import PendingOperation from '../../components/ui/PendingOperation'
import { useMemo, useEffect, useRef, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import useAuth from '../../hooks/useAuth'
import api from '../../api/cashOutApi'
import { DENOMINATIONS, requestGuard, money, recordedTime } from '../../utils/chipControl'
import { canPostCashOut, emptySelection, loadCashOutScope, postingAllowed, matchingCustomers,
  loadSelection, eligibilityPayload, returnWorkspace, freezeCashOut, freezeLosingReturn,
  createCashOutSubmission, payoutChanged } from '../../utils/cashOut'

const emptyForm = () => ({ paymentMode: 'CASH', paymentReference: '', remarks: '' })
const inputClass = 'mt-1 w-full rounded-md border border-slate-300 p-2 text-sm disabled:bg-slate-100'
const message = (error) => error?.response?.data?.message || error?.message || 'Authoritative data unavailable.'
const Stats = ({ rows }) => <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.map(([label, value]) => <div key={label} className="rounded-md bg-slate-50 p-3"><dt className="text-sm text-slate-600">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>

function History({ rows, kind, loading, error, customer, session }) {
  return <Card><h2 className="mb-3 text-lg font-semibold">Persisted {kind === 'cash' ? 'Cash-Out' : 'Losing Return'} history</h2>
    {loading ? <p role="status">Loading history…</p> : error ? <p role="alert">History unavailable: {error}</p>
      : rows === null ? <p>History unavailable. Verify a customer for the current Business Date.</p>
        : rows.length === 0 ? <p>No persisted transactions in this scope.</p>
          : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Transaction / date', 'Customer / session', 'Amount / policy', 'Payment / reference', 'Actor / recorded time'].map((h) => <th className="p-2" key={h}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="p-2"><span title={row.id}>{row[kind === 'cash' ? 'cashOutCode' : 'losingReturnCode']?.split('-').slice(0, 3).join('-')}</span><br />{row.businessDate}<details><summary>Audit reference</summary><span className="break-all">{row.id}</span>{kind === 'cash' && <p>Returned chips: {Object.entries(row.denominations || {}).map(([d,q]) => `${d} × ${q}`).join(', ')}</p>}</details></td>
              <td className="p-2">{row.customerCode || customer?.customerCode} · {row.customerName || customer?.fullName}<br /><span title={row.customerSessionId}>{row.sessionCode || session?.sessionCode || 'Session reference unavailable'}</span></td>
              <td className="p-2">{money(kind === 'cash' ? row.cashPaid : row.amountPaid)}{kind !== 'cash' && <p className="text-xs">Verified loss {money(row.eligibleVerifiedLoss)} · {Number(row.returnRate) * 100}%</p>}</td>
              <td className="p-2">{row.paymentMode || 'Unavailable'}<br />{row.paymentReference || '—'}</td>
              <td className="p-2">{row.createdBy?.username || row.actorUsername || 'Actor unavailable'}<br />{recordedTime(row.createdAt)}</td></tr>)}</tbody></table></div>}
  </Card>
}

