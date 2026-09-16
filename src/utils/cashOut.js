import { durableCashOut } from './durableSubmissions.js'
import { matchingCustomers, verifySession, PAYMENT_MODES } from './buyIn.js'
import { openDate, statusPayload, lifecycleAllows, validNumber, parseQuantities, inventoryPayload } from './chipControl.js'
export { matchingCustomers, verifySession }
export const canPostCashOut = (role) => ['CASHIER', 'SUPER_ADMIN'].includes(role)
export const isCashOutRoute = (path) => path === '/cashier/cash-out'
const fail = (name) => { throw new Error(`${name} unavailable. Refresh authoritative data before posting.`) }
export const emptySelection = () => ({ customer: null, session: null, financial: null, custody: null, cashHistory: null, returnHistory: null, eligibility: null })
export async function loadCashOutScope(api, role) {
  const date = openDate(await api.getCurrentOpenBusinessDate())
  if (!date) return { date: null, status: null, reconciliation: null }
  const [status, reconciliation] = await Promise.all([
    api.getOperationalStatus(), canPostCashOut(role) ? api.getCurrentCashierReconciliation() : Promise.resolve(null),
  ])
  statusPayload(status, date)
  if (canPostCashOut(role) && (reconciliation?.businessDate !== date
    || !['OPEN', 'REOPENED', 'SUBMITTED'].includes(reconciliation?.lifecycleStatus))) fail('Reconciliation')
  if (openDate(await api.getCurrentOpenBusinessDate()) !== date) fail('Business Date changed')
  return { date, status, reconciliation }
}
export const postingAllowed = (role, scope) => canPostCashOut(role) && Boolean(scope?.date)
  && lifecycleAllows(scope.status, true) && scope.reconciliation?.businessDate === scope.date
  && ['OPEN', 'REOPENED'].includes(scope.reconciliation?.lifecycleStatus)
