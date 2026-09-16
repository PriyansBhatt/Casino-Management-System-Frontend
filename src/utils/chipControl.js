import { durableCustody } from './durableSubmissions.js'
import { DENOMINATIONS, requestGuard } from './buyIn.js'
export { DENOMINATIONS, requestGuard }
export const MOVEMENT_LABELS = {
  CAGE_OPENING: 'Cage Opening', BUY_IN_ISSUE: 'Buy-In Issue', CASH_OUT_RETURN: 'Cash-Out Return',
  TABLE_FLOAT_ISSUE: 'Table Float Issue', TABLE_FLOAT_RETURN: 'Table Float Return',
  CUSTOMER_TO_TABLE: 'Customer → Table', TABLE_TO_CUSTOMER: 'Table → Customer',
  LEGACY_CUSTODY_CORRECTION: 'Legacy Custody Correction',
}
export const movementLabel = (type) => MOVEMENT_LABELS[type] || `Unknown / Legacy (${String(type || 'unavailable')})`
export const exposureLabel = (status) => ({ AT_TABLE: 'At table', OUTSTANDING: 'Outstanding', CLEAR: 'Clear', NEGATIVE_POSITION: 'Negative position' })[status] || 'Unknown / Legacy'
export const isChipControlRoute = (path) => path === '/chip-control'
export const canFloat = (role, table, date, ready, locked) => ['SUPER_ADMIN', 'PIT_SUPERVISOR'].includes(role)
  && Boolean(date) && ready && !locked && table?.status === 'OPEN' && table?.businessDate === date
export const validNumber = (value) => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== ''))
  && Number.isFinite(Number(value)) && Math.abs(Number(value)) <= Number.MAX_SAFE_INTEGER
export const money = (value) => validNumber(value) ? `NPR ${Number(value).toLocaleString('en-NP')}` : 'Unavailable'
export const difference = (financial, physical) => validNumber(financial) && validNumber(physical) ? Number(financial) - Number(physical) : null
const fail = (label) => { throw new Error(`${label} is unavailable: invalid authoritative response.`) }

