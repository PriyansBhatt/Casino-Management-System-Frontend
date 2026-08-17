import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import cashierApi from '../../api/cashierApi'
import { ROLES } from '../../constants/roles'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useToast from '../../hooks/useToast'

const DENOMINATIONS = [1000, 500, 100, 50, 20, 10, 5]
const emptyCounts = Object.fromEntries(DENOMINATIONS.map((value) => [value, 0]))
const money = (value) => value == null ? 'Unavailable' : `NPR ${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const errorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback
const newKey = () => globalThis.crypto?.randomUUID?.() || `reconciliation-${Date.now()}-${Math.random()}`

const SummaryCard = ({ label, value, detail }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
    <p className="mt-3 font-serif text-xl font-black text-slate-950">{value}</p>
    {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
  </article>
)

const TenderCard = ({ title, tenders = {} }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="font-serif text-xl font-black text-slate-950">{title}</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {['CASH', 'BANK', 'CARD', 'QR'].map((mode) => (
        <div key={mode} className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-black tracking-wider text-slate-500">{mode}</p>
          <p className="mt-1 font-bold text-slate-900">{money(tenders[mode]?.amount ?? 0)}</p>
          <p className="text-xs text-slate-500">{tenders[mode]?.count ?? 0} transaction(s)</p>
        </div>
      ))}
    </div>
  </section>
)

const CashierReconciliation = () => {
  const { user } = useAuth()
  const { isSystemLocked } = useBusinessStatus()
  const { showToast } = useToast()
  const [record, setRecord] = useState(null)
  const [openingCash, setOpeningCash] = useState('')
  const [denominations, setDenominations] = useState(emptyCounts)
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [reviewRecords, setReviewRecords] = useState([])
  const keyRef = useRef(newKey())
  const submitted = record?.lifecycleStatus === 'SUBMITTED'
  const canReopen = user?.role === ROLES.DIRECTOR || user?.role === ROLES.SUPER_ADMIN
  const canSubmit = user?.role === ROLES.CASHIER || user?.role === ROLES.SUPER_ADMIN
  const actualCount = useMemo(() => DENOMINATIONS.reduce((sum, value) => sum + value * Number(denominations[value] || 0), 0), [denominations])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await cashierApi.getCurrentCashierReconciliation()
      setRecord(data)
      if (data?.id) {
        setOpeningCash(String(data.openingCash ?? ''))
        setDenominations({ ...emptyCounts, ...(data.denominations || {}) })
        setRemarks(data.remarks || '')
      }
      if (user?.role === ROLES.DIRECTOR || user?.role === ROLES.SUPER_ADMIN) {
        setReviewRecords(await cashierApi.getSubmittedCashierReconciliations())
      }
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to load cashier reconciliation.'))
    } finally {
      setLoading(false)
    }
  }, [user?.role])

  useEffect(() => { load() }, [load])

  const changeCount = (denomination, rawValue) => {
    const quantity = rawValue === '' ? 0 : Number(rawValue)
    if (!Number.isInteger(quantity) || quantity < 0) return
    setDenominations((current) => ({ ...current, [denomination]: quantity }))
    setRecord((current) => current?.id ? current : { ...current, expectedClosingCash: null, variance: null })
    keyRef.current = newKey()
  }

  const payload = () => ({ openingCash: Number(openingCash), denominations, remarks: remarks.trim() || null, idempotencyKey: keyRef.current })
  const validate = () => {
    if (openingCash === '' || !Number.isFinite(Number(openingCash)) || Number(openingCash) < 0) {
      setError('Enter a valid opening cash amount.')
      return false
    }
    return true
  }
  const preview = async () => {
    if (!validate()) return
    setWorking(true); setError('')
    try { setRecord(await cashierApi.previewCashierReconciliation(payload())) }
    catch (requestError) { setError(errorMessage(requestError, 'Unable to calculate reconciliation.')) }
    finally { setWorking(false) }
  }
  const submit = async () => {
    if (!validate()) return
    if (isSystemLocked) { setError('System is locked. Reconciliation cannot be submitted.'); return }
    setWorking(true); setError('')
    try {
      const data = await cashierApi.submitCashierReconciliation(payload())
      setRecord(data)
      showToast({ type: 'success', title: 'Reconciliation submitted', message: `${data.status} for ${data.businessDate}.` })
    } catch (requestError) {
      const message = errorMessage(requestError, 'Unable to submit reconciliation.')
      setError(message)
      showToast({ type: 'error', title: 'Submission failed', message })
    } finally { setWorking(false) }
  }
  const reopen = async (item) => {
    const reason = window.prompt('Reason for reopening this reconciliation:')
    if (!reason?.trim()) return
    setWorking(true); setError('')
    try {
      await cashierApi.reopenCashierReconciliation(item.id, reason.trim())
      showToast({ type: 'success', title: 'Reconciliation reopened', message: `Posting restored for ${item.cashierUsername}.` })
      await load()
    } catch (requestError) {
      const message = errorMessage(requestError, 'Unable to reopen reconciliation.')
      setError(message); showToast({ type: 'error', title: 'Reopen failed', message })
    } finally { setWorking(false) }
  }

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading cashier reconciliation…</div>

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="rounded-2xl bg-slate-950 p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Cashier Operations</p>
            <h1 className="mt-1 font-serif text-3xl font-black">Cashier Reconciliation</h1>
            <p className="mt-2 text-sm text-slate-300">Business Date: {record?.businessDate || 'Unavailable'} · Cashier: {record?.cashierName || record?.cashierUsername || user?.username || 'Unavailable'}</p>
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black">{record?.status || 'UNAVAILABLE'} · {record?.lifecycleStatus || 'OPEN'}{isSystemLocked ? ' · SYSTEM LOCKED' : ''}</span>
        </div>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Opening Cash" value={money(record?.openingCash ?? (openingCash === '' ? null : openingCash))} />
        <SummaryCard label="Cash Received" value={money(record?.physicalCashReceived)} detail="Persisted CASH buy-ins" />
        <SummaryCard label="Cash Paid" value={money(record?.physicalCashPaid)} detail="Persisted CASH cash-outs" />
        <SummaryCard label="Expected Closing" value={money(record?.expectedClosingCash)} />
        <SummaryCard label="Actual Closing" value={money(record?.actualClosingCash ?? actualCount)} />
        <SummaryCard label="Variance" value={money(record?.variance)} detail={record?.status} />
      </section>
      <div className="grid gap-5 xl:grid-cols-3"><TenderCard title="Buy-In Tender Summary" tenders={record?.buyInTenders} /><TenderCard title="Cash-Out Tender Summary" tenders={record?.cashOutTenders} /><TenderCard title="Losing Return Tender Summary" tenders={record?.losingReturnTenders} /></div>

      {canReopen && reviewRecords.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-serif text-xl font-black text-slate-950">Current Business Date Submissions</h2><div className="mt-4 space-y-3">{reviewRecords.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="font-bold text-slate-900">{item.cashierName || item.cashierUsername}</p><p className="text-xs text-slate-500">{item.status} · {item.lifecycleStatus} · {money(item.variance)}</p></div>{item.lifecycleStatus === 'SUBMITTED' && <button type="button" disabled={working || isSystemLocked} onClick={() => reopen(item)} className="rounded-xl border border-amber-400 px-4 py-2 text-sm font-black text-amber-700 disabled:opacity-50">Reopen Reconciliation</button>}</div>)}</div></section>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-serif text-xl font-black text-slate-950">Actual Cash Count</h2><p className="text-sm text-slate-500">Count physical NPR notes. The backend recalculates the authoritative total.</p></div>
          <p className="text-xl font-black text-slate-950">{money(actualCount)}</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {DENOMINATIONS.map((value) => (
            <label key={value} className="rounded-xl border border-slate-200 p-3">
              <span className="text-xs font-black text-slate-600">NPR {value.toLocaleString()}</span>
              <input type="number" min="0" step="1" disabled={submitted || !canSubmit} value={denominations[value] ?? 0} onChange={(event) => changeCount(value, event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-right font-bold outline-none focus:border-amber-400 disabled:bg-slate-100" />
            </label>
          ))}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[240px_1fr]">
          <label><span className="text-xs font-black uppercase tracking-wider text-slate-500">Opening Cash</span><input type="number" min="0" step="0.01" disabled={submitted || !canSubmit} value={openingCash} onChange={(event) => { setOpeningCash(event.target.value); keyRef.current = newKey() }} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-amber-400 disabled:bg-slate-100" /></label>
          <label><span className="text-xs font-black uppercase tracking-wider text-slate-500">Remarks</span><input maxLength="1000" disabled={submitted || !canSubmit} value={remarks} onChange={(event) => { setRemarks(event.target.value); keyRef.current = newKey() }} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-amber-400 disabled:bg-slate-100" /></label>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          {!canSubmit && <p className="mr-auto text-sm text-slate-500">Review-only access. Reconciliation is tied to your authenticated account.</p>}
          {!submitted && canSubmit && <><button type="button" onClick={preview} disabled={working} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50">Calculate</button><button type="button" onClick={submit} disabled={working || isSystemLocked} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{working ? 'Working…' : 'Submit Reconciliation'}</button></>}
          {submitted && <p className="text-sm font-semibold text-emerald-700">Submitted {record.submittedAt ? new Date(record.submittedAt).toLocaleString() : ''}</p>}
        </div>
      </section>
      <p className="text-xs text-slate-500">Machine cash-in, tips, expenses, deposits and manual adjustments are excluded because no authoritative persisted backend source exists yet.</p>
    </div>
  )
}

export default CashierReconciliation
