import ConfirmDialog from '../../components/ui/ConfirmDialog'
import useAuth from '../../hooks/useAuth'
import useHrSafety, { hrActorKey } from '../../hooks/useHrSafety'
import { freezeHrIntent } from '../../utils/hrSafety'
import { useEffect, useState } from 'react'
import hrApi from '../../api/hrApi'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Loading from '../../components/ui/Loading'
import useToast from '../../hooks/useToast'
import { Actions, Field, Header, LeaveTable, Overlay, Status, formatDateTime } from './MyLeave'

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100'
const emptyFilters = { startDate: '', endDate: '', staffProfileId: '', departmentId: '', leaveTypeId: '', status: '' }
const emptyType = { code: '', name: '', description: '', active: true }

const LeaveManagement = () => {
  const { showToast } = useToast()
  const safety = useHrSafety()
  const [refreshWarning, setRefreshWarning] = useState('')
  const [tab, setTab] = useState('requests')
  const [requests, setRequests] = useState([])
  const [types, setTypes] = useState([])
  const [staff, setStaff] = useState([])
  const [departments, setDepartments] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [action, setAction] = useState(null)
  const [typeEditor, setTypeEditor] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const clearDetail = () => { safety.invalidate('detail', 'scope'); setSelected(null); setDetailLoading(false) }
  const changeFilters = next => {
    safety.invalidate('list', 'scope'); clearDetail()
    setRefreshWarning(''); setFilters(next); setRequests([]); setLoading(false); setError('Apply filters to load authoritative leave requests.')
    setAction(null); setConfirmation(null)
  }
  const load = async (nextFilters = filters) => {
    if (!safety.live()) return
    const current = safety.begin('list')
    setRefreshWarning(''); setAction(null); setTypeEditor(null); setConfirmation(null)
    clearDetail(); setLoading(true); setError(''); setRequests([])
    try {
      const [leaveRows, leaveTypes, staffRows, departmentRows] = await Promise.all([
        hrApi.getLeaveRequests(nextFilters), hrApi.getLeaveTypes(), hrApi.getStaff(), hrApi.getDepartments(),
      ])
      if (!current()) return
      setRequests(leaveRows); setTypes(leaveTypes); setStaff(staffRows); setDepartments(departmentRows); return true
    } catch (error) {
      if (!current()) return
      setRequests([]); setTypes([]); setStaff([]); setDepartments([])
      setError(error.message || 'Unable to load authoritative leave management data.'); return false
    } finally { if (current()) setLoading(false) }
  }
  useEffect(() => { void load(emptyFilters) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const changeTab = next => {
    safety.invalidate('list', 'detail', 'scope'); setTab(next); setAction(null); setTypeEditor(null); setConfirmation(null)
    void load(filters)
  }
  const applyFilters = event => {
    event.preventDefault()
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      showToast({ type: 'error', title: 'Invalid filter dates', message: 'End date cannot be before start date.' }); return
    }
    void load(filters)
  }
  const openRequest = async row => {
    safety.invalidate('scope')
    const current = safety.begin('detail')
    setError(''); setSelected(null); setDetailLoading(true)
    try {
      const detail = await hrApi.getLeaveRequest(row.requestId)
      if (current()) setSelected(detail)
    } catch (error) {
      if (current()) showToast({ type: 'error', title: 'Request unavailable', message: error.message || 'Unable to load this leave request.' })
    } finally { if (current()) setDetailLoading(false) }
  }
  const submitAction = event => {
    event.preventDefault()
    if (safety.pending) return
    const reason = action.reason.trim()
    if (action.type !== 'approve' && !reason) { showToast({ type: 'error', title: 'Reason required', message: 'Enter a reason for this action.' }); return }
    setConfirmation(freezeHrIntent({ operation: action.type, id: action.record.requestId,
      payload: action.type === 'approve' ? { remarks: reason || null } : { reason },
      context: `${action.record.staff?.fullName || action.record.staff?.username || 'Employee'} · ${action.record.startDate} to ${action.record.endDate}` }))
  }
  const saveType = event => {
    event.preventDefault()
    if (safety.pending) return
    const form = typeEditor.form
    if (!form.name.trim() || (!typeEditor.record && !form.code.trim())) { showToast({ type: 'error', title: 'Required fields missing', message: 'Code and name are required.' }); return }
    const payload = { ...form, name: form.name.trim(), description: form.description.trim() || null }
    if (typeEditor.record) delete payload.code
    else payload.code = form.code.trim().toUpperCase()
    setConfirmation(freezeHrIntent({ operation: typeEditor.record ? 'updateType' : 'createType', id: typeEditor.record?.id, payload, context: `${form.code} · ${form.name}` }))
  }
  const confirmMutation = () => {
    const current = safety.capture('scope')
    const methods = { approve:'approveLeaveRequest', reject:'rejectLeaveRequest', cancel:'cancelLeaveRequest', updateType:'updateLeaveType', createType:'createLeaveType' }
    return safety.submit(confirmation, intent => intent.operation === 'createType'
      ? hrApi.createLeaveType(intent.payload) : hrApi[methods[intent.operation]](intent.id, intent.payload), {
      busy: setSaving,
      success: () => { setConfirmation(null); setAction(null); setTypeEditor(null); setRefreshWarning(''); showToast({ type: 'success', title: 'Leave updated', message: 'The requested change was saved.' }) },
      failure: error => showToast({ type: 'error', title: 'Leave update failed', message: error.message || 'The leave update was rejected.' }),
      refresh: () => current() ? load(filters) : undefined,
      warning: () => setRefreshWarning('Leave updated, but refreshed data could not be loaded.'),
    })
  }

  return <div className="space-y-6">
    {refreshWarning && <p role="status" className="rounded border border-amber-300 bg-amber-50 p-3">{refreshWarning}</p>}
    <PageHeader title="Leave Management" description="Review full-day leave requests and maintain authoritative leave types." actions={<Button type="button" variant="outline" onClick={() => load(filters)} disabled={loading}>Refresh</Button>} />
    <div className="flex gap-2 rounded-xl bg-slate-100 p-1"><Tab active={tab === 'requests'} onClick={() => changeTab('requests')}>Leave Requests</Tab><Tab active={tab === 'types'} onClick={() => changeTab('types')}>Leave Types</Tab></div>
    {tab === 'requests' && <Card><form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-4 lg:grid-cols-7"><Field label="From"><input type="date" value={filters.startDate} onChange={(e) => changeFilters({ ...filters, startDate: e.target.value })} className={inputClass} /></Field><Field label="To"><input type="date" value={filters.endDate} onChange={(e) => changeFilters({ ...filters, endDate: e.target.value })} className={inputClass} /></Field><Field label="Employee"><select value={filters.staffProfileId} onChange={(e) => changeFilters({ ...filters, staffProfileId: e.target.value })} className={inputClass}><option value="">All employees</option>{staff.map((row) => <option key={row.staffProfileId} value={row.staffProfileId}>{row.fullName || row.username} · {row.employeeCode}</option>)}</select></Field><Field label="Department"><select value={filters.departmentId} onChange={(e) => changeFilters({ ...filters, departmentId: e.target.value })} className={inputClass}><option value="">All departments</option>{departments.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field><Field label="Leave Type"><select value={filters.leaveTypeId} onChange={(e) => changeFilters({ ...filters, leaveTypeId: e.target.value })} className={inputClass}><option value="">All types</option>{types.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field><Field label="Status"><select value={filters.status} onChange={(e) => changeFilters({ ...filters, status: e.target.value })} className={inputClass}><option value="">All statuses</option>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></Field><div className="flex items-end"><Button type="submit" disabled={loading}>Apply</Button></div></form></Card>}
    {loading && <Card><Loading message="Loading authoritative leave management data..." size="sm" /></Card>}
    {!loading && error && <ErrorState title="Leave management unavailable" description={error} onRetry={() => load(filters)} />}
    {!loading && !error && tab === 'requests' && (requests.length ? <LeaveTable rows={requests} onSelect={openRequest} /> : <Card><EmptyState title="No leave requests found" description="No authoritative request matches the current filters." /></Card>)}
    {!loading && !error && tab === 'types' && <LeaveTypes rows={types} onCreate={() => setTypeEditor({ record: null, form: emptyType })} onEdit={(row) => setTypeEditor({ record: row, form: { code: row.code, name: row.name, description: row.description || '', active: row.active } })} />}
    {detailLoading && <Loading message="Loading leave request…" />}
    {selected && <RequestDetail row={selected} onClose={clearDetail} onAction={(type) => setAction({ type, record: freezeHrIntent(selected), reason: '' })} />}
    {action && <Overlay><Header title={`${action.type[0].toUpperCase()}${action.type.slice(1)} Leave Request`} onClose={() => setAction(null)} /><p className="mt-2 text-sm text-slate-600">{action.record.staff?.fullName || action.record.staff?.username} · {action.record.startDate} to {action.record.endDate}. The backend will enforce the current lifecycle and roster-conflict rules.</p><form onSubmit={submitAction} className="mt-5"><Field label={action.type === 'approve' ? 'Remarks (optional)' : 'Reason'}><textarea required={action.type !== 'approve'} maxLength="500" rows="4" value={action.reason} onChange={(e) => setAction({ ...action, reason: e.target.value })} className={inputClass} /></Field><p className="mt-1 text-right text-xs text-slate-500">{action.reason.length}/500</p><Actions saving={saving} onClose={() => setAction(null)} label={`Confirm ${action.type}`} danger={action.type !== 'approve'} /></form></Overlay>}
    {typeEditor && <Overlay><Header title={`${typeEditor.record ? 'Edit' : 'Create'} Leave Type`} onClose={() => setTypeEditor(null)} /><form onSubmit={saveType} className="mt-5 grid gap-4 sm:grid-cols-2">{!typeEditor.record && <Field label="Code"><input required maxLength="50" value={typeEditor.form.code} onChange={(e) => setTypeEditor({ ...typeEditor, form: { ...typeEditor.form, code: e.target.value } })} className={inputClass} /></Field>}<Field label="Name"><input required maxLength="150" value={typeEditor.form.name} onChange={(e) => setTypeEditor({ ...typeEditor, form: { ...typeEditor.form, name: e.target.value } })} className={inputClass} /></Field><Field label="Status"><select value={typeEditor.form.active ? 'ACTIVE' : 'INACTIVE'} onChange={(e) => setTypeEditor({ ...typeEditor, form: { ...typeEditor.form, active: e.target.value === 'ACTIVE' } })} className={inputClass}><option>ACTIVE</option><option>INACTIVE</option></select></Field><div className="sm:col-span-2"><Field label="Description"><textarea maxLength="1000" rows="4" value={typeEditor.form.description} onChange={(e) => setTypeEditor({ ...typeEditor, form: { ...typeEditor.form, description: e.target.value } })} className={inputClass} /></Field></div><div className="sm:col-span-2"><Actions saving={saving} onClose={() => setTypeEditor(null)} label="Save Leave Type" /></div></form></Overlay>}
    <ConfirmDialog isOpen={!!confirmation} title="Confirm HR change" description={confirmation ? `${confirmation.operation} · ${confirmation.context}` : ''} isLoading={saving} onCancel={() => setConfirmation(null)} onConfirm={confirmMutation} />
  </div>
}

const RequestDetail = ({ row, onClose, onAction }) => <Overlay wide><Header title="Leave Request" onClose={onClose} /><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Detail label="Employee" value={row.staff?.fullName || row.staff?.username} /><Detail label="Employee Code" value={row.staff?.employeeCode} /><Detail label="Leave Type" value={`${row.leaveType?.code || ''} · ${row.leaveType?.name || 'Unavailable'}`} /><Detail label="Status" value={<Status value={row.status} />} /><Detail label="Start Date" value={row.startDate} /><Detail label="End Date" value={row.endDate} /><Detail label="Calendar Days" value={row.calendarDays} /><Detail label="Submitted" value={formatDateTime(row.submittedAt)} /></div><div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700"><p className="text-xs font-black uppercase text-slate-500">Employee Reason</p><p className="mt-1">{row.reason}</p></div>{row.reviewedAt && <Lifecycle title="Review" actor={row.reviewedBy} at={row.reviewedAt} reason={row.reviewReason} />}{row.cancelledAt && <Lifecycle title="Cancellation" actor={row.cancelledBy} at={row.cancelledAt} reason={row.cancellationReason} />}<div className="mt-6 flex flex-wrap justify-end gap-2">{row.status === 'PENDING' && <><Button type="button" variant="success" onClick={() => onAction('approve')}>Approve</Button><Button type="button" variant="danger" onClick={() => onAction('reject')}>Reject</Button></>}{['PENDING', 'APPROVED'].includes(row.status) && <Button type="button" variant="danger" onClick={() => onAction('cancel')}>Cancel Request</Button>}</div></Overlay>
const LeaveTypes = ({ rows, onCreate, onEdit }) => <Card><div className="flex items-center justify-between border-b border-slate-200 pb-4"><div><h2 className="text-lg font-black text-slate-950">Leave Types</h2><p className="text-sm text-slate-500">Codes are canonical and immutable after creation.</p></div><Button type="button" onClick={onCreate}>Add Leave Type</Button></div><div className="mt-5">{rows.length === 0 ? <EmptyState title="No leave types found" /> : <div className="grid gap-3 lg:grid-cols-2">{rows.map((row) => <div key={row.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-black text-slate-950">{row.name}</h3><span className={`rounded-full px-2 py-1 text-xs font-black ${row.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{row.active ? 'ACTIVE' : 'INACTIVE'}</span></div><p className="mt-1 text-xs font-bold text-slate-500">{row.code}</p><p className="mt-2 text-sm text-slate-600">{row.description || 'No description provided.'}</p></div><Button type="button" size="sm" variant="outline" onClick={() => onEdit(row)}>Edit</Button></div></div>)}</div>}</div></Card>
const Detail = ({ label, value }) => <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">{label}</p><div className="mt-1 text-sm font-bold text-slate-950">{value ?? 'Unavailable'}</div></div>
const Lifecycle = ({ title, actor, at, reason }) => <div className="mt-4 rounded-xl border border-slate-200 p-4 text-sm"><p className="font-black text-slate-950">{title}</p><p className="text-slate-600">{actor?.fullName || actor?.username || 'Actor unavailable'} · {formatDateTime(at)}</p>{reason && <p className="mt-2 text-slate-700">{reason}</p>}</div>
const Tab = ({ active, onClick, children }) => <button type="button" onClick={onClick} className={`flex-1 rounded-lg px-4 py-2 text-sm font-black ${active ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}>{children}</button>

export default function HrPage() { const { user } = useAuth(); return <LeaveManagement key={hrActorKey(user)} /> }
