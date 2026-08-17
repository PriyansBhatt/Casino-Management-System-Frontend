import { useEffect, useMemo, useState } from 'react'
import cashierApi from '../../api/cashierApi'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import { getErrorMessage } from '../../utils/errorUtils'

const money = (value) => `NPR ${Number(value || 0).toLocaleString('en-IN')}`
const statusStyles = {
  AT_TABLE: 'border-sky-200 bg-sky-50 text-sky-700',
  OUTSTANDING: 'border-amber-200 bg-amber-50 text-amber-700',
  CLEAR: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}
const statusLabels = { AT_TABLE: 'At Table', OUTSTANDING: 'Outstanding', CLEAR: 'Clear' }

const ChipControl = () => {
  const { user } = useAuth()
  const { isSystemLocked } = useBusinessStatus()
  const [directory, setDirectory] = useState({ businessDate: null, sessions: [] })
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDirectory = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await cashierApi.getChipControlSessions()
      const next = {
        businessDate: result?.businessDate || null,
        sessions: Array.isArray(result?.sessions) ? result.sessions : [],
      }
      setDirectory(next)
      setSelectedSessionId((current) => next.sessions.some(
        (item) => item.customerSessionId === current,
      ) ? current : next.sessions[0]?.customerSessionId || null)
    } catch (requestError) {
      setDirectory({ businessDate: null, sessions: [] })
      setSelectedSessionId(null)
      setError(getErrorMessage(requestError) || 'Chip Control data could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDirectory() }, [])

  const filteredSessions = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return directory.sessions.filter((session) => {
      const matchesSearch = !normalized || [session.customerName, session.customerCode,
        session.sessionCode, session.activeTableCode, session.activeTableName]
        .some((value) => String(value || '').toLowerCase().includes(normalized))
      return matchesSearch && (statusFilter === 'ALL' || session.exposureStatus === statusFilter)
    })
  }, [directory.sessions, search, statusFilter])

  const selected = directory.sessions.find(
    (session) => session.customerSessionId === selectedSessionId,
  ) || null

  const metrics = useMemo(() => ({
    activeSessions: directory.sessions.length,
    outstandingPosition: directory.sessions.reduce(
      (total, session) => total + Math.max(0, Number(session.calculatedChipPosition || 0)), 0),
    atTable: directory.sessions.filter((session) => session.exposureStatus === 'AT_TABLE').length,
    outstanding: directory.sessions.filter(
      (session) => session.exposureStatus === 'OUTSTANDING',
    ).length,
  }), [directory.sessions])

  const exportCsv = () => {
    const rows = filteredSessions.map((session) => [session.customerCode, session.customerName,
      session.sessionCode, session.badge || 'Unavailable', session.activeTableCode || 'Not assigned',
      session.totalBuyIn, session.verifiedGamingWin, session.verifiedGamingLoss,
      session.totalCashOut, session.calculatedChipPosition, session.exposureStatus])
    const csv = [['Customer Code', 'Customer', 'Session', 'Badge', 'Current Table', 'Buy-In',
      'Verified Wins', 'Verified Losses', 'Cash-Out', 'Expected Position', 'Status'], ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `chip-control-${directory.businessDate || 'current'}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <div className="space-y-6 pb-12">
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Cash & Chips</p><h1 className="mt-1 text-3xl font-black text-slate-950">Chip Control</h1><p className="mt-2 max-w-3xl text-sm text-slate-500">Authoritative chip positions for OPEN customer sessions on the current Business Date.</p></div>
        <div className="flex flex-wrap gap-2"><HeaderValue label="Business Date" value={directory.businessDate}/><HeaderValue label="Current User" value={`${user?.fullName || user?.username || 'Unavailable'} · ${user?.role || 'Unavailable'}`}/><button type="button" onClick={loadDirectory} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50">Refresh</button><button type="button" onClick={exportCsv} disabled={!filteredSessions.length} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white disabled:opacity-40">Export CSV</button></div>
      </div>
    </header>

    {isSystemLocked && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">Casino operations are locked. Chip Control remains available in read-only mode.</div>}
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4"><p className="font-black text-red-800">Chip Control could not be loaded</p><p className="mt-1 text-sm text-red-700">{error}</p></div>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Active Customer Sessions" value={metrics.activeSessions} note="OPEN on current Business Date"/>
      <Metric label="Outstanding Chip Position" value={money(metrics.outstandingPosition)} note="Positive expected positions"/>
      <Metric label="Customers At Table" value={metrics.atTable} note="ACTIVE table assignments" tone="sky"/>
      <Metric label="Outstanding Exposure" value={metrics.outstanding} note="Positive position, not at table" tone="amber"/>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-lg font-black text-slate-950">Customer Chip Positions</h2><p className="text-sm text-slate-500">Persisted buy-ins, verified gaming results, and cash-outs.</p></div><div className="flex flex-col gap-2 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 min-w-[280px] rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-amber-400" placeholder="Search customer, session or table"/><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"><option value="ALL">All statuses</option><option value="AT_TABLE">At Table</option><option value="OUTSTANDING">Outstanding</option><option value="CLEAR">Clear</option></select></div></div>
      <div className="overflow-x-auto"><table className="min-w-[1180px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Session</th><th className="px-4 py-3">Badge</th><th className="px-4 py-3">Current Table</th><th className="px-4 py-3">Buy-In</th><th className="px-4 py-3">Verified Wins</th><th className="px-4 py-3">Verified Losses</th><th className="px-4 py-3">Cash-Out</th><th className="px-4 py-3">Expected Position</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredSessions.map((session) => <tr key={session.customerSessionId} onClick={() => setSelectedSessionId(session.customerSessionId)} className={`cursor-pointer hover:bg-amber-50/40 ${selectedSessionId === session.customerSessionId ? 'bg-amber-50' : ''}`}><td className="px-4 py-4"><p className="font-black text-slate-950">{session.customerName}</p><p className="text-xs text-slate-500">{session.customerCode}</p></td><td className="px-4 py-4 font-bold text-slate-700">{session.sessionCode}</td><td className="px-4 py-4">{session.badge || 'Unavailable'}</td><td className="px-4 py-4">{session.activeTableCode ? <><p className="font-bold text-slate-900">{session.activeTableCode}</p><p className="text-xs text-slate-500">{session.activeTableName}</p></> : 'Not assigned'}</td><td className="px-4 py-4 font-bold">{money(session.totalBuyIn)}</td><td className="px-4 py-4 font-bold text-emerald-700">{money(session.verifiedGamingWin)}</td><td className="px-4 py-4 font-bold text-red-700">{money(session.verifiedGamingLoss)}</td><td className="px-4 py-4 font-bold">{money(session.totalCashOut)}</td><td className="px-4 py-4 text-base font-black text-slate-950">{money(session.calculatedChipPosition)}</td><td className="px-4 py-4"><Status value={session.exposureStatus}/></td></tr>)}</tbody></table></div>
      {!loading && filteredSessions.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No OPEN customer sessions match the current filters.</p>}
      {loading && <p className="p-10 text-center text-sm font-bold text-slate-500">Loading authoritative Chip Control data...</p>}
    </section>

    {selected && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black text-slate-950">{selected.customerName}</h2><p className="mt-1 text-sm text-slate-500">{selected.customerCode} · {selected.sessionCode} · Business Date {selected.businessDate}</p></div><Status value={selected.exposureStatus}/></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Detail label="Session Entry" value={selected.entryTime ? new Date(selected.entryTime).toLocaleString() : 'Unavailable'}/><Detail label="Badge" value={selected.badge || 'Unavailable'}/><Detail label="Current Location" value={selected.activeTableCode ? `${selected.activeTableCode} · ${selected.activeTableName}` : 'Not assigned'}/><Detail label="Session Status" value={selected.sessionStatus}/><Detail label="Total Buy-In" value={money(selected.totalBuyIn)}/><Detail label="Verified Wins" value={money(selected.verifiedGamingWin)} tone="green"/><Detail label="Verified Losses" value={money(selected.verifiedGamingLoss)} tone="red"/><Detail label="Previous Cash-Out" value={money(selected.totalCashOut)}/></div><div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Expected Remaining Chip Position</p><p className="mt-2 text-3xl font-black">{money(selected.calculatedChipPosition)}</p><p className="mt-2 text-sm text-slate-300">Buy-In + Verified Wins − Verified Losses − Cash-Out</p></div></section>}
  </div>
}

const HeaderValue = ({ label, value }) => <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-slate-900">{value || 'Unavailable'}</p></div>
const Metric = ({ label, value, note, tone }) => <article className={`rounded-2xl border p-5 shadow-sm ${tone === 'sky' ? 'border-sky-200 bg-sky-50' : tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></article>
const Status = ({ value }) => <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black uppercase ${statusStyles[value] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>{statusLabels[value] || value || 'Unavailable'}</span>
const Detail = ({ label, value, tone }) => <div><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><p className={`mt-1 font-black ${tone === 'green' ? 'text-emerald-700' : tone === 'red' ? 'text-red-700' : 'text-slate-900'}`}>{value || 'Unavailable'}</p></div>

export default ChipControl
