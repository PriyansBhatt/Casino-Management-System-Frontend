import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import chipCustodyApi from '../../api/chipCustodyApi'
import pitApi from '../../api/pitApi'
import AddPlayerDialog from '../../components/pit/AddPlayerDialog'
import LeavePlayerDialog from '../../components/pit/LeavePlayerDialog'
import TableModeCustodyDialog, { TABLE_CUSTODY_ACTIONS } from '../../components/pit/TableModeCustodyDialog'
import TableModeHeader from '../../components/pit/TableModeHeader'
import TableModePlayerGrid from '../../components/pit/TableModePlayerGrid'
import TableModeResultDialog from '../../components/pit/TableModeResultDialog'
import { ROLES } from '../../constants/roles'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import { getErrorMessage } from '../../utils/errorUtils'
import usePitMutation from '../../hooks/usePitMutation'
import PitMutationStatus from '../../components/pit/PitMutationStatus'
import { money, lifecycleAllows } from '../../utils/pit'
import { statusPayload } from '../../utils/chipControl'

const POLL_INTERVAL_MS = 12_000
const STALE_MUTATION_THRESHOLD_MS = 36_000

const DealerTableModeInner = ({ embedded = false, refreshTick = 0, onSnapshot }) => {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const [lifecycle, setLifecycle] = useState(null)
  const [snapshot, setSnapshot] = useState(null)
  const [initialError, setInitialError] = useState('')
  const [staleError, setStaleError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null)
  const [freshnessExpired, setFreshnessExpired] = useState(false)
  const [assignmentLost, setAssignmentLost] = useState(false)
  const [addPlayerOpen, setAddPlayerOpen] = useState(false)
  const [leavePlayer, setLeavePlayer] = useState(null)
  const [custodyAction, setCustodyAction] = useState(null)
  const [resultAction, setResultAction] = useState(null)
  const [mutationPending, setMutationPending] = useState(false)
  const mountedRef = useRef(false)
  const inFlightRef = useRef(false)
  const mutationPendingRef = useRef(false)
  const requestSequenceRef = useRef(0)
  const snapshotRef = useRef(null)

  const verifyDealerAssignment = useCallback(async () => {
    if (user?.role !== ROLES.DEALER) return false
    try {
      const assignedTables = await pitApi.getAuthoritativeTables()
      return !assignedTables.some((table) => table.operationId === tableId)
    } catch {
      return false
    }
  }, [tableId, user?.role])

  const refreshSnapshot = useCallback(async ({ interactive = false, force = false } = {}) => {
    if (inFlightRef.current || assignmentLost || (mutationPendingRef.current && !force)) return null
    inFlightRef.current = true
    const sequence = ++requestSequenceRef.current
    if (mountedRef.current) setRefreshing(true)

    try {
      const [confirmed, rawStatus] = await Promise.all([pitApi.getPitTableMode(tableId), pitApi.getOperationalStatus().catch(() => null)])
      let operationalStatus = null
      try { operationalStatus = statusPayload(rawStatus, confirmed.businessDate) } catch { /* Historical view remains readable; mutations fail closed. */ }
      if (!mountedRef.current || sequence !== requestSequenceRef.current) return null
      setLifecycle(operationalStatus)
      snapshotRef.current = confirmed
      setSnapshot(confirmed)
      setInitialError('')
      setStaleError('')
      setLastRefreshedAt(new Date())
      setFreshnessExpired(false)
      return confirmed
    } catch (error) {
      if (!mountedRef.current || sequence !== requestSequenceRef.current) return null
      if (error?.response?.status === 403 && user?.role === ROLES.DEALER) {
        const lost = await verifyDealerAssignment()
        if (!mountedRef.current || sequence !== requestSequenceRef.current) return null
        if (lost) {
          setAssignmentLost(true)
          setAddPlayerOpen(false)
          setLeavePlayer(null)
          setCustodyAction(null)
          setResultAction(null)
          setStaleError('')
          return null
        }
      }

      setLifecycle(null)
      const message = getErrorMessage(error)
      if (snapshotRef.current) setStaleError(message)
      else setInitialError(message)
      if (interactive) {
        showToast({ type: 'error', title: 'Refresh failed', message })
      }
      return null
    } finally {
      if (sequence === requestSequenceRef.current) {
        inFlightRef.current = false
        if (mountedRef.current) setRefreshing(false)
      }
    }
  }, [assignmentLost, showToast, tableId, user?.role, verifyDealerAssignment])

  const mutation = usePitMutation(async () => {
    const next = await refreshSnapshot({ force: true })
    if (!next) throw new Error('Latest table state unavailable.')
  })
  useEffect(() => { onSnapshot?.(snapshot) }, [snapshot, onSnapshot])
  useEffect(() => { if (refreshTick) refreshSnapshot({ force: true }) }, [refreshTick, refreshSnapshot])

  useEffect(() => {
    mountedRef.current = true
    refreshSnapshot()
    return () => {
      mountedRef.current = false
      requestSequenceRef.current += 1
      inFlightRef.current = false
    }
  }, [refreshSnapshot])

  useEffect(() => {
    if (!lastRefreshedAt) return undefined
    const remaining = Math.max(
      0,
      STALE_MUTATION_THRESHOLD_MS - (Date.now() - lastRefreshedAt.getTime()),
    )
    const timeout = window.setTimeout(() => setFreshnessExpired(true), remaining)
    return () => window.clearTimeout(timeout)
  }, [lastRefreshedAt])

  useEffect(() => {
    if (assignmentLost) return undefined
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') refreshSnapshot()
    }
    const interval = window.setInterval(refreshIfVisible, POLL_INTERVAL_MS)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshSnapshot()
    }
    const handleFocus = () => {
      if (document.visibilityState === 'visible') refreshSnapshot()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [assignmentLost, refreshSnapshot])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const recoverDealerAuthorization = useCallback(async (error) => {
    if (error?.response?.status !== 403 || user?.role !== ROLES.DEALER) return false
    const lost = await verifyDealerAssignment()
    if (lost && mountedRef.current) {
      setAssignmentLost(true)
      setAddPlayerOpen(false)
      setLeavePlayer(null)
      setCustodyAction(null)
      setResultAction(null)
    }
    return lost
  }, [user?.role, verifyDealerAssignment])

  const run = async (target) => {
    if (mutation.blocked) return {success:false,message:'Resolve the pending Pit operation first.'}
    mutationPendingRef.current = true; setMutationPending(true)
    requestSequenceRef.current += 1; inFlightRef.current = false
    try { return await mutation.perform({...target,tableCode:snapshotRef.current.tableCode,date:snapshotRef.current.businessDate}) }
    finally { mutationPendingRef.current=false; if(mountedRef.current)setMutationPending(false) }
  }
  const handleAssignPlayer = async candidate => {
    const outcome=await run({kind:'assign',idempotent:false,tableId,payload:{customerId:candidate.customerId,customerSessionId:candidate.customerSessionId}})
    if(outcome.success)setAddPlayerOpen(false)
    return outcome
  }
  const handleLeavePlayer = async (player,payload) => {
    const outcome=await run({kind:'leave',idempotent:true,tableId,assignmentId:player.assignmentId,sessionId:player.customerSessionId,payload})
    if(outcome.success)setLeavePlayer(null)
    return outcome
  }
  const handleCustodyAction = (mode,player) => {setAddPlayerOpen(false);setLeavePlayer(null);setResultAction(null);setCustodyAction({mode,player})}
  const handleResultAction = (resultType,player) => {setAddPlayerOpen(false);setLeavePlayer(null);setCustodyAction(null);setResultAction({resultType,player})}
  const handleCustodyTransfer = async (player,mode,payload) => {
    const outcome=await run({kind:mode===TABLE_CUSTODY_ACTIONS.CHIP_IN?'chip-in':'chip-return',idempotent:true,tableId,sessionId:player.customerSessionId,assignmentId:player.assignmentId,payload})
    if(outcome.success)setCustodyAction(null)
    return outcome
  }
  const handleVerifiedResult = async (player,resultType,payload) => {
    const outcome=await run({kind:'result',idempotent:true,tableId,sessionId:player.customerSessionId,assignmentId:player.assignmentId,payload:{...payload,customerId:player.customerId,customerSessionId:player.customerSessionId,pitTableId:tableId,assignmentId:player.assignmentId,sourceType:'TABLE',resultType}})
    if(outcome.success)setResultAction(null)
    return outcome
  }

  if (assignmentLost) {
    return (
      <FocusedFrame user={user} onLogout={handleLogout}>
        <StatePanel title="Your assignment to this table has ended."
          detail="Operational access was removed by an authoritative staff assignment change."
          action="Return to My Tables" onAction={() => navigate('/pit/tables', { replace: true })} />
      </FocusedFrame>
    )
  }

  if (!snapshot && !initialError) {
    return (
      <FocusedFrame user={user} onLogout={handleLogout}>
        <StatePanel title="Loading Dealer Table Mode…" detail="Retrieving the latest authoritative table snapshot." />
      </FocusedFrame>
    )
  }

  if (!snapshot && initialError) {
    return (
      <FocusedFrame user={user} onLogout={handleLogout}>
        <StatePanel title="Unable to load Table Mode" detail={initialError}
          action={refreshing ? 'Retrying…' : 'Retry'} onAction={() => refreshSnapshot({ interactive: true })}
          disabled={refreshing} />
      </FocusedFrame>
    )
  }

  const snapshotValid = snapshot.operationId === tableId
    && Array.isArray(snapshot.players)
    && Array.isArray(snapshot.supportedDenominations)
  const tableClosed = snapshot.status !== 'OPEN'
  const businessDateMismatch = !snapshot.currentBusinessDateOpen
    || snapshot.businessDate !== snapshot.currentBusinessDate
  const tableOperational = snapshotValid && !snapshot.systemLocked && !tableClosed
    && !businessDateMismatch && !assignmentLost && !freshnessExpired && !staleError && lifecycleAllows(lifecycle, true)
  const canMutateTable = tableOperational && !refreshing && !mutationPending && !mutation.blocked
  const canStart = canMutateTable && lifecycleAllows(lifecycle, false)
  const tableAvailability = Object.fromEntries(snapshot.supportedDenominations.map(
    (denomination) => [denomination, Number(snapshot.tableCustody?.denominations?.[denomination] || 0)],
  ))
  const currentLeavePlayer = leavePlayer
    ? snapshot.players.find((player) => player.assignmentId === leavePlayer.assignmentId)
    : null
  const currentCustodyPlayer = custodyAction
    ? snapshot.players.find((player) => player.assignmentId === custodyAction.player.assignmentId)
    : null
  const currentResultPlayer = resultAction
    ? snapshot.players.find((player) => player.assignmentId === resultAction.player.assignmentId)
    : null
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {!embedded && <TableModeHeader snapshot={snapshot} lastRefreshedAt={lastRefreshedAt}
        refreshing={refreshing} stale={Boolean(staleError)}
        onRefresh={() => refreshSnapshot({ interactive: true })}
        onExit={() => navigate('/pit/tables')} />}

      <div className="mx-auto max-w-[1500px] space-y-4 px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rotate-45 bg-amber-400" />
            <strong className="text-sm">Royal Summit Casino ERP</strong>
            <span className="text-xs font-bold text-slate-500">
              {user?.username} · {user?.role}
            </span>
          </div>
          <button type="button" onClick={handleLogout}
            className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700">
            Logout
          </button>
        </div>

        <PitMutationStatus mutation={mutation} />
        <section className="rounded border bg-white p-4"><strong>Operation Verified Results (includes players who LEFT)</strong><p>Verified Wins: {money(snapshot.operationVerifiedWins)} · Verified Losses: {money(snapshot.operationVerifiedLosses)} · Floor Net: {money(Number(snapshot.operationVerifiedLosses)-Number(snapshot.operationVerifiedWins))}</p><p>These are financial results; physical custody is separate.</p></section>
        {!lifecycleAllows(lifecycle,false) && <Warning title="New activity unavailable" detail="The current lifecycle does not allow adding players, chip-in or WIN/LOSS. Eligible settlement actions remain separate." />}
        {snapshot.systemLocked && (
          <Warning title="SYSTEM LOCKED" detail="Operational changes are temporarily disabled." danger />
        )}
        {tableClosed && <Warning title="TABLE CLOSED" detail="This operation remains available for read-only review." />}
        {businessDateMismatch && (
          <Warning title="Business Date mismatch"
            detail="Table operation is not part of the current Business Date." />
        )}
        {staleError && (
          <Warning title="Unable to refresh — displaying last confirmed data."
            detail={staleError} />
        )}
        {freshnessExpired && (
          <Warning title="AUTHORITATIVE DATA IS STALE"
            detail="Operational actions are disabled until a successful Table Mode refresh is confirmed." danger />
        )}
        {!snapshotValid && (
          <Warning title="INVALID TABLE SNAPSHOT"
            detail="The authoritative response does not match this Table Mode operation. Mutations are disabled." danger />
        )}

        {tableOperational && (
          <div className="flex justify-end">
            <button type="button" onClick={() => {
              setLeavePlayer(null)
              setCustodyAction(null)
              setResultAction(null)
              setAddPlayerOpen(true)
            }}
              disabled={!canStart}
              className="min-h-12 rounded-xl bg-amber-400 px-6 text-sm font-black text-slate-950 shadow-sm disabled:cursor-not-allowed disabled:opacity-40">
              {mutationPending ? 'Operation pending…' : 'Add Player'}
            </button>
          </div>
        )}

        <TableModePlayerGrid players={snapshot.players} operational={canMutateTable} newActivityAllowed={canStart}
          mutationPending={mutationPending} onCustody={handleCustodyAction}
          onResult={handleResultAction}
          onLeave={(player) => {
            setAddPlayerOpen(false)
            setCustodyAction(null)
            setResultAction(null)
            setLeavePlayer(player)
          }} />

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Supported chip denominations</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(snapshot.supportedDenominations || []).map((denomination) => (
              <span key={denomination} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-800">
                NPR {Number(denomination).toLocaleString('en-IN')}
              </span>
            ))}
          </div>
        </section>
      </div>

      {addPlayerOpen && (
        <AddPlayerDialog operationId={tableId} tableCode={snapshot.tableCode}
          operational={canStart} pending={mutation.blocked}
          onAssign={handleAssignPlayer} onAuthorizationError={recoverDealerAuthorization}
          onClose={() => setAddPlayerOpen(false)} />
      )}
      {leavePlayer && (
        <LeavePlayerDialog
          player={currentLeavePlayer || { ...leavePlayer, status: 'INACTIVE' }}
          tableCode={snapshot.tableCode}
          denominations={snapshot.supportedDenominations || []} availability={tableAvailability}
          operational={canMutateTable && Boolean(currentLeavePlayer)} pending={mutation.blocked}
          onLeave={handleLeavePlayer} onClose={() => setLeavePlayer(null)} />
      )}
      {custodyAction && (
        <TableModeCustodyDialog
          key={`${custodyAction.mode}-${custodyAction.player.assignmentId}`}
          mode={custodyAction.mode}
          player={currentCustodyPlayer || { ...custodyAction.player, status: 'INACTIVE' }}
          tableId={tableId}
          tableCode={snapshot.tableCode} denominations={snapshot.supportedDenominations || []}
          operational={(custodyAction.mode === TABLE_CUSTODY_ACTIONS.CHIP_IN ? canStart : canMutateTable) && Boolean(currentCustodyPlayer)} pending={mutation.blocked}
          onSubmit={handleCustodyTransfer} onAuthorizationError={recoverDealerAuthorization}
          onClose={() => setCustodyAction(null)} />
      )}
      {resultAction && (
        <TableModeResultDialog
          key={`${resultAction.resultType}-${resultAction.player.assignmentId}`}
          resultType={resultAction.resultType}
          player={currentResultPlayer || { ...resultAction.player, status: 'INACTIVE' }}
          tableCode={snapshot.tableCode} tableName={snapshot.tableName}
          denominations={snapshot.supportedDenominations || []}
          operational={canStart && Boolean(currentResultPlayer)} pending={mutation.blocked}
          onSubmit={handleVerifiedResult} onClose={() => setResultAction(null)} />
      )}
    </div>
  )
}

const FocusedFrame = ({ user, onLogout, children }) => (
  <div className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
    <div className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
      <div><strong>Royal Summit Casino ERP</strong><p className="text-xs font-bold text-slate-500">{user?.username} · {user?.role}</p></div>
      <button type="button" onClick={onLogout} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-black">Logout</button>
    </div>
    <div className="mx-auto mt-6 max-w-5xl">{children}</div>
  </div>
)

const StatePanel = ({ title, detail, action, onAction, disabled }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
    <h1 className="text-2xl font-black">{title}</h1>
    <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
    {action && <button type="button" onClick={onAction} disabled={disabled}
      className="mt-5 min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-black text-white disabled:opacity-60">{action}</button>}
  </section>
)

const Warning = ({ title, detail, danger }) => (
  <section className={`rounded-xl border px-4 py-3 ${danger
    ? 'border-red-300 bg-red-50 text-red-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
    <p className="font-black">{title}</p><p className="text-sm font-semibold">{detail}</p>
  </section>
)

export default function DealerTableMode(props) {
  const {tableId}=useParams()
  return <DealerTableModeInner key={tableId} {...props}/>
}
