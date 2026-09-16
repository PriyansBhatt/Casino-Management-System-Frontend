import { persistedOperation } from './persistedOperation.js'
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) } return value }
const callbacks = async (result, frozen, success, refresh, warning) => {
  try { success?.(result, frozen) } catch { warning?.('Transaction confirmed; display details unavailable. Do not repost.') }
  try { await refresh?.(frozen) } catch { warning?.('Transaction posted successfully, but refresh failed. Do not repost; refresh authoritative data.') }
}
export function durableBuyIn(options) {
  const store = persistedOperation({ ...options, module: 'buy-in' })
  let active = false
  return { store, get pending() { return active || store.pending },
    async run(payload, handlers, retry = false) {
      if (active || store.pending) return null
      const frozen = retry ? store.operation : null
      active = true
      try {
        const result = await store.run({ operationType: 'Buy-In', expectedBusinessDate: payload?.expectedBusinessDate,
          target: { label: handlers.targetLabel, customerId: payload?.customerId, amount: payload?.amountReceived }, payload },
        op => handlers.post({ ...op.payload, idempotencyKey: op.operationKey }), { retry, warning: handlers.onWarning })
        await callbacks(result, frozen, handlers.onSuccess, handlers.refresh, handlers.onWarning)
        return result
      } finally { active = false }
    },
  }
}
export function durableCustody(options) {
  const store = persistedOperation({ ...options, module: 'custody' })
  let active = false
  return { store, get pending() { return active || store.pending },
    async run(operation, handlers, retry = false) {
      if (active || store.pending) return null
      active = true
      try {
        const result = await store.run({ operationType: `Custody ${operation?.kind || ''} ${operation?.mode || ''}`,
          expectedBusinessDate: operation?.date, target: { tableId: operation?.tableId, amount: Object.entries(operation?.denominations || {}).reduce((sum, [d, q]) => sum + Number(d) * q, 0) }, payload: operation },
        op => handlers.post(op.payload, op.operationKey), { retry, preflight: handlers.preflight, warning: handlers.warning })
        await callbacks(result, null, handlers.success, handlers.refresh, handlers.warning)
        return result
      } finally { active = false }
    },
  }
}
export function durableCashOut(options) {
  const store = persistedOperation({ ...options, module: 'cash-out' })
  let active = false
  let draft = null
  return { store, get pending() { return active || store.pending }, get uncertain() { return Boolean(store.operation) },
    get target() { return store.operation?.payload || draft },
    prepare(operation) { if (store.pending || store.operation) throw new Error('Resolve the pending transaction before starting a new one.'); draft = freeze(structuredClone(operation)); return draft },
    cancel() { if (!store.pending && !store.operation) draft = null },
    async run(handlers) {
      if (active || store.pending) return null
      const retry = Boolean(store.operation), frozen = store.operation?.payload || draft
      if (!frozen) return null
      active = true
      try {
        const result = await store.run({ operationType: frozen.kind === 'cash' ? 'Cash-Out' : 'Losing Return',
          expectedBusinessDate: frozen.date, target: { label: frozen.customerName, amount: frozen.payload.cashPaid ?? frozen.quote }, payload: frozen },
        op => handlers.post({ ...op.payload, payload: { ...op.payload.payload, idempotencyKey: op.operationKey } }),
        { retry, preflight: () => handlers.preflight(frozen), warning: handlers.warning })
        draft = null
        await callbacks(result, frozen, handlers.success, handlers.refresh, handlers.warning)
        return { confirmed: true, result }
      } finally { active = false }
    },
  }
}
export function durableReconciliation(options, freezeCount, validate) {
  const store = persistedOperation({ ...options, module: 'reconciliation' })
  let active = false
  return { store, get pending() { return active || store.pending }, get uncertain() { return Boolean(store.operation) }, get target() { return store.operation?.payload },
    async run(input, handlers) {
      if (active || store.pending) return null
      const retry = Boolean(store.operation)
      const payload = retry ? store.operation.payload : { ...freezeCount(input.date, input.counts, input.remarks, crypto.randomUUID()), expectedReopenedAt: input.expectedReopenedAt || null }
      active = true
      try {
        const result = await store.run({ operationType: 'Cashier Reconciliation', expectedBusinessDate: payload.expectedBusinessDate,
          operationKey: payload.idempotencyKey, target: { amount: Object.entries(payload.denominations).reduce((sum, [d, q]) => sum + Number(d) * q, 0) }, payload }, async op => {
          const value = await handlers.post(op.payload)
          validate(value, op.payload.expectedBusinessDate, op.payload)
          return value
        }, { retry, preflight: () => handlers.preflight(payload), warning: handlers.warning })
        await callbacks(result, payload, handlers.success, handlers.refresh, handlers.warning)
        return result
      } finally { active = false }
    },
  }
}
