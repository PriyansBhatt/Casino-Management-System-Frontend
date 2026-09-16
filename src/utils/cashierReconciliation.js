import { durableReconciliation } from './durableSubmissions.js'
import { openDate, statusPayload, lifecycleAllows, validNumber, money, recordedTime } from './chipControl.js'
export { money, recordedTime }
export { requestGuard } from './buyIn.js'
export const NOTES = [1000, 500, 100, 50, 20, 10, 5]
export const canOperate = (role) => ['CASHIER', 'SUPER_ADMIN'].includes(role)
export const canManage = (role) => ['DIRECTOR', 'SUPER_ADMIN'].includes(role)
export const lifecycleLabel = (value) => ({ OPEN: 'Not Submitted', SUBMITTED: 'Submitted', REOPENED: 'Reopened' })[value] || 'Unavailable'
export const resultLabel = (value) => ({ BALANCED: 'Balanced', OVER: 'Over', SHORT: 'Short' })[value] || 'Not calculated / unavailable'
export const CASH_PAID_DETAIL = 'CASH Cash-Outs + CASH Losing Returns'
export const emptyCounts = () => Object.fromEntries(NOTES.map((n) => [n, 0]))
const fail = (what) => { throw new Error(`${what} unavailable: invalid authoritative response.`) }
const amount = (v) => validNumber(v)
export function noteCount(values) {
  if (!values || Array.isArray(values)) throw new Error('Cash note counts are required.')
  let total = 0
  const denominations = {}
  for (const [note, raw] of Object.entries(values)) {
    const q = raw === '' ? 0 : Number(raw)
    if (!NOTES.includes(Number(note)) || raw === null || raw === undefined || typeof raw === 'boolean'
      || !Number.isSafeInteger(q) || q < 0 || q > 2147483647) throw new Error('Note quantities must be nonnegative integers up to 2147483647.')
    if (q) denominations[note] = q
    total += Number(note) * q
  }
  if (!Number.isSafeInteger(total)) throw new Error('Cash note total exceeds safe range.')
  return { total, denominations }
}
export function openingAmount(raw) {
  const value = String(raw).trim()
  // Keep the decimal string intact; never round user money through a JS Number.
  if (!/^\d{1,17}(\.\d{1,2})?$/.test(value)) throw new Error('Opening Cash requires a nonnegative amount with at most two decimals and 17 integer digits.')
  return value
}
function tenders(value) {
  if (!value || !['CASH', 'BANK', 'CARD', 'QR'].every((mode) => amount(value[mode]?.amount)
      && Number(value[mode].amount) >= 0 && Number.isSafeInteger(value[mode]?.count) && value[mode].count >= 0)) fail('Tender totals')
}
export function reconciliation(value, date) {
  if (!value || value.businessDate !== date || !value.cashierUsername
      || !['OPEN', 'SUBMITTED', 'REOPENED'].includes(value.lifecycleStatus)
      || !['LIVE', 'PREVIEW', 'SUBMITTED_SNAPSHOT', 'LAST_SUBMISSION_SNAPSHOT'].includes(value.calculationBasis)) fail('Reconciliation')
  const snapshot = value.calculationBasis.endsWith('SNAPSHOT')
  if (snapshot) {
    if (!value.id || !value.submittedAt || !['SUBMITTED','REOPENED'].includes(value.lifecycleStatus)
        || (value.calculationBasis === 'SUBMITTED_SNAPSHOT') !== (value.lifecycleStatus === 'SUBMITTED')
        || !['openingCash','expectedClosingCash','actualClosingCash','variance'].every((k) => amount(value[k]))
        || !['BALANCED','OVER','SHORT'].includes(value.status)
        || !['physicalCashReceived','physicalCashPaid','buyInTenders','cashOutTenders','losingReturnTenders'].every((k) => value[k] === null)) fail('Saved submission')
  } else {
    if (!amount(value.physicalCashReceived) || !amount(value.physicalCashPaid)) fail('Physical cash totals')
    tenders(value.buyInTenders); tenders(value.cashOutTenders); tenders(value.losingReturnTenders)
    if (value.openingCash !== null && !amount(value.openingCash)) fail('Opening Cash')
    if (value.expectedClosingCash !== null && !amount(value.expectedClosingCash)) fail('Expected Closing')
    if (value.calculationBasis === 'PREVIEW') {
      if (!['openingCash','expectedClosingCash','actualClosingCash','variance'].every((k) => amount(value[k]))
          || !['BALANCED','OVER','SHORT'].includes(value.status)) fail('Preview')
    } else if (value.actualClosingCash !== null || value.variance !== null
        || !['OPEN','REOPENED'].includes(value.lifecycleStatus)
        || !(value.status === null || value.status === 'NOT_SUBMITTED')) fail('Live calculation')
  }
  noteCount(value.denominations)
  return value
}
export function opening(value, date) {
  if (value === null) return null
  if (!value?.id || value.businessDate !== date || !value.cashierUsername || !value.cashierUserId
      || !amount(value.openingCashAmount) || Number(value.openingCashAmount) < 0) fail('Opening Cash')
  return value
}
export async function loadReconciliation(api, role, username) {
  const date = openDate(await api.getCurrentOpenBusinessDate())
  if (!date) return { date: null, status: null, record: null, opening: null, management: null, errors: {} }
  const result = { date, status: null, record: null, opening: null, management: null, errors: {} }
  const jobs = [ ['status', () => api.getOperationalStatus(), (v) => statusPayload(v, date)] ]
  if (canOperate(role)) jobs.push(['record', () => api.current(), (v) => {
    reconciliation(v, date); if (username && v.cashierUsername !== username) fail('Cashier scope'); return v
  }], ['opening', () => api.opening(), (v) => {
    opening(v, date); if (v && username && v.cashierUsername !== username) fail('Opening Cash scope'); return v
  }])
  if (canManage(role)) jobs.push(['management', () => api.management(), (v) => {
    if (!Array.isArray(v)) fail('Management review')
    v.forEach((row) => { reconciliation(row, date); if (!row.calculationBasis.endsWith('SNAPSHOT')) fail('Management saved review') }); return v
  }])
  const values = await Promise.allSettled(jobs.map(async ([, read, validate]) => validate(await read())))
  values.forEach((v, i) => { if (v.status === 'fulfilled') result[jobs[i][0]] = v.value; else result.errors[jobs[i][0]] = v.reason.message })
  if (openDate(await api.getCurrentOpenBusinessDate()) !== date) throw new Error('Business Date changed during loading. Refresh and recount.')
  return result
}
export function ready(scope, role, settlement = true) {
  return canOperate(role) && Boolean(scope?.date) && lifecycleAllows(scope.status, settlement)
    && Boolean(scope.record) && !scope.errors.record && !scope.errors.opening
    && scope.record.businessDate === scope.date && scope.record.lifecycleStatus !== 'SUBMITTED'
}
export function resetDraft(previous, next) {
  return previous?.date !== next?.date || previous?.record?.lifecycleStatus !== next?.record?.lifecycleStatus
}
export function frozenCount(date, counts, remarks, key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Business Date unavailable.')
  return Object.freeze({ expectedBusinessDate: date, denominations: Object.freeze(noteCount(counts).denominations), remarks: remarks.trim() || null, idempotencyKey: key })
}
export function createReconciliationSubmission(newKey = () => crypto.randomUUID(), options) {
  if (options) return durableReconciliation(options, frozenCount, (value, date, payload) => {
    reconciliation(value, date)
    if (value.lifecycleStatus !== 'SUBMITTED' || value.calculationBasis !== 'SUBMITTED_SNAPSHOT'
      || JSON.stringify(noteCount(value.denominations).denominations) !== JSON.stringify(payload.denominations)) {
      throw new Error('Submitted count could not be verified. Retry Original; do not start a new submission.')
    }
  })
  let target = null, pending = false, uncertain = false
  return {
    get target() { return target }, get pending() { return pending }, get uncertain() { return uncertain },
    async run(input, { preflight, post, success, refresh, warning }) {
      if (pending) return null
      if (!uncertain) target = frozenCount(input.date, input.counts, input.remarks, newKey())
      const frozen = target
      pending = true
      try {
        if (!uncertain) await preflight(frozen)
        let value
        try { value = await post(frozen) }
        catch (error) {
          uncertain = ![400,401,403,404,409,422].includes(error.response?.status)
          if (!uncertain) target = null
          if (uncertain) throw new Error('Submission outcome unconfirmed. Keep this page open and retry the unchanged count with the same key.')
          throw error
        }
        try {
          reconciliation(value, frozen.expectedBusinessDate)
          if (value.lifecycleStatus !== 'SUBMITTED' || value.calculationBasis !== 'SUBMITTED_SNAPSHOT') fail('Confirmed submission')
          if (JSON.stringify(noteCount(value.denominations).denominations) !== JSON.stringify(frozen.denominations)) fail('Submitted count')
        } catch {
          uncertain = true
          throw new Error('Server responded, but SUBMITTED could not be verified. Outcome unconfirmed; retry the unchanged reference. Do not create another submission.')
        }
        uncertain = false; target = null
        try { success(value) } catch { warning('Submission confirmed; display details unavailable. Do not resubmit.') }
        try { await refresh() } catch { warning('Reconciliation submitted successfully. Refresh failed; do not resubmit. Reload authoritative data.') }
        return value
      } finally { pending = false }
    },
  }
}
