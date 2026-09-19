import { persistedOperation, currentActor } from './persistedOperation.js'
import { csvCell } from './reports.js'
export const STORE_TABS = ['Requests', 'Inventory', 'Procurement / Receiving', 'Records']
export const canReadStore = role => ['SUPER_ADMIN', 'DIRECTOR'].includes(role)
export const canWriteStore = role => role === 'SUPER_ADMIN'
export const requestStatuses = ['PENDING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED']
export const procurementStatuses = ['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED']
export const movementTypes = ['OPENING', 'ISSUE', 'RECEIPT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT']
export const units = ['PCS', 'BOX', 'PACK', 'BOTTLE']
const fail = () => { throw Error('Store response is unavailable or malformed. Refresh before acting.') }
const object = x => x && typeof x === 'object' && !Array.isArray(x) ? x : fail()
const string = x => typeof x === 'string' && x.trim() ? x : fail()
const nullableText = x => x === null || typeof x === 'string' ? x : fail()
const uuid = x => typeof x === 'string' && /^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(x) ? x : fail()
const integer = x => Number.isSafeInteger(x) && x >= 0 ? x : fail()
const quantityValue = x => integer(x) <= 2147483647 ? x : fail()
const bool = x => typeof x === 'boolean' ? x : fail()
const member = (x, values) => values.includes(x) ? x : fail()
const nullable = (x, check) => x === null ? x : check(x)
const date = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && new Date(`${x}T00:00:00Z`).toISOString().slice(0,10) === x ? x : fail()
const timestamp = x => {
  const m=typeof x==='string' && /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?$/.exec(x)
  if(!m||+m[2]>23||+m[3]>59||+m[4]>59)fail();date(m[1]);return x
}
function fields(row, spec) { object(row); for (const [key, check] of Object.entries(spec)) check(row[key]); return row }
const base = { id: uuid }
const itemFields = { itemId: uuid, itemCode: string, itemName: string, unit: x => member(x, units) }
export function decodeRow(kind, r) {
  const schemas = {
    items: { ...base, code:string,name:string,category:string,unit:x=>member(x,units),active:bool,quantityBalance:quantityValue,version:integer,hasHistory:bool,hasMovements:bool,createdAt:timestamp },
    staff: { ...base, employeeCode:string,name:string,departmentId:uuid,departmentName:string },
    requests: { ...base, reference:string,departmentId:uuid,departmentName:string,requesterStaffProfileId:uuid,requesterName:string,recordedByUserId:uuid,recordedByName:string,createdAt:timestamp,requiredDate:x=>nullable(x,date),remarks:nullableText,status:x=>member(x,requestStatuses),version:integer,cancelledAt:x=>nullable(x,timestamp),cancellationReason:nullableText },
    procurements: { ...base,...itemFields,reference:string,requestLineId:uuid,requestId:uuid,requestReference:string,departmentName:string,quantity:quantityValue,receivedQuantity:quantityValue,outstandingQuantity:quantityValue,status:x=>member(x,procurementStatuses),supplierReference:nullableText,createdAt:timestamp,orderedAt:x=>nullable(x,timestamp),cancelledAt:x=>nullable(x,timestamp),cancellationReason:nullableText,version:integer },
    movements: { ...base,...itemFields,reference:string,movementType:x=>member(x,movementTypes),quantity:quantityValue,balanceAfter:quantityValue,requestLineId:x=>nullable(x,uuid),requestReference:nullableText,procurementId:x=>nullable(x,uuid),procurementReference:nullableText,departmentName:nullableText,performedBy:uuid,performedByName:string,performedAt:timestamp,businessDate:x=>nullable(x,date),reason:nullableText,externalReference:nullableText },
    lines: { ...base,...itemFields,active:bool,requestedQuantity:quantityValue,issuedQuantity:quantityValue,cancelledQuantity:quantityValue,outstandingQuantity:quantityValue,availableQuantity:quantityValue,procurementId:x=>nullable(x,uuid),procurementReference:nullableText,procurementStatus:x=>nullable(x,v=>member(v,['PENDING','ORDERED'])) },
  }
  if (!schemas[kind]) fail()
  fields(r,schemas[kind])
  if (kind==='lines' && (r.requestedQuantity<1 || r.requestedQuantity-r.issuedQuantity-r.cancelledQuantity!==r.outstandingQuantity)) fail()
  if (kind==='procurements' && (r.quantity<1 || r.quantity-r.receivedQuantity!==r.outstandingQuantity)) fail()
  if (kind==='movements' && r.quantity<1) fail()
  return r
}
export function decodePage(kind, value) {
  fields(value,{ page:integer,size:integer,hasNext:bool })
  if (value.size<1 || value.size>100 || !Array.isArray(value.items) || value.items.length>value.size) fail()
  value.items.forEach(row=>decodeRow(kind,row));return value
}
export function decodeDetail(value) {
  object(value);decodeRow('requests',value.request)
  if (!Array.isArray(value.lines)||!value.lines.length||value.lines.length>50) fail()
  value.lines.forEach(row=>decodeRow('lines',row));return value
}
export function decodeReceipt(value) { return fields(value,{ id:uuid,reference:string }) }
export function positiveQuantity(value) {
  if (!/^[1-9]\d*$/.test(String(value))) throw Error('Enter a positive whole quantity.')
  const n=Number(value);if (!Number.isSafeInteger(n)||n>2147483647) throw Error('Quantity exceeds supported range.');return n
}
export function requestPayload(staff, lines, requiredDate, remarks) {
  decodeRow('staff',staff)
  if (!lines.length||lines.length>50||new Set(lines.map(l=>l.itemId)).size!==lines.length) throw Error('Choose 1–50 different items.')
  return { staffProfileId:staff.id,requiredDate:requiredDate||null,remarks:remarks.trim(),lines:lines.map(l=>({itemId:uuid(l.itemId),quantity:positiveQuantity(l.quantity)})) }
}
const freeze = x => { if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x)}return x }
export function freezeIntent(kind, path, payload, label, key = crypto.randomUUID(), context = {}) {
  return freeze({ operationType:kind,operationKey:key,target:{path,label,context:JSON.parse(JSON.stringify(context))},payload:JSON.parse(JSON.stringify(payload)) })
}
export function storeCsv(kind, rows) {
  let output
  if(kind==='items') output=[['Code','Name','Category','Unit','Quantity balance','Active'],...rows.map(r=>{decodeRow(kind,r);return [r.code,r.name,r.category,r.unit,r.quantityBalance,r.active?'Yes':'No']})]
  else if(kind==='movements') output=[['Reference','Item code','Item','Unit','Type','In','Out','Balance after','Request','Procurement','Department','Actor','Timestamp','Business Date'],...rows.map(r=>{decodeRow(kind,r);const out=['ISSUE','ADJUSTMENT_OUT'].includes(r.movementType);return [r.reference,r.itemCode,r.itemName,r.unit,r.movementType,out?'':r.quantity,out?r.quantity:'',r.balanceAfter,r.requestReference,r.procurementReference,r.departmentName,r.performedByName,r.performedAt,r.businessDate]})]
  else throw Error('Export unavailable.')
  return '\uFEFF'+output.map(row=>row.map(csvCell).join(',')).join('\r\n')
}
/** Each read channel has an independent generation; stale success/error/finally cannot publish. */
export function createStoreManager(api, { actor, role, publish, resolveActor=currentActor, storage, newKey }) {
  let active=true, generation={}, state={message:'',mutationError:'',working:false}, synchronousBusy=false
  const recovery=persistedOperation({module:'store',actor,storage,resolveActor,newKey})
  const current=()=>active&&resolveActor()===actor
  const emit=patch=>{if(current()){state={...state,...patch};publish(state)}}
  const authorize=write=>{if(!current()||!(write?canWriteStore(role):canReadStore(role)))throw Error('Store access or authentication changed. No request was sent.')}
  return {
    recovery,
    isCurrent:current,
    activate(){active=true},
    dispose(){active=false;for(const key of Object.keys(generation))generation[key]++},
    invalidate(channel){generation[channel]=(generation[channel]||0)+1;emit({[channel]:{data:null,loading:false,error:''}})},
    async load(channel,kind,params={}) {
      authorize(false);const ticket=(generation[channel]||0)+1;generation[channel]=ticket
      const valid=()=>current()&&generation[channel]===ticket
      const context=JSON.stringify({kind,params})
      emit({[channel]:{data:null,loading:true,error:'',context}})
      try {
        const raw=kind==='detail'?await api.detail(params.id):await api.list(kind,params)
        const data=kind==='detail'?decodeDetail(raw):decodePage(kind,raw)
        if(kind==='detail' && data.request.id!==params.id)fail()
        if(kind!=='detail' && (data.page!==(params.page??0)||data.size!==(params.size??50)))fail()
        if(valid())emit({[channel]:{data,loading:false,error:'',context}})
        return valid()?data:null
      } catch(error) {if(valid())emit({[channel]:{data:null,loading:false,error:error?.response?.data?.message||error.message,context}});return null}
    },
    async submit(intent, refresh, retry=false) {
      if(synchronousBusy)return null
      authorize(true);synchronousBusy=true
      const invalidated={}
      for(const channel of Object.keys(generation)){generation[channel]++;invalidated[channel]={data:null,loading:false,error:''}}
      emit({...invalidated,working:true,message:'',mutationError:''})
      try {
        const receipt=await recovery.run(intent, async op=>{authorize(true);return decodeReceipt(await api.mutate(op))},{retry,clearDefiniteFailure:true})
        if(!receipt)return null
        emit({message:`Recorded successfully: ${receipt.reference}`,mutationError:''})
        try {if(current())await refresh?.()} catch {emit({message:`Recorded successfully: ${receipt.reference}. Refresh failed; reload authoritative data before another operation.`})}
        return current()?receipt:null
      } catch(error){emit({mutationError:error?.response?.data?.message||error.message});throw error}
      finally{synchronousBusy=false;emit({working:false})}
    },
  }
}

export function isStoreRoute(path) {
  try { path=decodeURIComponent(path).toLowerCase() } catch { return false }
  return path==='/store'||path.startsWith('/store/')
}
