import { durableBuyIn } from './durableSubmissions.js'
export const DENOMINATIONS = [500, 1000, 5000, 10000, 25000]
export const PAYMENT_MODES = ['CASH', 'BANK', 'QR', 'CARD']
export const canPostBuyIn = (role) => ['CASHIER', 'SUPER_ADMIN'].includes(role)
export const isBuyInRoute = (path) => path === '/cashier/buy-in'
export const UNAVAILABLE_WORKFLOWS = {
  MACHINE_CASH_IN: 'Unavailable — authoritative Machine Cash-In requires Slot & Machine Gaming integration.',
  TIPS: 'Unavailable — an authoritative tips collection and accounting workflow has not been implemented.',
}

export function requestGuard() {
  let version = 0
  return { next() { const current = ++version; return () => current === version }, invalidate() { version++ } }
}

export function denominationTotal(denominations) {
  let total = 0
  for (const [denomination, quantity] of Object.entries(denominations)) {
    if (!DENOMINATIONS.includes(Number(denomination)) || !Number.isSafeInteger(quantity) || quantity < 0) return null
    total += Number(denomination) * quantity
    if (!Number.isSafeInteger(total)) return null
  }
  return total
}

export function validateBuyIn(value, date) {
  if (!value?.id || !value.buyInCode || !value.customerId || !value.customerSessionId
      || !value.createdAt || value.businessDate !== date || !PAYMENT_MODES.includes(value.paymentMode)
      || !Number.isSafeInteger(Number(value.amountReceived)) || Number(value.amountReceived) <= 0
      || Number(value.amountReceived) !== Number(value.totalChipValueIssued)
      || !value.denominations || typeof value.denominations !== 'object') {
    throw new Error('Invalid or mismatched Business Date Chip Buy-In response. Refresh the operational scope.')
  }
  return value
}

export function scopedHistory(records, date) {
  if (!Array.isArray(records)) throw new Error('Chip Buy-In history is unavailable: invalid response.')
  return records.map((record) => ({ ...record, transaction: validateBuyIn(record?.transaction, date) }))
}

export async function loadBuyInScope(api, role) {
  const businessDate = await api.getCurrentOpenBusinessDate()
  if (businessDate === null) return { businessDate: null, customers: [], history: [], reconciliation: null }
  if (businessDate?.status !== 'OPEN' || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate.businessDate)) {
    throw new Error('Current OPEN Business Date is unavailable.')
  }
  const [customers, records, reconciliation] = await Promise.all([
    canPostBuyIn(role) ? api.getCustomers() : Promise.resolve([]),
    api.getCurrentBusinessDateBuyIns(),
    canPostBuyIn(role) ? api.getCurrentCashierReconciliation() : Promise.resolve(null),
  ])
  if (!Array.isArray(customers) || customers.some((customer) => !customer?.id || !customer.customerCode || !customer.fullName)) {
    throw new Error('Customer directory is unavailable.')
  }
  if (canPostBuyIn(role) && (reconciliation?.businessDate !== businessDate.businessDate
      || !['OPEN', 'SUBMITTED', 'REOPENED'].includes(reconciliation?.lifecycleStatus))) {
    throw new Error('Cashier reconciliation status is unavailable. Refresh the operational scope.')
  }
  // The current-date history endpoint and lifecycle read are separate requests.
  // Recheck even an empty result so a rollover cannot appear as a zero for the old date.
  const confirmedDate = await api.getCurrentOpenBusinessDate()
  if (confirmedDate?.status !== 'OPEN' || confirmedDate.businessDate !== businessDate.businessDate) {
    throw new Error('Business Date changed while loading. Refresh the operational scope.')
  }
  return { businessDate: confirmedDate, customers, history: scopedHistory(records, businessDate.businessDate), reconciliation }
}

export function matchingCustomers(customers, search) {
  const query = search.trim().toLowerCase()
  if (!query) return []
  return customers.filter((customer) => [customer.customerCode, customer.fullName, customer.phone]
    .some((value) => typeof value === 'string' && value.toLowerCase().includes(query)))
}

export function verifySession(customer, session, date) {
  if (customer?.status !== 'ACTIVE' || !session?.id || session.customerId !== customer.id
      || session.status !== 'OPEN' || session.exitTime !== null || session.businessDate !== date) {
    throw new Error('Customer requires an OPEN, unexited Reception session for this Business Date.')
  }
  return session
}

export function readyToPost({ role, date, ready, pending, selected, verified, total, amount, mode, reference, finalized }) {
  return canPostBuyIn(role) && Boolean(date) && ready && !pending && !finalized
    && Boolean(selected?.id) && verified?.customerId === selected.id && verified?.status === 'OPEN'
    && verified?.exitTime === null && verified?.businessDate === date && Boolean(verified?.id)
    && Number.isSafeInteger(amount) && amount > 0 && total === amount
    && PAYMENT_MODES.includes(mode) && (mode === 'CASH' || Boolean(reference.trim()))
}

export function historyTotals(history, available) {
  if (!available) return null
  return history.reduce((totals, { transaction }) => {
    const amount = Number(transaction.amountReceived)
    totals.total += amount
    totals[transaction.paymentMode === 'CASH' ? 'cash' : 'nonCash'] += amount
    totals.count++
    return totals
  }, { total: 0, cash: 0, nonCash: 0, count: 0 })
}

const csvCell = (value) => {
  let text = String(value ?? '')
  if (/^[\s\uFEFF]*[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}
export function buyInCsv(records, date) {
  const history = scopedHistory(records, date)
  return [
    ['Buy-In', 'Business Date', 'Timestamp', 'Customer code', 'Customer', 'Session', 'Currency', 'Amount received', 'Payment mode', 'Reference', 'Cashier'],
    ...history.map(({ transaction: tx, customerCode, customerName }) => [tx.buyInCode, tx.businessDate,
      tx.createdAt, customerCode, customerName, tx.customerSessionId, 'NPR', tx.amountReceived,
      tx.paymentMode, tx.paymentReference, tx.createdBy?.username || 'Unavailable']),
  ].map((row) => row.map(csvCell).join(',')).join('\n')
}

// A synchronous lock covers POST and secondary refresh. Uncertain retries retain their key.
export function createBuyInSubmission(newKey = () => globalThis.crypto.randomUUID(), options) {
  if (options) return durableBuyIn(options)
  let pending = false
  let signature = null
  let key = null
  let uncertain = false
  return {
    get pending() { return pending },
    async run(payload, { post, onSuccess, refresh, onWarning }) {
      if (pending) return null
      const nextSignature = JSON.stringify(payload)
      if (uncertain && signature !== nextSignature) {
        throw new Error('The previous request is unconfirmed. Retry the unchanged request before starting another buy-in.')
      }
      if (signature !== nextSignature) { signature = nextSignature; key = newKey() }
      pending = true
      let created
      try {
        try {
          created = await post({ ...payload, idempotencyKey: key })
        } catch (error) {
          uncertain = ![400, 401, 403, 404, 409, 422].includes(error.response?.status)
          throw error
        }
        uncertain = false
        // Confirmation is independent of all secondary reads.
        onSuccess(created)
        signature = null
        key = null
        try { await refresh(created) } catch {
          onWarning('Buy-In posted successfully, but transaction history could not be refreshed. Do not repost this transaction.')
        }
        return created
      } finally { pending = false }
    },
  }
}
