import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import cashierApi from '../../api/cashierApi'
import chipCustodyApi from '../../api/chipCustodyApi'
import axiosInstance from '../../api/axiosInstance'
import useAuth from '../../hooks/useAuth'
import { ROLES } from '../../constants/roles'
import { getErrorMessage } from '../../utils/errorUtils'
import { DENOMINATIONS, MOVEMENT_LABELS, movementLabel, exposureLabel, money, difference,
  parseQuantities, inventoryPayload, loadControlScope, emptyScope, requestGuard, sessionCsv,
  displayLocation, recordedTime, createCustodySubmission, canFloat, openDate, statusPayload,
  lifecycleAllows } from '../../utils/chipControl'

const emptyQuantities = () => Object.fromEntries(DENOMINATIONS.map((value) => [value, '']))
const numeric = (value) => Number(value)
const quantityTotal = (values) => { try { return parseQuantities(values).total } catch { return null } }
const api = { ...chipCustodyApi, getChipControlSessions: cashierApi.getChipControlSessions,
  // Validate the raw list locally; the shared pit API intentionally retains its existing behavior.
  getTables: async () => (await axiosInstance.get('/pit-tables', { skipUnauthorizedRedirect: true })).data }

const ChipControl = () => {
  const { user } = useAuth()
  const role = user?.role
  const canInitialize = role === ROLES.SUPER_ADMIN
  const canManageTableFloat = [ROLES.SUPER_ADMIN, ROLES.PIT_SUPERVISOR].includes(role)
  const canLoadTables = canManageTableFloat
  const canViewHistory = [ROLES.SUPER_ADMIN, ROLES.DIRECTOR].includes(role)
  const [scope, setScope] = useState(emptyScope)
  const { date: businessDate, cage, status: operationalStatus } = scope
  const directory = scope.directory || { sessions: [] }
  const tables = scope.tables || []
  const movements = scope.movements || []
  const isSystemLocked = operationalStatus?.systemLocked === true
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
  const [sessionError, setSessionError] = useState('')
  const [tableError, setTableError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [warning, setWarning] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const generation = useRef(requestGuard())
  const sessionGeneration = useRef(requestGuard())
  const tableGeneration = useRef(requestGuard())
  const submission = useRef(createCustodySubmission())
  const scopeRef = useRef(scope)
  scopeRef.current = scope
  const mounted = useRef(false)
  const error = scope.errors.date || ''

  const clearSelections = useCallback(() => {
    sessionGeneration.current.invalidate(); tableGeneration.current.invalidate()
    setSelectedSessionId(''); setSelectedTableId(''); setSessionCustody(null); setTableCustody(null)
    setSessionError(''); setTableError(''); setSessionLoading(false); setTableLoading(false)
  }, [])
  const loadPage = useCallback(async () => {
    const current = generation.current.next()
    clearSelections(); setLoading(true); setScope(emptyScope())
    const result = await loadControlScope(api, { tables: canLoadTables, history: canViewHistory })
    if (current()) {
      setScope(result); setLoading(false)
      setNeedsRefresh(Boolean(result.errors.date || result.errors.status || result.errors.cage || result.errors.tables))
      if (!Object.keys(result.errors).length) setWarning('')
    }
    return result
  }, [canLoadTables, canViewHistory, clearSelections])
  useEffect(() => {
    mounted.current = true
    loadPage()
    return () => {
      mounted.current = false; generation.current.invalidate()
      sessionGeneration.current.invalidate(); tableGeneration.current.invalidate()
    }
  }, [loadPage])
  useEffect(() => {
    let current = true, checking = false
    const checkDate = async () => {
      if (checking || submission.current.pending) return
      checking = true
      const previous = scopeRef.current
      try {
        const next = openDate(await api.getCurrentOpenBusinessDate())
        if (current && previous === scopeRef.current && next !== previous.date && !submission.current.pending) await loadPage()
      } catch {
        if (current && previous === scopeRef.current && !submission.current.pending) await loadPage()
      } finally { checking = false }
    }
    const timer = setInterval(checkDate, 30000)
    window.addEventListener('focus', checkDate)
    return () => { current = false; clearInterval(timer); window.removeEventListener('focus', checkDate) }
  }, [loadPage])

  const selectedSession = directory.sessions.find((session) => session.customerSessionId === selectedSessionId) || null
  const selectedTable = tables.find((table) => table.id === selectedTableId) || null
  const ready = Boolean(businessDate) && !loading && !submitting && !needsRefresh
  const canIssue = lifecycleAllows(operationalStatus)
  const canReturn = lifecycleAllows(operationalStatus, true)
  const floatAllowed = canFloat(role, selectedTable, businessDate, ready, isSystemLocked)
    && (floatMode === 'ISSUE' ? canIssue : canReturn)

  useEffect(() => {
    const current = sessionGeneration.current.next()
    setSessionCustody(null); setSessionError(''); setSessionLoading(Boolean(selectedSessionId))
    if (!selectedSessionId) return () => sessionGeneration.current.invalidate()
    api.getCustomerSessionInventory(selectedSessionId)
      .then((value) => inventoryPayload(value, 'CUSTOMER_SESSION', selectedSessionId))
      .then((value) => { if (current()) setSessionCustody(value) })
      .catch((failure) => { if (current()) setSessionError(getErrorMessage(failure) || 'Session custody unavailable.') })
      .finally(() => { if (current()) setSessionLoading(false) })
    return () => sessionGeneration.current.invalidate()
  }, [selectedSessionId])
  useEffect(() => {
    const current = tableGeneration.current.next()
    setTableCustody(null); setTableError(''); setTableLoading(Boolean(selectedTableId))
    if (!selectedTableId) return () => tableGeneration.current.invalidate()
    api.getTableInventory(selectedTableId)
      .then((value) => inventoryPayload(value, 'PIT_TABLE', selectedTableId))
      .then((value) => { if (current()) setTableCustody(value) })
      .catch((failure) => { if (current()) setTableError(getErrorMessage(failure) || 'Table custody unavailable.') })
      .finally(() => { if (current()) setTableLoading(false) })
    return () => tableGeneration.current.invalidate()
  }, [selectedTableId])

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
    if (!businessDate || !scope.directory || loading || submitting) return
    const csv = sessionCsv(filteredSessions, businessDate)
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url
    anchor.download = `chip-control-${businessDate}.csv`; anchor.click(); URL.revokeObjectURL(url)
  }
  const submitMovement = async (kind) => {
    if (submission.current.pending || !ready || (kind === 'OPENING' ? !canInitialize || !canIssue || !cage || cage.initialized : !floatAllowed)) return
    let parsed
    try {
      parsed = parseQuantities(kind === 'OPENING' ? openingQuantities : floatQuantities)
      if (!parsed.total) throw new Error('Enter at least one positive denomination quantity.')
    } catch (failure) { setFeedback({ type: 'error', message: failure.message }); return }
    const operation = { kind, date: businessDate, tableId: kind === 'OPENING' ? null : selectedTableId,
      mode: kind === 'OPENING' ? null : floatMode, denominations: parsed.denominations }
    if (!window.confirm(`Confirm ${money(parsed.total)} ${kind === 'OPENING' ? 'cage opening' : `table float ${floatMode.toLowerCase()}`}?`)) return
    setSubmitting(true); setFeedback(null); setWarning('')
    try {
      await submission.current.run(operation, {
        preflight: async () => {
          const date = openDate(await api.getCurrentOpenBusinessDate())
          if (date !== operation.date) {
            if (mounted.current) { clearSelections(); setScope(emptyScope()); setNeedsRefresh(true) }
            throw new Error('Business Date changed. Refresh before posting.')
          }
          const status = statusPayload(await api.getOperationalStatus(), date)
          if (!lifecycleAllows(status, operation.mode === 'RETURN')) throw new Error('Backend operational status does not permit this movement. Refresh before continuing.')
        },
        post: (value, key) => {
          const payload = { denominations: value.denominations, idempotencyKey: key }
          if (value.kind === 'OPENING') return api.initializeCage(payload)
          return value.mode === 'ISSUE' ? api.issueTableFloat(value.tableId, payload) : api.returnTableFloat(value.tableId, payload)
        },
        success: (value) => {
          if (!mounted.current) return
          setConfirmation(value || null)
          setFeedback({ type: 'success', message: 'Custody movement posted successfully.' })
          if (kind === 'OPENING') setOpeningQuantities(emptyQuantities())
          else setFloatQuantities(emptyQuantities())
        },
        refresh: async () => {
          if (!mounted.current) return
          const result = await loadPage()
          if (Object.keys(result.errors).length) throw new Error('Secondary refresh incomplete')
        },
        warning: (message) => { if (mounted.current) { setWarning(message); setNeedsRefresh(true) } },
      })
    } catch (failure) { if (mounted.current) setFeedback({ type: 'error', message: getErrorMessage(failure) || failure.message }) }
    finally { if (mounted.current) setSubmitting(false) }
  }
  const submitOpening = () => submitMovement('OPENING')
  const submitFloat = () => submitMovement('FLOAT')

  return <div className="space-y-6 pb-12">
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Cash & Chips</p><h1 className="mt-1 text-3xl font-black text-slate-950">Chip Control</h1><p className="mt-2 text-sm text-slate-500">Authoritative physical custody and customer financial positions.</p></div>
        <div className="flex flex-wrap gap-2"><HeaderValue label="Business Date" value={loading ? 'Loading…' : businessDate || 'Unavailable'}/><HeaderValue label="Current User" value={`${user?.fullName || user?.username || 'Unavailable'} · ${role || 'Unavailable'}`}/><button type="button" onClick={() => { if (!submission.current.pending) loadPage() }} disabled={loading || submitting} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white disabled:opacity-50">{loading ? 'Refreshing...' : 'Refresh All'}</button><button type="button" onClick={exportCsv} disabled={!businessDate || !scope.directory || loading || submitting || !filteredSessions.length} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40">Export CSV</button></div>
      </div>
    </header>

    {isSystemLocked && <Notice tone="warning">Casino operations are locked. Custody inspection remains read-only; backend mutation enforcement remains active.</Notice>}
    {error && <Notice tone="error">{error}</Notice>}
    {feedback && <Notice tone={feedback.type}>{feedback.message}</Notice>}
    {warning && <Notice tone="warning">{warning}</Notice>}
    {confirmation && <Notice tone="success">Confirmed movement: {movementLabel(confirmation.movementType)} · Business Date {confirmation.businessDate || 'Unavailable'} · {money(confirmation.totalValue)}<details><summary>Audit reference</summary>{confirmation.id || 'Unavailable'}</details></Notice>}
    {!loading && !businessDate && <Notice tone="warning">No authoritative OPEN Business Date is available. Scoped sections, mutations and export are unavailable; cage inventory is independent.</Notice>}
    {operationalStatus?.lifecycleWarning && <Notice tone="warning">{operationalStatus.lifecycleWarning}</Notice>}
    {operationalStatus?.continuationOverrideActive && <Notice tone="warning">An authorized Business Date continuation is active. The backend validates each movement.</Notice>}
    {scope.errors.status && <Notice tone="error">Operational controls unavailable: {scope.errors.status}</Notice>}

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle title="Physical Chip Inventory" subtitle="Authoritative cage quantities. This is not a cash balance."/>
      {loading && <Empty text="Loading cage inventory..."/>}
      {scope.errors.cage && <Notice tone="error">{scope.errors.cage}</Notice>}
      {!loading && cage && <>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><InventoryCards inventory={cage}/></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Total Physical Chips" value={Object.values(cage.denominations || {}).reduce((sum, quantity) => sum + numeric(quantity), 0).toLocaleString('en-IN')}/><Metric label="Total Cage Chip Value" value={money(cage.totalValue)}/><Metric label="Opening Inventory" value={cage.initialized ? 'Initialized' : 'Not initialized'} tone={cage.initialized ? 'green' : 'amber'}/></div>
      </>}
      {!loading && !cage && !scope.errors.cage && <Empty text="Cage inventory is unavailable."/>}
    </section>

    {canInitialize && cage && !cage.initialized && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <SectionTitle title="Initialize Opening Cage Inventory" subtitle="SUPER_ADMIN only. This creates the auditable opening movement and is not an editable balance."/>
      <fieldset disabled={submitting || !ready || !canIssue}><QuantityEditor values={openingQuantities} onChange={setOpeningQuantities}/></fieldset>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4"><strong>Total Opening Value</strong><strong className="text-xl">{money(quantityTotal(openingQuantities))}</strong></div>
      <button type="button" onClick={submitOpening} disabled={submitting || !ready || !canIssue} className="mt-4 rounded-xl bg-amber-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{submitting ? 'Initializing...' : 'Confirm Opening Inventory'}</button>
    </section>}

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle title="Customer-Session Custody" subtitle="Compare financial position with separately tracked physical denominations."/>
      {scope.errors.directory && <Notice tone="error">{scope.errors.directory}</Notice>}
      {!loading && !scope.directory && !scope.errors.directory && <Empty text="Business Date session directory unavailable."/>}
      <p className="mt-3 text-xs text-slate-500">Search narrows the choices below. Select a session explicitly; changing the search clears selection.</p>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]"><input value={search} disabled={loading || submitting || !scope.directory} onChange={(event) => { setSearch(event.target.value); sessionGeneration.current.invalidate(); setSelectedSessionId(''); setSessionCustody(null) }} placeholder="Search customer, code, session or table" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"/><select value={selectedSessionId} disabled={loading || submitting || !scope.directory} onChange={(event) => { sessionGeneration.current.invalidate(); setSessionCustody(null); setSelectedSessionId(event.target.value) }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Select an OPEN customer session</option>{filteredSessions.map((session) => <option key={session.customerSessionId} value={session.customerSessionId}>{session.customerCode} · {session.customerName} · {session.sessionCode}</option>)}</select></div>
      {sessionLoading && <Empty text="Loading customer-session custody..."/>}
      {sessionError && <Notice tone="error">{sessionError}</Notice>}
      {selectedSession && sessionCustody && <div className="mt-5 grid gap-5 xl:grid-cols-2"><div><h3 className="font-black text-slate-950">Physical Chip Custody</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><InventoryCards inventory={sessionCustody}/></div><p className="mt-4 text-xl font-black">Total: {money(sessionCustody.totalValue)}</p></div><div className="rounded-2xl bg-slate-950 p-5 text-white"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Financial Position</p><p className="mt-2 text-3xl font-black">{money(selectedSession.calculatedChipPosition)}</p><p className="mt-2 text-sm text-slate-300">{selectedSession.customerName} · {selectedSession.customerCode}<br/>{selectedSession.sessionCode} · {exposureLabel(selectedSession.exposureStatus)}</p><p className="mt-4 text-xs text-slate-400">Financial position and physical custody are separate authoritative measures. Gaming results and physical transfers are separate events and can legitimately produce different values.</p><p className="mt-4 text-xs font-bold">Financial / Physical Difference (Financial − Physical)</p><p className="mt-1 text-xl font-black">{money(difference(selectedSession.calculatedChipPosition, sessionCustody.totalValue))}</p></div></div>}
      {!selectedSessionId && <Empty text="Select a customer session to inspect physical custody."/>}
    </section>

    {canLoadTables && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle title="Pit Table Physical Inventory" subtitle="Declared opening float and current denomination custody are shown separately."/>
      {scope.errors.tables && <Notice tone="error">{scope.errors.tables}</Notice>}
      {!loading && !scope.tables && !scope.errors.tables && <Empty text="Business Date table inventory directory unavailable."/>}
      <select disabled={loading || submitting || !scope.tables} value={selectedTableId} onChange={(event) => { tableGeneration.current.invalidate(); setTableCustody(null); setSelectedTableId(event.target.value) }} className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Select a Pit Table</option>{tables.map((table) => <option key={table.id} value={table.id}>{table.tableCode} · {table.tableName} · {table.status}</option>)}</select>
      {tableLoading && <Empty text="Loading table custody..."/>}
      {tableError && <Notice tone="error">{tableError}</Notice>}
      {selectedTable && tableCustody && <><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><InventoryCards inventory={tableCustody}/></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Current Physical Inventory" value={money(tableCustody.totalValue)}/><Metric label="Declared Opening Float" value={money(selectedTable.openingFloat)}/><Metric label="Table Status" value={selectedTable.status}/></div></>}
      {!selectedTableId && <Empty text="Select a table to inspect physical inventory."/>}

      {selectedTable && selectedTable.status !== 'OPEN' && <Empty text="This operation is read-only. Float movements require an OPEN current Business Date operation."/>}
      {canManageTableFloat && selectedTable?.status === 'OPEN' && <fieldset disabled={submitting || !ready || isSystemLocked || !canReturn}><div className="mt-6 border-t border-slate-200 pt-5"><div className="flex gap-2"><ModeButton active={floatMode === 'ISSUE'} onClick={() => setFloatMode('ISSUE')}>Issue Float</ModeButton><ModeButton active={floatMode === 'RETURN'} onClick={() => setFloatMode('RETURN')}>Return Float</ModeButton></div><QuantityEditor values={floatQuantities} onChange={setFloatQuantities}/><div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4"><strong>Calculated Movement Total</strong><strong className="text-xl">{money(quantityTotal(floatQuantities))}</strong></div><button type="button" onClick={submitFloat} disabled={!floatAllowed} className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{submitting ? 'Posting...' : `Confirm Float ${floatMode === 'ISSUE' ? 'Issue' : 'Return'}`}</button></div></fieldset>}
    </section>}

    {canViewHistory && <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between"><SectionTitle title="Current Business Date Movement History" subtitle="Persisted custody ledger movements only."/><select value={movementFilter} onChange={(event) => setMovementFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="ALL">All movement types</option>{Object.keys(MOVEMENT_LABELS).map((type) => <option key={type} value={type}>{movementLabel(type)}</option>)}</select></div>
      {scope.errors.movements && <Notice tone="error">{scope.errors.movements}</Notice>}
      {!loading && !scope.movements && !scope.errors.movements && <Empty text="Business Date movement history unavailable."/>}
      <div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Business Date / Recorded Time (Kathmandu)</th><th className="px-4 py-3">Movement</th><th className="px-4 py-3">From → To</th><th className="px-4 py-3">Denominations</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">References</th><th className="px-4 py-3">Actor</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredMovements.map((movement) => <tr key={movement.id}><td className="px-4 py-4">{movement.businessDate}<br/><span className="text-xs">{recordedTime(movement.createdAt)}</span></td><td className="px-4 py-4 font-black">{movementLabel(movement.movementType)}</td><td className="px-4 py-4">{displayLocation(movement.sourceType, movement.display)} → {displayLocation(movement.destinationType, movement.display)}</td><td className="px-4 py-4">{denominationSummary(movement.denominations)}</td><td className="px-4 py-4 font-black">{money(movement.totalValue)}</td><td className="px-4 py-4 text-xs">{movement.display?.sessionCode || movement.display?.tableCode || movement.relatedTransactionType || 'Unavailable'}<details className="mt-2"><summary>Audit IDs</summary><p>Movement: {movement.id}</p><p>From: {movement.sourceReferenceId || '—'}</p><p>To: {movement.destinationReferenceId || '—'}</p><p>Session: {movement.customerSessionId || '—'}</p><p>Table: {movement.pitTableId || '—'}</p><p>Related: {movement.relatedTransactionId || '—'}</p><p>Actor: {movement.createdBy || 'Unavailable'}</p></details></td><td className="px-4 py-4 text-xs">{movement.display?.actorUsername || movement.display?.actorDisplayName || 'Unavailable'}</td></tr>)}</tbody></table></div>
      {!loading && scope.movements && !filteredMovements.length && <Empty text="No custody movements match the current filter."/>}
    </section>}
  </div>
}

const InventoryCards = ({ inventory }) => DENOMINATIONS.map((denomination) => {
  const quantity = numeric(inventory?.denominations?.[denomination])
  return <article key={denomination} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">{money(denomination)}</p><p className="mt-1 text-2xl font-black text-slate-950">{quantity.toLocaleString('en-IN')}</p><p className="mt-1 text-xs text-slate-500">Value {money(denomination * quantity)}</p></article>
})
const QuantityEditor = ({ values, onChange }) => <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{DENOMINATIONS.map((denomination) => <label key={denomination} className="rounded-xl border border-slate-200 bg-white p-3"><span className="text-xs font-black uppercase text-slate-500">{money(denomination)}</span><input type="number" min="0" step="1" value={values[denomination]} onChange={(event) => onChange((current) => ({ ...current, [denomination]: event.target.value }))} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3" placeholder="0"/></label>)}</div>
const denominationSummary = (values = {}) => DENOMINATIONS.map((denomination) => [denomination, numeric(values[denomination])]).filter(([, quantity]) => quantity > 0).map(([denomination, quantity]) => `${money(denomination)} × ${quantity}`).join(', ') || 'No denominations'
const HeaderValue = ({ label, value }) => <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-slate-900">{value}</p></div>
const SectionTitle = ({ title, subtitle }) => <div><h2 className="text-lg font-black text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>
const Metric = ({ label, value, tone }) => <article className={`rounded-xl border p-4 ${tone === 'green' ? 'border-emerald-200 bg-emerald-50' : tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-950">{value}</p></article>
const ModeButton = ({ active, onClick, children }) => <button type="button" onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-black ${active ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{children}</button>
const Empty = ({ text }) => <p className="mt-5 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">{text}</p>
const Notice = ({ tone, children }) => <div className={`rounded-2xl border p-4 text-sm font-bold ${tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{children}</div>

export default ChipControl
