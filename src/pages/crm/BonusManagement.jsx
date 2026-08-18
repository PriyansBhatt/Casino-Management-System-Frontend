import { useEffect, useMemo, useRef, useState } from 'react'
import bonusApi from '../../api/bonusApi'
import receptionApi from '../../api/receptionApi'

const TYPES = ['WELCOME', 'PROMOTIONAL', 'LOYALTY', 'VIP', 'MANUAL_ADJUSTMENT']
const money = (value) => `NPR ${Number(value || 0).toLocaleString()}`
const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200'
const key = () => globalThis.crypto?.randomUUID?.() || `bonus-${Date.now()}-${Math.random().toString(36).slice(2)}`

const BonusManagement = () => {
  const [businessDate, setBusinessDate] = useState('')
  const [customers, setCustomers] = useState([])
  const [bonuses, setBonuses] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [bonusType, setBonusType] = useState('PROMOTIONAL')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const submission = useRef({ signature: '', idempotencyKey: '' })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const current = await receptionApi.getCurrentOpenBusinessDate()
      if (!current?.businessDate) throw new Error('Current business date is not opened.')
      const [customerRecords, bonusRecords] = await Promise.all([
        receptionApi.getCustomers({ skipUnauthorizedRedirect: true }),
        bonusApi.getBonuses(current.businessDate),
      ])
      setBusinessDate(current.businessDate)
      setCustomers(Array.isArray(customerRecords) ? customerRecords : [])
      setBonuses(Array.isArray(bonusRecords) ? bonusRecords : [])
    } catch (loadError) {
      setBonuses([])
      setError(loadError.response?.data?.message || loadError.message || 'Unable to load Customer Bonus Management.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const matchingCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    return customers.filter((customer) => [customer.customerCode, customer.fullName, customer.phone]
      .some((value) => String(value || '').toLowerCase().includes(query))).slice(0, 8)
  }, [customers, search])

  const summary = useMemo(() => ({
    count: bonuses.length,
    approved: bonuses.filter((bonus) => bonus.status === 'APPROVED').reduce((sum, bonus) => sum + Number(bonus.amount || 0), 0),
    pending: bonuses.filter((bonus) => bonus.status === 'PENDING').length,
    customers: new Set(bonuses.map((bonus) => bonus.customerId)).size,
  }), [bonuses])

  const verifyCustomer = async (customer) => {
    setVerifying(true)
    setError('')
    setMessage('')
    try {
      if (String(customer.status).toUpperCase() !== 'ACTIVE') throw new Error('Customer must be ACTIVE.')
      const session = await receptionApi.getActiveSession(customer.id, { skipUnauthorizedRedirect: true })
      if (!session || session.businessDate !== businessDate) throw new Error('Customer requires an OPEN session for the current Business Date.')
      setSelectedCustomer(customer)
      setActiveSession(session)
      setSearch(`${customer.customerCode} · ${customer.fullName}`)
      setMessage(`${customer.fullName} verified with active session ${session.sessionCode || session.id}.`)
    } catch (verifyError) {
      setSelectedCustomer(null)
      setActiveSession(null)
      setError(verifyError.response?.data?.message || verifyError.message || 'Unable to verify customer session.')
    } finally {
      setVerifying(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    const numericAmount = Number(amount)
    if (!selectedCustomer || !activeSession) return setError('Verify an active customer session first.')
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError('Bonus amount must be greater than zero.')
    if (!reason.trim()) return setError('Bonus reason is required.')
    const base = { customerId: selectedCustomer.id, customerSessionId: activeSession.id, bonusType, amount: numericAmount, reason: reason.trim() }
    const signature = JSON.stringify(base)
    if (submission.current.signature !== signature) submission.current = { signature, idempotencyKey: key() }
    setSubmitting(true)
    try {
      const created = await bonusApi.createBonus({ ...base, idempotencyKey: submission.current.idempotencyKey })
      setBonuses((current) => [created, ...current.filter((bonus) => bonus.id !== created.id)])
      setAmount('')
      setReason('')
      submission.current = { signature: '', idempotencyKey: '' }
      setMessage(`Bonus ${created.bonusCode} created and approved successfully.`)
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.message || 'Unable to create customer bonus.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-black">Bonus Management</h2>
          <p className="mt-1 text-sm text-slate-500">Casino-issued promotional value, tracked separately from cash Buy-In and gaming results.</p>
        </div>
        <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold">Business Date: {businessDate || 'Not open'}</div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Bonuses Issued', summary.count],
          ['Approved Value', money(summary.approved)],
          ['Pending Approvals', summary.pending],
          ['Customers Receiving Bonus', summary.customers],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{loading ? 'Loading…' : value}</p></div>)}
      </div>

      <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-black">Create Bonus</h3>
          <label className="block text-sm font-bold">Search Customer
            <input className={`${inputClass} mt-2`} value={search} onChange={(event) => { setSearch(event.target.value); setSelectedCustomer(null); setActiveSession(null) }} placeholder="Customer code, name or phone" />
          </label>
          {matchingCustomers.length > 0 && !selectedCustomer && <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">{matchingCustomers.map((customer) => <button disabled={verifying} type="button" key={customer.id} onClick={() => verifyCustomer(customer)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white"><strong>{customer.customerCode}</strong> · {customer.fullName} · {customer.phone}</button>)}</div>}
          {selectedCustomer && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm"><strong>{selectedCustomer.fullName}</strong><br />{selectedCustomer.customerCode} · Session {activeSession?.sessionCode || activeSession?.id}</div>}
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-bold">Bonus Type<select className={`${inputClass} mt-2`} value={bonusType} onChange={(event) => setBonusType(event.target.value)}>{TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label className="block text-sm font-bold">Amount (NPR)<input className={`${inputClass} mt-2`} type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
          <label className="block text-sm font-bold">Reason<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-amber-400" maxLength="1000" value={reason} onChange={(event) => setReason(event.target.value)} /></label>
          <button type="submit" disabled={submitting || loading || !activeSession} className="h-11 w-full rounded-xl bg-amber-400 text-sm font-black text-slate-950 disabled:opacity-50">{submitting ? 'Submitting…' : 'Create & Approve Bonus'}</button>
          <p className="text-xs text-slate-500">Current scope: Director/Super Admin creation is immediately approved. Bonus value is not customer cash and does not change Losing Return eligibility.</p>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b px-5 py-4"><h3 className="text-lg font-black">Bonus History</h3></div>
        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{['Bonus Code', 'Customer', 'Session', 'Type', 'Amount', 'Status', 'Created By', 'Approved By', 'Time'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{bonuses.map((bonus) => <tr key={bonus.id}><td className="px-4 py-3 font-mono font-bold">{bonus.bonusCode}</td><td className="px-4 py-3"><strong>{bonus.customerName || 'Unavailable'}</strong><br />{bonus.customerCode || 'Code unavailable'}</td><td className="px-4 py-3">{bonus.sessionCode || bonus.customerSessionId}</td><td className="px-4 py-3">{bonus.bonusType}</td><td className="px-4 py-3 font-bold">{money(bonus.amount)}</td><td className="px-4 py-3">{bonus.status}</td><td className="px-4 py-3">{bonus.createdBy?.username || 'Unavailable'}</td><td className="px-4 py-3">{bonus.approvedBy?.username || 'Unavailable'}</td><td className="px-4 py-3">{bonus.createdAt ? new Date(bonus.createdAt).toLocaleString() : 'Unavailable'}</td></tr>)}{!loading && bonuses.length === 0 && <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-500">No bonuses exist for this Business Date.</td></tr>}</tbody></table></div>
      </div>
    </section>
  )
}

export default BonusManagement
