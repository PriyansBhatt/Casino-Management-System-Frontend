export const USER_ROLES = Object.freeze(['SUPER_ADMIN', 'DIRECTOR', 'RECEPTIONIST', 'CASHIER', 'PIT_SUPERVISOR', 'DEALER'])
export const knownRole = value => USER_ROLES.includes(value)
export const knownStatus = value => typeof value === 'string' && ['ACTIVE', 'INACTIVE'].includes(value.toUpperCase())
export const roleLabel = value => knownRole(value) ? value : 'Unknown'
export const statusLabel = value => knownStatus(value) ? value.toUpperCase() : 'Unknown'
export const canChangeAuthority = target => knownRole(target?.role) && knownStatus(target?.status)
export const isSelf = (actor, target) => actor?.username === target?.username
export function validatePassword(password, confirmation) {
  if (!password || !password.trim() || password.length < 6 || new TextEncoder().encode(password).length > 72) throw Error('Password must contain at least 6 characters and at most 72 UTF-8 bytes.')
  if (password !== confirmation) throw Error('Passwords do not match.')
  return password
}
export function filteredUsers(rows, { search = '', role = '', status = '' }) {
  const query = search.trim().toLowerCase()
  return rows.filter(u => (!role || u.role === role) && (!status || statusLabel(u.status) === status) && [u.username, u.fullName, u.email, u.staff?.employeeCode].some(v => String(v || '').toLowerCase().includes(query)))
    .sort((a, b) => a.username.localeCompare(b.username) || a.id.localeCompare(b.id))
}
export function validUsers(value) {
  if (!Array.isArray(value) || value.some(u => typeof u?.id !== 'string' || !u.id || typeof u.username !== 'string' || !u.username)) throw Error('Authoritative user directory unavailable.')
  return value
}
export function createUserManager(api, notify) {
  let active = true, generation = 0, submitting = false
  let state = { rows: null, loading: true, working: false, error: '', message: '' }
  const publish = patch => { state = { ...state, ...patch }; if (active) notify(state) }
  const load = async () => {
    const current = ++generation
    publish({ rows: null, loading: true, error: '' })
    try {
      const rows = validUsers(await api.getUsers())
      if (active && current === generation) publish({ rows, loading: false })
    } catch (error) {
      if (active && current === generation) publish({ rows: null, loading: false, error: error?.response?.data?.message || error.message || 'User directory unavailable.' })
    }
  }
  return {
    get state() { return state }, load,
    activate() { active = true },
    dispose() { active = false; generation++ },
    async submit(action, target, payload, success, onSuccess = () => {}) {
      if (submitting || !active) return false
      submitting = true; generation++
      const id = target?.id, frozen = Object.freeze({ ...payload })
      publish({ working: true, loading: false, error: '', message: '' })
      try {
        if (['role', 'status'].includes(action) && !canChangeAuthority(target)) throw Error('Role/status changes are unavailable while the current account authority is Unknown.')
        if (action === 'create') await api.createUser(frozen)
        else if (action === 'role') await api.changeUserRole(id, frozen)
        else if (action === 'status') await api.toggleUserStatus(id, frozen)
        else if (action === 'password') await api.resetUserPassword(id, frozen)
        else throw Error('Unsupported account action.')
        if (active) { publish({ message: success }); onSuccess(); await load() }
        return true
      } catch (error) {
        if (active) publish({ error: error?.response?.data?.message || error.message || 'Account request failed. Refresh before retrying.' })
        return false
      } finally { submitting = false; if (active) publish({ working: false }) }
    },
  }
}
