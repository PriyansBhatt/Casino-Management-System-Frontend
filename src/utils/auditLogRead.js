export function auditPage(value) {
  if (!value || !Array.isArray(value.items) || !Number.isInteger(value.page) || value.page < 0 || !Number.isInteger(value.size) || value.size < 1 || value.size > 100 || typeof value.hasNext !== 'boolean' || value.items.length > value.size) throw Error('Audit records unavailable: invalid response.')
  const nullableText = value => value == null || typeof value === 'string'
  const items = value.items.map(row => {
    if (!row || typeof row.id !== 'string' || typeof row.detailsWithheld !== 'boolean' || (row.safeDetails != null && typeof row.safeDetails !== 'string') || (row.detailsWithheld && row.safeDetails != null)) throw Error('Audit records unavailable: invalid record.')
    if (!['businessDate','actionType','moduleName','entityId','performedAt'].every(key => nullableText(row[key])) ||
        (row.actor != null && (typeof row.actor !== 'object' || Array.isArray(row.actor) || typeof row.actor.id !== 'string' || !row.actor.id || !nullableText(row.actor.username) || !nullableText(row.actor.fullName)))) throw Error('Audit records unavailable: invalid record fields.')
    // Explicit allowlist; never retain unexpected raw remarks, role or metadata.
    return { id: row.id, businessDate: row.businessDate ?? null, actionType: row.actionType ?? null, moduleName: row.moduleName ?? null, entityId: row.entityId ?? null, performedAt: row.performedAt ?? null,
      actor: row.actor ? { id: row.actor.id, username: row.actor.username ?? null, fullName: row.actor.fullName ?? null } : null,
      safeDetails: row.safeDetails ?? null, detailsWithheld: row.detailsWithheld }
  })
  return { items, page: value.page, size: value.size, hasNext: value.hasNext }
}
export const actorLabel = actor => !actor ? 'Not recorded' : actor.fullName || actor.username || 'Unknown user'
export const detailsLabel = row => row.detailsWithheld ? 'Details withheld' : row.safeDetails ?? 'Not recorded'
export const timestampLabel = value => value ? value.replace('T', ' ') : 'Not recorded'
export function auditCsv(items) {
  const cell = value => { let text = String(value ?? ''); if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = "'" + text; return '"' + text.replaceAll('"', '""') + '"' }
  const rows = [['Timestamp','Business Date','Actor','Username','Action','Module','Entity ID','Safe Details'], ...items.map(row => [row.performedAt,row.businessDate,actorLabel(row.actor),row.actor?.username,row.actionType,row.moduleName,row.entityId,detailsLabel(row)])]
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')
}
export function createAuditReader(api, notify) {
  let generation = 0, active = true
  let state = { loading: false, data: null, error: '', filters: {}, page: 0 }
  const publish = patch => { state = { ...state, ...patch }; if (active) notify(state) }
  const load = async (filters = state.filters, page = 0) => {
    const token = ++generation
    const frozen = { ...filters }
    publish({ loading: true, data: null, error: '', filters: frozen, page })
    try {
      const data = auditPage(await api({ ...frozen, page, size: 50 }))
      if (data.page !== page || data.size !== 50) throw Error('Audit response scope is inconsistent.')
      if (active && token === generation) publish({ loading: false, data })
    } catch (error) { if (active && token === generation) publish({ loading: false, data: null, error: 'Audit records unavailable. Check filters and retry.' }) }
  }
  return { get state() { return state }, load, activate() { active = true }, dispose() { active = false; generation++ } }
}
