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

const POLL_INTERVAL_MS = 12_000
const STALE_MUTATION_THRESHOLD_MS = 36_000

const DealerTableMode = () => {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { showToast } = useToast()
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
      const confirmed = await pitApi.getPitTableMode(tableId)
      if (!mountedRef.current || sequence !== requestSequenceRef.current) return null
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

  const beginMutation = () => {
    mutationPendingRef.current = true
    setMutationPending(true)
  }

  const endMutation = () => {
    mutationPendingRef.current = false
    if (mountedRef.current) setMutationPending(false)
  }

  const handleAssignPlayer = async (candidate) => {
    if (mutationPendingRef.current) return { success: false, message: 'Another table operation is already in progress.' }
    beginMutation()
    try {
      await pitApi.assignPlayer(tableId, {
        customerId: candidate.customerId,
        customerSessionId: candidate.customerSessionId,
      })
      const confirmed = await refreshSnapshot({ force: true })
      const assigned = confirmed?.players?.some(
        (player) => player.customerSessionId === candidate.customerSessionId,
      )
      if (!assigned) {
        return { success: false, uncertain: true, message: 'The request completed, but the authoritative table assignment could not be confirmed. Refresh before retrying.' }
      }
      setAddPlayerOpen(false)
      showToast({ type: 'success', title: 'Player assigned', message: `${candidate.customerName} is now assigned to ${confirmed.tableCode}.` })
      return { success: true }
    } catch (error) {
      if (await recoverDealerAuthorization(error)) return { success: false, lost: true }

      const confirmed = await refreshSnapshot({ force: true })
      const assigned = confirmed?.players?.some(
        (player) => player.customerSessionId === candidate.customerSessionId,
      )
      if (assigned) {
        setAddPlayerOpen(false)
        showToast({ type: 'success', title: 'Player assignment confirmed', message: `${candidate.customerName} is assigned to ${confirmed.tableCode}.` })
        return { success: true }
      }
      return {
        success: false,
        uncertain: !error?.response && !confirmed,
        message: getErrorMessage(error),
      }
    } finally {
      endMutation()
    }
  }

  const handleLeavePlayer = async (player, payload) => {
    if (mutationPendingRef.current) return { success: false, message: 'Another table operation is already in progress.' }
    beginMutation()
    try {
      await pitApi.leavePlayer(tableId, player.assignmentId, payload)
      const confirmed = await refreshSnapshot({ force: true })
      const stillAssigned = confirmed?.players?.some(
        (current) => current.assignmentId === player.assignmentId,
      )
      if (!confirmed || stillAssigned) {
        return { success: false, message: 'The request completed, but the authoritative table leave could not be confirmed. Retry with the same request only after refreshing.' }
      }
      setLeavePlayer(null)
      showToast({ type: 'success', title: 'Player left table', message: `${player.customerName} is no longer assigned to ${confirmed.tableCode}. The casino session remains open.` })
      return { success: true }
    } catch (error) {
      if (await recoverDealerAuthorization(error)) return { success: false, lost: true }

      const confirmed = await refreshSnapshot({ force: true })
      const stillAssigned = confirmed?.players?.some(
        (current) => current.assignmentId === player.assignmentId,
      )
      if (confirmed && !stillAssigned) {
        setLeavePlayer(null)
        showToast({ type: 'success', title: 'Table leave confirmed', message: `${player.customerName} is no longer assigned to ${confirmed.tableCode}.` })
        return { success: true }
      }
      return { success: false, message: getErrorMessage(error) }
    } finally {
      endMutation()
    }
  }

  const handleCustodyAction = (mode, player) => {
    setAddPlayerOpen(false)
    setLeavePlayer(null)
    setResultAction(null)
    setCustodyAction({ mode, player })
  }

  const handleCustodyTransfer = async (player, mode, payload) => {
    if (mutationPendingRef.current) return { success: false, message: 'Another table operation is already in progress.' }
    beginMutation()
    try {
      if (mode === TABLE_CUSTODY_ACTIONS.CHIP_IN) {
        await chipCustodyApi.moveCustomerChipsToTable(tableId, player.customerSessionId, payload)
      } else {
        await chipCustodyApi.returnTableChipsToCustomer(tableId, player.customerSessionId, payload)
      }
      const confirmed = await refreshSnapshot({ force: true })
      if (!confirmed) {
        return { success: false, message: 'The transfer response was received, but the authoritative table snapshot could not be refreshed. Retry with the same request only after revalidation.' }
      }
      setCustodyAction(null)
      showToast({
        type: 'success',
        title: mode === TABLE_CUSTODY_ACTIONS.CHIP_IN ? 'CHIP-IN confirmed' : 'RETURN confirmed',
        message: mode === TABLE_CUSTODY_ACTIONS.CHIP_IN
          ? `Physical chips moved from ${player.sessionCode} to ${confirmed.tableCode}.`
          : `Physical chips returned from ${confirmed.tableCode} to ${player.sessionCode}.`,
      })
      return { success: true }
    } catch (error) {
      if (await recoverDealerAuthorization(error)) return { success: false, lost: true }
      await refreshSnapshot({ force: true })
      return { success: false, message: getErrorMessage(error) }
    } finally {
      endMutation()
    }
  }

  const handleResultAction = (resultType, player) => {
    setAddPlayerOpen(false)
    setLeavePlayer(null)
    setCustodyAction(null)
    setResultAction({ resultType, player })
  }

  const handleVerifiedResult = async (player, resultType, request) => {
    if (mutationPendingRef.current) return { success: false, message: 'Another table operation is already in progress.' }
    beginMutation()
    try {
      await pitApi.createVerifiedGamingResult({
        customerId: player.customerId,
        customerSessionId: player.customerSessionId,
        pitTableId: tableId,
        assignmentId: player.assignmentId,
        sourceType: 'TABLE',
        resultType,
        denominations: request.denominations,
        idempotencyKey: request.idempotencyKey,
      })
      const confirmed = await refreshSnapshot({ force: true })
      if (!confirmed) {
        return { success: false, message: `The verified ${resultType} response was received, but the authoritative table snapshot could not be refreshed. Retry with the same request only after revalidation.` }
      }
      setResultAction(null)
      showToast({
        type: 'success',
        title: `Verified ${resultType} recorded`,
        message: `The authoritative result for ${player.customerName} is reflected in the refreshed table snapshot.`,
      })
      return { success: true }
    } catch (error) {
      if (await recoverDealerAuthorization(error)) return { success: false, lost: true }
      const confirmed = await refreshSnapshot({ force: true })
      const playerStillActive = confirmed?.players?.some(
        (current) => current.assignmentId === player.assignmentId && current.status === 'ACTIVE',
      )
      const message = getErrorMessage(error)
      if (confirmed && !playerStillActive) {
        setResultAction(null)
        showToast({ type: 'error', title: 'Player assignment ended', message })
        return { success: false, message }
      }
      return {
        success: false,
        message: !error?.response
          ? `${message} Authoritative state was refreshed; retrying will reuse the same idempotency key.`
          : message,
      }
    } finally {
      endMutation()
    }
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
    && !businessDateMismatch && !assignmentLost && !freshnessExpired
  const canMutateTable = tableOperational && !refreshing && !mutationPending
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
      <TableModeHeader snapshot={snapshot} lastRefreshedAt={lastRefreshedAt}
        refreshing={refreshing} stale={Boolean(staleError)}
        onRefresh={() => refreshSnapshot({ interactive: true })}
        onExit={() => navigate('/pit/tables')} />

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
              disabled={!canMutateTable}
              className="min-h-12 rounded-xl bg-amber-400 px-6 text-sm font-black text-slate-950 shadow-sm disabled:cursor-not-allowed disabled:opacity-40">
              {mutationPending ? 'Operation pending…' : 'Add Player'}
            </button>
          </div>
        )}

        <TableModePlayerGrid players={snapshot.players} operational={canMutateTable}
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
          operational={canMutateTable} pending={mutationPending}
          onAssign={handleAssignPlayer} onAuthorizationError={recoverDealerAuthorization}
          onClose={() => setAddPlayerOpen(false)} />
      )}
      {leavePlayer && (
        <LeavePlayerDialog
          player={currentLeavePlayer || { ...leavePlayer, status: 'INACTIVE' }}
          tableCode={snapshot.tableCode}
          denominations={snapshot.supportedDenominations || []} availability={tableAvailability}
          operational={canMutateTable && Boolean(currentLeavePlayer)} pending={mutationPending}
          onLeave={handleLeavePlayer} onClose={() => setLeavePlayer(null)} />
      )}
      {custodyAction && (
        <TableModeCustodyDialog
          key={`${custodyAction.mode}-${custodyAction.player.assignmentId}`}
          mode={custodyAction.mode}
          player={currentCustodyPlayer || { ...custodyAction.player, status: 'INACTIVE' }}
          tableId={tableId}
          tableCode={snapshot.tableCode} denominations={snapshot.supportedDenominations || []}
          operational={canMutateTable && Boolean(currentCustodyPlayer)} pending={mutationPending}
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
          operational={canMutateTable && Boolean(currentResultPlayer)} pending={mutationPending}
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

export default DealerTableMode
