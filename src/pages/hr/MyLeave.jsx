import { useCallback, useEffect, useState } from 'react'
import hrApi from '../../api/hrApi'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Loading from '../../components/ui/Loading'
import useToast from '../../hooks/useToast'

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
const emptyRequest = { leaveTypeId: '', startDate: '', endDate: '', reason: '' }
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100'

const MyLeave = () => {
  const { showToast } = useToast()
  const [types, setTypes] = useState([])
  const [requests, setRequests] = useState([])
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState(false)
  const [form, setForm] = useState(emptyRequest)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (nextFilters = filters) => {
    setLoading(true); setError(''); setRequests([])
    try {
      const [availableTypes, history] = await Promise.all([
        hrApi.getAvailableLeaveTypes(), hrApi.getMyLeaveRequests(nextFilters),
      ])
      setTypes(availableTypes); setRequests(history)
    } catch (requestError) {
      setTypes([]); setRequests([])
      setError(requestError.message || 'Unable to load authoritative leave data.')
    } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const validateDates = (startDate, endDate) => !startDate || !endDate || startDate <= endDate

  const submitRequest = async (event) => {
    event.preventDefault()
    if (!validateDates(form.startDate, form.endDate)) {
      showToast({ type: 'error', title: 'Invalid leave dates', message: 'End date cannot be before start date.' }); return
    }
    const reason = form.reason.trim()
    if (!reason) { showToast({ type: 'error', title: 'Reason required', message: 'Enter a reason for this leave request.' }); return }
    setSaving(true)
    try {
      await hrApi.createLeaveRequest({ ...form, reason })
      setEditor(false); setForm(emptyRequest)
      await load(filters)
      showToast({ type: 'success', title: 'Leave request submitted', message: 'The authoritative request history has been refreshed.' })
    } catch (requestError) {
      showToast({ type: 'error', title: 'Submission failed', message: requestError.message || 'The leave request was rejected.' })
    } finally { setSaving(false) }
  }

  const cancelRequest = async (event) => {
    event.preventDefault()
    const reason = cancelReason.trim()
    if (!reason) { showToast({ type: 'error', title: 'Reason required', message: 'Enter a cancellation reason.' }); return }
    setSaving(true)
    try {
      await hrApi.cancelMyLeaveRequest(cancelTarget.requestId, { reason })
      setCancelTarget(null); setCancelReason('')
      await load(filters)
      showToast({ type: 'success', title: 'Leave request cancelled', message: 'The request status was refreshed from the backend.' })
    } catch (requestError) {
      showToast({ type: 'error', title: 'Cancellation failed', message: requestError.message || 'The cancellation was rejected.' })
    } finally { setSaving(false) }
  }

  const applyFilters = (event) => {
    event.preventDefault()
    if (!validateDates(filters.startDate, filters.endDate)) {
      showToast({ type: 'error', title: 'Invalid filter dates', message: 'End date cannot be before start date.' }); return
    }
    void load(filters)
  }

  return <div className="space-y-6">
    <PageHeader title="My Leave" description="Submit and review your authoritative full-day leave requests." actions={<Button type="button" onClick={() => { setForm(emptyRequest); setEditor(true) }} disabled={loading || types.length === 0}>Request Leave</Button>} />
    <Card><form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-4"><Field label="Status"><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className={inputClass}><option value="">All statuses</option>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="From"><input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className={inputClass} /></Field><Field label="To"><input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className={inputClass} /></Field><div className="flex items-end"><Button type="submit" disabled={loading}>Apply Filters</Button></div></form></Card>
    {loading && <Card><Loading message="Loading authoritative leave history..." size="sm" /></Card>}
    {!loading && error && <ErrorState title="Leave data unavailable" description={error} onRetry={() => load(filters)} />}
    {!loading && !error && requests.length === 0 && <Card><EmptyState title="No leave requests found" description="No authoritative leave request matches these filters." /></Card>}
    {!loading && !error && requests.length > 0 && <LeaveTable rows={requests} selfService onCancel={(row) => { setCancelTarget(row); setCancelReason('') }} />}
    {editor && <Overlay><Header title="Request Full-Day Leave" onClose={() => setEditor(false)} /><form onSubmit={submitRequest} className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Leave Type"><select required value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })} className={inputClass}><option value="">Select leave type</option>{types.map((type) => <option key={type.id} value={type.id}>{type.code} · {type.name}</option>)}</select></Field><div /><Field label="Start Date"><input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} /></Field><Field label="End Date"><input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} /></Field><div className="sm:col-span-2"><Field label="Reason"><textarea required maxLength="1000" rows="4" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass} /></Field><p className="mt-1 text-right text-xs text-slate-500">{form.reason.length}/1000</p></div><Actions saving={saving} onClose={() => setEditor(false)} label="Submit Request" /></form></Overlay>}
    {cancelTarget && <Overlay><Header title="Cancel Pending Leave Request" onClose={() => setCancelTarget(null)} /><p className="mt-2 text-sm text-slate-600">Cancel {cancelTarget.leaveType?.name || 'leave'} for {cancelTarget.startDate} to {cancelTarget.endDate}. This action is authoritative.</p><form onSubmit={cancelRequest} className="mt-5"><Field label="Cancellation Reason"><textarea required maxLength="500" rows="4" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className={inputClass} /></Field><p className="mt-1 text-right text-xs text-slate-500">{cancelReason.length}/500</p><Actions saving={saving} onClose={() => setCancelTarget(null)} label="Confirm Cancellation" danger /></form></Overlay>}
  </div>
}

export const LeaveTable = ({ rows, selfService = false, onSelect, onCancel }) => <Card><div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{!selfService && <Th>Employee</Th>}<Th>Leave Type</Th><Th>Dates</Th><Th>Days</Th><Th>Status</Th><Th>Request / lifecycle</Th><Th>Submitted</Th><Th /></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.requestId}>{!selfService && <Td><p className="font-bold text-slate-950">{row.staff?.fullName || row.staff?.username || 'Unavailable'}</p><p className="text-xs text-slate-500">{row.staff?.employeeCode}</p></Td>}<Td><p className="font-bold text-slate-950">{row.leaveType?.name || 'Unavailable'}</p><p className="text-xs text-slate-500">{row.leaveType?.code}</p></Td><Td>{row.startDate} → {row.endDate}</Td><Td>{row.calendarDays ?? 'Unavailable'}</Td><Td><Status value={row.status} /></Td><Td><p className="max-w-xs text-slate-700">{row.reason}</p>{row.reviewedAt && <p className="mt-1 text-xs text-slate-500">Reviewed by {row.reviewedBy?.fullName || row.reviewedBy?.username || 'Unavailable'} · {formatDateTime(row.reviewedAt)}{row.reviewReason ? ` · ${row.reviewReason}` : ''}</p>}{row.cancelledAt && <p className="mt-1 text-xs text-slate-500">Cancelled by {row.cancelledBy?.fullName || row.cancelledBy?.username || 'Unavailable'} · {formatDateTime(row.cancelledAt)}{row.cancellationReason ? ` · ${row.cancellationReason}` : ''}</p>}</Td><Td>{formatDateTime(row.submittedAt)}</Td><Td><div className="flex gap-2">{onSelect && <Button type="button" size="sm" variant="outline" onClick={() => onSelect(row)}>Review</Button>}{onCancel && row.status === 'PENDING' && <Button type="button" size="sm" variant="danger" onClick={() => onCancel(row)}>Cancel</Button>}</div></Td></tr>)}</tbody></table></div></Card>

