import PendingOperation from '../../components/ui/PendingOperation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useAuth from '../../hooks/useAuth'
import cashierApi from '../../api/cashierApi'
import receptionApi from '../../api/receptionApi'
import { DENOMINATIONS, PAYMENT_MODES, UNAVAILABLE_WORKFLOWS, canPostBuyIn, requestGuard,
  denominationTotal, loadBuyInScope, matchingCustomers, verifySession, readyToPost,
  historyTotals, buyInCsv, createBuyInSubmission, validateBuyIn } from '../../utils/buyIn'

const emptyScope = () => ({ businessDate: null, customers: [], history: [], reconciliation: null })
const scopeApi = { ...receptionApi, ...cashierApi }
const money = (value) => `NPR ${Number(value).toLocaleString('en-NP')}`
const inputStyle = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100'
const buttonStyle = 'rounded-lg border border-slate-300 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40'
const errorText = (error) => error.response?.data?.message || error.message || 'Request could not be completed.'

export default function BuyIn() {
  const { user } = useAuth()
  const role = user?.role
  const [scope, setScope] = useState(emptyScope)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [success, setSuccess] = useState('')
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [tab, setTab] = useState('CHIP_BUY_IN')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [verified, setVerified] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const [quantities, setQuantities] = useState({})
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('CASH')
  const [reference, setReference] = useState('')
  const [pending, setPending] = useState(false)
  const [postingError, setPostingError] = useState('')
  const [filter, setFilter] = useState('')
  const [modeFilter, setModeFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const scopeGuard = useRef(requestGuard())
  const selectionGuard = useRef(requestGuard())
  const submission = useMemo(() => ({ current: createBuyInSubmission(undefined, { actor: String(user?.id || user?.username || '') }) }), [user?.id, user?.username])
  const date = scope.businessDate?.businessDate
  const available = !loading && !error && Boolean(date)
  const operational = available && !needsRefresh
  const writable = canPostBuyIn(role)
  const finalized = scope.reconciliation?.lifecycleStatus === 'SUBMITTED'

  const clearSelection = useCallback(() => {
    selectionGuard.current.invalidate()
    setSelected(null); setVerified(null); setVerifying(false); setVerificationError('')
  }, [])
  const refreshScope = useCallback(async (propagateFailure = false) => {
    const current = scopeGuard.current.next()
    clearSelection()
    setScope(emptyScope()); setLoading(true); setError(''); setNeedsRefresh(false)
    try {
      const next = await loadBuyInScope(scopeApi, role)
      if (current()) { setScope(next); setWarning(''); setPage(1) }
    } catch (failure) {
      if (current()) setError(errorText(failure))
      if (propagateFailure === true) throw failure
    } finally { if (current()) setLoading(false) }
  }, [role, clearSelection])
  useEffect(() => {
    refreshScope()
    return () => { scopeGuard.current.invalidate(); selectionGuard.current.invalidate() }
  }, [refreshScope])

  const matches = useMemo(() => matchingCustomers(scope.customers, query), [scope.customers, query])
  const total = denominationTotal(quantities)
  const totals = historyTotals(scope.history, available)
  const canSubmit = tab === 'CHIP_BUY_IN' && readyToPost({ role, date, ready: operational,
    pending, selected, verified, total, amount: Number(amount), mode, reference, finalized })
  const filtered = useMemo(() => scope.history.filter(({ transaction: tx, customerCode, customerName }) => {
    const search = filter.trim().toLowerCase()
    return (modeFilter === 'ALL' || tx.paymentMode === modeFilter)
      && [tx.buyInCode, customerCode, customerName, tx.paymentReference].some((value) => String(value ?? '').toLowerCase().includes(search))
  }), [scope.history, filter, modeFilter])
  const pageCount = Math.max(1, Math.ceil(filtered.length / 20))
  const visiblePage = Math.min(page, pageCount)

  async function selectCustomer(customer) {
    if (!operational || !writable || submission.current.pending) return
    const current = selectionGuard.current.next()
    setSelected(customer); setVerified(null); setVerifying(true); setVerificationError('')
    try {
      const session = verifySession(customer, await receptionApi.getActiveSession(customer.id), date)
      if (current()) setVerified(session)
    } catch (failure) { if (current()) setVerificationError(errorText(failure)) }
    finally { if (current()) setVerifying(false) }
  }

  async function postBuyIn(event) {
    event.preventDefault()
    if (!canSubmit || submission.current.pending) return
    const current = scopeGuard.current.next()
    const customer = selected
    const capturedDate = date
    const payload = { expectedBusinessDate: capturedDate, currency: 'NPR', customerId: customer.id, customerSessionId: verified.id,
      amountReceived: Number(amount), paymentMode: mode, totalChipValueIssued: total,
      denominations: quantities, paymentReference: reference.trim() || null }
    setPending(true); setPostingError(''); setSuccess(''); setWarning('')
    try {
      await submission.current.run(payload, {
        targetLabel: `${customer.customerCode} · ${customer.fullName}`,
        post: cashierApi.createBuyIn,
        onSuccess: (created) => {
          if (!current()) return
          setSuccess(`Chip Buy-In posted successfully${created?.buyInCode ? `: ${created.buyInCode}` : ''}.`)
          try {
            const tx = validateBuyIn(created, capturedDate)
            setScope((previous) => ({ ...previous, history: [
              { transaction: tx, customerCode: customer.customerCode, customerName: customer.fullName },
              ...previous.history.filter((row) => row.transaction.id !== tx.id),
            ] }))
          } catch {
            setWarning('Buy-In posted successfully, but its confirmation details are unavailable. Refresh history; do not repost.')
            setNeedsRefresh(true)
          }
          setQuantities({}); setAmount(''); setReference(''); setQuery(''); clearSelection()
        },
        refresh: async () => {
          const next = await loadBuyInScope(scopeApi, role)
          if (current()) { setScope(next); setNeedsRefresh(false); setPage(1) }
        },
        onWarning: (message) => {
          if (current()) { setWarning(message); setNeedsRefresh(true) }
        },
      })
    } catch (failure) { if (current()) setPostingError(errorText(failure)) }
    finally { setPending(false) }
  }

  const retryOriginal = async () => {
    setPending(true); setPostingError('')
    try { await submission.current.run(null, { post: cashierApi.createBuyIn,
      onSuccess: () => setSuccess('Chip Buy-In posted successfully. Do not repost.'),
      refresh: () => refreshScope(true), onWarning: setWarning }, true) }
    catch (e) { setPostingError(errorText(e)) } finally { setPending(false) }
  }

  function exportCsv() {
    if (!operational || pending) return
    const blob = new Blob([buyInCsv(filtered, date)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `chip-buy-ins-${date}.csv`; link.click()
    URL.revokeObjectURL(url)
  }
  const unavailable = loading ? 'Loading…' : error ? 'Error — unavailable' : 'Unavailable'
  const cards = [
    ['Chip Buy-In — Business Date', totals ? money(totals.total) : unavailable],
    ['Chip Buy-In receipts only', totals ? `${totals.count} transactions` : unavailable],
    ['Cash Received — Chip Buy-In', totals ? money(totals.cash) : unavailable],
    ['Non-Cash Received — Chip Buy-In', totals ? money(totals.nonCash) : unavailable],
    ['Machine Cash-In', 'Unavailable'], ['Tips Collected', 'Unavailable'],
  ]

  return <div className="space-y-6"><PendingOperation allowed={writable} store={submission.current.store} retry={retryOriginal} changed={() => setPostingError('')} />

    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold">Cash Collection &amp; Buy-In</h1>
        <p className="text-slate-600">Persisted Chip Buy-In receipts · All cashiers</p>
        <p className="mt-2 font-semibold">Business Date: {loading ? 'Loading…' : date || 'Unavailable'} {date && '· OPEN'}</p>
      </div>
      <button className={buttonStyle} disabled={pending || loading} onClick={() => { if (!submission.current.pending) refreshScope() }}>Refresh Business Date</button>
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
    {!loading && !error && !date && <p role="status" className="rounded-lg bg-amber-50 p-4">No current OPEN Business Date. Posting and scoped export are unavailable.</p>}
    {success && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{success}</p>}
    {warning && <p role="alert" className="rounded-lg bg-amber-50 p-4 text-amber-900">{warning} Refresh the Business Date before continuing.</p>}
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">{cards.map(([label, value]) =>
      <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-600">{label}</p><p className="mt-3 text-lg font-bold">{value}</p></div>)}</div>
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex gap-2 border-b border-slate-200 pb-4" role="tablist" aria-label="Collection workflows">
        {[['CHIP_BUY_IN', 'Chip Buy-In'], ['MACHINE_CASH_IN', 'Machine Cash-In'], ['TIPS', 'Tips Collection']].map(([value, label]) =>
          <button key={value} role="tab" aria-selected={tab === value} disabled={pending} className={`${buttonStyle} ${tab === value ? 'bg-slate-900 text-white' : ''}`}
            onClick={() => { if (submission.current.pending) return; setTab(value); clearSelection(); setQuery('') }}>{label}</button>)}
      </div>
      {tab !== 'CHIP_BUY_IN' ? <div className="space-y-4 py-8"><p>{UNAVAILABLE_WORKFLOWS[tab]}</p><button className={buttonStyle} disabled>Posting unavailable</button></div>
        : !writable ? <p className="py-6 text-slate-600">View only. Chip Buy-In posting is restricted to CASHIER and SUPER_ADMIN.</p>
        : <form onSubmit={postBuyIn} className="space-y-5">
          {finalized && <p role="alert" className="text-amber-800">Your reconciliation is submitted. Posting is unavailable.</p>}
          <fieldset disabled={!operational || pending || finalized} className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="font-bold">1. Select and verify customer</h2>
              <label className="block text-sm">Search CID, name or phone<input className={`${inputStyle} mt-1`} value={query}
                onChange={(event) => { setQuery(event.target.value); clearSelection() }} placeholder="Search persisted customers" /></label>
              {query.trim() && <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
                {matches.length ? matches.map((customer) => <button type="button" key={customer.id} onClick={() => selectCustomer(customer)}
                  className={`block w-full border-b p-3 text-left text-sm hover:bg-slate-50 ${selected?.id === customer.id ? 'bg-yellow-50' : ''}`}>
                  {customer.customerCode} · {customer.fullName} · {customer.phone || 'Phone unavailable'} · {customer.status}
                </button>) : <p className="p-3 text-sm text-slate-500">No matching customers.</p>}
              </div>}
              {verifying && <p role="status">Verifying active Reception session…</p>}
              {verificationError && <p role="alert" className="text-red-700">{verificationError}</p>}
              {verified && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Verified: {selected.customerCode} · {selected.fullName}<br />OPEN and unexited · Business Date {verified.businessDate}</p>}
              <h2 className="pt-2 font-bold">2. Receive payment · NPR only</h2>
              <label className="block text-sm">Amount received (NPR)<input className={`${inputStyle} mt-1`} type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
              <label className="block text-sm">Payment method<select className={`${inputStyle} mt-1`} value={mode} onChange={(event) => setMode(event.target.value)}>{PAYMENT_MODES.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="block text-sm">Payment reference {mode === 'CASH' ? '(optional)' : '(required)'}<input className={`${inputStyle} mt-1`} maxLength={120} value={reference} onChange={(event) => setReference(event.target.value)} required={mode !== 'CASH'} /></label>
            </div>
            <div className="space-y-4"><h2 className="font-bold">3. Issue chips by denomination quantity</h2>
              {DENOMINATIONS.map((denomination) => <label key={denomination} className="flex items-center justify-between gap-4 text-sm"><span>{money(denomination)}</span>
                <input aria-label={`Quantity of NPR ${denomination}`} className={`${inputStyle} max-w-36`} type="number" min="0" step="1" value={quantities[denomination] ?? ''}
                  onChange={(event) => setQuantities((previous) => ({ ...previous, [denomination]: event.target.value === '' ? 0 : Number(event.target.value) }))} /></label>)}
              <div className="rounded-lg bg-slate-50 p-4"><p className="font-bold">Chip value: {total === null ? 'Invalid quantities' : money(total)}</p>
                <p className="mt-2 text-sm text-slate-600">Whole, non-negative quantities only. Amount received must equal issued chip value. The backend validates cage inventory and posting locks.</p></div>
              <p className="text-sm text-slate-500">INR / exchange-rate accounting is unavailable. Opening cash is not integrated on this page.</p>
            </div>
          </fieldset>
          {postingError && <p role="alert" className="text-red-700">{postingError}</p>}
          <button type="submit" disabled={!canSubmit} className={`${buttonStyle} bg-yellow-400 text-slate-950`}>{pending ? 'Confirming Buy-In…' : 'Post Chip Buy-In'}</button>
        </form>}
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Business Date Transactions</h2><p className="text-sm text-slate-500">All cashiers · Persisted Chip Buy-In receipts only{date && ` · ${date}`}</p></div>
        <div className="flex gap-2"><button className={buttonStyle} disabled={!operational || pending} onClick={exportCsv}>Export CSV</button><button className={buttonStyle} disabled title="Scoped print is unavailable in B1">Print unavailable</button><button className={buttonStyle} disabled title="PDF reporting is unavailable in B1">PDF unavailable</button></div></div>
      <div className="mb-4 flex gap-3"><input aria-label="Filter transactions" className={inputStyle} placeholder="Buy-In, CID, customer or reference" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1) }} />
        <select aria-label="Filter payment method" className={`${inputStyle} max-w-48`} value={modeFilter} onChange={(event) => { setModeFilter(event.target.value); setPage(1) }}><option value="ALL">All payments</option>{PAYMENT_MODES.map((value) => <option key={value}>{value}</option>)}</select></div>
      {!available ? <p className="py-6 text-slate-500">{unavailable} — Business Date history</p> : <>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500">{['Buy-In', 'Business Date / Timestamp', 'Customer', 'Payment', 'Reference', 'Received', 'Cashier'].map((label) => <th className="p-3" key={label}>{label}</th>)}</tr></thead>
          <tbody>{filtered.slice((visiblePage - 1) * 20, visiblePage * 20).map(({ transaction: tx, customerCode, customerName }) => <tr className="border-b" key={tx.id}>
            <td className="p-3 font-semibold">{tx.buyInCode}</td><td className="p-3">{tx.businessDate}<br /><span className="text-xs text-slate-500">{tx.createdAt.replace('T', ' ')}</span></td>
            <td className="p-3">{customerCode || 'Unavailable'}<br />{customerName || 'Unavailable'}</td><td className="p-3">{tx.paymentMode}</td><td className="p-3">{tx.paymentReference || '—'}</td><td className="p-3">{money(tx.amountReceived)}</td><td className="p-3">{tx.createdBy?.username || 'Unavailable'}</td>
          </tr>)}</tbody></table></div>
        {!filtered.length && <p className="py-6 text-center text-slate-500">No persisted Chip Buy-Ins match this Business Date and filter.</p>}
        <div className="mt-4 flex items-center justify-between"><span className="text-sm text-slate-500">{filtered.length} filtered records · Page {visiblePage} of {pageCount}</span><div className="flex gap-2"><button className={buttonStyle} disabled={visiblePage <= 1} onClick={() => setPage(visiblePage - 1)}>Previous</button><button className={buttonStyle} disabled={visiblePage >= pageCount} onClick={() => setPage(visiblePage + 1)}>Next</button></div></div>
      </>}
    </section>
  </div>
}
