import { useCallback, useEffect, useMemo, useState } from 'react'
import businessDateApi from '../../api/businessDateApi'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { ROLES } from '../../constants/roles'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useToast from '../../hooks/useToast'
import { getErrorMessage } from '../../utils/errorUtils'

const MANAGERS = new Set([ROLES.SUPER_ADMIN, ROLES.DIRECTOR])
const healthStyles = {
  HEALTHY: 'border-green-200 bg-green-50 text-green-900',
  STALE: 'border-amber-200 bg-amber-50 text-amber-900',
  MISSING: 'border-red-200 bg-red-50 text-red-900',
  INCONSISTENT: 'border-red-300 bg-red-50 text-red-900',
}

const formatTime = (value) => {
  if (!value) return 'Unavailable'
  const source = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}+05:45`
  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kathmandu',
  }).format(date)
}

const Field = ({ label, value }) => (
  <div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt><dd className="mt-1 text-sm font-medium text-gray-900">{value ?? 'Unavailable'}</dd></div>
)

const BusinessDateSettings = () => {
  const { user } = useAuth()
  const { refreshBusinessStatus } = useBusinessStatus()
  const { showToast } = useToast()
  const canManage = MANAGERS.has(user?.role)
  const [status, setStatus] = useState(null)
  const [history, setHistory] = useState([])
  const [currentOpen, setCurrentOpen] = useState(null)
  const [activeOverride, setActiveOverride] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [openDate, setOpenDate] = useState('')
  const [openRemarks, setOpenRemarks] = useState('')
  const [reopenDate, setReopenDate] = useState('')
  const [reopenReason, setReopenReason] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [duration, setDuration] = useState('30')
  const [revokeReason, setRevokeReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextStatus, dates, openDateRecord, override] = await Promise.all([
        businessDateApi.getStatus(), businessDateApi.getAll(),
        businessDateApi.getCurrentOpen(), businessDateApi.getContinuationOverride(),
      ])
      setStatus(nextStatus)
      setHistory(Array.isArray(dates) ? dates : [])
      setCurrentOpen(openDateRecord)
      setActiveOverride(override)
      setOpenDate(nextStatus?.expectedBusinessDate || '')
    } catch (requestError) {
      setStatus(null); setHistory([]); setCurrentOpen(null); setActiveOverride(null)
      setError(getErrorMessage(requestError))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  const closedDates = useMemo(() => history.filter((item) => item.status === 'CLOSED'), [history])

  const mutate = async (action, success) => {
    setMutating(true); setError('')
    try {
      await action()
      showToast({ type: 'success', title: 'Business Date updated', message: success })
      setConfirmation(null)
      await Promise.all([load(), refreshBusinessStatus()])
    } catch (requestError) {
      const message = getErrorMessage(requestError)
      setError(message)
      showToast({ type: 'error', title: 'Business Date action failed', message })
    } finally { setMutating(false) }
  }

  const confirm = (options) => setConfirmation(options)
  const requestOpen = () => {
    if (!openDate) return setError('Select a Business Date to open.')
    confirm({ title: `Open Business Date ${openDate}?`, description: 'This establishes the authoritative operational date for casino transactions.', label: 'Open Business Date', action: () => mutate(() => businessDateApi.open(openDate, openRemarks.trim()), `Business Date ${openDate} opened.`) })
  }
  const requestClose = () => {
    const date = currentOpen?.businessDate
    if (!date) return setError('There is no open Business Date to close.')
    confirm({ title: `Close Business Date ${date}?`, description: 'The backend will validate sessions, tables, custody, financial positions, reconciliations, and legacy resolutions.', label: 'Close Business Date', variant: 'danger', action: () => mutate(() => businessDateApi.close(date), `Business Date ${date} closed.`) })
  }
  const requestReopen = () => {
    if (!reopenDate) return setError('Select a closed Business Date to reopen.')
    if (!reopenReason.trim()) return setError('A reason is required to reopen a Business Date.')
    confirm({ title: `Reopen Business Date ${reopenDate}?`, description: 'This audited action restores the historical date as the operational date.', label: 'Reopen Business Date', variant: 'warning', action: () => mutate(() => businessDateApi.reopen(reopenDate, reopenReason.trim()), `Business Date ${reopenDate} reopened.`) })
  }
  const requestOverride = () => {
    const durationMinutes = Number(duration)
    if (!overrideReason.trim()) return setError('A continuation reason is required.')
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 60) return setError('Override duration must be between 1 and 60 minutes.')
    confirm({ title: 'Authorize temporary stale-date continuation?', description: `New obligations will be allowed for ${durationMinutes} minutes. This action is audited.`, label: 'Authorize Override', variant: 'warning', action: () => mutate(() => businessDateApi.createContinuationOverride({ reason: overrideReason.trim(), durationMinutes }), 'Temporary Business Date continuation authorized.') })
  }
  const requestRevoke = () => {
    if (!revokeReason.trim()) return setError('A revocation reason is required.')
    confirm({ title: 'Revoke continuation override?', description: 'Normal stale Business Date protections will apply immediately. This action is audited.', label: 'Revoke Override', variant: 'danger', action: () => mutate(() => businessDateApi.revokeContinuationOverride({ reason: revokeReason.trim() }), 'Business Date continuation override revoked.') })
  }

  const health = status?.businessDateHealth || 'MISSING'
  return (
    <div className="space-y-6">
      <PageHeader title="Business Date Management" description="Authoritative lifecycle health, operations, and audited continuation controls." action={<Button variant="outline" onClick={load} disabled={loading || mutating}>Refresh</Button>} />

      {error && <Card className="border-red-200 bg-red-50"><p className="font-semibold text-red-800">Business Date action failed</p>{error.split('|').map((part, index) => <p key={`${index}-${part}`} className="mt-1 text-sm text-red-700">{part.trim()}</p>)}</Card>}
      {loading && <Card><p className="text-sm text-gray-600">Loading authoritative Business Date state...</p></Card>}

      {!loading && status && <>
        <Card className={healthStyles[health] || healthStyles.MISSING}>
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide">Lifecycle health</p><h2 className="mt-1 text-2xl font-bold">{health}</h2><p className="mt-2 max-w-3xl text-sm">{status.lifecycleWarning || 'Business Date lifecycle is aligned with the expected casino date.'}</p></div><span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">{status.businessDateOpen ? 'OPEN' : 'NOT OPEN'}</span></div>
          <dl className="mt-5 grid gap-4 border-t border-current/20 pt-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Authoritative Business Date" value={status.businessDate} /><Field label="Expected Business Date" value={status.expectedBusinessDate} /><Field label="Stale By" value={status.businessDateStale ? `${status.staleByDays} day(s)` : 'Not stale'} /><Field label="Server Time (Kathmandu)" value={formatTime(status.serverTimestamp)} /></dl>
        </Card>

        <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-gray-900">System Lock</h2><p className="mt-1 text-sm text-gray-600">System Lock is independent. Business Date lifecycle actions do not unlock the casino system.</p></div><span className={`rounded-full px-3 py-1 text-sm font-bold ${status.systemLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{status.systemLocked ? 'LOCKED' : 'UNLOCKED'}</span></div>{status.lockReason && <p className="mt-3 text-sm text-gray-700">Reason: {status.lockReason}</p>}</Card>

        {canManage && <div className="grid gap-6 xl:grid-cols-2">
          <Card><h2 className="text-lg font-semibold text-gray-900">Lifecycle controls</h2><p className="mt-1 text-sm text-gray-600">All actions are validated and persisted by the backend.</p><div className="mt-5 space-y-5">
            <section className="rounded-lg border border-gray-200 p-4"><h3 className="font-semibold">Open next Business Date</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><input className="rounded-md border px-3 py-2 text-sm" type="date" value={openDate} onChange={(event) => setOpenDate(event.target.value)} disabled={mutating || Boolean(currentOpen) || health === 'INCONSISTENT'} /><input className="rounded-md border px-3 py-2 text-sm" placeholder="Remarks (optional)" value={openRemarks} onChange={(event) => setOpenRemarks(event.target.value)} disabled={mutating || Boolean(currentOpen) || health === 'INCONSISTENT'} /></div><Button className="mt-3" onClick={requestOpen} disabled={mutating || Boolean(currentOpen) || health === 'INCONSISTENT'}>Open Business Date</Button>{currentOpen && <p className="mt-2 text-xs text-amber-700">Close the current Business Date before opening another.</p>}{health === 'INCONSISTENT' && <p className="mt-2 text-xs text-red-700">Resolve the inconsistent backend state before changing the lifecycle.</p>}</section>
            <section className="rounded-lg border border-gray-200 p-4"><h3 className="font-semibold">Close current Business Date</h3><p className="mt-2 text-sm text-gray-600">Current: {currentOpen?.businessDate || 'No open Business Date'}</p><Button className="mt-3" variant="danger" onClick={requestClose} disabled={mutating || !currentOpen}>Close Business Date</Button></section>
            <section className="rounded-lg border border-gray-200 p-4"><h3 className="font-semibold">Reopen closed Business Date</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><select className="rounded-md border px-3 py-2 text-sm" value={reopenDate} onChange={(event) => setReopenDate(event.target.value)} disabled={mutating || Boolean(currentOpen) || health === 'INCONSISTENT'}><option value="">Select closed date</option>{closedDates.map((item) => <option key={item.id || item.businessDate} value={item.businessDate}>{item.businessDate}</option>)}</select><input className="rounded-md border px-3 py-2 text-sm" placeholder="Reopen reason (required)" value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} disabled={mutating || Boolean(currentOpen) || health === 'INCONSISTENT'} /></div><Button className="mt-3" variant="outline" onClick={requestReopen} disabled={mutating || Boolean(currentOpen) || health === 'INCONSISTENT'}>Reopen Business Date</Button></section>
          </div></Card>

          <Card><h2 className="text-lg font-semibold">Continuation override</h2><p className="mt-1 text-sm text-gray-600">Temporarily authorize new obligations on a stale open date, for at most 60 minutes.</p>
            {activeOverride?.active ? <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4"><p className="font-semibold text-amber-900">ACTIVE OVERRIDE</p><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Business Date" value={activeOverride.businessDate} /><Field label="Expires" value={formatTime(activeOverride.expiresAt)} /><Field label="Authorized By" value={activeOverride.actor?.fullName || activeOverride.actor?.username} /><Field label="Reason" value={activeOverride.reason} /></dl><textarea className="mt-4 w-full rounded-md border px-3 py-2 text-sm" rows="2" placeholder="Revocation reason (required)" value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} disabled={mutating} /><Button className="mt-3" variant="danger" onClick={requestRevoke} disabled={mutating}>Revoke Override</Button></div>
              : <div className="mt-5 space-y-3"><textarea className="w-full rounded-md border px-3 py-2 text-sm" rows="3" placeholder="Continuation reason (required)" value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} disabled={mutating} /><label className="block text-xs font-semibold uppercase text-gray-500" htmlFor="override-duration">Duration (minutes)</label><input id="override-duration" className="w-full rounded-md border px-3 py-2 text-sm" type="number" min="1" max="60" step="1" value={duration} onChange={(event) => setDuration(event.target.value)} disabled={mutating} /><Button onClick={requestOverride} disabled={mutating || health !== 'STALE' || !status.businessDateOpen}>Authorize Continuation</Button>{(health !== 'STALE' || !status.businessDateOpen) && <p className="text-xs text-gray-500">Available only for a stale, open Business Date.</p>}</div>}
          </Card>
        </div>}

        <Card><h2 className="text-lg font-semibold">Business Date history</h2>{history.length === 0 ? <p className="mt-3 text-sm text-gray-600">No Business Date records found.</p> : <div className="mt-4 overflow-x-auto"><table className="min-w-full divide-y text-sm"><thead><tr className="text-left text-xs uppercase text-gray-500"><th className="px-3 py-2">Business Date</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Opened</th><th className="px-3 py-2">Closed</th><th className="px-3 py-2">Remarks</th></tr></thead><tbody className="divide-y">{history.map((item) => <tr key={item.id || item.businessDate}><td className="px-3 py-3 font-medium">{item.businessDate}</td><td className="px-3 py-3">{item.status}</td><td className="px-3 py-3">{formatTime(item.openedAt)}</td><td className="px-3 py-3">{formatTime(item.closedAt)}</td><td className="px-3 py-3">{item.remarks || '—'}</td></tr>)}</tbody></table></div>}</Card>
      </>}

      <ConfirmDialog isOpen={Boolean(confirmation)} title={confirmation?.title} description={confirmation?.description} confirmLabel={confirmation?.label} variant={confirmation?.variant} onConfirm={confirmation?.action} onCancel={() => setConfirmation(null)} isLoading={mutating} />
    </div>
  )
}

export default BusinessDateSettings
