import { persistedOperation, actorIdentity, currentActor } from './persistedOperation.js'
export const ACCOUNTS_ROLES = ['STORE_MANAGER','ACCOUNTANT_HEAD','ACCOUNTS_MANAGER','DIRECTOR']
export const BILL_STATES = ['DRAFT','SUBMITTED','AWAITING_DIRECTOR_APPROVAL','HELD','RETURNED','REJECTED','APPROVED_FOR_PAYMENT']
export const isPreparer = role => ['STORE_MANAGER','ACCOUNTANT_HEAD'].includes(role)
const uuid = value => typeof value === 'string' && /^[a-f0-9-]{36}$/i.test(value)
const amount = value => typeof value === 'string' && /^\d{1,12}\.\d{2}$/.test(value)
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value
const validBill = b => uuid(b?.id) && uuid(b.recorded_by) && BILL_STATES.includes(b.status) && Number.isSafeInteger(b.version) && b.version >= 0 && Number.isSafeInteger(b.revision) && b.revision > 0 && date(b.business_date) && typeof b.invoice_reference === 'string'
const validEvidence = e => uuid(e?.id) && typeof e.original_name === 'string' && typeof e.invoice_document === 'boolean' && /^[a-f0-9]{64}$/.test(e.checksum || '') && ['application/pdf','image/jpeg','image/png'].includes(e.media_type)
const validSnapshot = s => s && s.invoice?.currency === 'NPR' && uuid(s.invoice.partyId) && date(s.invoice.invoiceDate) && ['subtotal','discount','tax','total'].every(k => amount(s.invoice[k])) && Array.isArray(s.invoice.lines) && s.invoice.lines.length > 0 && s.invoice.lines.every(l => typeof l.description === 'string' && amount(l.amount)) && Array.isArray(s.evidenceIds) && s.evidenceIds.every(uuid) && typeof s.partyName === 'string' && Array.isArray(s.sourceSnapshots)
export function decode(kind, value) {
  let valid = false
  if (kind === 'context') valid = value?.currency === 'NPR' && uuid(value.actorId) && ACCOUNTS_ROLES.includes(value.role) && typeof value.username === 'string' && (value.businessDate === null || date(value.businessDate))
  else if (kind === 'receipt') valid = uuid(value?.id) && uuid(value.operationId) && Number.isSafeInteger(value.version) && value.version >= 0
  else if (kind === 'detail') valid = validBill(value?.bill) && validSnapshot(value.snapshot) && Array.isArray(value.evidence) && value.evidence.every(validEvidence) && value.evidence.length === value.snapshot.evidenceIds.length && value.evidence.every(e => value.snapshot.evidenceIds.includes(e.id)) && (value.bill.verification_id == null ? value.verification == null : uuid(value.verification?.id) && value.verification.id === value.bill.verification_id && uuid(value.verification.actor_id) && value.verification.revision === value.bill.revision && value.verification.action === 'VERIFY' && typeof value.verification.decided_at === 'string' && /^[a-f0-9]{64}$/.test(value.verification.evidence_digest || ''))
  else valid = Array.isArray(value?.items) && typeof value.hasMore === 'boolean' && Number.isSafeInteger(value.page) && value.page >= 0 && Number.isSafeInteger(value.size) && value.size > 0 && value.size <= 100 && value.items.length <= value.size && value.items.every(row => {
    if (kind === 'bills') return validBill(row) && amount(row.total) && typeof row.party_name === 'string'
    if (kind === 'parties') return uuid(row.id) && typeof row.name === 'string' && typeof row.code === 'string'
    if (kind === 'sources') return uuid(row.id) && typeof row.reference === 'string'
    if (kind === 'evidence') return validEvidence(row)
    if (kind === 'revisions') return Number.isSafeInteger(row.revision) && validSnapshot(row.snapshot)
    if (kind === 'decisions') return uuid(row.id) && ['SUBMIT','VERIFY','APPROVE','HOLD','RESUME','RETURN','REJECT'].includes(row.action) && uuid(row.actor_id) && Number.isSafeInteger(row.revision)
    return false
  })
  if (!valid) throw Error(`Authoritative Accounts ${kind} response is malformed or unavailable.`)
  return value
}
export function actionsFor(user, detail) {
  if (!detail || !uuid(user?.id) || !ACCOUNTS_ROLES.includes(user?.role)) return []
  const b = detail.bill, own = user.id === b.recorded_by
  if (isPreparer(user.role)) return own && ['DRAFT','RETURNED'].includes(b.status) ? ['corrections','upload','submit'] : []
  if (own) return []
  const stage = b.status === 'HELD' ? b.held_stage : b.status === 'SUBMITTED' ? 'VERIFICATION' : b.status === 'AWAITING_DIRECTOR_APPROVAL' ? 'APPROVAL' : null
  if (stage === 'VERIFICATION' && user.role === 'ACCOUNTS_MANAGER') return b.status === 'HELD' ? ['resume','return','reject'] : ['verify','hold','return','reject']
  if (stage === 'APPROVAL' && user.role === 'DIRECTOR' && detail.verification?.actor_id !== user.id) return b.status === 'HELD' ? ['resume','return','reject'] : ['approve','hold','return','reject']
  return []
}
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) } return value }
export function intent(kind, target, payload, key = crypto.randomUUID()) { return freeze(JSON.parse(JSON.stringify({ operationType: kind, target, payload, expectedBusinessDate: payload.expectedBusinessDate || null, operationKey: key }))) }
export async function fileMetadata(file) {
  if (!file || file.size <= 0 || file.size > 5 * 1024 * 1024 || !['application/pdf','image/jpeg','image/png'].includes(file.type)) throw Error('Choose a PDF, JPEG or PNG up to 5 MiB (5,242,880 bytes).')
  return { name: file.name, type: file.type, size: file.size, checksum: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())), n => n.toString(16).padStart(2,'0')).join('') }
}
export function createAccountsManager({ api, user, notify = () => {}, storage, resolveActor = currentActor }) {
  const actor = actorIdentity(user), generation = {}, recovery = persistedOperation({ module: 'accounts', actor, storage, resolveActor })
  let active = true, busy = false, state = { message: '', mutationError: '', working: false }
  const publish = patch => { state = { ...state, ...patch }; if (active) notify(state) }
  const current = () => active && resolveActor() === actor
  const load = async (channel, kind, params) => {
    if (!current() || !ACCOUNTS_ROLES.includes(user.role)) return false
    const n = generation[channel] = (generation[channel] || 0) + 1
    publish({ [channel]: { loading: true, data: null, error: '' } })
    try { const data = decode(kind, await api.read(kind, params)); if (kind === 'context' && (data.role !== user.role || user.id && data.actorId !== user.id || user.username && data.username !== user.username)) throw Error('Accounts context does not match the authenticated actor.'); if (kind === 'detail' && data.bill.id !== params?.id || data.items && (data.page !== (params?.page || 0) || data.size !== (params?.size || 50))) throw Error('Accounts response does not match the requested scope.'); if (current() && n === generation[channel]) { publish({ [channel]: { loading: false, data, error: '' } }); return true } }
    catch (e) { if (current() && n === generation[channel]) publish({ [channel]: { loading: false, data: null, error: e?.response?.data?.message || e.message } }) }
    return false
  }
  return {
    get state() { return state }, recovery, load,
    isCurrent: current,
    async download(billId, evidenceId, deliver) {
      if (!current()) return false
      const n = generation.download = (generation.download || 0) + 1
      try {
        const blob = await api.document(billId, evidenceId)
        if (!current() || generation.download !== n) return false
        deliver(blob); return true
      } catch (error) {
        if (current() && generation.download === n) throw error
        return false
      }
    },
    invalidate(channel) { generation[channel] = (generation[channel] || 0) + 1; publish({ [channel]: { loading: false, data: null, error: '' } }) },
    activate() { active = true }, dispose() { active = false; Object.keys(generation).forEach(k => generation[k]++) },
    async submit(frozen, refresh = async () => {}, retry = false, file = null) {
      if (busy || !active) return null
      if (!ACCOUNTS_ROLES.includes(user.role)) throw Error('No Accounts workflow access.')
      busy = true; publish({ working: true, mutationError: '', message: '' })
      try {
        const result = await recovery.run(frozen, async saved => {
          if (saved.operationType === 'upload') {
            const meta = await fileMetadata(file)
            if (JSON.stringify(meta) !== JSON.stringify(saved.payload.file)) throw Error('Reselect the exact original file for this upload retry. No upload sent.')
          }
          return decode('receipt', await api.mutate(saved, file))
        }, { retry, clearDefiniteFailure: true })
        if (!result) return null
        if (current()) publish({ message: 'Recorded successfully. No payment was made.' })
        try { if (current()) await refresh(result) } catch { if (current()) publish({ message: 'Recorded successfully. Refresh failed; reload authoritative records before continuing.' }) }
        return result
      } catch (e) { if (current()) publish({ mutationError: e?.response?.data?.message || e.message }); throw e }
      finally { busy = false; if (current()) publish({ working: false }) }
    },
  }
}
