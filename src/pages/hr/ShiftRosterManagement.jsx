import { useCallback, useEffect, useMemo, useState } from 'react'
import hrApi from '../../api/hrApi'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Loading from '../../components/ui/Loading'
import useToast from '../../hooks/useToast'

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100'
const emptyShift = { code: '', name: '', description: '', startTime: '', endTime: '', crossesMidnight: false, lateGraceMinutes: 0, earlyCheckInMinutes: 0, active: true }
const emptyRoster = { staffProfileId: '', shiftDefinitionId: '', rosterDate: '', remarks: '' }

const kathmanduToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const part = (type) => parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

const addCivilDays = (isoDate, days) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

const initialFilters = () => {
  const today = kathmanduToday()
  return { fromDate: addCivilDays(today, -3), toDate: addCivilDays(today, 3), staffProfileId: '', departmentId: '', shiftId: '', status: '' }
}

const ShiftRosterManagement = () => {
  const { showToast } = useToast()
  const [tab, setTab] = useState('roster')
  const [shifts, setShifts] = useState([])
  const [staff, setStaff] = useState([])
  const [departments, setDepartments] = useState([])
  const [roster, setRoster] = useState([])
  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [referenceLoading, setReferenceLoading] = useState(true)
  const [rosterLoading, setRosterLoading] = useState(true)
  const [referenceError, setReferenceError] = useState('')
  const [rosterError, setRosterError] = useState('')
  const [selected, setSelected] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadReferenceData = useCallback(async () => {
    setReferenceLoading(true); setReferenceError('')
    try {
      const [shiftRows, staffRows, departmentRows] = await Promise.all([
        hrApi.getShiftDefinitions(), hrApi.getStaff(), hrApi.getDepartments(),
      ])
      setShifts(shiftRows); setStaff(staffRows); setDepartments(departmentRows)
    } catch (error) {
      setShifts([]); setStaff([]); setDepartments([])
      setReferenceError(error.message || 'Unable to load HR scheduling reference data.')
    } finally { setReferenceLoading(false) }
  }, [])

  const loadRoster = useCallback(async (query = appliedFilters) => {
    setRosterLoading(true); setRosterError('')
    try {
      const rows = await hrApi.getRosterAssignments(query)
      setRoster(rows)
      setSelected((current) => current ? rows.find((row) => row.id === current.id) || null : null)
    } catch (error) {
      setRoster([]); setSelected(null)
      setRosterError(error.message || 'Unable to load the authoritative staff roster.')
    } finally { setRosterLoading(false) }
  }, [appliedFilters])

  useEffect(() => { void loadReferenceData(); void loadRoster(appliedFilters) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const profileFor = (assignment) => staff.find((row) => row.staffProfileId === assignment.staff?.staffProfileId)
  const activeStaff = staff.filter((row) => row.employmentStatus === 'ACTIVE')
  const openShiftDialog = (shift = null) => setDialog({ type: 'shift', editing: Boolean(shift), record: shift, form: shift ? {
    name: shift.name, description: shift.description || '', startTime: shift.startTime?.slice(0, 5) || '', endTime: shift.endTime?.slice(0, 5) || '',
    crossesMidnight: shift.crossesMidnight, lateGraceMinutes: shift.lateGraceMinutes, earlyCheckInMinutes: shift.earlyCheckInMinutes, active: shift.active,
  } : { ...emptyShift } })
  const openRosterDialog = (assignment = null) => setDialog({ type: 'roster', editing: Boolean(assignment), record: assignment, form: assignment ? {
    shiftDefinitionId: assignment.shift?.id || '', rosterDate: assignment.rosterDate, remarks: assignment.remarks || '',
  } : { ...emptyRoster } })
  const change = (field, value) => setDialog((current) => ({ ...current, form: { ...current.form, [field]: value } }))

  const save = async (event) => {
    event.preventDefault()
    if (saving) return
    if (dialog.type === 'shift') {
      if (dialog.form.startTime === dialog.form.endTime) {
        showToast({ type: 'error', title: 'Invalid shift', message: 'Shift start and end times must be different.' })
        return
      }
      if (Number(dialog.form.lateGraceMinutes) < 0 || Number(dialog.form.earlyCheckInMinutes) < 0) {
        showToast({ type: 'error', title: 'Invalid shift', message: 'Shift grace values cannot be negative.' })
        return
      }
    }
    setSaving(true)
    try {
      if (dialog.type === 'shift') {
        const payload = { ...dialog.form, name: dialog.form.name.trim(), description: dialog.form.description.trim() || null,
          lateGraceMinutes: Number(dialog.form.lateGraceMinutes), earlyCheckInMinutes: Number(dialog.form.earlyCheckInMinutes) }
        if (dialog.editing) await hrApi.updateShiftDefinition(dialog.record.id, payload)
        else await hrApi.createShiftDefinition({ ...payload, code: dialog.form.code.trim() })
        await Promise.all([loadReferenceData(), loadRoster()])
      } else {
        const payload = { shiftDefinitionId: dialog.form.shiftDefinitionId, rosterDate: dialog.form.rosterDate, remarks: dialog.form.remarks.trim() || null }
        if (dialog.editing) await hrApi.updateRosterAssignment(dialog.record.id, payload)
        else await hrApi.createRosterAssignment({ ...payload, staffProfileId: dialog.form.staffProfileId })
        await loadRoster()
      }
      setDialog(null)
      showToast({ type: 'success', title: 'Schedule saved', message: 'The authoritative backend schedule has been refreshed.' })
    } catch (error) {
      showToast({ type: 'error', title: 'Unable to save schedule', message: error.message || 'The schedule could not be saved.' })
    } finally { setSaving(false) }
  }

  const cancelRoster = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await hrApi.cancelRosterAssignment(dialog.record.id, { reason: dialog.form.reason.trim() })
      setDialog(null); await loadRoster()
      showToast({ type: 'success', title: 'Roster assignment cancelled', message: 'The cancelled assignment remains in authoritative history.' })
    } catch (error) {
      showToast({ type: 'error', title: 'Cancellation failed', message: error.message || 'The roster assignment could not be cancelled.' })
    } finally { setSaving(false) }
  }

  const applyFilters = (event) => {
    event.preventDefault()
    if (filters.fromDate && filters.toDate && filters.toDate < filters.fromDate) {
      showToast({ type: 'error', title: 'Invalid date range', message: 'Roster end date cannot be before start date.' }); return
    }
    setAppliedFilters({ ...filters }); void loadRoster(filters)
  }

  return <div className="space-y-6">
    <PageHeader title="Shift & Roster" description="Authoritative Kathmandu civil-time shift definitions and staff scheduling." />
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"><Tab active={tab === 'roster'} onClick={() => setTab('roster')}>Roster</Tab><Tab active={tab === 'shifts'} onClick={() => setTab('shifts')}>Shift Definitions</Tab></div>

    {referenceLoading && <Card><Loading message="Loading scheduling reference data..." size="sm" /></Card>}
    {!referenceLoading && referenceError && <ErrorState title="Scheduling data unavailable" description={referenceError} onRetry={loadReferenceData} />}
    {!referenceLoading && !referenceError && tab === 'shifts' && <ShiftList shifts={shifts} onCreate={() => openShiftDialog()} onEdit={openShiftDialog} />}
    {!referenceLoading && !referenceError && tab === 'roster' && <>
      <Card><form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Field label="From Date"><input required type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} className={inputClass} /></Field>
        <Field label="To Date"><input required type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} className={inputClass} /></Field>
        <Field label="Staff"><select value={filters.staffProfileId} onChange={(e) => setFilters({ ...filters, staffProfileId: e.target.value })} className={inputClass}><option value="">All staff</option>{staff.map((row) => <option key={row.staffProfileId} value={row.staffProfileId}>{row.employeeCode} · {row.fullName || row.username}</option>)}</select></Field>
        <Field label="Department"><select value={filters.departmentId} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })} className={inputClass}><option value="">All departments</option>{departments.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
        <Field label="Shift"><select value={filters.shiftId} onChange={(e) => setFilters({ ...filters, shiftId: e.target.value })} className={inputClass}><option value="">All shifts</option>{shifts.map((row) => <option key={row.id} value={row.id}>{row.code} · {row.name}</option>)}</select></Field>
        <Field label="Status"><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className={inputClass}><option value="">All statuses</option><option>SCHEDULED</option><option>CANCELLED</option></select></Field>
        <div className="flex gap-2 md:col-span-3 xl:col-span-6 xl:justify-end"><Button type="submit" disabled={rosterLoading}>{rosterLoading ? 'Loading…' : 'Apply Filters'}</Button><Button type="button" onClick={() => openRosterDialog()} disabled={!activeStaff.length || !shifts.some((row) => row.active)}>Create Assignment</Button></div>
      </form></Card>
      {activeStaff.length === 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">No ACTIVE Staff Profiles are available for a new roster assignment.</div>}
      {!shifts.some((row) => row.active) && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">No ACTIVE Shift Definitions are available for a new roster assignment.</div>}
      {rosterLoading && <Card><Loading message="Loading authoritative roster..." size="sm" /></Card>}
      {!rosterLoading && rosterError && <ErrorState title="Roster unavailable" description={rosterError} onRetry={() => loadRoster()} />}
      {!rosterLoading && !rosterError && <RosterList rows={roster} profileFor={profileFor} onView={setSelected} />}
    </>}

    {selected && <RosterDetail assignment={selected} profile={profileFor(selected)} onClose={() => setSelected(null)} onEdit={() => openRosterDialog(selected)} onCancel={() => setDialog({ type: 'cancel', record: selected, form: { reason: '' } })} />}
    {dialog?.type === 'shift' && <ShiftEditor dialog={dialog} saving={saving} onChange={change} onClose={() => setDialog(null)} onSubmit={save} />}
    {dialog?.type === 'roster' && <RosterEditor dialog={dialog} staff={activeStaff} shifts={shifts} saving={saving} onChange={change} onClose={() => setDialog(null)} onSubmit={save} />}
    {dialog?.type === 'cancel' && <CancelEditor dialog={dialog} saving={saving} onChange={change} onClose={() => setDialog(null)} onSubmit={cancelRoster} />}
  </div>
}

const ShiftList = ({ shifts, onCreate, onEdit }) => <Card><div className="flex items-center justify-between border-b border-slate-200 pb-4"><div><h2 className="text-lg font-black text-slate-950">Shift Definitions</h2><p className="text-sm text-slate-500">Local clock times are displayed without timezone conversion.</p></div><Button type="button" onClick={onCreate}>Create Shift</Button></div><div className="mt-5">{shifts.length === 0 ? <EmptyState title="No shift definitions found" /> : <div className="grid gap-3 lg:grid-cols-2">{shifts.map((shift) => <div key={shift.id} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-950">{shift.name}</h3><Status active={shift.active}>{shift.active ? 'ACTIVE' : 'INACTIVE'}</Status>{shift.crossesMidnight && <Status active>OVERNIGHT</Status>}</div><p className="mt-1 text-xs font-bold text-slate-500">{shift.code}</p><p className="mt-3 text-lg font-black text-slate-900">{clock(shift.startTime)} → {clock(shift.endTime)}{shift.crossesMidnight ? ' (+1 day)' : ''}</p><p className="mt-1 text-sm text-slate-600">Late grace: {shift.lateGraceMinutes} min · Early check-in: {shift.earlyCheckInMinutes} min</p></div><Button type="button" variant="outline" size="sm" onClick={() => onEdit(shift)}>Edit</Button></div></div>)}</div>}</div></Card>

const RosterList = ({ rows, profileFor, onView }) => <Card>{rows.length === 0 ? <EmptyState title="No roster assignments in this range" description="Adjust the authoritative query filters or create a new assignment." /> : <div className="overflow-x-auto"><table className="min-w-[980px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><Th>Employee</Th><Th>Department</Th><Th>Roster Date</Th><Th>Shift</Th><Th>Scheduled Span</Th><Th>Status</Th><Th /></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => { const profile = profileFor(row); return <tr key={row.id}><Td><p className="font-bold text-slate-950">{row.staff?.fullName || row.staff?.username || 'Unavailable'}</p><p className="text-xs text-slate-500">{row.staff?.employeeCode || 'Code unavailable'}</p></Td><Td>{profile?.department?.name || 'Unavailable'}</Td><Td>{row.rosterDate}</Td><Td>{row.shift ? `${row.shift.code} · ${row.shift.name}` : 'Unavailable'}</Td><Td>{schedule(row)}</Td><Td><Status active={row.status === 'SCHEDULED'}>{row.status}</Status></Td><Td><Button type="button" variant="outline" size="sm" onClick={() => onView(row)}>View</Button></Td></tr> })}</tbody></table></div>}</Card>

const RosterDetail = ({ assignment, profile, onClose, onEdit, onCancel }) => <Overlay><Header title="Roster Assignment" onClose={onClose} /><div className="mt-5 grid gap-3 sm:grid-cols-2"><Detail label="Employee" value={assignment.staff?.fullName || assignment.staff?.username} /><Detail label="Employee Code" value={assignment.staff?.employeeCode} /><Detail label="Department / Job Title" value={[profile?.department?.name, profile?.jobTitle?.name].filter(Boolean).join(' · ')} /><Detail label="Status" value={assignment.status} /><Detail label="Shift" value={assignment.shift ? `${assignment.shift.code} · ${assignment.shift.name}` : null} /><Detail label="Scheduled Span" value={schedule(assignment)} /><Detail label="Remarks" value={assignment.remarks} /><Detail label="Cancellation Reason" value={assignment.cancellationReason} /><Detail label="Cancelled At" value={assignment.cancelledAt} /></div>{assignment.status === 'SCHEDULED' && <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="danger" onClick={onCancel}>Cancel Assignment</Button><Button type="button" onClick={onEdit}>Edit Assignment</Button></div>}</Overlay>

const ShiftEditor = ({ dialog, saving, onChange, onClose, onSubmit }) => <Overlay><Header title={`${dialog.editing ? 'Edit' : 'Create'} Shift Definition`} onClose={onClose} /><form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">{!dialog.editing && <Field label="Code"><input required maxLength={50} value={dialog.form.code} onChange={(e) => onChange('code', e.target.value)} className={inputClass} /></Field>}<Field label="Name"><input required maxLength={150} value={dialog.form.name} onChange={(e) => onChange('name', e.target.value)} className={inputClass} /></Field><Field label="Start Time"><input required type="time" value={dialog.form.startTime} onChange={(e) => onChange('startTime', e.target.value)} className={inputClass} /></Field><Field label="End Time"><input required type="time" value={dialog.form.endTime} onChange={(e) => onChange('endTime', e.target.value)} className={inputClass} /></Field><Field label="Crosses Midnight"><select value={dialog.form.crossesMidnight ? 'YES' : 'NO'} onChange={(e) => onChange('crossesMidnight', e.target.value === 'YES')} className={inputClass}><option value="NO">No</option><option value="YES">Yes — ends next calendar day</option></select></Field><Field label="Status"><select value={dialog.form.active ? 'ACTIVE' : 'INACTIVE'} onChange={(e) => onChange('active', e.target.value === 'ACTIVE')} className={inputClass}><option>ACTIVE</option><option>INACTIVE</option></select></Field><Field label="Late Grace (minutes)"><input required min="0" type="number" value={dialog.form.lateGraceMinutes} onChange={(e) => onChange('lateGraceMinutes', e.target.value)} className={inputClass} /></Field><Field label="Early Check-In (minutes)"><input required min="0" type="number" value={dialog.form.earlyCheckInMinutes} onChange={(e) => onChange('earlyCheckInMinutes', e.target.value)} className={inputClass} /></Field><div className="sm:col-span-2"><Field label="Description"><textarea maxLength={1000} rows="3" value={dialog.form.description} onChange={(e) => onChange('description', e.target.value)} className={inputClass} /></Field>{dialog.form.crossesMidnight && <p className="mt-2 rounded-lg bg-blue-50 p-3 text-sm font-bold text-blue-700">This shift ends on the following calendar day.</p>}</div><Actions saving={saving} onClose={onClose} /></form></Overlay>

const RosterEditor = ({ dialog, staff, shifts, saving, onChange, onClose, onSubmit }) => { const availableShifts = shifts.filter((row) => row.active || row.id === dialog.form.shiftDefinitionId); return <Overlay><Header title={`${dialog.editing ? 'Edit' : 'Create'} Roster Assignment`} onClose={onClose} /><form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">{!dialog.editing && <Field label="Staff Member"><select required value={dialog.form.staffProfileId} onChange={(e) => onChange('staffProfileId', e.target.value)} className={inputClass}><option value="">Select active staff</option>{staff.map((row) => <option key={row.staffProfileId} value={row.staffProfileId}>{row.employeeCode} · {row.fullName || row.username} · {row.department?.name || 'Department unavailable'}</option>)}</select></Field>}<Field label="Shift"><select required value={dialog.form.shiftDefinitionId} onChange={(e) => onChange('shiftDefinitionId', e.target.value)} className={inputClass}><option value="">Select active shift</option>{availableShifts.map((row) => <option key={row.id} value={row.id}>{row.code} · {row.name} · {clock(row.startTime)}–{clock(row.endTime)}{row.crossesMidnight ? ' (+1 day)' : ''}</option>)}</select></Field><Field label="Roster Date"><input required type="date" value={dialog.form.rosterDate} onChange={(e) => onChange('rosterDate', e.target.value)} className={inputClass} /></Field><div className="sm:col-span-2"><Field label="Remarks"><textarea maxLength={1000} rows="3" value={dialog.form.remarks} onChange={(e) => onChange('remarks', e.target.value)} className={inputClass} /></Field></div><Actions saving={saving} onClose={onClose} /></form></Overlay> }
const CancelEditor = ({ dialog, saving, onChange, onClose, onSubmit }) => <Overlay><Header title="Cancel Roster Assignment" onClose={onClose} /><p className="mt-2 text-sm text-slate-600">Cancellation preserves the assignment in history and is audited by the backend.</p><form onSubmit={onSubmit} className="mt-5"><Field label="Cancellation Reason"><textarea required maxLength={1000} rows="4" value={dialog.form.reason} onChange={(e) => onChange('reason', e.target.value)} className={inputClass} /></Field><Actions saving={saving} onClose={onClose} action="Cancel Assignment" danger /></form></Overlay>

const schedule = (row) => row.shift ? `${row.rosterDate} · ${clock(row.shift.startTime)} → ${row.shift.crossesMidnight ? `${addCivilDays(row.rosterDate, 1)} · ` : ''}${clock(row.shift.endTime)}` : 'Unavailable'
const clock = (value) => value ? String(value).slice(0, 5) : 'Unavailable'
const Tab = ({ active, onClick, children }) => <button type="button" onClick={onClick} className={`rounded-lg px-4 py-2 text-sm font-black ${active ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{children}</button>
const Field = ({ label, children }) => <label className="block text-xs font-bold text-slate-600">{label}<span className="mt-1 block">{children}</span></label>
const Th = ({ children }) => <th className="px-4 py-3">{children}</th>
const Td = ({ children }) => <td className="px-4 py-4 text-slate-700">{children}</td>
const Status = ({ active, children }) => <span className={`rounded-full px-2.5 py-1 text-xs font-black ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{children}</span>
const Detail = ({ label, value }) => <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-slate-950">{value || 'Unavailable'}</p></div>
const Header = ({ title, onClose }) => <div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Authoritative HR</p><h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2></div><button type="button" onClick={onClose} className="text-2xl text-slate-400">×</button></div>
const Actions = ({ saving, onClose, action = 'Save', danger = false }) => <div className="mt-5 flex justify-end gap-3 border-t border-slate-200 pt-4 sm:col-span-2"><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Back</Button><Button type="submit" variant={danger ? 'danger' : 'primary'} disabled={saving}>{saving ? 'Saving…' : action}</Button></div>
const Overlay = ({ children }) => <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"><div className="my-auto w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl">{children}</div></div>

export default ShiftRosterManagement