export const Field = ({ label, children }) => <label className="block text-xs font-bold text-slate-600">{label}<span className="mt-1 block">{children}</span></label>
export const Status = ({ value }) => { const color = value === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : value === 'PENDING' ? 'bg-amber-100 text-amber-800' : value === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${color}`}>{value}</span> }
export const Overlay = ({ children, wide = false }) => <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"><div className={`my-auto w-full ${wide ? 'max-w-5xl' : 'max-w-2xl'} rounded-2xl bg-white p-6 shadow-2xl`}>{children}</div></div>
export const Header = ({ title, onClose }) => <div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Authoritative HR</p><h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2></div><button type="button" onClick={onClose} className="text-2xl text-slate-400">×</button></div>
export const Actions = ({ saving, onClose, label, danger = false }) => <div className="mt-5 flex justify-end gap-3 border-t border-slate-200 pt-4"><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Back</Button><Button type="submit" variant={danger ? 'danger' : 'primary'} disabled={saving}>{saving ? 'Saving…' : label}</Button></div>
export const formatDateTime = (value) => {
  if (!value) return 'Unavailable'
  const utcValue = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`
  return new Intl.DateTimeFormat('en-NP', { timeZone: 'Asia/Kathmandu', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(utcValue))
}
const Th = ({ children }) => <th className="px-4 py-3">{children}</th>
const Td = ({ children }) => <td className="px-4 py-4 text-slate-700">{children}</td>

export default MyLeave