export function parseQuantities(values) {
  let total = 0
  const denominations = {}
  for (const [key, raw] of Object.entries(values || {})) {
    if (!DENOMINATIONS.includes(Number(key))) fail('Denomination')
    if (raw !== '' && (!validNumber(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < 0)) fail('Quantity')
    const quantity = raw === '' ? 0 : Number(raw)
    if (quantity > 0) denominations[key] = quantity
    total += Number(key) * quantity
    if (!Number.isSafeInteger(total)) fail('Quantity total')
  }
  return { denominations, total }
}
export function inventoryPayload(value, type, referenceId = null) {
  if (!value || value.locationType !== type || value.referenceId !== referenceId
      || typeof value.initialized !== 'boolean' || !value.denominations || Array.isArray(value.denominations)
      || !DENOMINATIONS.every((key) => Object.hasOwn(value.denominations, key))
      || Object.values(value.denominations).some((quantity) => quantity === '' || quantity === null)
      || !validNumber(value.totalValue)) fail('Physical inventory')
  const { total } = parseQuantities(value.denominations)
  if (total !== Number(value.totalValue)) fail('Physical inventory total')
  return value
}
export function directoryPayload(value, date) {
  if (value?.businessDate !== date || !Array.isArray(value.sessions)) fail('Session directory')
  for (const row of value.sessions) {
    if (!row?.customerId || !row.customerSessionId || !row.customerCode || !row.customerName || !row.sessionCode
        || row.businessDate !== date || String(row.sessionStatus).toUpperCase() !== 'OPEN'
        || !['totalBuyIn', 'verifiedGamingWin', 'verifiedGamingLoss', 'totalCashOut', 'calculatedChipPosition']
          .every((key) => validNumber(row[key]))) fail('Session directory')
  }
  return value
}
export function movementsPayload(value, date) {
  if (!Array.isArray(value)) fail('Movement history')
  for (const row of value) {
    if (!row?.id || row.businessDate !== date || typeof row.createdAt !== 'string' || !row.createdAt
        || !row.movementType || !row.denominations || !validNumber(row.totalValue)
        || Object.values(row.denominations).some((quantity) => quantity === '' || quantity === null)) fail('Movement history')
    const parsed = parseQuantities(row.denominations)
    if (parsed.total <= 0 || parsed.total !== Number(row.totalValue)) fail('Movement total')
  }
  return value
}
export function tablesPayload(value, date) {
  if (!Array.isArray(value)) fail('Table directory')
  return value.filter((table) => table?.operationId).map((table) => {
    if (table.businessDate !== date || !table.tableCode || !table.tableName || !validNumber(table.openingFloat)) fail('Table directory')
    return { ...table, id: table.operationId }
  })
}
export function openDate(value) {
  if (value === null) return null
  if (value?.status !== 'OPEN' || !/^\d{4}-\d{2}-\d{2}$/.test(value.businessDate)) fail('Business Date')
  return value.businessDate
}
export const emptyScope = () => ({ date: null, cage: null, directory: null, tables: null, movements: null, status: null, errors: {} })
export async function loadControlScope(api, { tables, history }) {
  const result = emptyScope()
  // Cage inventory is independently authoritative even when no operational date is open.
  const cageRead = Promise.resolve().then(api.getCageInventory).then((value) => inventoryPayload(value, 'CAGE'))
    .then((value) => ({ value }), (error) => ({ error }))
  try { result.date = openDate(await api.getCurrentOpenBusinessDate()) }
  catch (error) { result.errors.date = error.message }
  if (result.date) {
    const jobs = [
      ['status', () => api.getOperationalStatus(), (value) => statusPayload(value, result.date)],
      ['directory', () => api.getChipControlSessions(), (value) => directoryPayload(value, result.date)],
      ...(tables ? [['tables', () => api.getTables(), (value) => tablesPayload(value, result.date)]] : []),
      ...(history ? [['movements', () => api.getCurrentMovements(), (value) => movementsPayload(value, result.date)]] : []),
    ]
    const settled = await Promise.allSettled(jobs.map(async ([, read, validate]) => validate(await read())))
    settled.forEach((item, index) => {
      const key = jobs[index][0]
      if (item.status === 'fulfilled') result[key] = item.value
      else result.errors[key] = item.reason.message || `${key} unavailable`
    })
    try {
      if (openDate(await api.getCurrentOpenBusinessDate()) !== result.date) throw new Error('Business Date changed during refresh. Refresh again.')
    } catch (error) {
      result.date = null; result.directory = null; result.tables = null; result.movements = null; result.status = null
      result.errors.date = error.message
    }
  }
  const cage = await cageRead
  if (cage.error) result.errors.cage = cage.error.message
  else result.cage = cage.value
  return result
}
const csvCell = (value) => {
  let text = String(value ?? '')
  if (/^[\s\uFEFF]*[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}
export function sessionCsv(sessions, date) {
  directoryPayload({ businessDate: date, sessions }, date)
  return [['Business Date', 'Customer Code', 'Customer', 'Session', 'Current Table', 'Buy-In', 'Verified Wins', 'Verified Losses', 'Cash-Out', 'Financial Position', 'Status'],
    ...sessions.map((row) => [row.businessDate, row.customerCode, row.customerName, row.sessionCode,
      row.activeTableCode || 'Not assigned', row.totalBuyIn, row.verifiedGamingWin, row.verifiedGamingLoss,
      row.totalCashOut, row.calculatedChipPosition, exposureLabel(row.exposureStatus)])]
    .map((row) => row.map(csvCell).join(',')).join('\n')
}
export function displayLocation(type, display) {
  if (type === 'CAGE') return 'Cage'
  if (type === 'EXTERNAL') return 'External'
  if (type === 'CUSTOMER_SESSION') return [display?.customerCode, display?.customerName, display?.sessionCode].filter(Boolean).join(' · ') || 'Customer session — display unavailable'
  if (type === 'PIT_TABLE') return [display?.tableCode, display?.tableName].filter(Boolean).join(' · ') || 'Pit table — display unavailable'
  return 'Unknown / Legacy location'
}
export const recordedTime = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
  ? `${value.replace('T', ' ')} (casino recorded time)` : 'Unavailable'

// The logical operation includes date, direction and target, not just denomination quantities.
export function createCustodySubmission(newKey = () => crypto.randomUUID(), options) {
  if (options) return durableCustody(options)
  let pending = false, signature = null, key = null, uncertain = false
  return {
    get pending() { return pending },
    async run(operation, { preflight, post, success, refresh, warning }) {
      if (pending) return null
      const next = JSON.stringify(operation)
      if (uncertain && signature !== next) throw new Error('Previous outcome is unconfirmed. Retry the unchanged operation before entering another movement.')
      if (signature !== next) { signature = next; key = newKey() }
      pending = true
      try {
        await preflight()
        let result
        try { result = await post(operation, key) }
        catch (error) {
          uncertain = ![400,401,403,404,409,422].includes(error.response?.status)
          if (uncertain) throw new Error('Posting outcome is unconfirmed. Keep this form open and retry unchanged to reuse the same reference.')
          throw error
        }
        uncertain = false; signature = null; key = null
        success(result)
        try { await refresh(result) }
        catch { warning('Movement posted successfully, but the refresh could not be completed. Do not repost; refresh the page data.') }
        return result
      } finally { pending = false }
    },
  }
}

export function statusPayload(value, date) {
  if (value?.businessDate !== date || value.businessDateOpen !== true || typeof value.systemLocked !== 'boolean'
      || !['HEALTHY','STALE'].includes(value.businessDateHealth) || typeof value.continuationOverrideActive !== 'boolean') fail('Operational status')
  return value
}
export function lifecycleAllows(status, settlement = false) {
  if (!status || status.systemLocked || !status.businessDateOpen) return false
  if (status.businessDateHealth === 'HEALTHY') return true
  if (status.businessDateHealth !== 'STALE') return false
  if (settlement || status.continuationOverrideActive) return true
  // Advisory UI only; use the backend's casino timestamp, never the browser clock.
  const time = status.serverTimestamp?.split('T')[1]
  return status.staleByDays === 1 && typeof time === 'string' && time <= '12:30:00'
}