export function financialPayload(value, customerId, sessionId, date) {
  if (value?.customerId !== customerId || value.customerSessionId !== sessionId || value.businessDate !== date
      || !['totalBuyIn', 'totalCashOut', 'verifiedGamingWin', 'verifiedGamingLoss', 'calculatedChipPosition'].every((k) => validNumber(value[k]))) fail('Financial position')
  return value
}
export function eligibilityPayload(value, customerId, sessionId, date) {
  if (value?.customerId !== customerId || value.customerSessionId !== sessionId || value.businessDate !== date
      || typeof value.eligible !== 'boolean' || typeof value.alreadyPaid !== 'boolean' || !value.eligibilityReason
      || (value.alreadyPaid && value.eligible)
      || !['totalBuyIn', 'verifiedWins', 'verifiedLosses', 'previousCashOuts', 'previousLosingReturns',
        'eligibleVerifiedLoss', 'minimumEligibleLoss', 'returnRate', 'availableReturnAmount'].every((k) => validNumber(value[k]))) fail('Losing Return eligibility')
  return value
}
export function persistedHistory(rows, kind, customerId, sessionId, date) {
  if (!Array.isArray(rows)) fail('Persisted history')
  for (const row of rows) {
    if (!row?.id || row.customerId !== customerId || row.businessDate !== date || !row.customerSessionId
        || !row.createdAt || !row[kind === 'cash' ? 'cashOutCode' : 'losingReturnCode']
        || !validNumber(row[kind === 'cash' ? 'cashPaid' : 'amountPaid'])
        || (kind === 'cash' && row.customerSessionId !== sessionId)) fail('Persisted history scope')
  }
  return rows
}
export async function loadSelection(api, customer, date) {
  const session = verifySession(customer, await api.getActiveSession(customer.id), date)
  const state = { ...emptySelection(), customer, session, errors: {} }
  const jobs = [
    ['financial', () => api.getSessionFinancialPosition(session.id), (v) => financialPayload(v, customer.id, session.id, date)],
    ['custody', () => api.getCustomerSessionInventory(session.id), (v) => inventoryPayload(v, 'CUSTOMER_SESSION', session.id)],
    ['cashHistory', () => api.getCashOutsBySession(session.id), (v) => persistedHistory(v, 'cash', customer.id, session.id, date)],
    ['returnHistory', () => api.getLosingReturnHistory(customer.id, date), (v) => persistedHistory(v, 'return', customer.id, session.id, date)],
  ]
  const results = await Promise.allSettled(jobs.map(async ([, read, validate]) => validate(await read())))
  results.forEach((v, i) => { if (v.status === 'fulfilled') state[jobs[i][0]] = v.value; else state.errors[jobs[i][0]] = v.reason.message })
  return state
}
export function returnWorkspace(quantities, financial, custody) {
  if (!financial || !custody) fail('Financial position / physical custody')
  const { denominations, total } = parseQuantities(quantities)
  for (const [denomination, quantity] of Object.entries(denominations)) {
    if (quantity > Number(custody.denominations[denomination])) throw new Error(`Returned ${denomination} quantity exceeds physical custody.`)
  }
  const position = Number(financial.calculatedChipPosition)
  if (total > Math.max(position, 0) || total > Number(custody.totalValue)) throw new Error('Cash-Out exceeds financial entitlement or physical custody.')
  return { denominations, total, financialRemaining: position - total, physicalRemaining: Number(custody.totalValue) - total }
}
export function freezeCashOut(selection, scope, quantities, form) {
  verifySession(selection.customer, selection.session, scope.date)
  const result = returnWorkspace(quantities, selection.financial, selection.custody)
  if (result.total <= 0) throw new Error('Enter physical chip quantities to return.')
  if (!PAYMENT_MODES.includes(form.paymentMode) || (form.paymentMode !== 'CASH' && !form.paymentReference.trim())) throw new Error('A reference is required for non-cash payment.')
  return { kind: 'cash', date: scope.date, customerName: selection.customer.fullName, payload: {
    customerId: selection.customer.id, customerSessionId: selection.session.id,
    cashPaid: result.total, totalChipValueReturned: result.total, denominations: { ...result.denominations },
    paymentMode: form.paymentMode, paymentReference: form.paymentReference.trim() || null, remarks: form.remarks.trim() || null,
  } }
}
export function freezeLosingReturn(selection, scope, remarks) {
  verifySession(selection.customer, selection.session, scope.date)
  const quote = eligibilityPayload(selection.eligibility, selection.customer.id, selection.session.id, scope.date)
  if (!quote.eligible || quote.alreadyPaid || Number(quote.availableReturnAmount) <= 0) throw new Error(quote.eligibilityReason)
  return { kind: 'return', date: scope.date, customerName: selection.customer.fullName, quote: quote.availableReturnAmount,
    payload: { customerId: selection.customer.id, customerSessionId: selection.session.id, remarks: remarks.trim() || null } }
}
// A frozen operation survives uncertain failures. Never exchange its target or key on retry.
export function createCashOutSubmission(newKey = () => crypto.randomUUID(), options) {
  if (options) return durableCashOut(options)
  let target = null, pending = false, attempted = false
  return {
    get target() { return target }, get pending() { return pending }, get uncertain() { return attempted },
    prepare(operation) {
      if (pending || attempted) throw new Error('Retry the unconfirmed transaction before changing its target.')
      target = Object.freeze({ ...structuredClone(operation), payload: Object.freeze({ ...structuredClone(operation.payload), idempotencyKey: newKey(), ...(operation.payload.denominations ? { denominations: Object.freeze({ ...operation.payload.denominations }) } : {}) }) })
      return target
    },
    cancel() { if (!pending && !attempted) target = null },
    async run({ preflight, post, success, refresh, warning }) {
      if (pending || !target) return null
      pending = true
      const frozen = target
      try {
        // Uncertain replays must reach the backend even if later lifecycle state now blocks new work.
        if (!attempted) await preflight(frozen)
        attempted = true
        let result
        try { result = await post(frozen) }
        catch (error) {
          if ([400,401,403,404,409,422].includes(error.response?.status)) attempted = false
          if (attempted) throw new Error('Outcome unconfirmed. Keep this page open and retry this unchanged transaction with the same reference.')
          throw error
        }
        target = null; attempted = false
        // HTTP confirmation is final even if optional response details or refresh are unavailable.
        try { success(result, frozen) } catch { warning('Transaction confirmed; display details unavailable. Do not repost.') }
        try { await refresh(frozen) } catch { warning('Transaction successful, but refresh failed. Do not repost; refresh authoritative data.') }
        return { confirmed: true, result }
      } finally { pending = false }
    },
  }
}
export const payoutChanged = (result, target) => target.kind === 'return' && validNumber(result?.amountPaid)
  && Number(result.amountPaid) !== Number(target.quote)
