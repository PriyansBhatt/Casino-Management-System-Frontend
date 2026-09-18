export const TENDERS = ['CASH', 'BANK', 'CARD', 'QR']
const invalid = () => { throw new Error('Report unavailable: invalid authoritative response.') }
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v)
export const validDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v
const count = v => Number.isSafeInteger(v) && v >= 0
// Reports serialize BigDecimal as decimal strings; never round through binary floating point.
const moneyValue = v => typeof v === 'string' && /^-?(0|[1-9]\d*)(\.\d{1,2})?$/.test(v)
const nonnegativeMoney = v => moneyValue(v) && !v.startsWith('-')
const nullableText = v => v === null || typeof v === 'string'
const timestamp = v => {
  if (typeof v !== 'string') return false
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})?$/.exec(v)
  return !!match && validDate(match[1]) && +match[2] < 24 && +match[3] < 60 && +match[4] < 60 && Number.isFinite(Date.parse(v))
}
const status = v => ['OPEN','CLOSED'].includes(v)
const tender = v => {
  if (!object(v) || Object.keys(v).length !== 4 || TENDERS.some(k => !object(v[k]) || !count(v[k].count) || !nonnegativeMoney(v[k].amount))) invalid()
  return Object.fromEntries(TENDERS.map(k => [k, { count:v[k].count, amount:v[k].amount }]))
}
export function dailyReport(v, expected) {
  if (!object(v) || !validDate(v.businessDate) || (expected && v.businessDate !== expected) || !status(v.status) || !timestamp(v.windowStart) || !timestamp(v.windowEnd)) invalid()
  const counts = ['sessionEntries','distinctGuestsEntered','losingReturnCount','submittedCount','reopenedCount']
  const amounts = ['losingReturnAmountPaid','customerWins','customerLosses']
  if (counts.some(k => !count(v[k])) || amounts.some(k => !nonnegativeMoney(v[k])) || v.distinctGuestsEntered > v.sessionEntries) invalid()
  if (v.submittedCount === 0 ? v.aggregateSubmittedVariance !== null : !moneyValue(v.aggregateSubmittedVariance)) invalid()
  const start = `${v.businessDate}T09:00:00+05:45`
  if (Date.parse(v.windowStart) !== Date.parse(start) || Date.parse(v.windowEnd) - Date.parse(v.windowStart) !== 86400000) invalid()
  return { businessDate:v.businessDate,status:v.status,windowStart:v.windowStart,windowEnd:v.windowEnd,
    ...Object.fromEntries([...counts,...amounts,'aggregateSubmittedVariance'].map(k => [k,v[k]])),buyIn:tender(v.buyIn),cashOut:tender(v.cashOut) }
}
export function reconciliationPage(v, expected, page=0, size=50) {
  if (!object(v) || !validDate(v.businessDate) || (expected && v.businessDate !== expected) || !status(v.status) || v.page !== page || v.size !== size || !count(v.page) || !Number.isInteger(v.size) || v.size<1 || v.size>100 || typeof v.hasNext !== 'boolean' || !Array.isArray(v.items) || v.items.length>size || (v.hasNext && v.items.length!==size)) invalid()
  const ids = new Set()
  const items = v.items.map(r => {
    if (!object(r) || typeof r.id !== 'string' || !r.id || ids.has(r.id) || r.businessDate !== v.businessDate || typeof r.cashierId !== 'string' || !r.cashierId || !nullableText(r.cashierUsername) || !nullableText(r.cashierName) || !['SUBMITTED','REOPENED'].includes(r.lifecycleStatus) || !timestamp(r.submittedAt) || !(r.reopenedAt === null || timestamp(r.reopenedAt))) invalid()
    ids.add(r.id)
    if (['openingCash','expectedClosingCash'].some(k=>!moneyValue(r[k]))) invalid()
    if (r.lifecycleStatus === 'SUBMITTED') {
      if (r.calculationBasis !== 'SUBMITTED_SNAPSHOT' || !['BALANCED','OVER','SHORT'].includes(r.status) || !moneyValue(r.actualClosingCash) || !moneyValue(r.variance)) invalid()
    } else if (r.calculationBasis !== 'REOPENED_SAVED_RECORD' || r.actualClosingCash !== null || r.variance !== null || r.status !== null || !timestamp(r.reopenedAt)) invalid()
    return Object.fromEntries(['id','businessDate','cashierId','cashierUsername','cashierName','lifecycleStatus','status','calculationBasis','openingCash','expectedClosingCash','actualClosingCash','variance','submittedAt','reopenedAt'].map(k=>[k,r[k]]))
  })
  return { businessDate:v.businessDate,status:v.status,items,page:v.page,size:v.size,hasNext:v.hasNext }
}
export const money = value => {
  if (value == null) return 'Unavailable'
  if (!moneyValue(value)) invalid()
  const [whole, fraction=''] = value.split('.')
  return `NPR ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction.padEnd(2,'0')}`
}
export const cashierLabel = row => row.cashierName || row.cashierUsername || 'Unknown user'
export const csvCell = value => { let text=String(value ?? 'Unavailable'); if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text="'"+text; return `"${text.replaceAll('"','""')}"` }
const csv = rows => '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')
export function reportCsv(view, data) {
  if (view==='reconciliations') return csv([
    ['Business Date','Cashier ID','Current username','Current name','Lifecycle','Result','Basis','Opening Cash','Expected Closing','Actual Closing','Variance','Submitted At','Reopened At'],
    ...data.items.map(r=>[r.businessDate,r.cashierId,r.cashierUsername,r.cashierName,r.lifecycleStatus,r.status,r.calculationBasis,r.openingCash,r.expectedClosingCash,r.actualClosingCash,r.variance,r.submittedAt,r.reopenedAt])])
  return csv([['Business Date','Status','Section','Metric','Tender','Count','Amount NPR'],
    [data.businessDate,data.status,'Guests','Entry sessions','',data.sessionEntries,''],
    [data.businessDate,data.status,'Guests','Distinct guests entered','',data.distinctGuestsEntered,''],
    ...['buyIn','cashOut'].flatMap(k=>TENDERS.map(t=>[data.businessDate,data.status,k==='buyIn'?'Buy-In':'Cash-Out','Posted transactions',t,data[k][t].count,data[k][t].amount])),
    [data.businessDate,data.status,'Losing Return','Persisted payouts','CASH',data.losingReturnCount,data.losingReturnAmountPaid],
    ...['customerWins','customerLosses'].map(k=>[data.businessDate,data.status,'Verified Gaming',k,'','',data[k]]),
    [data.businessDate,data.status,'Reconciliation','Submitted count','',data.submittedCount,''],
    [data.businessDate,data.status,'Reconciliation','Submitted variance','','',data.aggregateSubmittedVariance],
    [data.businessDate,data.status,'Reconciliation','Reopened','',data.reopenedCount,'']])
}
// All scope changes go through load/clear; dispose invalidates in-flight work.
export function createReportReader(fetcher, emit) {
  let generation=0, disposed=false
  let state={loading:false,error:'',data:null}
  const publish=next=>{state=next;if(!disposed)emit(next)}
  return {
    get state(){return state},
    clear(){generation++;publish({loading:false,error:'Select an existing Business Date.',data:null})},
    dispose(){disposed=true;generation++},
    async load(view,date='',page=0){
      const ticket=++generation
      publish({loading:true,error:'',data:null})
      try {
        if(date && !validDate(date)) throw Error()
        const raw=await fetcher(view,date,page)
        const data=view==='daily'?dailyReport(raw,date):reconciliationPage(raw,date,page)
        if(ticket===generation&&!disposed)publish({loading:false,error:'',data})
      } catch {
        if(ticket===generation&&!disposed)publish({loading:false,error:'Report unavailable. Select an existing Business Date or refresh. A current OPEN date is required only when no date is selected.',data:null})
      }
    },
  }
}
