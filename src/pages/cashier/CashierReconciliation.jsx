import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../../api/reconciliationApi'
import useAuth from '../../hooks/useAuth'
import { lifecycleAllows } from '../../utils/chipControl'
import { NOTES, emptyCounts, money, recordedTime, canOperate, canManage, lifecycleLabel, resultLabel,
  CASH_PAID_DETAIL, noteCount, openingAmount, reconciliation, opening, loadReconciliation, ready,
  resetDraft, frozenCount, requestGuard, createReconciliationSubmission } from '../../utils/cashierReconciliation'

const errorText = (e) => e?.response?.data?.message || e?.message || 'Authoritative data unavailable.'
const field = 'mt-2 w-full rounded-lg border border-slate-300 p-3 disabled:bg-slate-100'
const button = 'rounded-lg border border-slate-300 px-4 py-2 font-semibold disabled:opacity-50'
const Summary = ({ label, value, detail }) => <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-600">{label}</p><p className="mt-2 text-xl font-bold">{value}</p>{detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}</article>
const Tender = ({ title, values, cashOnly = false }) => <section className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="font-bold">{title}</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{(cashOnly ? ['CASH'] : ['CASH','BANK','CARD','QR']).map((mode) => <div className="rounded bg-slate-50 p-3" key={mode}><p className="text-xs font-bold">{mode}</p><p>{money(values?.[mode]?.amount)}</p><p className="text-xs">{values?.[mode]?.count ?? 'Unavailable'} transaction(s)</p></div>)}</div></section>

