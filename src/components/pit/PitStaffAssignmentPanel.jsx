import { useCallback, useEffect, useMemo, useState } from 'react'
import pitApi from '../../api/pitApi'
import { ROLES } from '../../constants/roles'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useToast from '../../hooks/useToast'
import { getErrorMessage } from '../../utils/errorUtils'

const STAFF_ROLES = ['DEALER', 'PIT_SUPERVISOR']
const MANAGER_ROLES = [ROLES.SUPER_ADMIN, ROLES.PIT_SUPERVISOR]

const roleLabel = (role) => role === 'PIT_SUPERVISOR' ? 'Pit Supervisor' : 'Dealer'
const staffName = (staff) => staff?.fullName || staff?.displayName || staff?.username || 'Unavailable'
const actorName = (actor) => actor?.username || 'Unavailable'
const formatDateTime = (value) => {
  if (!value) return 'Unavailable'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString()
}

const createRequestKey = (prefix) => {
  if (!globalThis.crypto?.randomUUID) return null
  return `${prefix}-${globalThis.crypto.randomUUID()}`
}

const PitStaffAssignmentPanel = ({ tableId, tableOpen, onStaffChange }) => {
  const { user } = useAuth()
  const { isSystemLocked } = useBusinessStatus()
  const { showToast } = useToast()
  const [activeStaff, setActiveStaff] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [action, setAction] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState('')
  const [remarks, setRemarks] = useState('')
  const [actionError, setActionError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canManage = MANAGER_ROLES.includes(user?.role)
  const staffByRole = useMemo(
    () => Object.fromEntries(activeStaff.map((staff) => [staff.assignmentRole, staff])),
    [activeStaff],
  )

  const loadActive = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const value = await pitApi.getActiveTableStaff(tableId)
      setActiveStaff(value)
      onStaffChange?.(value)
      return value
    } catch (error) {
      setActiveStaff([])
      onStaffChange?.(null)
      setLoadError(getErrorMessage(error))
      return []
    } finally {
      setLoading(false)
    }
  }, [onStaffChange, tableId])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const value = await pitApi.getTableStaffHistory(tableId)
      setHistory(value)
      setHistoryLoaded(true)
    } catch (error) {
      setHistory([])
      setHistoryError(getErrorMessage(error))
    } finally {
      setHistoryLoading(false)
    }
  }, [tableId])

  useEffect(() => {
    loadActive()
  }, [loadActive])

  const openHistory = () => {
    setHistoryOpen(true)
    if (!historyLoaded) loadHistory()
  }

  const loadCandidates = async (role) => {
    setCandidatesLoading(true)
    setActionError('')
    try {
      const value = await pitApi.getPitStaffCandidates(role)
      setCandidates(value)
    } catch (error) {
      setCandidates([])
      setActionError(getErrorMessage(error))
    } finally {
      setCandidatesLoading(false)
    }
  }

  const beginAction = (type, role, assignment = null) => {
    const key = createRequestKey(`pit-staff-${type.toLowerCase()}`)
    if (!key) {
      showToast({
        type: 'error',
        title: 'Staff Action Unavailable',
        message: 'Secure request ID generation is unavailable in this browser.',
      })
      return
    }
    setAction({ type, role, assignment, idempotencyKey: key })
    setSelectedCandidate('')
    setRemarks('')
    setCandidates([])
    setActionError('')
    if (type !== 'END') loadCandidates(role)
  }

  const closeAction = () => {
    if (submitting) return
    setAction(null)
    setCandidates([])
    setSelectedCandidate('')
    setRemarks('')
    setActionError('')
  }

  const refreshAfterMutation = async () => {
    await loadActive()
    if (historyLoaded || historyOpen) await loadHistory()
  }

  const submitAction = async () => {
    if (!action || submitting) return
    if (action.type !== 'END' && !selectedCandidate) {
      setActionError(`Select a ${roleLabel(action.role)}.`)
      return
    }
    setSubmitting(true)
    setActionError('')
    try {
      if (action.type === 'ASSIGN') {
        await pitApi.assignTableStaff(tableId, {
          staffUserId: selectedCandidate,
          assignmentRole: action.role,
          remarks: remarks.trim() || null,
          idempotencyKey: action.idempotencyKey,
        })
      } else if (action.type === 'HANDOVER') {
        await pitApi.handoverTableStaff(tableId, action.role, {
          newStaffUserId: selectedCandidate,
          remarks: remarks.trim() || null,
          idempotencyKey: action.idempotencyKey,
        })
      } else {
        await pitApi.endTableStaffAssignment(tableId, action.assignment.assignmentId, {
          remarks: remarks.trim() || null,
          idempotencyKey: action.idempotencyKey,
        })
      }
      await refreshAfterMutation()
      const title = action.type === 'ASSIGN'
        ? 'Staff Assigned'
        : action.type === 'HANDOVER' ? 'Staff Handover Complete' : 'Assignment Ended'
      showToast({ type: 'success', title, message: `${roleLabel(action.role)} records were refreshed.` })
      setAction(null)
      setCandidates([])
      setSelectedCandidate('')
      setRemarks('')
    } catch (error) {
      const message = getErrorMessage(error)
      setActionError(message)
      showToast({ type: 'error', title: 'Staff Action Failed', message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-600">Authoritative assignments</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Table Staff</h2>
          <p className="mt-1 text-sm text-slate-500">Current staff and retained assignment history for this operation.</p>
        </div>
        <button type="button" onClick={openHistory}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50">
          Assignment History
        </button>
      </div>

      {loading && <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-500">Loading active table staff...</p>}
      {loadError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"><p>{loadError}</p><button type="button" onClick={loadActive} className="mt-2 underline">Retry</button></div>}
      {isSystemLocked && canManage && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">System Lock is active. Staff information remains readable, but assignment changes are disabled.</p>}

      {!loading && !loadError && <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {STAFF_ROLES.map((role) => {
          const assignment = staffByRole[role]
          return <div key={role} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">{roleLabel(role)}</p>
                <p className="mt-2 text-lg font-black text-slate-950">{assignment ? staffName(assignment) : 'Not assigned'}</p>
                {assignment && assignment.fullName && <p className="mt-0.5 text-xs font-semibold text-slate-500">@{assignment.username}</p>}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${assignment ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{assignment ? 'ACTIVE' : 'UNASSIGNED'}</span>
            </div>
            <p className="mt-4 text-xs text-slate-500">Assigned Since</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{assignment ? formatDateTime(assignment.startedAt) : 'Unavailable'}</p>
            {canManage && tableOpen && <div className="mt-4 flex flex-wrap gap-2">
              {!assignment && <button type="button" onClick={() => beginAction('ASSIGN', role)} disabled={isSystemLocked}
                className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-black text-white disabled:opacity-40">Assign</button>}
              {assignment && <>
                <button type="button" onClick={() => beginAction('HANDOVER', role, assignment)} disabled={isSystemLocked}
                  className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-white disabled:opacity-40">Handover</button>
                <button type="button" onClick={() => beginAction('END', role, assignment)} disabled={isSystemLocked}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 disabled:opacity-40">End Assignment</button>
              </>}
            </div>}
          </div>
        })}
      </div>}

      {action && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && closeAction()}>
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-wider text-amber-600">{roleLabel(action.role)}</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">{action.type === 'ASSIGN' ? 'Assign Staff' : action.type === 'HANDOVER' ? 'Confirm Handover' : 'Confirm End Assignment'}</h3>
          {action.assignment && <p className="mt-2 text-sm text-slate-600">Current: <strong>{staffName(action.assignment)}</strong></p>}
          {action.type !== 'END' && <label className="mt-5 block"><span className="text-sm font-black text-slate-800">{action.type === 'HANDOVER' ? 'Replacement' : 'Staff member'}</span><select value={selectedCandidate} onChange={(event) => setSelectedCandidate(event.target.value)} disabled={candidatesLoading || submitting} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"><option value="">{candidatesLoading ? 'Loading candidates...' : 'Select candidate'}</option>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.fullName || candidate.username} ({candidate.username})</option>)}</select>{!candidatesLoading && candidates.length === 0 && !actionError && <p className="mt-2 text-xs font-bold text-amber-700">No eligible candidates are currently available.</p>}</label>}
          <label className="mt-4 block"><span className="text-sm font-black text-slate-800">Optional remarks</span><textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} disabled={submitting} maxLength={1000} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label>
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">Confirm this authoritative staff action. The backend will validate the table state, role, System Lock, conflicts and idempotency.</p>
          {actionError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{actionError}</p>}
          <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={closeAction} disabled={submitting} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Cancel</button><button type="button" onClick={submitAction} disabled={submitting || isSystemLocked || (action.type !== 'END' && (!selectedCandidate || candidatesLoading))} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white disabled:opacity-40">{submitting ? 'Processing...' : action.type === 'ASSIGN' ? 'Confirm Assign' : action.type === 'HANDOVER' ? 'Confirm Handover' : 'Confirm End'}</button></div>
        </div>
      </div>}

      {historyOpen && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && setHistoryOpen(false)}><div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 p-5"><div><h3 className="text-2xl font-black text-slate-950">Assignment History</h3><p className="mt-1 text-sm text-slate-500">Authoritative staff history for this table operation.</p></div><button type="button" onClick={() => setHistoryOpen(false)} className="rounded-lg border px-3 py-2 font-black">×</button></div><div className="max-h-[70vh] overflow-auto p-5">{historyLoading && <p className="py-8 text-center text-sm font-bold text-slate-500">Loading assignment history...</p>}{historyError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"><p>{historyError}</p><button type="button" onClick={loadHistory} className="mt-2 underline">Retry</button></div>}{!historyLoading && !historyError && history.length === 0 && <p className="rounded-xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">No assignment history exists for this operation.</p>}{!historyLoading && !historyError && history.length > 0 && <div className="space-y-3">{history.map((entry) => <div key={entry.assignmentId} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">{roleLabel(entry.assignmentRole)}</p><p className="mt-1 font-black text-slate-950">{staffName(entry)}</p><p className="text-xs text-slate-500">@{entry.username}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-black ${entry.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>{entry.active ? 'ACTIVE' : 'ENDED'}</span></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><HistoryField label="Started" value={formatDateTime(entry.startedAt)} /><HistoryField label="Ended" value={formatDateTime(entry.endedAt)} /><HistoryField label="Assigned By" value={actorName(entry.assignedBy)} /><HistoryField label="Ended By" value={actorName(entry.endedBy)} /></div>{entry.remarks && <p className="mt-3 text-sm text-slate-600"><strong>Assignment remarks:</strong> {entry.remarks}</p>}{entry.endRemarks && <p className="mt-1 text-sm text-slate-600"><strong>End remarks:</strong> {entry.endRemarks}</p>}</div>)}</div>}</div></div></div>}
    </section>
  )
}

const HistoryField = ({ label, value }) => <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-700">{value}</p></div>

export default PitStaffAssignmentPanel
