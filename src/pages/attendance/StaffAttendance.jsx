import { useCallback, useEffect, useState } from 'react'
import attendanceApi from '../../api/attendanceApi'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Loading from '../../components/ui/Loading'
import { ROLES } from '../../constants/roles'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import {
  formatAttendanceBusinessDate,
  formatAttendanceTimestamp,
  formatWorkedMinutes,
  getCasinoDateSuggestion,
} from '../../utils/attendanceFormatters'

const StaffAttendance = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const canViewReport = [ROLES.DIRECTOR, ROLES.SUPER_ADMIN].includes(user?.role)
  const [mode, setMode] = useState('mine')
  const [current, setCurrent] = useState(null)
  const [currentLoading, setCurrentLoading] = useState(true)
  const [currentError, setCurrentError] = useState('')
  const [history, setHistory] = useState([])
  const [historyDate, setHistoryDate] = useState('')
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [mutating, setMutating] = useState(false)
  const [confirmCheckout, setConfirmCheckout] = useState(false)
  const [reportDate, setReportDate] = useState(getCasinoDateSuggestion)
  const [report, setReport] = useState([])
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState('')
  const [reportLoaded, setReportLoaded] = useState(false)

  const loadCurrent = useCallback(async () => {
    setCurrentLoading(true)
    setCurrentError('')
    try {
      setCurrent(await attendanceApi.getCurrent())
    } catch (error) {
      setCurrent(null)
      setCurrentError(error.message || 'Unable to confirm attendance status.')
    } finally {
      setCurrentLoading(false)
    }
  }, [])

  const loadHistory = useCallback(async (businessDate = '') => {
    setHistoryLoading(true)
    setHistoryError('')
    try {
      setHistory(await attendanceApi.getMyHistory(businessDate))
    } catch (error) {
      setHistory([])
      setHistoryError(error.message || 'Unable to load attendance history.')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.allSettled([loadCurrent(), loadHistory('')])
  }, [loadCurrent, loadHistory])

  const refreshSelf = async () => {
    await Promise.allSettled([loadCurrent(), loadHistory(historyDate)])
  }

  const mutationMessage = (error, action) => {
    if (error.normalized?.status === 409) {
      return action === 'check-in'
        ? 'An attendance shift is already open.'
        : 'No open attendance shift exists or it was already closed.'
    }
    if (error.normalized?.status === 403) {
      return error.message || 'Your account is not permitted to perform this attendance action.'
    }
    return error.message || `Unable to ${action}.`
  }

  const mutateAttendance = async (action) => {
    if (mutating || currentLoading || currentError) return
    setMutating(true)
    setCurrentError('')
    try {
      if (action === 'check-in') await attendanceApi.checkIn()
      else await attendanceApi.checkOut()
      showToast({
        type: 'success',
        title: action === 'check-in' ? 'Checked in' : 'Checked out',
        message: action === 'check-in'
          ? 'Your attendance shift was opened by the backend.'
          : 'Your attendance shift was closed successfully.',
      })
    } catch (error) {
      showToast({ type: 'error', title: 'Attendance update failed', message: mutationMessage(error, action) })
    } finally {
      setConfirmCheckout(false)
      await refreshSelf()
      setMutating(false)
    }
  }

  const loadReport = async () => {
    if (!canViewReport || !reportDate || reportLoading) return
    setReport([])
    setReportError('')
    setReportLoaded(true)
    setReportLoading(true)
    try {
      setReport(await attendanceApi.getReport(reportDate))
    } catch (error) {
      setReport([])
      setReportError(error.message || 'Unable to load the staff attendance report.')
    } finally {
      setReportLoading(false)
    }
  }

  const changeReportDate = (value) => {
    setReportDate(value)
    setReport([])
    setReportError('')
    setReportLoaded(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Attendance"
        description="Authoritative employee attendance and Business Date reporting. Times are shown in Asia/Kathmandu."
      />

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <Tab active={mode === 'mine'} onClick={() => setMode('mine')}>My Attendance</Tab>
        {canViewReport && <Tab active={mode === 'report'} onClick={() => setMode('report')}>Staff Report</Tab>}
      </div>

      {mode === 'mine' && (
        <div className="space-y-6">
          {currentLoading && <Card><Loading message="Confirming attendance status..." size="sm" /></Card>}
          {!currentLoading && currentError && (
            <ErrorState title="Unable to confirm attendance status" description={currentError} onRetry={loadCurrent} />
          )}
          {!currentLoading && !currentError && (
            <Card className={current ? 'border-emerald-200' : 'border-slate-200'}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${current ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {current ? 'Open Shift' : 'Checked Out'}
                  </span>
                  <h2 className="mt-3 text-2xl font-black text-slate-950">
                    {current ? 'Attendance shift in progress' : 'No active attendance shift'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {current
                      ? `This shift remains assigned to Business Date ${current.businessDate} until checkout.`
                      : 'Check in when you begin your work shift.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={current ? 'danger' : 'success'}
                  size="lg"
                  disabled={mutating}
                  onClick={() => current ? setConfirmCheckout(true) : mutateAttendance('check-in')}
                >
                  {mutating ? (current ? 'Checking out…' : 'Checking in…') : (current ? 'Check Out' : 'Check In')}
                </Button>
              </div>

              {current && (
                <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric label="Employee" value={current.employee?.fullName || current.employee?.username || 'Unavailable'} />
                  <Metric label="Business Date" value={formatAttendanceBusinessDate(current.businessDate)} secondary={current.businessDate} />
                  <Metric label="Checked In" value={formatAttendanceTimestamp(current.checkInAt)} />
                  <Metric label="Worked" value={formatWorkedMinutes(current.workedMinutes)} />
                </div>
              )}
            </Card>
          )}

          <Card>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">My Attendance History</h2>
                <p className="mt-1 text-sm text-slate-500">Records remain grouped by their backend-assigned Business Date.</p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-xs font-bold text-slate-600">
                  Business Date
                  <input type="date" value={historyDate} onChange={(event) => setHistoryDate(event.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <Button type="button" variant="outline" onClick={() => { setHistoryDate(''); void loadHistory('') }} disabled={historyLoading}>Clear</Button>
                <Button type="button" onClick={() => loadHistory(historyDate)} disabled={historyLoading}>{historyLoading ? 'Loading…' : 'Refresh'}</Button>
              </div>
            </div>
            <div className="mt-5">
              {historyLoading && <Loading message="Loading attendance history..." size="sm" />}
              {!historyLoading && historyError && <ErrorState title="History unavailable" description={historyError} onRetry={() => loadHistory(historyDate)} />}
              {!historyLoading && !historyError && history.length === 0 && <EmptyState title="No attendance records found" />}
              {!historyLoading && !historyError && history.length > 0 && <AttendanceTable rows={history} includeEmployee={false} />}
            </div>
          </Card>
        </div>
      )}

      {mode === 'report' && canViewReport && (
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Staff Business Date Report</h2>
              <p className="mt-1 text-sm text-slate-500">The suggested date is for querying only; persisted Business Dates remain backend authoritative.</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs font-bold text-slate-600">
                Business Date
                <input type="date" value={reportDate} onChange={(event) => changeReportDate(event.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <Button type="button" onClick={loadReport} disabled={!reportDate || reportLoading}>{reportLoading ? 'Loading…' : reportLoaded ? 'Refresh' : 'Load Report'}</Button>
            </div>
          </div>
          <div className="mt-5">
            {reportLoading && <Loading message="Loading staff attendance report..." size="sm" />}
            {!reportLoading && reportError && <ErrorState title="Report unavailable" description={reportError} onRetry={loadReport} />}
            {!reportLoading && !reportError && !reportLoaded && <EmptyState title="Select a Business Date" description="Load the authoritative staff attendance report for the selected date." />}
            {!reportLoading && !reportError && reportLoaded && report.length === 0 && <EmptyState title="No attendance records found" description={`No persisted records exist for Business Date ${reportDate}.`} />}
            {!reportLoading && !reportError && report.length > 0 && <AttendanceTable rows={report} includeEmployee />}
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={confirmCheckout}
        title="Check out now?"
        description="This closes your current attendance shift. The backend will record the authoritative checkout time."
        confirmLabel="Check Out"
        variant="warning"
        isLoading={mutating}
        onCancel={() => setConfirmCheckout(false)}
        onConfirm={() => mutateAttendance('check-out')}
      />
    </div>
  )
}

const Tab = ({ active, onClick, children }) => (
  <button type="button" onClick={onClick} className={`rounded-lg px-4 py-2 text-sm font-black transition ${active ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
    {children}
  </button>
)

const Metric = ({ label, value, secondary }) => (
  <div className="rounded-xl bg-slate-50 p-4">
    <p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-1 font-black text-slate-950">{value}</p>
    {secondary && <p className="mt-1 text-xs text-slate-500">{secondary}</p>}
  </div>
)

const AttendanceTable = ({ rows, includeEmployee }) => (
  <div className="overflow-x-auto">
    <table className="min-w-[760px] w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
        <tr>
          {includeEmployee && <th className="px-4 py-3">Employee</th>}
          {includeEmployee && <th className="px-4 py-3">Username</th>}
          <th className="px-4 py-3">Business Date</th>
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3">Check In</th>
          <th className="px-4 py-3">Check Out</th>
          <th className="px-4 py-3">Worked</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((record) => (
          <tr key={record.attendanceId}>
            {includeEmployee && <td className="px-4 py-4 font-bold text-slate-950">{record.employee?.fullName || 'Unavailable'}</td>}
            {includeEmployee && <td className="px-4 py-4 text-slate-600">{record.employee?.username || 'Unavailable'}</td>}
            <td className="px-4 py-4"><span className="font-bold text-slate-900">{formatAttendanceBusinessDate(record.businessDate)}</span><br /><span className="text-xs text-slate-500">{record.businessDate}</span></td>
            <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${record.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{record.status}</span></td>
            <td className="whitespace-nowrap px-4 py-4">{formatAttendanceTimestamp(record.checkInAt)}</td>
            <td className="whitespace-nowrap px-4 py-4">{formatAttendanceTimestamp(record.checkOutAt)}</td>
            <td className="whitespace-nowrap px-4 py-4 font-bold">{formatWorkedMinutes(record.workedMinutes)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export default StaffAttendance
