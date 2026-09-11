import { useEffect, useMemo, useState } from 'react'
import attendanceApi from '../../api/attendanceApi'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Loading from '../../components/ui/Loading'
import useToast from '../../hooks/useToast'
import {
  formatAttendanceBusinessDate,
  formatAttendanceTimestamp,
  formatInstantForKathmanduInput,
  formatWorkedMinutes,
  getCasinoDateSuggestion,
  kathmanduLocalToInstant,
} from '../../utils/attendanceFormatters'

const CLASSIFICATIONS = ['UNSCHEDULED', 'ON_TIME', 'LATE', 'EARLY_DEPARTURE', 'LATE_AND_EARLY_DEPARTURE']
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100'
const friendly = (value) => String(value || '').replaceAll('_', ' ')

const AttendanceManagement = () => {
  const { showToast } = useToast()
  const [businessDate, setBusinessDate] = useState(getCasinoDateSuggestion)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [classificationFilter, setClassificationFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [correction, setCorrection] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const loadReport = async (date = businessDate, selectedId = selected?.attendanceId) => {
    if (!date) return
    setLoading(true); setError(''); setRecords([]); setLoaded(true)
    try {
      const rows = await attendanceApi.getReport(date)
      setRecords(rows)
      setSelected(selectedId ? rows.find((row) => row.attendanceId === selectedId) || null : null)
    } catch (requestError) {
      setRecords([]); setSelected(null)
      setError(requestError.message || 'Unable to load the authoritative attendance report.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadReport(businessDate, null) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadHistory = async (attendanceId) => {
    setHistory([]); setHistoryError(''); setHistoryLoading(true)
    try { setHistory(await attendanceApi.getAttendanceCorrections(attendanceId)) }
    catch (requestError) { setHistory([]); setHistoryError(requestError.message || 'Unable to load correction history.') }
    finally { setHistoryLoading(false) }
  }

  const selectRecord = (record) => {
    setSelected(record); setCorrection(null); setConfirmation(null)
    void loadHistory(record.attendanceId)
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return records.filter((record) => {
      const identity = [record.employee?.fullName, record.employee?.username].some((value) => String(value || '').toLowerCase().includes(query))
      return (!query || identity) && (!statusFilter || record.status === statusFilter)
        && (!classificationFilter || record.attendanceScheduleStatus === classificationFilter)
    })
  }, [records, search, statusFilter, classificationFilter])

  const openCorrection = () => {
    const type = 'CHECK_IN_TIME'
    setCorrection({ type, checkInLocal: formatInstantForKathmanduInput(selected.checkInAt), checkOutLocal: '', reason: '' })
  }

  const changeCorrectionType = (type) => setCorrection({
    ...correction, type,
    checkInLocal: type === 'CHECK_IN_TIME' || type === 'CHECK_IN_AND_OUT' ? formatInstantForKathmanduInput(selected.checkInAt) : '',
    checkOutLocal: type === 'CHECK_OUT_TIME' || type === 'CHECK_IN_AND_OUT' ? formatInstantForKathmanduInput(selected.checkOutAt) : '',
  })

  const prepareCorrection = (event) => {
    event.preventDefault()
    const needsCheckIn = ['CHECK_IN_TIME', 'CHECK_IN_AND_OUT'].includes(correction.type)
    const needsCheckOut = ['CHECK_OUT_TIME', 'CHECK_IN_AND_OUT', 'MISSED_CHECKOUT'].includes(correction.type)
    const checkInAt = needsCheckIn ? kathmanduLocalToInstant(correction.checkInLocal) : null
    const checkOutAt = needsCheckOut ? kathmanduLocalToInstant(correction.checkOutLocal) : null
    const reason = correction.reason.trim()
    let message = ''
    if ((needsCheckIn && !checkInAt) || (needsCheckOut && !checkOutAt)) message = 'Enter every required timestamp in Kathmandu local time.'
    else if (!reason) message = 'Correction reason is required.'
    else if (reason.length > 500) message = 'Correction reason must not exceed 500 characters.'
    else if ((checkInAt && new Date(checkInAt) > new Date()) || (checkOutAt && new Date(checkOutAt) > new Date())) message = 'Correction timestamps cannot be in the future.'
    else if (checkInAt && checkOutAt && new Date(checkOutAt) <= new Date(checkInAt)) message = 'Corrected checkout must be later than corrected check-in.'
    if (message) { showToast({ type: 'error', title: 'Invalid correction', message }); return }
    const payload = { type: correction.type, ...(checkInAt ? { checkInAt } : {}), ...(checkOutAt ? { checkOutAt } : {}), reason }
    setConfirmation({ payload })
  }

  const submitCorrection = async () => {
    if (submitting || !confirmation) return
    setSubmitting(true)
    try {
      await attendanceApi.createAttendanceCorrection(selected.attendanceId, confirmation.payload)
      const selectedId = selected.attendanceId
      setCorrection(null); setConfirmation(null)
      await loadReport(businessDate, selectedId)
      await loadHistory(selectedId)
      showToast({ type: 'success', title: 'Attendance corrected', message: 'The authoritative attendance record and audit history were refreshed.' })
    } catch (requestError) {
      showToast({ type: 'error', title: 'Correction failed', message: requestError.message || 'The attendance correction was rejected.' })
    } finally { setSubmitting(false) }
  }

  const validTypes = selected?.status === 'OPEN'
    ? ['CHECK_IN_TIME', 'MISSED_CHECKOUT']
    : ['CHECK_IN_TIME', 'CHECK_OUT_TIME', 'CHECK_IN_AND_OUT']

  return <div className="space-y-6">
    <PageHeader title="Attendance Management" description="Authoritative Business Date attendance reporting and audited corrections. Times are shown in Asia/Kathmandu." />
    <Card>
      <form onSubmit={(event) => { event.preventDefault(); void loadReport(businessDate, null) }} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Field label="Attendance Business Date"><input required type="date" value={businessDate} onChange={(event) => { setBusinessDate(event.target.value); setRecords([]); setSelected(null); setLoaded(false); setError('') }} className={inputClass} /></Field>
        <Button type="submit" disabled={!businessDate || loading}>{loading ? 'Loading…' : loaded ? 'Refresh Report' : 'Load Report'}</Button>
      </form>
    </Card>
    {loading && <Card><Loading message="Loading authoritative attendance report..." size="sm" /></Card>}
    {!loading && error && <ErrorState title="Attendance report unavailable" description={error} onRetry={() => loadReport(businessDate, null)} />}
    {!loading && !error && loaded && <Card>
      <div className="grid gap-3 border-b border-slate-200 pb-5 md:grid-cols-3">
        <Field label="Search loaded report"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Employee name or username" className={inputClass} /></Field>
        <Field label="Attendance Status"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClass}><option value="">All statuses</option><option>OPEN</option><option>CLOSED</option></select></Field>
        <Field label="Schedule Classification"><select value={classificationFilter} onChange={(event) => setClassificationFilter(event.target.value)} className={inputClass}><option value="">All classifications</option>{CLASSIFICATIONS.map((value) => <option key={value}>{value}</option>)}</select></Field>
      </div>
      <div className="mt-5">{filtered.length === 0 ? <EmptyState title="No attendance records found" description={`No loaded record matches the current filters for Business Date ${businessDate}.`} /> : <AttendanceTable rows={filtered} onSelect={selectRecord} />}</div>
    </Card>}

    {selected && <AttendanceDetail record={selected} history={history} historyLoading={historyLoading} historyError={historyError} onRetryHistory={() => loadHistory(selected.attendanceId)} onClose={() => { setSelected(null); setHistory([]) }} onCorrect={openCorrection} />}
    {correction && <CorrectionEditor record={selected} form={correction} validTypes={validTypes} submitting={submitting} onChange={setCorrection} onType={changeCorrectionType} onClose={() => setCorrection(null)} onSubmit={prepareCorrection} />}
    <ConfirmDialog isOpen={Boolean(confirmation)} title="Confirm audited Attendance correction" description={confirmation ? confirmationText(selected, confirmation.payload) : ''} confirmLabel="Apply Correction" variant="warning" isLoading={submitting} onCancel={() => setConfirmation(null)} onConfirm={submitCorrection} />
  </div>
}

const AttendanceTable = ({ rows, onSelect }) => <div className="overflow-x-auto"><table className="min-w-[1100px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><Th>Employee</Th><Th>Business Date</Th><Th>Actual Time</Th><Th>Status</Th><Th>Schedule</Th><Th>Classification</Th><Th>Worked</Th><Th /></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((record) => <tr key={record.attendanceId}><Td><p className="font-bold text-slate-950">{record.employee?.fullName || 'Name unavailable'}</p><p className="text-xs text-slate-500">{record.employee?.username || 'Username unavailable'}</p></Td><Td>{record.businessDate}</Td><Td><p>{formatAttendanceTimestamp(record.checkInAt)}</p><p className="text-xs text-slate-500">to {formatAttendanceTimestamp(record.checkOutAt)}</p></Td><Td><Status value={record.status} /></Td><Td>{record.scheduled ? <><p className="font-bold">{record.shiftCode} · {record.shiftName}</p><p className="text-xs text-slate-500">{formatAttendanceTimestamp(record.scheduledStartAt)} → {formatAttendanceTimestamp(record.scheduledEndAt)}</p></> : <span className="text-slate-500">Unscheduled</span>}</Td><Td><Status value={record.attendanceScheduleStatus} /></Td><Td className="font-bold">{formatWorkedMinutes(record.workedMinutes)}</Td><Td><Button type="button" size="sm" variant="outline" onClick={() => onSelect(record)}>Review</Button></Td></tr>)}</tbody></table></div>

const AttendanceDetail = ({ record, history, historyLoading, historyError, onRetryHistory, onClose, onCorrect }) => <Overlay wide><Header title="Attendance Record" onClose={onClose} /><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Detail label="Employee" value={record.employee?.fullName || record.employee?.username} /><Detail label="Username" value={record.employee?.username} /><Detail label="Business Date" value={`${formatAttendanceBusinessDate(record.businessDate)} · ${record.businessDate}`} /><Detail label="Status" value={record.status} /><Detail label="Check In" value={formatAttendanceTimestamp(record.checkInAt)} /><Detail label="Check Out" value={formatAttendanceTimestamp(record.checkOutAt)} /><Detail label="Worked" value={formatWorkedMinutes(record.workedMinutes)} /><Detail label="Schedule" value={record.scheduled ? `${record.shiftCode} · ${record.shiftName}` : 'Unscheduled'} /><Detail label="Roster Date" value={record.rosterDate} /><Detail label="Scheduled Start" value={formatAttendanceTimestamp(record.scheduledStartAt)} /><Detail label="Scheduled End" value={formatAttendanceTimestamp(record.scheduledEndAt)} /><Detail label="Classification" value={friendly(record.attendanceScheduleStatus)} /><Detail label="Late By" value={`${record.lateByMinutes || 0} minutes`} /><Detail label="Early Departure" value={record.earlyDepartureMinutes == null ? 'Not available' : `${record.earlyDepartureMinutes} minutes`} /><Detail label="Created" value={formatAttendanceTimestamp(record.createdAt)} /><Detail label="Updated" value={formatAttendanceTimestamp(record.updatedAt)} /></div><div className="mt-6 flex justify-end"><Button type="button" onClick={onCorrect}>Correct Attendance</Button></div><div className="mt-7 border-t border-slate-200 pt-5"><h3 className="font-black text-slate-950">Correction History</h3><p className="mt-1 text-sm text-slate-500">Immutable, oldest-first audit history from the backend.</p><div className="mt-4">{historyLoading && <Loading message="Loading correction history..." size="sm" />}{!historyLoading && historyError && <ErrorState title="Correction history unavailable" description={historyError} onRetry={onRetryHistory} />}{!historyLoading && !historyError && history.length === 0 && <EmptyState title="No corrections recorded" />}{!historyLoading && !historyError && history.length > 0 && <CorrectionHistory rows={history} />}</div></div></Overlay>

const CorrectionHistory = ({ rows }) => <div className="space-y-3">{rows.map((row) => <div key={row.correctionId} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-black text-slate-950">{friendly(row.correctionType)}</p><p className="text-xs text-slate-500">{formatAttendanceTimestamp(row.correctedAt)} · {row.correctedBy?.fullName || row.correctedBy?.username || 'Actor unavailable'}</p></div>{row.previousWorkedMinutes !== row.newWorkedMinutes && <span className="text-xs font-bold text-slate-600">Worked: {formatWorkedMinutes(row.previousWorkedMinutes)} → {formatWorkedMinutes(row.newWorkedMinutes)}</span>}</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{row.newCheckInAt && <Change label="Check In" previous={row.previousCheckInAt} next={row.newCheckInAt} />}{row.newCheckOutAt && <Change label="Check Out" previous={row.previousCheckOutAt} next={row.newCheckOutAt} />}</div><p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><span className="font-bold">Reason:</span> {row.reason}</p></div>)}</div>

const CorrectionEditor = ({ record, form, validTypes, submitting, onChange, onType, onClose, onSubmit }) => { const needsIn = ['CHECK_IN_TIME', 'CHECK_IN_AND_OUT'].includes(form.type); const needsOut = ['CHECK_OUT_TIME', 'CHECK_IN_AND_OUT', 'MISSED_CHECKOUT'].includes(form.type); return <Overlay><Header title="Correct Attendance" onClose={onClose} /><p className="mt-2 text-sm text-slate-600">{record.employee?.fullName || record.employee?.username} · Business Date {record.businessDate}. Business Date and schedule snapshots cannot be changed.</p><form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Correction Type"><select value={form.type} onChange={(event) => onType(event.target.value)} className={inputClass}>{validTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>{needsIn && <Field label="Corrected Check-In (Kathmandu)"><input required type="datetime-local" value={form.checkInLocal} onChange={(event) => onChange({ ...form, checkInLocal: event.target.value })} className={inputClass} /></Field>}{needsOut && <Field label="Corrected Check-Out (Kathmandu)"><input required type="datetime-local" value={form.checkOutLocal} onChange={(event) => onChange({ ...form, checkOutLocal: event.target.value })} className={inputClass} /></Field>}<div className="sm:col-span-2"><Field label="Reason"><textarea required maxLength="500" rows="4" value={form.reason} onChange={(event) => onChange({ ...form, reason: event.target.value })} className={inputClass} /></Field><p className="mt-1 text-right text-xs text-slate-500">{form.reason.length}/500</p></div><div className="flex justify-end gap-3 border-t border-slate-200 pt-4 sm:col-span-2"><Button type="button" variant="outline" disabled={submitting} onClick={onClose}>Cancel</Button><Button type="submit" disabled={submitting}>Review Correction</Button></div></form></Overlay> }

const confirmationText = (record, payload) => [`Employee: ${record.employee?.fullName || record.employee?.username || 'Unavailable'}`, `Type: ${friendly(payload.type)}`, payload.checkInAt ? `Proposed check-in: ${formatAttendanceTimestamp(payload.checkInAt)} (current: ${formatAttendanceTimestamp(record.checkInAt)})` : '', payload.checkOutAt ? `Proposed check-out: ${formatAttendanceTimestamp(payload.checkOutAt)} (current: ${formatAttendanceTimestamp(record.checkOutAt)})` : '', `Reason: ${payload.reason}`, 'This audited correction will update authoritative Attendance history.'].filter(Boolean).join('\n')
const Change = ({ label, previous, next }) => <div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-slate-500">Before: {formatAttendanceTimestamp(previous)}</p><p className="font-bold text-slate-900">After: {formatAttendanceTimestamp(next)}</p></div>
const Status = ({ value }) => { const good = ['CLOSED', 'ON_TIME'].includes(value); const warn = ['OPEN', 'LATE', 'EARLY_DEPARTURE', 'LATE_AND_EARLY_DEPARTURE'].includes(value); return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${good ? 'bg-emerald-100 text-emerald-700' : warn ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{friendly(value)}</span> }
const Field = ({ label, children }) => <label className="block text-xs font-bold text-slate-600">{label}<span className="mt-1 block">{children}</span></label>
const Th = ({ children }) => <th className="px-4 py-3">{children}</th>
const Td = ({ children, className = '' }) => <td className={`px-4 py-4 text-slate-700 ${className}`}>{children}</td>
const Detail = ({ label, value }) => <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-slate-950">{value || 'Unavailable'}</p></div>
const Header = ({ title, onClose }) => <div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Authoritative HR</p><h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2></div><button type="button" onClick={onClose} className="text-2xl text-slate-400">×</button></div>
const Overlay = ({ children, wide = false }) => <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"><div className={`my-auto w-full ${wide ? 'max-w-6xl' : 'max-w-3xl'} rounded-2xl bg-white p-6 shadow-2xl`}>{children}</div></div>

export default AttendanceManagement
