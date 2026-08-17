import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import pitApi from '../../api/pitApi'
import { ROLES } from '../../constants/roles'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useToast from '../../hooks/useToast'
import { getErrorMessage } from '../../utils/errorUtils'
import VerifiedTablePlayers from './VerifiedTablePlayers'

const money = (value) => value == null
  ? 'Unavailable'
  : `NPR ${Number(value).toLocaleString('en-IN')}`

const closeRoles = [ROLES.PIT_SUPERVISOR, ROLES.DEALER, ROLES.SUPER_ADMIN]

const TableSessionDetails = () => {
  const navigate = useNavigate()
  const { tableId } = useParams()
  const { user } = useAuth()
  const { isSystemLocked } = useBusinessStatus()
  const { showToast } = useToast()
  const [table, setTable] = useState(null)
  const [reconciliation, setReconciliation] = useState(null)
  const [summary, setSummary] = useState({ activePlayers: 0, WIN: 0, LOSS: 0 })
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [showReconciliation, setShowReconciliation] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [closingFloat, setClosingFloat] = useState('')
  const [busy, setBusy] = useState(false)

  const loadTable = useCallback(async () => {
    const value = await pitApi.getAuthoritativeTable(tableId)
    setTable(value)
    setLoadError('')
    return value
  }, [tableId])

  const loadReconciliation = useCallback(async () => {
    const value = await pitApi.getTableReconciliation(tableId)
    setReconciliation(value)
    return value
  }, [tableId])

  useEffect(() => {
    let active = true
    Promise.all([pitApi.getAuthoritativeTable(tableId), pitApi.getTableReconciliation(tableId)])
      .then(([tableValue, reconciliationValue]) => {
        if (!active) return
        setTable(tableValue)
        setReconciliation(reconciliationValue)
        setLoadError('')
      })
      .catch(() => {
        if (active) setLoadError('Table data could not be loaded. Return to Gaming Floor and reopen the table.')
      })
    return () => { active = false }
  }, [tableId])

  const closeTable = async () => {
    if (summary.activePlayers > 0) {
      setActionError('All active customers must leave this table before it can be closed.')
      return
    }
    const numericClosingFloat = Number(closingFloat)
    if (closingFloat === '' || !Number.isFinite(numericClosingFloat) || numericClosingFloat < 0) {
      setActionError('Enter a valid closing float of zero or greater.')
      return
    }
    setBusy(true)
    setActionError('')
    try {
      await pitApi.closeAuthoritativeTable(tableId, closingFloat)
      await Promise.all([loadTable(), loadReconciliation()])
      setShowClose(false)
      showToast({ type: 'success', title: 'Pit Table Closed', message: `${table.tableCode} is now closed.` })
    } catch (error) {
      const message = getErrorMessage(error)
      setActionError(message)
      showToast({ type: 'error', title: 'Table Could Not Be Closed', message })
    } finally {
      setBusy(false)
    }
  }

  if (loadError) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 className="text-xl font-black text-red-800">Table unavailable</h1><p className="mt-2 text-sm text-red-700">{loadError}</p><button type="button" onClick={() => navigate('/pit/tables')} className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white">Return to Gaming Floor</button></div>
  }
  if (!table) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">Loading table...</div>

  const isOpen = table.status === 'OPEN'
  const canClose = closeRoles.includes(user?.role)

  return <div className="space-y-6 pb-12">
    <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3"><button type="button" onClick={() => navigate('/pit/tables')} className="rounded-xl border border-slate-200 px-3 py-2 font-black text-slate-600 hover:bg-slate-50">←</button><div><p className="text-xs font-black uppercase tracking-[0.16em] text-amber-600">Gaming Floor</p><h1 className="mt-1 text-3xl font-black text-slate-950">{table.tableName}</h1><p className="mt-1 text-sm font-semibold text-slate-500">{table.tableCode} · {table.gameType}</p></div></div>
        <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setShowReconciliation((value) => !value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50">Table Reconciliation</button>{isOpen && canClose && <button type="button" onClick={() => { setActionError(''); setShowClose(true) }} disabled={isSystemLocked} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-40">Close Table</button>}<span className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>{table.status}</span></div>
      </div>
      <div className="grid gap-4 bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-4"><HeaderInfo label="Business Date" value={table.businessDate}/><HeaderInfo label="Opening Float" value={money(table.openingFloat)}/><HeaderInfo label="Opened At" value={table.openedAt ? new Date(table.openedAt).toLocaleString() : 'Unavailable'}/><HeaderInfo label="Staff Assignment" value="Not assigned"/></div>
    </header>

    {showReconciliation && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black text-slate-950">Table Reconciliation</h2><p className="mt-1 text-sm text-slate-500">Backend-derived table float reconciliation.</p></div><button type="button" onClick={() => setShowReconciliation(false)} className="text-sm font-bold text-slate-500">Close</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><HeaderInfo label="Opening Float" value={money(reconciliation?.openingFloat)}/><HeaderInfo label="Closing Float" value={money(reconciliation?.closingFloat)}/><HeaderInfo label="Table Difference" value={money(reconciliation?.tableDifference)}/><HeaderInfo label="Reconciliation Status" value={reconciliation?.tableStatus}/></div></section>}

    {!isOpen && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">This table is CLOSED. Assignments and result mutations are disabled; historical players and verified results remain available.</div>}
    {isSystemLocked && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">Casino operations are currently locked. Table mutations are disabled.</div>}

    <VerifiedTablePlayers key={`${table.id}-${table.status}`} tableId={table.id} onSummaryChange={setSummary}/>

    {showClose && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={() => !busy && setShowClose(false)}><section onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-red-600">Final operational action</p><h2 className="mt-1 text-2xl font-black text-slate-950">Close {table.tableName}</h2><p className="mt-1 text-sm text-slate-500">{table.tableCode} · Business Date {table.businessDate}</p></div><button type="button" onClick={() => setShowClose(false)} disabled={busy} className="rounded-lg border px-3 py-2 text-sm font-bold">Cancel</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><HeaderInfo label="Opening Float" value={money(table.openingFloat)}/><HeaderInfo label="Active Players" value={String(summary.activePlayers)}/><HeaderInfo label="Verified Wins" value={money(summary.WIN)}/><HeaderInfo label="Verified Losses" value={money(summary.LOSS)}/><HeaderInfo label="Current Difference" value={money(reconciliation?.tableDifference)}/><HeaderInfo label="Status" value={reconciliation?.tableStatus}/></div>{summary.activePlayers > 0 && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">{summary.activePlayers} active customer assignment(s) must leave the table first. Customers are never force-removed.</p>}<label className="mt-5 block"><span className="text-sm font-black text-slate-800">Closing Float (NPR)</span><input type="number" min="0" step="0.01" value={closingFloat} onChange={(event) => setClosingFloat(event.target.value)} disabled={busy} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-lg font-black outline-none focus:border-red-400" placeholder="Enter counted closing float"/></label>{actionError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{actionError}</p>}<button type="button" onClick={closeTable} disabled={busy || isSystemLocked || summary.activePlayers > 0} className="mt-5 h-12 w-full rounded-xl bg-red-600 text-sm font-black text-white disabled:opacity-40">{busy ? 'Closing Table...' : 'Confirm Close Table'}</button></section></div>}
  </div>
}

const HeaderInfo = ({ label, value }) => <div><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-slate-900">{value || 'Unavailable'}</p></div>

export default TableSessionDetails
