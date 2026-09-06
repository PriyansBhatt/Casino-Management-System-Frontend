import { useCallback, useEffect, useMemo, useState } from 'react'
import cashierApi from '../../api/cashierApi'
import chipCustodyApi from '../../api/chipCustodyApi'
import pitApi from '../../api/pitApi'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import { ROLES } from '../../constants/roles'
import { getErrorMessage } from '../../utils/errorUtils'

const DENOMINATIONS = [500, 1000, 5000, 10000, 25000]
const emptyQuantities = () => Object.fromEntries(DENOMINATIONS.map((value) => [value, '']))
const money = (value) => `NPR ${Number(value || 0).toLocaleString('en-IN')}`
const numeric = (value) => Number(value || 0)
const newKey = (prefix) => `${prefix}-${crypto.randomUUID()}`
const normalizeQuantities = (values) => Object.fromEntries(
  DENOMINATIONS.map((denomination) => [denomination, Number(values[denomination] || 0)])
    .filter(([, quantity]) => Number.isInteger(quantity) && quantity > 0),
)
const quantityTotal = (values) => DENOMINATIONS.reduce(
  (total, denomination) => total + denomination * Number(values[denomination] || 0), 0,
)

const ChipControl = () => {
  const { user } = useAuth()
  const { isSystemLocked } = useBusinessStatus()
  const role = user?.role
  const canInitialize = role === ROLES.SUPER_ADMIN
  const canManageTableFloat = [ROLES.SUPER_ADMIN, ROLES.PIT_SUPERVISOR].includes(role)
  const canLoadTables = [ROLES.SUPER_ADMIN, ROLES.PIT_SUPERVISOR, ROLES.DEALER].includes(role)
  const canViewHistory = [ROLES.SUPER_ADMIN, ROLES.DIRECTOR].includes(role)

  const [businessDate, setBusinessDate] = useState(null)
  const [directory, setDirectory] = useState({ sessions: [] })
  const [cage, setCage] = useState(null)
  const [tables, setTables] = useState([])
  const [movements, setMovements] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [sessionCustody, setSessionCustody] = useState(null)
  const [selectedTableId, setSelectedTableId] = useState('')
  const [tableCustody, setTableCustody] = useState(null)
  const [openingQuantities, setOpeningQuantities] = useState(emptyQuantities)
  const [floatQuantities, setFloatQuantities] = useState(emptyQuantities)
  const [floatMode, setFloatMode] = useState('ISSUE')
  const [movementFilter, setMovementFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sessionError, setSessionError] = useState('')
  const [tableError, setTableError] = useState('')
  const [feedback, setFeedback] = useState(null)

  const loadPage = useCallback(async () => {
    setLoading(true)
    setError('')
    setFeedback(null)
    setBusinessDate(null)
    setDirectory({ sessions: [] })
    setCage(null)
    setTables([])
    setMovements([])
    setSessionCustody(null)
    setTableCustody(null)
    try {
      const [dateResult, directoryResult, cageResult, tableResult, movementResult] = await Promise.all([
        chipCustodyApi.getCurrentOpenBusinessDate(),
        cashierApi.getChipControlSessions(),
        chipCustodyApi.getCageInventory(),
        canLoadTables ? pitApi.getAuthoritativeTables() : Promise.resolve([]),
        canViewHistory ? chipCustodyApi.getCurrentMovements() : Promise.resolve([]),
      ])
      setBusinessDate(dateResult?.businessDate || null)
      setDirectory({ sessions: Array.isArray(directoryResult?.sessions) ? directoryResult.sessions : [] })
      setCage(cageResult || null)
      setTables(Array.isArray(tableResult)
        ? tableResult
          .filter((table) => table.operationId)
          .map((table) => ({ ...table, id: table.operationId }))
        : [])
      setMovements(Array.isArray(movementResult) ? movementResult : [])
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Authoritative chip custody data could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [canLoadTables, canViewHistory])

  useEffect(() => { loadPage() }, [loadPage])

  const selectedSession = directory.sessions.find(
    (session) => session.customerSessionId === selectedSessionId,
  ) || null
  const selectedTable = tables.find((table) => table.id === selectedTableId) || null

  useEffect(() => {
    if (!selectedSessionId) {
      setSessionCustody(null)
      setSessionError('')
      return
    }
    let current = true
    setSessionLoading(true)
    setSessionCustody(null)
    setSessionError('')
    chipCustodyApi.getCustomerSessionInventory(selectedSessionId)
      .then((result) => { if (current) setSessionCustody(result || null) })
      .catch((requestError) => {
        if (current) setSessionError(getErrorMessage(requestError) || 'Session custody could not be loaded.')
      })
      .finally(() => { if (current) setSessionLoading(false) })
    return () => { current = false }
  }, [selectedSessionId])

  const loadTableCustody = useCallback(async (tableId) => {
    if (!tableId) {
      setTableCustody(null)
      setTableError('')
      return
    }
    setTableLoading(true)
    setTableCustody(null)
    setTableError('')
    try {
      setTableCustody(await chipCustodyApi.getTableInventory(tableId))
    } catch (requestError) {
      setTableError(getErrorMessage(requestError) || 'Table custody could not be loaded.')
    } finally {
      setTableLoading(false)
    }
  }, [])

  useEffect(() => { loadTableCustody(selectedTableId) }, [loadTableCustody, selectedTableId])

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase()
    return directory.sessions.filter((session) => !query || [session.customerName,
      session.customerCode, session.sessionCode, session.activeTableCode]
      .some((value) => String(value || '').toLowerCase().includes(query)))
  }, [directory.sessions, search])

  const filteredMovements = useMemo(() => movements.filter(
    (movement) => movementFilter === 'ALL' || movement.movementType === movementFilter,
  ), [movementFilter, movements])

  const exportCsv = () => {
    const rows = filteredSessions.map((session) => [session.customerCode, session.customerName,
      session.sessionCode, session.activeTableCode || 'Not assigned', session.totalBuyIn,
      session.verifiedGamingWin, session.verifiedGamingLoss, session.totalCashOut,
      session.calculatedChipPosition, session.exposureStatus])
    const csv = [['Customer Code', 'Customer', 'Session', 'Current Table', 'Buy-In',
      'Verified Wins', 'Verified Losses', 'Cash-Out', 'Financial Position', 'Status'], ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `chip-control-${businessDate || 'current'}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const submitOpening = async () => {
    const denominations = normalizeQuantities(openingQuantities)
    if (!Object.keys(denominations).length) {
      setFeedback({ type: 'error', message: 'Enter at least one positive denomination quantity.' })
      return
    }
    if (!window.confirm(`Initialize cage inventory with ${money(quantityTotal(openingQuantities))}? This cannot be edited as a balance later.`)) return
    setSubmitting(true)
    setFeedback(null)
    try {
      await chipCustodyApi.initializeCage({ denominations, idempotencyKey: newKey('CAGE-OPENING') })
      setOpeningQuantities(emptyQuantities())
      await loadPage()
      setFeedback({ type: 'success', message: 'Cage opening inventory initialized successfully.' })
    } catch (requestError) {
      setFeedback({ type: 'error', message: getErrorMessage(requestError) || 'Cage opening inventory could not be initialized.' })
    } finally {
      setSubmitting(false)
    }
  }

  const submitFloat = async () => {
    const denominations = normalizeQuantities(floatQuantities)
    if (!selectedTableId || !Object.keys(denominations).length) {
      setFeedback({ type: 'error', message: 'Select a table and enter at least one positive denomination quantity.' })
      return
    }
    const label = floatMode === 'ISSUE' ? 'issue to' : 'return from'
    if (!window.confirm(`Confirm ${money(quantityTotal(floatQuantities))} chip float ${label} ${selectedTable?.tableCode || 'the selected table'}?`)) return
    setSubmitting(true)
    setFeedback(null)
    try {
      const payload = { denominations, idempotencyKey: newKey(`TABLE-FLOAT-${floatMode}`) }
      if (floatMode === 'ISSUE') await chipCustodyApi.issueTableFloat(selectedTableId, payload)
      else await chipCustodyApi.returnTableFloat(selectedTableId, payload)
      setFloatQuantities(emptyQuantities())
      await loadPage()
      setSelectedTableId(selectedTableId)
      await loadTableCustody(selectedTableId)
      setFeedback({ type: 'success', message: `Table float ${floatMode === 'ISSUE' ? 'issued' : 'returned'} successfully.` })
    } catch (requestError) {
      setFeedback({ type: 'error', message: getErrorMessage(requestError) || 'Table float movement could not be posted.' })
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="space-y-6 pb-12">
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Cash & Chips</p><h1 className="mt-1 text-3xl font-black text-slate-950">Chip Control</h1><p className="mt-2 text-sm text-slate-500">Authoritative physical custody and customer financial positions.</p></div>
        <div className="flex flex-wrap gap-2"><HeaderValue label="Business Date" value={businessDate || 'Not open'}/><HeaderValue label="Current User" value={`${user?.fullName || user?.username || 'Unavailable'} · ${role || 'Unavailable'}`}/><button type="button" onClick={loadPage} disabled={loading} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white disabled:opacity-50">{loading ? 'Refreshing...' : 'Refresh All'}</button><button type="button" onClick={exportCsv} disabled={!filteredSessions.length} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40">Export CSV</button></div>
      </div>
    </header>

    {isSystemLocked && <Notice tone="warning">Casino operations are locked. Custody inspection remains read-only; backend mutation enforcement remains active.</Notice>}
    {error && <Notice tone="error">{error}</Notice>}
    {feedback && <Notice tone={feedback.type}>{feedback.message}</Notice>}

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle title="Physical Chip Inventory" subtitle="Authoritative cage quantities. This is not a cash balance."/>
      {loading && <Empty text="Loading cage inventory..."/>}
      {!loading && cage && <>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><InventoryCards inventory={cage}/></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Total Physical Chips" value={Object.values(cage.denominations || {}).reduce((sum, quantity) => sum + numeric(quantity), 0).toLocaleString('en-IN')}/><Metric label="Total Cage Chip Value" value={money(cage.totalValue)}/><Metric label="Opening Inventory" value={cage.initialized ? 'Initialized' : 'Not initialized'} tone={cage.initialized ? 'green' : 'amber'}/></div>
      </>}
      {!loading && !cage && !error && <Empty text="Cage inventory is unavailable."/>}
    </section>

    {canInitialize && cage && !cage.initialized && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <SectionTitle title="Initialize Opening Cage Inventory" subtitle="SUPER_ADMIN only. This creates the auditable opening movement and is not an editable balance."/>
      <QuantityEditor values={openingQuantities} onChange={setOpeningQuantities}/>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4"><strong>Total Opening Value</strong><strong className="text-xl">{money(quantityTotal(openingQuantities))}</strong></div>
      <button type="button" onClick={submitOpening} disabled={submitting || isSystemLocked} className="mt-4 rounded-xl bg-amber-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{submitting ? 'Initializing...' : 'Confirm Opening Inventory'}</button>
    </section>}

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle title="Customer-Session Custody" subtitle="Compare financial position with separately tracked physical denominations."/>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, code, session or table" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"/><select value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Select an OPEN customer session</option>{filteredSessions.map((session) => <option key={session.customerSessionId} value={session.customerSessionId}>{session.customerCode} · {session.customerName} · {session.sessionCode}</option>)}</select></div>
      {sessionLoading && <Empty text="Loading customer-session custody..."/>}
      {sessionError && <Notice tone="error">{sessionError}</Notice>}
      {selectedSession && sessionCustody && <div className="mt-5 grid gap-5 xl:grid-cols-2"><div><h3 className="font-black text-slate-950">Physical Chip Custody</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><InventoryCards inventory={sessionCustody}/></div><p className="mt-4 text-xl font-black">Total: {money(sessionCustody.totalValue)}</p></div><div className="rounded-2xl bg-slate-950 p-5 text-white"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Financial Position</p><p className="mt-2 text-3xl font-black">{money(selectedSession.calculatedChipPosition)}</p><p className="mt-2 text-sm text-slate-300">{selectedSession.customerName} · {selectedSession.customerCode}<br/>{selectedSession.sessionCode} · {selectedSession.exposureStatus}</p><p className="mt-4 text-xs text-slate-400">Financial position and physical custody are separate authoritative measures.</p></div></div>}
      {!selectedSessionId && <Empty text="Select a customer session to inspect physical custody."/>}
    </section>

    {canLoadTables && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle title="Pit Table Physical Inventory" subtitle="Declared opening float and current denomination custody are shown separately."/>
      <select value={selectedTableId} onChange={(event) => setSelectedTableId(event.target.value)} className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Select a Pit Table</option>{tables.map((table) => <option key={table.id} value={table.id}>{table.tableCode} · {table.tableName} · {table.status}</option>)}</select>
      {tableLoading && <Empty text="Loading table custody..."/>}
      {tableError && <Notice tone="error">{tableError}</Notice>}
      {selectedTable && tableCustody && <><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><InventoryCards inventory={tableCustody}/></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Current Physical Inventory" value={money(tableCustody.totalValue)}/><Metric label="Declared Opening Float" value={money(selectedTable.openingFloat)}/><Metric label="Table Status" value={selectedTable.status}/></div></>}
      {!selectedTableId && <Empty text="Select a table to inspect physical inventory."/>}

      {canManageTableFloat && selectedTable && <div className="mt-6 border-t border-slate-200 pt-5"><div className="flex gap-2"><ModeButton active={floatMode === 'ISSUE'} onClick={() => setFloatMode('ISSUE')}>Issue Float</ModeButton><ModeButton active={floatMode === 'RETURN'} onClick={() => setFloatMode('RETURN')}>Return Float</ModeButton></div><QuantityEditor values={floatQuantities} onChange={setFloatQuantities}/><div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4"><strong>Calculated Movement Total</strong><strong className="text-xl">{money(quantityTotal(floatQuantities))}</strong></div><button type="button" onClick={submitFloat} disabled={submitting || isSystemLocked} className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{submitting ? 'Posting...' : `Confirm Float ${floatMode === 'ISSUE' ? 'Issue' : 'Return'}`}</button></div>}
    </section>}

    {canViewHistory && <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between"><SectionTitle title="Current Business Date Movement History" subtitle="Persisted custody ledger movements only."/><select value={movementFilter} onChange={(event) => setMovementFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="ALL">All movement types</option>{['CAGE_OPENING', 'BUY_IN_ISSUE', 'CASH_OUT_RETURN', 'TABLE_FLOAT_ISSUE', 'TABLE_FLOAT_RETURN', 'CUSTOMER_TO_TABLE', 'TABLE_TO_CUSTOMER'].map((type) => <option key={type}>{type}</option>)}</select></div>
      <div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Movement</th><th className="px-4 py-3">From → To</th><th className="px-4 py-3">Denominations</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">References</th><th className="px-4 py-3">Actor ID</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredMovements.map((movement) => <tr key={movement.id}><td className="px-4 py-4">{movement.createdAt ? new Date(movement.createdAt).toLocaleString() : 'Unavailable'}</td><td className="px-4 py-4 font-black">{movement.movementType}</td><td className="px-4 py-4">{locationLabel(movement.sourceType, movement.sourceReferenceId)} → {locationLabel(movement.destinationType, movement.destinationReferenceId)}</td><td className="px-4 py-4">{denominationSummary(movement.denominations)}</td><td className="px-4 py-4 font-black">{money(movement.totalValue)}</td><td className="px-4 py-4 text-xs">{movement.customerSessionId ? `Session ${movement.customerSessionId}` : movement.pitTableId ? `Table ${movement.pitTableId}` : movement.relatedTransactionId || 'Unavailable'}</td><td className="px-4 py-4 text-xs">{movement.createdBy || 'Unavailable'}</td></tr>)}</tbody></table></div>
      {!loading && !filteredMovements.length && <Empty text="No custody movements match the current filter."/>}
    </section>}
  </div>
}

const InventoryCards = ({ inventory }) => DENOMINATIONS.map((denomination) => {
  const quantity = numeric(inventory?.denominations?.[denomination])
  return <article key={denomination} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">{money(denomination)}</p><p className="mt-1 text-2xl font-black text-slate-950">{quantity.toLocaleString('en-IN')}</p><p className="mt-1 text-xs text-slate-500">Value {money(denomination * quantity)}</p></article>
})
const QuantityEditor = ({ values, onChange }) => <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{DENOMINATIONS.map((denomination) => <label key={denomination} className="rounded-xl border border-slate-200 bg-white p-3"><span className="text-xs font-black uppercase text-slate-500">{money(denomination)}</span><input type="number" min="0" step="1" value={values[denomination]} onChange={(event) => onChange((current) => ({ ...current, [denomination]: event.target.value }))} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3" placeholder="0"/></label>)}</div>
const denominationSummary = (values = {}) => DENOMINATIONS.map((denomination) => [denomination, numeric(values[denomination])]).filter(([, quantity]) => quantity > 0).map(([denomination, quantity]) => `${money(denomination)} × ${quantity}`).join(', ') || 'No denominations'
const locationLabel = (type, id) => id ? `${type} (${id})` : type || 'Unavailable'
const HeaderValue = ({ label, value }) => <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-slate-900">{value}</p></div>
const SectionTitle = ({ title, subtitle }) => <div><h2 className="text-lg font-black text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>
const Metric = ({ label, value, tone }) => <article className={`rounded-xl border p-4 ${tone === 'green' ? 'border-emerald-200 bg-emerald-50' : tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-950">{value}</p></article>
const ModeButton = ({ active, onClick, children }) => <button type="button" onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-black ${active ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{children}</button>
const Empty = ({ text }) => <p className="mt-5 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">{text}</p>
const Notice = ({ tone, children }) => <div className={`rounded-2xl border p-4 text-sm font-bold ${tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{children}</div>

export default ChipControl
