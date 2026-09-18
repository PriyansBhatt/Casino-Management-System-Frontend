// Small, page-local HR request generations. No records or actions are persisted.
export function freezeHrIntent(value) {
  const copy = structuredClone(value)
  const freeze = item => { if (item && typeof item === 'object') { Object.values(item).forEach(freeze); Object.freeze(item) } }
  freeze(copy)
  return copy
}
export function createHrSafety(authorised = () => true) {
  let active = true, pending = false
  const generations = new Map(), completed = new WeakSet()
  const live = () => active && authorised()
  const invalidate = (...channels) => channels.forEach(channel => generations.set(channel, (generations.get(channel) || 0) + 1))
  const capture = channel => { if (!generations.has(channel)) generations.set(channel, 0); const version = generations.get(channel) || 0; return () => live() && version === (generations.get(channel) || 0) }
  return {
    live, invalidate, capture,
    begin(channel) { invalidate(channel); return capture(channel) },
    mount() { active = true },
    dispose() { active = false; invalidate(...generations.keys()) },
    get pending() { return pending },
    async submit(intent, execute, { busy, success, failure, refresh, warning }) {
      if (!intent || !live() || pending || completed.has(intent)) return
      pending = true
      busy(true)
      try {
        try { await execute(intent) }
        catch (error) { if (live()) failure(error); return false }
        completed.add(intent)
        if (!live()) return true
        success()
        try {
          const refreshed = await refresh()
          if (refreshed === false && live()) warning()
        } catch { if (live()) warning() }
        return true
      } finally { pending = false; if (live()) busy(false) }
    },
  }
}