export default function CashOut() {
  const { user } = useAuth()
  const role = user?.role
  const [tab, setTab] = useState('cash')
  const [scope, setScope] = useState(null)
  const [selection, setSelection] = useState(emptySelection)
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState(null)
  const [quantities, setQuantities] = useState({})
  const [form, setForm] = useState(emptyForm)
  const [returnRemarks, setReturnRemarks] = useState('')
  const [busy, setBusy] = useState({ scope: true, search: false, selection: false, eligibility: false, post: false })
  const [error, setError] = useState('')
  const [scopeError, setScopeError] = useState('')
  const [quoteError, setQuoteError] = useState('')
  const [warning, setWarning] = useState('')
  const [confirmed, setConfirmed] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const scopeGuard = useRef(requestGuard()), searchGuard = useRef(requestGuard()), selectionGuard = useRef(requestGuard()), quoteGuard = useRef(requestGuard())
  const operation = useMemo(() => ({ current: createCashOutSubmission(undefined, { actor: String(user?.id || user?.username || '') }) }), [user?.id, user?.username])
  const mounted = useRef(true)
  const locked = busy.post || Boolean(confirmation) || operation.current.uncertain
  const setLoading = (key, value) => setBusy((old) => ({ ...old, [key]: value }))

  const clearSelection = () => {
    selectionGuard.current.invalidate(); quoteGuard.current.invalidate()
    setSelection(emptySelection()); setQuantities({}); setForm(emptyForm()); setReturnRemarks('')
    setQuoteError(''); setLoading('selection', false); setLoading('eligibility', false)
    operation.current.cancel(); setConfirmation(null)
  }
  const refreshScope = async () => {
    if (operation.current.pending || operation.current.uncertain || operation.current.target) return
    const current = scopeGuard.current.next()
    searchGuard.current.invalidate(); clearSelection(); setMatches(null); setScope(null); setScopeError(''); setError('')
    setLoading('search', false); setLoading('scope', true)
    try { const next = await loadCashOutScope(api, role); if (current()) setScope(next) }
    catch (e) { if (current()) setScopeError(message(e)) }
    finally { if (current()) setLoading('scope', false) }
  }
  useEffect(() => {
    mounted.current = true
    refreshScope()
    return () => { mounted.current = false; scopeGuard.current.invalidate(); searchGuard.current.invalidate(); selectionGuard.current.invalidate(); quoteGuard.current.invalidate() }
  }, [role])

  const editQuery = (value) => {
    if (locked) return
    searchGuard.current.invalidate(); clearSelection(); setQuery(value); setMatches(null); setError(''); setLoading('search', false)
  }
  const search = async () => {
    if (locked || !scope?.date) return
    const current = searchGuard.current.next(); clearSelection(); setMatches(null); setError(''); setLoading('search', true)
    try {
      const rows = await api.getCustomers()
      if (!Array.isArray(rows) || rows.some((r) => !r?.id || !r.customerCode || !r.fullName)) throw new Error('Customer directory unavailable.')
      if (current()) setMatches(matchingCustomers(rows, query))
    } catch (e) { if (current()) setError(message(e)) }
    finally { if (current()) setLoading('search', false) }
  }
  const verify = async (customer) => {
    if (locked || !scope?.date) return
    clearSelection(); searchGuard.current.invalidate(); setLoading('search', false)
    const current = selectionGuard.current.next(); setLoading('selection', true); setError('')
    try { const value = await loadSelection(api, customer, scope.date); if (current()) setSelection(value) }
    catch (e) { if (current()) setError(message(e)) }
    finally { if (current()) setLoading('selection', false) }
  }
  const calculate = async () => {
    if (locked || !selection.session || !scope?.date) return
    const current = quoteGuard.current.next()
    const customerId = selection.customer.id, sessionId = selection.session.id, date = scope.date
    setSelection((old) => ({ ...old, eligibility: null })); setQuoteError(''); setLoading('eligibility', true)
    try {
      const value = eligibilityPayload(await api.getLosingReturnEligibility(customerId), customerId, sessionId, date)
      if (current()) setSelection((old) => ({ ...old, eligibility: value }))
    } catch (e) { if (current()) setQuoteError(message(e)) }
    finally { if (current()) setLoading('eligibility', false) }
  }
  const prepare = () => {
    if (locked || !postingAllowed(role, scope) || busy.selection || busy.eligibility) return
    setError('')
    try {
      const target = tab === 'cash' ? freezeCashOut(selection, scope, quantities, form) : freezeLosingReturn(selection, scope, returnRemarks)
      setConfirmation(operation.current.prepare(target))
    } catch (e) { setError(message(e)) }
  }
  const confirm = async () => {
    if (operation.current.pending || !canPostCashOut(role)) return
    setLoading('post', true); setError(''); setWarning('')
    try {
      await operation.current.run({
        preflight: async (target) => {
          const latest = await loadCashOutScope(api, role)
          if (latest.date !== target.date || !postingAllowed(role, latest)) throw new Error('Business Date, reconciliation or System Lock no longer permits posting. Refresh authoritative data.')
        },
        post: (target) => target.kind === 'cash' ? api.createCashOut(target.payload) : api.createLosingReturn(target.payload),
        success: (result, target) => {
          if (!mounted.current) return
          setConfirmed({ result, target, changed: payoutChanged(result, target) }); setConfirmation(null)
          setQuantities({}); setForm(emptyForm()); setReturnRemarks(''); setSelection(emptySelection())
        },
        refresh: async (target) => {
          const current = selectionGuard.current.next(); quoteGuard.current.invalidate()
          const nextScope = await loadCashOutScope(api, role)
          if (nextScope.date !== target.date) throw new Error('Business Date changed.')
          const next = await loadSelection(api, selection.customer, target.date)
          if (current() && mounted.current) { setScope(nextScope); setSelection(next) }
          if (Object.keys(next.errors).length) throw new Error('Some authoritative reads failed.')
        },
        warning: (value) => { if (mounted.current) setWarning(value) },
      })
    } catch (e) { if (mounted.current) setError(message(e)) }
    finally { if (mounted.current) setLoading('post', false) }
  }
  let workspace = null, workspaceError = ''
  try { if (selection.financial && selection.custody) workspace = returnWorkspace(quantities, selection.financial, selection.custody) }
  catch (e) { workspaceError = message(e) }
  const ready = postingAllowed(role, scope) && !busy.scope && !busy.selection && !busy.eligibility && !locked
  const quote = selection.eligibility
  const blockedReason = !canPostCashOut(role) ? 'Director view only. Only Cashier and Super Admin can post.'
    : !scope?.date ? 'Business Date unavailable. Posting disabled.'
      : !postingAllowed(role, scope) ? 'Posting disabled: authoritative reconciliation or operational status is unavailable, submitted or locked.'
        : !selection.session ? 'Select and verify an active customer session before posting.'
          : !selection.financial || !selection.custody ? 'Financial position or physical custody unavailable. Posting disabled.' : ''

  return <div className="space-y-5">
    <PendingOperation allowed={canPostCashOut(role)} store={operation.current.store} retry={confirm} changed={() => { setConfirmation(null); setError(''); refreshScope() }} />
      <PageHeader title="Cash-Out & Losing Return" description="Authoritative settlement control" />
    <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">Business Date: {scope?.date || 'Unavailable'}</p><p className="text-sm">{busy.scope ? 'Loading operational prerequisites…' : scope?.status ? `${scope.status.businessDateHealth} · ${scope.status.systemLocked ? 'System locked' : 'Settlement status loaded'}` : 'Operational status unavailable'}</p>
      <p className="text-sm">Reconciliation: {canPostCashOut(role) ? scope?.reconciliation?.lifecycleStatus || 'Unavailable' : 'Operator-specific prerequisite checked when posting'}</p></div>
      <Button variant="outline" disabled={locked || busy.scope} onClick={refreshScope}>Refresh authoritative data</Button></div>
      {scopeError && <p role="alert" className="mt-2 text-red-700">{scopeError}</p>}
      {blockedReason && <p className="mt-2 text-amber-800">{blockedReason}</p>}
    </Card>
    <div role="status" aria-live="polite">{busy.selection && 'Verifying session, financial position, physical custody and history…'}{busy.eligibility && 'Recalculating Losing Return quote…'}</div>
    {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800">{error}</p>}
    {confirmed && <Card><p role="status" className="font-semibold text-green-800">{confirmed.target.kind === 'cash' ? 'Cash-Out' : 'Losing Return'} SUCCESSFUL — {confirmed.target.customerName} · Business Date {confirmed.result?.businessDate || confirmed.target.date}</p>
      <p>Persisted payout: {money(confirmed.result?.cashPaid ?? confirmed.result?.amountPaid)} · {confirmed.result?.cashOutCode || confirmed.result?.losingReturnCode || 'Transaction confirmed; details unavailable. Do not repost.'}</p>
      {confirmed.changed && <p>Eligibility was recalculated before posting. The actual persisted payout above differs from the earlier quote of {money(confirmed.target.quote)}.</p>}
    </Card>}
    {warning && <p role="alert" className="rounded-md bg-amber-50 p-3">{warning}</p>}
    <Card><h2 className="mb-3 text-lg font-semibold">Customer verification</h2><div className="flex items-end gap-3"><label className="flex-1 text-sm">Customer code, name or phone<input className={inputClass} value={query} disabled={locked || busy.scope || !scope?.date} onChange={(e) => editQuery(e.target.value)} /></label>
      <Button onClick={search} disabled={locked || busy.search || busy.scope || !scope?.date || !query.trim()}>{busy.search ? 'Searching…' : 'Search'}</Button></div>
      {matches?.length === 0 && <p>No matching customers.</p>}
      {matches?.map((customer) => <button type="button" key={customer.id} disabled={locked} className="mt-2 block w-full rounded border p-3 text-left disabled:opacity-50" onClick={() => verify(customer)}>{customer.customerCode} · {customer.fullName} · {customer.status}</button>)}
      {selection.customer && <p className="mt-3 font-semibold">{selection.customer.customerCode} · {selection.customer.fullName} · Session <span title={selection.session.id}>{selection.session.sessionCode || 'Reference unavailable'}</span> · Business Date {selection.session.businessDate}</p>}
    </Card>
    <div className="flex gap-2" aria-label="Settlement workflow">{[['cash','Cash-Out'], ['return','Losing Return']].map(([id,label]) => <Button key={id} variant={tab === id ? 'primary' : 'outline'} disabled={locked} onClick={() => setTab(id)}>{label}</Button>)}</div>
    {tab === 'cash' ? <>
      <Card><h2 className="mb-3 text-lg font-semibold">Financial position</h2><Stats rows={[
        ['Total Buy-In', money(selection.financial?.totalBuyIn)], ['Verified wins', money(selection.financial?.verifiedGamingWin)],
        ['Verified losses', money(selection.financial?.verifiedGamingLoss)], ['Previous Cash-Outs', money(selection.financial?.totalCashOut)],
        ['Financial position', money(selection.financial?.calculatedChipPosition)], ['Available financial Cash-Out', money(selection.financial ? Math.max(Number(selection.financial.calculatedChipPosition), 0) : null)],
      ]} />{selection.errors?.financial && <p role="alert">{selection.errors.financial}</p>}</Card>
      <Card><h2 className="mb-2 text-lg font-semibold">Physical chip custody & return workspace</h2><p className="mb-3 text-sm">Financial entitlement and physical chips are separate authoritative measures. Partial Cash-Out is supported. Cash-Out does not close the customer visit/session.</p>
        {selection.errors?.custody && <p role="alert">{selection.errors.custody}</p>}
        <div className="grid gap-3 sm:grid-cols-5">{DENOMINATIONS.map((d) => <label key={d} className="text-sm">NPR {d.toLocaleString()}<span className="block text-slate-600">In custody: {selection.custody?.denominations[d] ?? 'Unavailable'}</span><input aria-label={`Return quantity for NPR ${d}`} className={inputClass} type="number" min="0" step="1" max={selection.custody?.denominations[d]} value={quantities[d] ?? ''} disabled={!ready || !selection.custody || !selection.financial} onChange={(e) => setQuantities((old) => ({ ...old, [d]: e.target.value }))} /></label>)}</div>
        <div className="mt-4"><Stats rows={[
          ['Physical custody total', money(selection.custody?.totalValue)], ['Returned chip total / payout', money(workspace?.total)],
          ['Remaining financial position', money(workspace?.financialRemaining)], ['Remaining physical custody', money(workspace?.physicalRemaining)],
        ]} /></div>{workspaceError && <p role="alert" className="mt-2 text-red-700">{workspaceError}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-3"><label>Payment method<select className={inputClass} value={form.paymentMode} disabled={!ready} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>{['CASH','BANK','QR','CARD'].map((mode) => <option key={mode}>{mode}</option>)}</select></label><label>Reference {form.paymentMode !== 'CASH' && '(required)'}<input className={inputClass} maxLength={150} disabled={!ready} value={form.paymentReference} onChange={(e) => setForm({ ...form, paymentReference: e.target.value })} /></label><label>Remarks<input className={inputClass} maxLength={500} disabled={!ready} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></label></div>
        <Button className="mt-4" onClick={prepare} disabled={!ready || !workspace || workspace.total <= 0}>Review Cash-Out</Button>
      </Card>
      <History kind="cash" rows={selection.cashHistory} loading={busy.selection || busy.post} error={selection.errors?.cashHistory} customer={selection.customer} session={selection.session} />
    </> : <>
      <Card><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Losing Return eligibility quote</h2><Button variant="outline" onClick={calculate} disabled={locked || busy.selection || busy.eligibility || !selection.session}>Calculate eligibility</Button></div>
        <p className="mb-3">Customer {selection.customer?.customerCode || 'unavailable'} · Business Date {scope?.date || 'Unavailable'}. Customer/date totals include all visits for that date. Eligibility is a quote; POST recalculates the payout.</p>
        {quoteError && <p role="alert">{quoteError}</p>}
        <Stats rows={[
          ['Total Buy-Ins', money(quote?.totalBuyIn)], ['Verified wins', money(quote?.verifiedWins)], ['Verified losses', money(quote?.verifiedLosses)],
          ['Previous Cash-Outs', money(quote?.previousCashOuts)], ['Previous Losing Returns', money(quote?.previousLosingReturns)],
          ['Net eligible verified loss', money(quote?.eligibleVerifiedLoss)], ['Minimum required loss', money(quote?.minimumEligibleLoss)],
          ['Return rate', quote ? `${Number(quote.returnRate) * 100}%` : 'Unavailable'],
          ['Available return', quote?.alreadyPaid ? 'Unavailable for further payout — already paid' : money(quote?.availableReturnAmount)],
        ]} />
        <p className="my-3 font-semibold">{quote?.alreadyPaid ? 'RETURN ALREADY PAID FOR THIS BUSINESS DATE' : quote ? quote.eligible ? 'Eligible' : 'Not eligible' : 'Eligibility unavailable — calculate before posting'}</p>
        <p>{quote?.eligibilityReason}</p><p className="mt-2 text-sm">Net loss = max(verified losses − verified wins, 0). Minimum NPR 20,000; 10% rounded half up to 2 decimals, less previous payouts. One payout per customer per Business Date. Losing Return does not change chip custody or close the visit.</p>
        <label className="mt-3 block">Remarks<input className={inputClass} maxLength={1000} disabled={!ready} value={returnRemarks} onChange={(e) => setReturnRemarks(e.target.value)} /></label>
        <Button className="mt-3" disabled={!ready || !selection.financial || !selection.custody || !quote?.eligible || quote.alreadyPaid} onClick={prepare}>Review Losing Return</Button>
      </Card>
      <History kind="return" rows={selection.returnHistory} loading={busy.selection || busy.post} error={selection.errors?.returnHistory} customer={selection.customer} session={selection.session} />
    </>}
    {operation.current.uncertain && <p role="alert">Outcome uncertain: the original transaction is saved for explicit recovery after reload or navigation.</p>}
    <ConfirmDialog isOpen={Boolean(confirmation)} title={confirmation?.kind === 'cash' ? 'Confirm Cash-Out' : 'Confirm Losing Return'}
      description={confirmation ? `${confirmation.customerName} · Business Date ${confirmation.date} · ${money(confirmation.kind === 'cash' ? confirmation.payload.cashPaid : confirmation.quote)}. ${confirmation.kind === 'return' ? 'The backend recalculates and returns the actual payout.' : 'This does not close the visit.'} ${operation.current.uncertain ? 'Retry uses the same transaction reference.' : ''}` : ''}
      confirmLabel={operation.current.uncertain ? 'Retry unchanged transaction' : 'Post transaction'} isLoading={busy.post} onConfirm={confirm}
      onCancel={() => { if (!operation.current.uncertain) { operation.current.cancel(); setConfirmation(null) } }} cancelLabel={operation.current.uncertain ? 'Outcome unconfirmed' : 'Cancel'} />
  </div>
}
