// One bounded, actor/module-scoped operation. Never infer completion from balances/history.
export const actorIdentity = (user) => String(user?.id || user?.username || '')
export function currentActor() {
  try { return globalThis.localStorage.getItem('auth_token') ? actorIdentity(JSON.parse(globalThis.localStorage.getItem('user_data'))) : '' }
  catch { return '' }
}
export function assertActor(actor, resolve = currentActor) {
  if (!actor || resolve() !== actor) throw new Error('Authentication changed. Sign in as the original operator before retrying this operation. No request was sent.')
}
const clone = value => JSON.parse(JSON.stringify(value))
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) } return value }
export function persistedOperation({ module, actor, storage, resolveActor = currentActor, legacyKey = null, newKey = () => crypto.randomUUID() }) {
  if (!/^[a-z-]{1,40}$/.test(module)) throw new Error('Invalid operation module.')
  const storageKey = `i1b:v1:${module}:${encodeURIComponent(actor)}`
  let operation = null, pending = false, issue = '', observedRaw = null, listeners = new Set()
  const notify = () => listeners.forEach(fn => fn())
  const access = () => { const value = storage ?? globalThis.sessionStorage; if (!value) throw new Error('No storage'); return value }
  const validate = value => {
    if (value?.version !== 1 || value.module !== module || value.actorIdentity !== actor
      || typeof value.operationKey !== 'string' || !value.operationKey || value.operationKey.length > 100
      || typeof value.operationType !== 'string' || !value.operationType || !Number.isFinite(Date.parse(value.createdAt))
      || !value.payload || typeof value.payload !== 'object' || Array.isArray(value.payload)
      || !value.target || typeof value.target !== 'object' || Array.isArray(value.target)
      || (value.expectedBusinessDate !== null && (typeof value.expectedBusinessDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.expectedBusinessDate)))) throw new Error('Invalid saved operation')
    return freeze(value)
  }
  const storageError = () => new Error('Recovery storage is unavailable or invalid. No new request was sent. Restore browser storage or discard the local record after checking its outcome.')
  try {
    const raw = access().getItem(storageKey)
    observedRaw = raw
    if (raw !== null) { if (raw.length > 32000) throw new Error(); operation = validate(JSON.parse(raw)) }
    else if (legacyKey) {
      const legacy = access().getItem(legacyKey)
      if (legacy) {
        if (legacy.length > 32000) throw new Error()
        const saved = JSON.parse(legacy)
        if (!saved.kind || !saved.payload || typeof saved.idempotent !== 'boolean') throw new Error()
        operation = validate({ version: 1, module, actorIdentity: actor, operationType: saved.kind,
          operationKey: saved.payload.idempotencyKey || newKey(), createdAt: new Date().toISOString(),
          target: { tableId: saved.tableId, label: saved.machineCode }, expectedBusinessDate: saved.payload.expectedBusinessDate || saved.date || null, payload: saved })
        const migrated = JSON.stringify(operation)
        access().setItem(storageKey, migrated)
        if (access().getItem(storageKey) !== migrated) throw new Error()
        observedRaw = migrated
        access().removeItem(legacyKey)
      }
    }
  }
  catch { issue = storageError().message }
  const write = value => {
    try { const raw = JSON.stringify(value); if (raw.length > 32000) throw new Error(); access().setItem(storageKey, raw); if (access().getItem(storageKey) !== raw) throw new Error(); observedRaw = raw }
    catch { issue = storageError().message; notify(); throw storageError() }
  }
  // A remounted page or an older in-flight preflight must not replace another receipt.
  const checkCurrent = () => {
    try {
      if (access().getItem(storageKey) !== observedRaw) throw new Error()
    } catch {
      issue = 'Recovery storage changed or is unavailable. Reload this page to review the current pending operation. No new request was sent.'
      notify(); throw new Error(issue)
    }
  }
  const removeCurrent = () => {
    checkCurrent()
    access().removeItem(storageKey)
    if (access().getItem(storageKey) !== null) throw storageError()
    observedRaw = null
    operation = null
  }
  return {
    get operation() { return operation }, get pending() { return pending }, get issue() { return issue },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    assertActor() { assertActor(actor, resolveActor) },
    discard() { if (pending) throw new Error('An operation is in progress.'); assertActor(actor, resolveActor); removeCurrent(); issue = ''; notify() },
    async run(input, post, { retry = false, preflight = async () => {}, warning = () => {}, clearDefiniteFailure = false } = {}) {
      if (pending) return null
      assertActor(actor, resolveActor)
      if (issue) throw storageError()
      checkCurrent()
      if (operation && !retry) throw new Error('An operation has an uncertain outcome. Retry Original or explicitly discard its local recovery record before starting a new transaction.')
      if (retry && !operation) throw new Error('There is no saved operation to retry.')
      pending = true; notify()
      try {
        if (!retry) {
          await preflight()
          assertActor(actor, resolveActor)
          checkCurrent()
          const next = validate(clone({ version: 1, module, actorIdentity: actor, operationType: input.operationType,
            operationKey: input.operationKey || newKey(), createdAt: new Date().toISOString(), target: input.target || {},
            expectedBusinessDate: input.expectedBusinessDate || null, payload: input.payload }))
          write(next); operation = next; notify()
        } else write(operation) // Recheck persistence before any recovered transmission.
        assertActor(actor, resolveActor)
        let result
        try { result = await post(operation) }
        catch (error) {
          // Keep every transmitted uncertain operation, including conflicts, until explicitly resolved.
          // Superseded reconciliation is a terminal, non-mutating response.
          const text = error?.response?.data?.message || error.message || ''
          if ((module === 'reconciliation' && error?.response?.status === 409 && /superseded/i.test(text))
              || (clearDefiniteFailure && !retry && [400, 401, 403, 404, 409, 422].includes(error?.response?.status))) {
            try { removeCurrent() } catch { issue = storageError().message }
          }
          throw error
        }
        try { removeCurrent() } catch { issue = 'Operation succeeded, but local receipt cleanup failed. Do not start another operation until browser storage is restored.'; warning(issue) }
        return result
      } finally { pending = false; notify() }
    },
  }
}
