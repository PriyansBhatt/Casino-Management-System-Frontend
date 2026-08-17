import { useEffect, useMemo, useRef, useState } from 'react'
import pitApi from '../../api/pitApi'
import receptionApi from '../../api/receptionApi'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useToast from '../../hooks/useToast'
import { getErrorMessage } from '../../utils/errorUtils'

const denominations = [500, 1000, 5000, 10000, 25000]
const emptyQuantities = () => Object.fromEntries(denominations.map((value) => [value, 0]))
const money = (value) => `NPR ${Number(value || 0).toLocaleString('en-IN')}`
const summary = (values = {}) => denominations.filter((value) => Number(values[value]) > 0)
  .map((value) => `${value >= 1000 ? `${value / 1000}K` : value} × ${values[value]}`).join(', ')

const VerifiedTablePlayers = ({ tableId, onSummaryChange }) => {
  const { isSystemLocked } = useBusinessStatus()
  const { showToast } = useToast()
  const [table, setTable] = useState(null)
  const [players, setPlayers] = useState([])
  const [playerSummaries, setPlayerSummaries] = useState({})
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState([])
  const [selected, setSelected] = useState(null)
  const [entryOpen, setEntryOpen] = useState(false)
  const [resultType, setResultType] = useState('WIN')
  const [quantities, setQuantities] = useState(emptyQuantities)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const requestRef = useRef({ signature: null, key: null })

  const totalsFor = (history) => history.reduce((totals, item) => ({
    ...totals,
    [item.resultType]: totals[item.resultType] + Number(item.amount || 0),
  }), { WIN: 0, LOSS: 0 })

  const loadPlayers = async (knownTable = table) => {
    const assigned = knownTable?.status === 'CLOSED'
      ? await pitApi.getPlayerHistory(tableId)
      : await pitApi.getAssignedPlayers(tableId)
    const histories = await Promise.all(assigned.map((player) =>
      pitApi.getVerifiedGamingResults(player.customerSessionId)))
    setPlayers(assigned)
    setPlayerSummaries(Object.fromEntries(assigned.map((player, index) => [
      player.assignmentId, totalsFor(histories[index].filter((item) => item.assignmentId === player.assignmentId)),
    ])))
    return assigned
  }

  useEffect(() => {
    let active = true
    pitApi.getAuthoritativeTable(tableId)
      .then(async (realTable) => {
        if (!active) return
        setTable(realTable)
        const assigned = realTable.status === 'CLOSED'
          ? await pitApi.getPlayerHistory(tableId)
          : await pitApi.getAssignedPlayers(tableId)
        setPlayers(assigned)
        const histories = await Promise.all(assigned.map((player) => pitApi.getVerifiedGamingResults(player.customerSessionId)))
        if (active) setPlayerSummaries(Object.fromEntries(assigned.map((player, index) => [
          player.assignmentId, totalsFor(histories[index].filter((item) => item.assignmentId === player.assignmentId)),
        ])))
      })
      .catch(() => { if (active) setError('Table data could not be loaded. Return to Gaming Floor and reopen the table.') })
    return () => { active = false }
  }, [tableId])

  useEffect(() => {
    if (!onSummaryChange) return
    const totals = Object.values(playerSummaries).reduce((sum, value) => ({
      WIN: sum.WIN + Number(value.WIN || 0),
      LOSS: sum.LOSS + Number(value.LOSS || 0),
    }), { WIN: 0, LOSS: 0 })
    onSummaryChange({
      activePlayers: players.filter((player) => player.status === 'ACTIVE').length,
      ...totals,
    })
  }, [onSummaryChange, playerSummaries, players])

  const canMutate = table?.status === 'OPEN' && !isSystemLocked

  const searchCustomers = async () => {
    if (!canMutate) { setError('This Pit Table is closed or casino operations are locked.'); return }
    if (!query.trim()) { setError('Enter a customer code, name, phone, or nationality.'); return }
    setBusy(true); setError('')
    try {
      const directory = await receptionApi.getCustomers({ skipUnauthorizedRedirect: true })
      const normalized = query.trim().toLowerCase()
      setMatches((Array.isArray(directory) ? directory : []).filter((customer) =>
        [customer.customerCode, customer.fullName, customer.phone, customer.nationality]
          .some((value) => String(value || '').toLowerCase().includes(normalized))))
    } catch (err) { setError(getErrorMessage(err)) } finally { setBusy(false) }
  }

  const assign = async (customer) => {
    if (!canMutate) { setError('This Pit Table is closed or casino operations are locked.'); return }
    setBusy(true); setError('')
    try {
      if (String(customer.status).toUpperCase() !== 'ACTIVE') throw new Error('Customer is not active.')
      const session = await receptionApi.getActiveSession(customer.id, { skipUnauthorizedRedirect: true })
      if (!session?.id) throw new Error('Customer does not have an active reception session.')
      await pitApi.assignPlayer(tableId, { customerId: customer.id, customerSessionId: session.id })
      await loadPlayers(); setMatches([]); setQuery('')
      showToast({ type: 'success', title: 'Player Assigned', message: `${customer.fullName} joined the table.` })
    } catch (err) { const message = getErrorMessage(err); setError(message); showToast({ type: 'error', title: 'Assignment Failed', message }) }
    finally { setBusy(false) }
  }

  const selectPlayer = async (player, type = null) => {
    setSelected(player); setQuantities(emptyQuantities()); requestRef.current = { signature: null, key: null }
    if (type) { setResultType(type); setEntryOpen(true) }
    try { setResults((await pitApi.getVerifiedGamingResults(player.customerSessionId)).filter((item) => item.assignmentId === player.assignmentId)) }
    catch (err) { setError(getErrorMessage(err)); setResults([]) }
  }

  const total = useMemo(() => denominations.reduce(
    (value, denomination) => value + denomination * Number(quantities[denomination] || 0), 0), [quantities])

  const postResult = async () => {
    if (!canMutate) { setError('This Pit Table is closed or casino operations are locked.'); return }
    if (!selected || total <= 0) { setError('Enter at least one chip denomination quantity.'); return }
    const positive = Object.fromEntries(denominations.filter((value) => quantities[value] > 0)
      .map((value) => [value, Number(quantities[value])]))
    const signature = JSON.stringify({ assignmentId: selected.assignmentId, resultType, denominations: positive })
    if (requestRef.current.signature !== signature) {
      if (!globalThis.crypto?.randomUUID) { setError('Secure request processing is unavailable in this browser.'); return }
      requestRef.current = { signature, key: globalThis.crypto.randomUUID() }
    }
    setBusy(true); setError('')
    try {
      const created = await pitApi.createVerifiedGamingResult({
        customerId: selected.customerId, customerSessionId: selected.customerSessionId,
        pitTableId: tableId, assignmentId: selected.assignmentId,
        sourceType: 'TABLE', resultType, denominations: positive,
        idempotencyKey: requestRef.current.key,
      })
      const history = (await pitApi.getVerifiedGamingResults(selected.customerSessionId))
        .filter((item) => item.assignmentId === selected.assignmentId)
      setResults(history)
      setPlayerSummaries((current) => ({ ...current, [selected.assignmentId]: totalsFor(history) }))
      setEntryOpen(false); setQuantities(emptyQuantities()); requestRef.current = { signature: null, key: null }
      showToast({ type: 'success', title: `Verified ${created.resultType} Recorded`, message: money(created.amount) })
    } catch (err) { const message = getErrorMessage(err); setError(message); showToast({ type: 'error', title: 'Result Could Not Be Recorded', message }) }
    finally { setBusy(false) }
  }

  const leave = async (player) => {
    if (!canMutate) { setError('This Pit Table is closed or casino operations are locked.'); return }
    setBusy(true); setError('')
    try {
      await pitApi.leavePlayer(tableId, player.assignmentId); await loadPlayers()
      if (selected?.assignmentId === player.assignmentId) { setSelected(null); setEntryOpen(false); setResults([]) }
      showToast({ type: 'success', title: 'Player Left Table', message: player.customerName })
    } catch (err) { setError(getErrorMessage(err)) } finally { setBusy(false) }
  }

  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><h2 className="text-xl font-black text-slate-950">Table Players</h2><p className="mt-1 text-sm text-slate-500">Assign checked-in customers and record verified table results.</p></div>
        <div className="flex w-full gap-2 lg:max-w-xl"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && searchCustomers()} disabled={!canMutate} className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-amber-400 disabled:bg-slate-100" placeholder={table?.status === 'CLOSED' ? 'Table is closed' : 'Customer code, name, phone or nationality'}/><button type="button" onClick={searchCustomers} disabled={busy || !canMutate} className="rounded-xl bg-amber-400 px-5 text-sm font-black text-slate-950 disabled:opacity-50">{busy ? 'Please wait...' : 'Find Customer'}</button></div>
      </div>
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      {matches.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{matches.map((customer) => <button key={customer.id} type="button" onClick={() => assign(customer)} disabled={busy} className="rounded-xl border border-slate-200 p-3 text-left hover:border-amber-300 hover:bg-amber-50"><p className="font-black text-slate-900">{customer.fullName}</p><p className="text-xs text-slate-500">{customer.customerCode} · {customer.status}</p></button>)}</div>}
    </section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {players.map((player) => { const totals = playerSummaries[player.assignmentId] || { WIN: 0, LOSS: 0 }; return <article key={player.assignmentId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-black text-slate-950">{player.customerName}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{player.customerCode} · {player.sessionCode}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-black ${player.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>{player.status === 'ACTIVE' ? 'AT TABLE' : 'LEFT'}</span></div></div>
        <div className="p-4"><div className="grid grid-cols-2 gap-3 text-sm"><Info label="Badge" value={player.badge || 'Unavailable'}/><Info label="Table" value={table?.tableCode || 'Loading...'}/><Info label="Joined" value={player.joinedAt ? new Date(player.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unavailable'}/><Info label="Status" value={table?.status || 'Unavailable'}/><Info label="Verified Wins" value={money(totals.WIN)} tone="green"/><Info label="Verified Losses" value={money(totals.LOSS)} tone="red"/></div>
          <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => selectPlayer(player, 'WIN')} disabled={!canMutate} className="rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-40">Record Win</button><button type="button" onClick={() => selectPlayer(player, 'LOSS')} disabled={!canMutate} className="rounded-xl bg-red-600 px-3 py-2.5 text-sm font-black text-white hover:bg-red-500 disabled:opacity-40">Record Loss</button><button type="button" onClick={() => selectPlayer(player)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50">View Details</button><button type="button" onClick={() => leave(player)} disabled={busy || !canMutate || player.status !== 'ACTIVE'} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-black text-amber-800 disabled:opacity-50">Leave Table</button></div>
        </div></article> })}
      {players.length === 0 && <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{table?.status === 'CLOSED' ? 'No customer assignment history exists for this table.' : 'No customers are currently assigned to this table.'}</div>}
    </section>

    {selected && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 p-4"><div><h2 className="font-black text-slate-950">Result History</h2><p className="text-sm text-slate-500">{selected.customerName} · {selected.customerCode}</p></div><button type="button" onClick={() => setSelected(null)} className="text-sm font-bold text-slate-500">Close</button></div><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">Denominations</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Recorded By</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{results.map((item) => <tr key={item.id}><td className="px-4 py-3">{new Date(item.createdAt).toLocaleTimeString()}</td><td className="px-4 py-3 font-bold">{selected.customerName}</td><td className="px-4 py-3"><ResultBadge type={item.resultType}/></td><td className="px-4 py-3">{summary(item.denominations)}</td><td className="px-4 py-3 font-black">{money(item.amount)}</td><td className="px-4 py-3">{item.createdBy?.username || 'User unavailable'}</td><td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">VERIFIED</span></td></tr>)}</tbody></table>{results.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No verified results recorded for this table assignment.</p>}</div></section>}

    {entryOpen && selected && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" onMouseDown={() => !busy && setEntryOpen(false)}><aside onMouseDown={(event) => event.stopPropagation()} className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 p-5"><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Record Table Result</p><h2 className="mt-1 text-2xl font-black text-slate-950">Verified {resultType}</h2></div><button type="button" onClick={() => setEntryOpen(false)} disabled={busy} className="rounded-lg border px-3 py-2 text-sm font-bold">Close</button></div><div className="space-y-5 p-5"><div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4"><Info label="Customer" value={selected.customerName}/><Info label="Table" value={table?.tableName || table?.tableCode}/><Info label="Customer Code" value={selected.customerCode}/><Info label="Result" value={resultType} tone={resultType === 'WIN' ? 'green' : 'red'}/></div><div><p className="mb-3 text-sm font-black text-slate-800">Chip Denominations</p><div className="space-y-2">{denominations.map((denomination) => <div key={denomination} className="flex items-center justify-between rounded-xl border border-slate-200 p-3"><span className="font-black">{money(denomination)}</span><div className="flex items-center gap-2"><button type="button" onClick={() => setQuantities((current) => ({ ...current, [denomination]: Math.max(0, current[denomination] - 1) }))} className="h-10 w-10 rounded-lg border bg-slate-50 text-lg font-black">−</button><input type="number" min="0" step="1" value={quantities[denomination]} onChange={(event) => { setQuantities((current) => ({ ...current, [denomination]: Math.max(0, Math.trunc(Number(event.target.value) || 0)) })); requestRef.current = { signature: null, key: null } }} className="h-10 w-20 rounded-lg border text-center font-black"/><button type="button" onClick={() => setQuantities((current) => ({ ...current, [denomination]: current[denomination] + 1 }))} className="h-10 w-10 rounded-lg bg-slate-900 text-lg font-black text-white">+</button></div></div>)}</div></div><div className={`rounded-2xl p-5 ${resultType === 'WIN' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}><p className="text-sm font-bold">Total Verified {resultType}</p><p className="mt-1 text-3xl font-black">{money(total)}</p></div>{error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}<button type="button" onClick={postResult} disabled={busy || isSystemLocked || total <= 0} className={`h-12 w-full rounded-xl text-sm font-black text-white disabled:opacity-50 ${resultType === 'WIN' ? 'bg-emerald-600' : 'bg-red-600'}`}>{busy ? 'Recording...' : `Post Verified ${resultType}`}</button></div></aside></div>}
  </div>
}

const Info = ({ label, value, tone }) => <div><p className="text-xs font-semibold text-slate-500">{label}</p><p className={`mt-1 font-black ${tone === 'green' ? 'text-emerald-700' : tone === 'red' ? 'text-red-700' : 'text-slate-900'}`}>{value || 'Unavailable'}</p></div>
const ResultBadge = ({ type }) => <span className={`rounded-full px-2.5 py-1 text-xs font-black ${type === 'WIN' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{type}</span>

export default VerifiedTablePlayers
