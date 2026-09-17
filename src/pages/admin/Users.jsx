import { useEffect, useRef, useState } from 'react'
import useAuth from '../../hooks/useAuth'
import adminApi from '../../api/adminApi'
import { USER_ROLES, canChangeAuthority, roleLabel, statusLabel, createUserManager, filteredUsers, isSelf, validatePassword } from '../../utils/userManagement'

const input = 'w-full rounded border border-slate-300 p-2'
const button = 'rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50'
const blank = { username: '', fullName: '', email: '', role: 'CASHIER', password: '', confirmation: '', acknowledged: false }
const date = value => value ? value.replace('T', ' ').slice(0, 19) : 'Unavailable'

export default function Users() {
  const { user } = useAuth()
  const [view, setView] = useState({ rows: null, loading: true, working: false, error: '', message: '' })
  const manager = useRef(null)
  if (!manager.current) manager.current = createUserManager(adminApi, setView)
  const [filters, setFilters] = useState({ search: '', role: '', status: '' })
  const [dialog, setDialog] = useState(null)
  const [form, setForm] = useState({ ...blank })
  const [formError, setFormError] = useState('')
  useEffect(() => {
    const model = manager.current
    model.activate()
    if (user?.role === 'SUPER_ADMIN') model.load()
    return () => model.dispose()
  }, [user?.role])
  if (user?.role !== 'SUPER_ADMIN') return <p role="alert">Only SUPER_ADMIN may manage users.</p>
  const open = (kind, target = null) => {
    if (view.working || (kind === 'role' && !canChangeAuthority(target))) return
    setDialog({ kind, target: target ? { ...target } : null })
    setForm({ ...blank, role: USER_ROLES.includes(target?.role) ? target.role : 'CASHIER' })
    setFormError('')
  }
  const close = () => { setDialog(null); setForm({ ...blank }); setFormError('') }
  const update = (name, value) => setForm(current => ({ ...current, [name]: value }))
  const submit = async event => {
    event.preventDefault()
    if (view.working || !dialog) return
    const { kind, target } = dialog
    try {
      let payload
      if (kind === 'create') {
        payload = { username: form.username.trim(), fullName: form.fullName.trim(), email: form.email.trim() || null, role: form.role, password: validatePassword(form.password, form.confirmation) }
        if (!payload.username || !payload.fullName) throw Error('Username and full name are required.')
      } else if (kind === 'password') {
        if (isSelf(user, target) && !form.acknowledged) throw Error('Acknowledge the existing-session behavior before resetting your own password.')
        payload = { password: validatePassword(form.password, form.confirmation) }
      } else {
        if (!canChangeAuthority(target)) throw Error('Current account authority is Unknown.')
        if (isSelf(user, target)) throw Error('You cannot demote your own account.')
        payload = { role: form.role, expectedRole: target.role }
        if (!window.confirm(`Change ${target.username} from ${target.role} to ${form.role}?`)) return
      }
      if (kind !== 'password' && !USER_ROLES.includes(payload.role)) throw Error('Choose an approved role.')
      setForm(current => ({ ...current, password: '', confirmation: '' }))
      setFormError('')
      await manager.current.submit(kind, target, payload, kind === 'create' ? 'User created.' : kind === 'role' ? 'User role changed.' : 'Password reset. Existing JWTs are not revoked.', close)
    } catch (error) { setFormError(error.message); setForm(current => ({ ...current, password: '', confirmation: '' })) }
  }
  const changeStatus = async target => {
    if (view.working || isSelf(user, target) || !canChangeAuthority(target)) return
    const status = statusLabel(target.status) === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    if (!window.confirm(`${status === 'INACTIVE' ? 'Deactivate' : 'Activate'} ${target.username}?`)) return
    await manager.current.submit('status', { ...target }, { status, expectedStatus: target.status }, `User ${status === 'ACTIVE' ? 'activated' : 'deactivated'}.`)
  }
  const rows = view.rows ? filteredUsers(view.rows, filters) : []
  return <div className="space-y-5">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">User Management</h1><p>Manage system login accounts. Staff profiles remain managed through HR.</p></div><div className="flex gap-2"><button className={button} disabled={view.working || view.loading} onClick={() => manager.current.load()}>Refresh</button><button className={button} disabled={view.working} onClick={() => open('create')}>Add User</button></div></div>
    <div className="grid grid-cols-3 gap-3">{[['Total Users', view.rows?.length], ['Active', view.rows?.filter(u => statusLabel(u.status) === 'ACTIVE').length], ['Inactive', view.rows?.filter(u => statusLabel(u.status) === 'INACTIVE').length]].map(([label, count]) => <div className="rounded border bg-white p-4" key={label}><p>{label}</p><strong>{count ?? 'Unavailable'}</strong></div>)}</div>
    {view.message && <p role="status" className="text-green-800">{view.message}</p>}
    {view.error && <p role="alert" className="text-red-700">{view.error}{view.message && ' The account action succeeded; refresh the directory to see current data.'}</p>}
    <div className="flex gap-3"><input className={input} aria-label="Search users" placeholder="Search username, name, email or employee code" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} /><select className={input} aria-label="Filter role" value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })}><option value="">All roles</option>{USER_ROLES.map(role => <option key={role}>{role}</option>)}</select><select className={input} aria-label="Filter status" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option><option>ACTIVE</option><option>INACTIVE</option></select></div>
    {view.loading ? <p role="status">Loading users…</p> : view.rows && !rows.length ? <p>No users match the current filters.</p> : view.rows && <div className="overflow-x-auto rounded border bg-white"><table className="w-full text-left text-sm"><thead><tr>{['Username', 'Full Name', 'Email', 'Role', 'Status', 'Staff Link', 'Created', 'Updated', 'Actions'].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(target => <tr className="border-t" key={target.id}><td className="p-3">{target.username}</td><td>{target.fullName}</td><td>{target.email || 'Not supplied'}</td><td>{roleLabel(target.role)}</td><td>{statusLabel(target.status)}</td><td>{target.staff?.employeeCode || 'No linked staff profile'}</td><td>{date(target.createdAt)}</td><td>{date(target.updatedAt)}</td><td><div className="flex gap-2">{!isSelf(user, target) && <><button className={button} disabled={view.working || !canChangeAuthority(target)} title={!canChangeAuthority(target) ? 'Current account authority is Unknown' : undefined} onClick={() => open('role', target)}>Change Role</button><button className={button} disabled={view.working || !canChangeAuthority(target)} title={!canChangeAuthority(target) ? 'Current account authority is Unknown' : undefined} onClick={() => changeStatus(target)}>{!canChangeAuthority(target) ? 'Status unavailable' : statusLabel(target.status) === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button></>}<button className={button} disabled={view.working} onClick={() => open('password', target)}>Reset Password</button></div></td></tr>)}</tbody></table></div>}
    {dialog && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-label={dialog.kind === 'create' ? 'Add User' : dialog.kind === 'role' ? 'Change Role' : 'Reset Password'} className="w-full max-w-lg rounded bg-white p-6"><h2 className="text-xl font-bold">{dialog.kind === 'create' ? 'Add User' : `${dialog.kind === 'role' ? 'Change Role' : 'Reset Password'}: ${dialog.target.username}`}</h2><form onSubmit={submit} className="mt-4 space-y-3"><fieldset disabled={view.working} className="space-y-3">
      {dialog.kind === 'create' && <>{[['username', 'Username', 50], ['fullName', 'Full Name', 150], ['email', 'Email (optional)', 150]].map(([name, label, max]) => <label className="block" key={name}>{label}<input className={input} required={name !== 'email'} type={name === 'email' ? 'email' : 'text'} maxLength={max} value={form[name]} onChange={e => update(name, e.target.value)} autoComplete="off" /></label>)}</>}
      {dialog.kind !== 'password' && <label className="block">{dialog.kind === 'role' ? `Current role: ${dialog.target.role}. New role` : 'Role'}<select className={input} value={form.role} onChange={e => update('role', e.target.value)}>{USER_ROLES.map(role => <option key={role}>{role}</option>)}</select></label>}
      {dialog.kind !== 'role' && <>{[['password', dialog.kind === 'password' ? 'New Password' : 'Password'], ['confirmation', 'Confirm Password']].map(([name, label]) => <label className="block" key={name}>{label}<input className={input} type="password" required autoComplete="new-password" value={form[name]} onChange={e => update(name, e.target.value)} /></label>)}</>}
      {dialog.kind === 'password' && <p>Resetting a password does not revoke existing JWTs. They remain valid until expiry or an account authority change.</p>}
      {dialog.kind === 'password' && isSelf(user, dialog.target) && <label className="block"><input type="checkbox" checked={form.acknowledged} onChange={e => update('acknowledged', e.target.checked)} /> I confirm resetting my own password and understand that existing JWTs remain valid.</label>}
      {formError && <p role="alert" className="text-red-700">{formError}</p>}
      <div className="flex justify-end gap-2"><button type="button" className={button} onClick={close}>Cancel</button><button className={button} type="submit">{view.working ? 'Saving…' : 'Confirm'}</button></div>
    </fieldset></form></section></div>}
  </div>
}