export default function CashierReconciliation() {
  const { user } = useAuth()
  const role = user?.role, username = user?.username
  const [scope, setScope] = useState(null), [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState(emptyCounts), [remarks, setRemarks] = useState('')
  const [openingInput, setOpeningInput] = useState(''), [preview, setPreview] = useState(null)
  const [reviewed, setReviewed] = useState(false), [working, setWorking] = useState(false)
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [success, setSuccess] = useState(null)
  const [warning, setWarning] = useState(''), [reopenReasons, setReopenReasons] = useState({})
  const loadGuard = useRef(requestGuard()), previewGuard = useRef(requestGuard())
  const lastScope = useRef(null), busy = useRef(false), mounted = useRef(true)
  const submission = useRef(createReconciliationSubmission())

  const load = useCallback(async (force = false) => {
    if (!force && (busy.current || submission.current.pending || submission.current.uncertain)) return
    const current = loadGuard.current.next(); previewGuard.current.invalidate()
    setLoading(true); setScope(null); setPreview(null); setError('')
    try {
      const next = await loadReconciliation(api, role, username)
      if (!current() || !mounted.current) return
      if (resetDraft(lastScope.current, next)) {
        setCounts(emptyCounts()); setRemarks(''); setReviewed(false); setOpeningInput(''); setReopenReasons({})
        if (lastScope.current?.date && lastScope.current.date !== next.date) setNotice('Business Date changed. Previous counts and preview were discarded. Recount and review for the new date.')
        else if (lastScope.current?.record?.lifecycleStatus !== next.record?.lifecycleStatus) setNotice('Reconciliation state changed. Review the current record and recount before a new submission.')
      }
      lastScope.current = next; setScope(next)
      if (Object.keys(next.errors).length || !next.date) {
        setReviewed(false); setCounts(emptyCounts()); setRemarks('')
        setNotice('Some authoritative prerequisites are unavailable. Refresh and review the count before posting.')
      }
      if (force && (Object.keys(next.errors).length || !next.date)) throw new Error('Authoritative refresh incomplete.')
      return next
    } catch (e) {
      if (current() && mounted.current) {
        setScope(null); setCounts(emptyCounts()); setRemarks(''); setReviewed(false); setError(errorText(e))
      }
      if (force) throw e
    } finally { if (current() && mounted.current) setLoading(false) }
  }, [role, username])

  useEffect(() => {
    mounted.current = true; load()
    const focus = () => load(), interval = setInterval(focus, 45000)
    window.addEventListener('focus', focus)
    return () => { mounted.current = false; clearInterval(interval); window.removeEventListener('focus', focus); loadGuard.current.invalidate(); previewGuard.current.invalidate() }
  }, [load])

  const record = scope?.record, shown = preview || record
  const uncertain = submission.current.uncertain
  const controlsLocked = loading || working || uncertain
  const operational = ready(scope, role) && !controlsLocked
  const submitted = record?.lifecycleStatus === 'SUBMITTED'
  const snapshot = shown?.calculationBasis?.endsWith('SNAPSHOT')
  let countTotal = null
  try { countTotal = noteCount(counts).total } catch { /* Invalid input is not a zero. */ }
  const editCount = (note, raw) => {
    if (controlsLocked || submitted) return
    try {
      noteCount({ [note]: raw })
      previewGuard.current.invalidate(); setPreview(null); setReviewed(false)
      setCounts((old) => ({ ...old, [note]: raw })); setError(''); setNotice('Count changed. Any previous calculation is invalid; calculate again and review.')
    } catch (e) { setError(errorText(e)) }
  }
  const preflight = async (date, settlement = true) => {
    const latest = await loadReconciliation(api, role, username)
    if (latest.date !== date) {
      loadGuard.current.invalidate(); previewGuard.current.invalidate()
      setScope(null); setCounts(emptyCounts()); setRemarks(''); setPreview(null); setReviewed(false)
      setNotice('Business Date changed. Refresh and recount; the old count was not submitted.')
      throw new Error('Business Date changed. Refresh before continuing.')
    }
    if (!ready(latest, role, settlement)) throw new Error('Posting unavailable: check lifecycle, System Lock, reconciliation state and authoritative prerequisites.')
    return latest
  }
  const calculate = async () => {
    if (busy.current || submission.current.pending || !operational || !scope.opening) return
    busy.current = true; setWorking(true); setError('')
    const current = previewGuard.current.next()
    try {
      const target = frozenCount(scope.date, counts, remarks, crypto.randomUUID())
      await preflight(target.expectedBusinessDate)
      const value = reconciliation(await api.preview(target), target.expectedBusinessDate)
      if (value.calculationBasis !== 'PREVIEW') throw new Error('Preview response unavailable.')
      if (current() && mounted.current) setPreview(value)
    } catch (e) { if (current() && mounted.current) { setPreview(null); setError(errorText(e)) } }
    finally { busy.current = false; if (mounted.current) setWorking(false) }
  }
  const submit = async () => {
    if (busy.current || submission.current.pending || !canOperate(role)) return
    if (!uncertain && (!operational || !scope.opening || !reviewed)) return
    busy.current = true; setWorking(true); setError(''); setWarning('')
    try {
      await submission.current.run({ date: scope?.date, counts, remarks }, {
        preflight: (target) => preflight(target.expectedBusinessDate), post: api.submit,
        success: (value) => { if (mounted.current) { setSuccess({ title: 'Reconciliation Submitted', value }); setPreview(null); setReviewed(false) } },
        refresh: () => load(true), warning: (text) => { if (mounted.current) setWarning(text) },
      })
    } catch (e) {
      if (mounted.current) {
        setError(errorText(e))
        if (!submission.current.uncertain) { setScope(null); setPreview(null); setCounts(emptyCounts()); setReviewed(false) }
      }
    }
    finally { busy.current = false; if (mounted.current) setWorking(false) }
  }
  const establish = async () => {
    if (busy.current || submission.current.pending || !ready(scope, role, false) || controlsLocked || scope.opening) return
    let amount
    try { amount = openingAmount(openingInput) } catch (e) { setError(errorText(e)); return }
    if (!window.confirm(`Establish NPR ${amount} for your account on Business Date ${scope.date}? This can only be set once, before financial activity.`)) return
    busy.current = true; setWorking(true); setError(''); setWarning('')
    let confirmed = false
    try {
      const target = Object.freeze({ openingCashAmount: amount, expectedBusinessDate: scope.date })
      await preflight(target.expectedBusinessDate, false)
      const value = await api.establish(target); confirmed = true
      setSuccess({ title: 'Opening Cash established', value: { businessDate: target.expectedBusinessDate } }); setOpeningInput('')
      try { opening(value, target.expectedBusinessDate); if (!value) throw new Error() }
      catch { setWarning('Opening Cash creation confirmed; response details unavailable. Refresh to verify. Do not create it again.') }
      try { await load(true) } catch { setWarning('Opening Cash established, but refresh failed. Refresh to verify; do not create it again.') }
    } catch (e) {
      if (!confirmed) { setError(`${errorText(e)} Refresh before retrying; an uncertain opening request may already have been saved.`); setScope(null); setReviewed(false) }
    } finally { busy.current = false; if (mounted.current) setWorking(false) }
  }
  const reopen = async (row) => {
    if (busy.current || controlsLocked || !canManage(role) || row.lifecycleStatus !== 'SUBMITTED') return
    const reason = reopenReasons[row.id]?.trim()
    if (!reason) { setError('A reopen reason is required.'); return }
    if (!window.confirm(`Reopen ${row.cashierUsername}'s submitted reconciliation for ${row.businessDate}?`)) return
    busy.current = true; setWorking(true); setError(''); setWarning('')
    let confirmed = false
    try {
      const latest = await loadReconciliation(api, role, username)
      if (latest.date !== row.businessDate || !lifecycleAllows(latest.status, true)) throw new Error('Business Date/status changed. Refresh before reopening.')
      const value = await api.reopen(row.id, reason)
      // The transport succeeded: never report a later read failure as a failed reopen.
      confirmed = true
      setSuccess({ title: 'Reopen request accepted', value: { businessDate: row.businessDate } })
      try { reconciliation(value, row.businessDate); if (value.lifecycleStatus !== 'REOPENED') throw new Error() }
      catch { setWarning('Reopen response could not be verified. Refresh before attempting another action.') }
      try { await load(true) } catch { setWarning('Reopen request accepted; refresh failed. Refresh to verify current lifecycle.') }
    } catch (e) { if (!confirmed) { setError(errorText(e)); setScope(null) } }
    finally { busy.current = false; if (mounted.current) setWorking(false) }
  }

  return <div className="space-y-5">
    <header className="rounded-2xl bg-slate-950 p-5 text-white"><p className="text-xs font-bold uppercase text-amber-300">Cashier Operations</p><h1 className="text-3xl font-bold">Cashier Reconciliation</h1>
      <p className="mt-2">Business Date: {scope?.date || 'Unavailable'} · {canOperate(role) ? `Own cashier account: ${record?.cashierName || record?.cashierUsername || username || 'Unavailable'}` : 'Management review'}</p>
      <p className="mt-2">{scope?.status ? `${scope.status.businessDateHealth} · ${scope.status.systemLocked ? 'System Locked' : 'Backend status verified'}` : 'Operational status unavailable'}</p>
      {canOperate(role) && <p>{lifecycleLabel(record?.lifecycleStatus)} · Result: {resultLabel(shown?.status)}</p>}
    </header>
    <div className="flex items-center gap-3"><button className={button} disabled={controlsLocked} onClick={() => load()}>Refresh authoritative data</button><span role="status" aria-live="polite">{loading ? 'Loading authoritative prerequisites…' : working ? 'Processing frozen request…' : 'Date revalidated on focus and every 45 seconds.'}</span></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-blue-50 p-3">{notice}</p>}
    {scope && Object.entries(scope.errors).map(([key,text]) => <p role="alert" key={key}>{key} unavailable: {text}</p>)}
    {success && <section role="status" className="rounded-xl bg-green-50 p-4"><strong>{success.title}</strong><p>Business Date {success.value.businessDate}{success.value.lifecycleStatus === 'SUBMITTED' && ` · ${resultLabel(success.value.status)} · Actual ${money(success.value.actualClosingCash)} · Variance ${money(success.value.variance)}`}</p></section>}
    {warning && <p role="alert" className="rounded bg-amber-50 p-3">{warning}</p>}
    {uncertain && <section className="rounded-lg border border-amber-400 p-4"><p role="alert">Submission outcome unconfirmed. Keep this page open. Your frozen date, count and reference are retained; edits are disabled.</p><button className={button} disabled={working} onClick={submit}>Retry unchanged submission</button></section>}

    {canOperate(role) && <>
      <p className="rounded-xl bg-slate-100 p-4 font-semibold">Opening Cash + CASH Received − CASH Paid = Expected Closing<br />Actual Physical Cash − Expected Closing = Variance</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Summary label="Opening Cash" value={money(shown?.openingCash)} detail={scope?.opening ? 'Persisted set-once balance' : 'Not established / unavailable'} />
        <Summary label="Cash Received" value={money(shown?.physicalCashReceived)} detail="CASH Buy-Ins only" />
        <Summary label="Cash Paid" value={money(shown?.physicalCashPaid)} detail={CASH_PAID_DETAIL} />
        <Summary label="Expected Closing" value={money(shown?.expectedClosingCash)} />
        <Summary label="Actual Closing" value={money(shown?.actualClosingCash)} detail={preview ? 'Backend preview' : snapshot ? 'Saved submission' : 'Calculate after counting'} />
        <Summary label="Variance" value={money(shown?.variance)} detail={resultLabel(shown?.status)} />
      </div>
      {snapshot ? <p className="rounded bg-amber-50 p-3">Saved submission values. Tender totals were not stored with this submission and are unavailable in this review; they are not reconstructed from later activity.</p>
        : <><p className="text-sm text-slate-600">Tender summaries are informational. BANK, CARD and QR do not affect physical Expected Closing.</p><div className="grid gap-4 xl:grid-cols-3"><Tender title="Buy-In tender summary" values={shown?.buyInTenders} /><Tender title="Cash-Out tender summary" values={shown?.cashOutTenders} /><Tender title="Losing Return — CASH payouts only" values={shown?.losingReturnTenders} cashOnly /></div></>}
      {record && !scope.errors.opening && !scope.opening && !submitted && <section className="rounded-xl border border-amber-300 bg-amber-50 p-5"><h2 className="text-xl font-bold">Establish Opening Cash</h2><p>Set once for your account and this Business Date, before any Buy-In, Cash-Out or Losing Return. Financial activity already posted prevents establishment; RC1 does not provide a correction override.</p><label className="mt-3 block">Opening Cash (NPR)<input className={field} inputMode="decimal" value={openingInput} disabled={controlsLocked || !ready(scope, role, false)} onChange={(e) => setOpeningInput(e.target.value)} /></label><button className={`${button} mt-3`} disabled={controlsLocked || !ready(scope, role, false)} onClick={establish}>Set Opening Cash</button>{!ready(scope, role, false) && <p>New-operation lifecycle or System Lock prerequisites do not permit establishing Opening Cash.</p>}</section>}
      <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold">Actual physical note count</h2><p>Local counting aid: {money(countTotal)}. The backend independently recalculates Actual Closing and Variance.</p>
        {submitted ? <p className="mt-3">Saved notes: {Object.entries(record.denominations).map(([n,q]) => `NPR ${n} × ${q}`).join(', ') || 'Authoritative zero notes'}</p>
          : <div className="mt-4 grid gap-3 sm:grid-cols-4 xl:grid-cols-7">{NOTES.map((n) => <label key={n}>NPR {n.toLocaleString()}<input aria-label={`NPR ${n} note quantity`} className={field} type="number" min="0" max="2147483647" step="1" value={counts[n] ?? 0} disabled={controlsLocked || !record} onChange={(e) => editCount(n, e.target.value)} /></label>)}</div>}
        <label className="mt-4 block">Remarks<input className={field} maxLength={1000} value={remarks} disabled={controlsLocked || submitted || !record} onChange={(e) => { previewGuard.current.invalidate(); setPreview(null); setReviewed(false); setRemarks(e.target.value) }} /></label>
        {preview && <p role="status" className="mt-3">Backend preview only. Submit recalculates current transaction totals.</p>}
        {!submitted && <label className="my-4 flex gap-2"><input type="checkbox" checked={reviewed} disabled={controlsLocked || !record} onChange={(e) => setReviewed(e.target.checked)} />I reviewed this physical count for Business Date {scope?.date || 'Unavailable'}.</label>}
        <div className="mt-4 flex flex-wrap gap-3"><button className={button} disabled={!operational || !scope?.opening} onClick={calculate}>Calculate preview</button><button className={`${button} bg-amber-400`} disabled={!operational || !scope?.opening || !reviewed || countTotal === null} onClick={submit}>Submit Reconciliation</button></div>
        {!operational && <p className="mt-2 text-sm">Posting disabled while prerequisites are unavailable, the System is locked, a request is pending, or reconciliation is Submitted.</p>}
      </section>
    </>}

    {canManage(role) && <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold">Current Business Date management review</h2><p className="text-sm">Saved last-submission figures for each cashier. Reopened rows retain those saved review figures; the cashier must recount against live totals. No approval/rejection workflow.</p>
      {loading ? <p role="status">Loading management records…</p> : scope?.management == null ? <p>Management records unavailable.</p> : scope.management.length === 0 ? <p>No persisted reconciliations for this Business Date.</p>
        : <div className="mt-4 space-y-4">{scope.management.map((row) => <article key={row.id} className="rounded-lg border p-4"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-bold">{row.cashierName || row.cashierUsername} · {row.businessDate}</h3><p>{lifecycleLabel(row.lifecycleStatus)} · {resultLabel(row.status)}</p></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4"><p>Opening: {money(row.openingCash)}</p><p>Expected: {money(row.expectedClosingCash)}</p><p>Actual: {money(row.actualClosingCash)}</p><p>Variance: {money(row.variance)}</p></div>
          <p className="mt-2 text-sm">Submitted: {recordedTime(row.submittedAt)}</p>{row.reopenedAt && <p className="text-sm">Reopened: {recordedTime(row.reopenedAt)} · Reason: {row.reopenReason || 'Unavailable'}</p>}
          <details className="mt-2 text-sm"><summary>Saved note count and reference</summary><p>{Object.entries(row.denominations).map(([n,q]) => `NPR ${n} × ${q}`).join(', ') || 'Zero notes'}</p><p>Remarks: {row.remarks || '—'}</p><p className="break-all">{row.id}</p></details>
          {row.lifecycleStatus === 'SUBMITTED' && <div className="mt-3"><label>Required reopen reason<input className={field} maxLength={1000} disabled={controlsLocked} value={reopenReasons[row.id] || ''} onChange={(e) => setReopenReasons((old) => ({ ...old, [row.id]: e.target.value }))} /></label><button className={`${button} mt-2`} disabled={controlsLocked || !lifecycleAllows(scope.status, true)} onClick={() => reopen(row)}>Reopen Reconciliation</button></div>}
        </article>)}</div>}
    </section>}
    <p className="text-xs text-slate-600">Excluded: machine cash-in, tips, expenses, deposits and manual cash adjustments. No authoritative persisted cashier cash source for these is integrated.</p>
  </div>
}
