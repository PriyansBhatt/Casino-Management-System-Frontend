import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LockGuard from '../../components/business/LockGuard'
import LockedActionNotice from '../../components/business/LockedActionNotice'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import cashierApi from '../../api/cashierApi'
import receptionApi from '../../api/receptionApi'
import { getStatusBadgeVariant } from '../../utils/customerUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { getErrorMessage } from '../../utils/errorUtils'

const paymentMethods = ['CASH', 'BANK', 'QR', 'CARD']
const denominations = [500, 1000, 5000, 10000, 25000]
const emptyDenominations = () => Object.fromEntries(denominations.map((value) => [value, 0]))
const formatNpr = (value) => `NPR ${Number(value || 0).toLocaleString('en-IN')}`
const requiresReference = (method) => method !== 'CASH'

const getCashOutErrorMessage = (error) => {
  const status = error?.response?.status
  const message = getErrorMessage(error)
  if (!error?.response) return 'The backend is unavailable. Please keep this request unchanged and retry.'
  if (status === 401) return 'Your authentication session has expired. Please log in again.'
  if (status === 403) return message || 'You are not authorized to perform this Cash-Out.'
  if (status === 409) return message || 'This request conflicts with an earlier Cash-Out attempt.'
  if (/hibernate|java\.|org\.spring|sql exception/i.test(message)) {
    return 'The Cash-Out could not be processed. Please retry or contact an administrator.'
  }
  return message
}

const createIdempotencyKey = () => {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('Secure request identifiers are unavailable in this browser.')
  }
  return globalThis.crypto.randomUUID()
}

const CashOut = () => {
  const { businessStatus, isSystemLocked } = useBusinessStatus()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [customerQuery, setCustomerQuery] = useState('')
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [financialPosition, setFinancialPosition] = useState(null)
  const [cashOutHistory, setCashOutHistory] = useState([])
  const [chipQuantities, setChipQuantities] = useState(emptyDenominations)
  const [isSearching, setIsSearching] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [pendingCashOut, setPendingCashOut] = useState(null)
  const [reconciliationFinalized, setReconciliationFinalized] = useState(false)
  const [isReconciliationLoading, setIsReconciliationLoading] = useState(true)
  const [mode, setMode] = useState('CASH_OUT')
  const [losingEligibility, setLosingEligibility] = useState(null)
  const [losingRemarks, setLosingRemarks] = useState('')
  const [losingReturnResult, setLosingReturnResult] = useState(null)
  const submissionRef = useRef({ key: null, signature: null })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { paymentMethod: 'CASH', paymentReference: '', remarks: '' },
  })

  const paymentMethod = watch('paymentMethod')
  const denominationTotal = useMemo(
    () => Object.entries(chipQuantities).reduce(
      (total, [denomination, quantity]) => total + Number(denomination) * Number(quantity || 0), 0),
    [chipQuantities]
  )
  const availableCashOut = Math.max(0, Number(financialPosition?.calculatedChipPosition || 0))

  useEffect(() => {
    let active = true
    cashierApi.getCurrentCashierReconciliation()
      .then((value) => { if (active) setReconciliationFinalized(value?.lifecycleStatus === 'SUBMITTED') })
      .catch(() => { if (active) setErrorMessage('Unable to verify cashier reconciliation status.') })
      .finally(() => { if (active) setIsReconciliationLoading(false) })
    return () => { active = false }
  }, [])

  const clearVerification = () => {
    setSelectedCustomer(null)
    setActiveSession(null)
    setFinancialPosition(null)
    setCashOutHistory([])
    setPendingCashOut(null)
    setLosingEligibility(null)
    setLosingReturnResult(null)
    submissionRef.current = { key: null, signature: null }
  }

  const handleCustomerSearch = async () => {
    if (!customerQuery.trim()) {
      setErrorMessage('Enter a customer code, name, or phone.')
      return
    }
    setIsSearching(true)
    setErrorMessage('')
    clearVerification()
    try {
      const directory = await receptionApi.getCustomers({ skipUnauthorizedRedirect: true })
      const normalizedQuery = customerQuery.trim().toLowerCase()
      const results = (Array.isArray(directory) ? directory : []).filter((customer) =>
        [customer.customerCode, customer.fullName, customer.phone, customer.nationality]
          .some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
      )
      setCustomers(results)
      if (results.length === 0) {
        setErrorMessage('No matching backend customer was found.')
      }
    } catch (error) {
      const message = getErrorMessage(error)
      setCustomers([])
      setErrorMessage(message)
      showToast({ type: 'error', title: 'Customer Search Failed', message })
    } finally {
      setIsSearching(false)
    }
  }

  const loadSessionContext = async (customer, session) => {
    setIsSummaryLoading(true)
    try {
      const [position, history] = await Promise.all([
        cashierApi.getSessionFinancialPosition(session.id),
        cashierApi.getCashOutsBySession(session.id),
      ])
      if (!position) throw new Error('The authoritative session financial position is unavailable.')
      setFinancialPosition(position)
      setCashOutHistory(Array.isArray(history) ? history : [])
      setSelectedCustomer(customer)
      setActiveSession(session)
      setErrorMessage('')
    } catch (error) {
      const message = getCashOutErrorMessage(error)
      setSelectedCustomer(customer)
      setActiveSession(session)
      setFinancialPosition(null)
      setCashOutHistory([])
      setErrorMessage(message)
      showToast({ type: 'error', title: 'Financial Position Failed', message })
    } finally {
      setIsSummaryLoading(false)
    }
  }

  const verifyCustomer = async (customer) => {
    setIsVerifying(true)
    setErrorMessage('')
    clearVerification()
    try {
      if (String(customer.status).toUpperCase() !== 'ACTIVE') {
        throw new Error('This customer is not active.')
      }
      const session = await receptionApi.getActiveSession(customer.id, {
        skipUnauthorizedRedirect: true,
      })
      if (!session?.id) throw new Error('This customer does not have an active reception session.')
      await loadSessionContext(customer, session)
      showToast({ type: 'success', title: 'Customer Verified', message: `${customer.fullName} has an active session.` })
    } catch (error) {
      const message = getErrorMessage(error)
      clearVerification()
      setErrorMessage(message)
      showToast({ type: 'error', title: 'Verification Failed', message })
    } finally {
      setIsVerifying(false)
    }
  }

  const onSubmit = (data) => {
    setSuccessMessage('')
    setErrorMessage('')
    const numericAmount = denominationTotal
    if (!selectedCustomer || !activeSession) {
      setErrorMessage('Verify a customer with an active session before recording Cash-Out.')
      return
    }
    if (!financialPosition) {
      setErrorMessage('Load the authoritative financial position before recording Cash-Out.')
      return
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Enter at least one returned chip denomination.')
      return
    }
    if (numericAmount > availableCashOut) {
      setErrorMessage(`Cash-Out cannot exceed ${formatNpr(availableCashOut)}.`)
      return
    }
    if (requiresReference(data.paymentMethod) && !data.paymentReference?.trim()) {
      setErrorMessage('Payment reference is required for BANK, QR, and CARD.')
      return
    }
    const signature = JSON.stringify({
      customerId: selectedCustomer.id,
      customerSessionId: activeSession.id,
      cashPaid: numericAmount,
      totalChipValueReturned: denominationTotal,
      paymentMode: data.paymentMethod,
      paymentReference: data.paymentReference?.trim() || null,
    })
    if (submissionRef.current.signature !== signature) {
      submissionRef.current = { key: createIdempotencyKey(), signature }
    }
    setPendingCashOut({ ...data, numericAmount, denominationTotal, signature })
  }

  const confirmCashOut = async () => {
    const data = pendingCashOut
    if (!data || !selectedCustomer || !activeSession || isSubmitting) return
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const transaction = await cashierApi.createCashOut({
        customerId: selectedCustomer.id,
        customerSessionId: activeSession.id,
        cashPaid: data.numericAmount,
        totalChipValueReturned: data.denominationTotal,
        paymentMode: data.paymentMethod,
        idempotencyKey: submissionRef.current.key,
        ...(data.paymentReference?.trim() ? { paymentReference: data.paymentReference.trim() } : {}),
        ...(data.remarks?.trim() ? { remarks: data.remarks.trim() } : {}),
      })

      safeLogAuditEvent({
        module: AUDIT_MODULES.CASHIER,
        action: AUDIT_ACTIONS.CREATE,
        severity: data.numericAmount >= 100000 ? AUDIT_SEVERITY.HIGH : AUDIT_SEVERITY.MEDIUM,
        description: `Persisted cash-out ${transaction.cashOutCode} created for ${selectedCustomer.fullName}.`,
        businessDate: transaction.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'CASH_OUT',
        entityId: transaction.id,
      })

      setSuccessMessage(`Cash-Out ${transaction.cashOutCode} recorded: ${formatNpr(transaction.cashPaid)}.`)
      showToast({ type: 'success', title: 'Cash-Out Recorded', message: `${transaction.cashOutCode} · ${formatNpr(transaction.cashPaid)}` })
      setPendingCashOut(null)
      submissionRef.current = { key: null, signature: null }
      reset({ paymentMethod: 'CASH', paymentReference: '', remarks: '' })
      setChipQuantities(emptyDenominations())
      await loadSessionContext(selectedCustomer, activeSession)
    } catch (error) {
      const message = getCashOutErrorMessage(error)
      setErrorMessage(message)
      setPendingCashOut(null)
      showToast({ type: 'error', title: 'Cash-Out Failed', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateLosingReturn = async () => {
    if (!selectedCustomer || !activeSession) { setErrorMessage('Verify a customer with an active session first.'); return }
    setIsSummaryLoading(true); setErrorMessage('')
    try { setLosingEligibility(await cashierApi.getLosingReturnEligibility(selectedCustomer.id)) }
    catch (error) { setErrorMessage(getCashOutErrorMessage(error)) }
    finally { setIsSummaryLoading(false) }
  }

  const postLosingReturn = async () => {
    if (!losingEligibility?.eligible || !selectedCustomer || !activeSession || isSubmitting) return
    setIsSubmitting(true); setErrorMessage(''); setSuccessMessage('')
    try {
      const result = await cashierApi.createLosingReturn({ customerId: selectedCustomer.id, customerSessionId: activeSession.id, idempotencyKey: createIdempotencyKey(), ...(losingRemarks.trim() ? { remarks: losingRemarks.trim() } : {}) })
      setLosingReturnResult(result); setSuccessMessage(`Losing Return ${result.losingReturnCode} posted successfully.`)
      setLosingRemarks(''); await calculateLosingReturn()
    } catch (error) { const message=getCashOutErrorMessage(error); setErrorMessage(message); showToast({ type:'error', title:'Losing Return Failed', message }) }
    finally { setIsSubmitting(false) }
  }

  const submissionDisabled = isSubmitting || isSystemLocked || reconciliationFinalized
    || isReconciliationLoading || isSummaryLoading
    || !selectedCustomer || !activeSession || !financialPosition || availableCashOut <= 0

  return (
    <div className="space-y-6">
      <PageHeader title="Cash-Out & Return Control" description="Verify the customer position, receive chips, and record an authorized Cash-Out." />

      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        <button type="button" onClick={() => setMode('CASH_OUT')} className={`rounded-lg px-5 py-2.5 text-sm font-black ${mode === 'CASH_OUT' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}>Cash-Out</button>
        <button type="button" onClick={() => setMode('LOSING_RETURN')} className={`rounded-lg px-5 py-2.5 text-sm font-black ${mode === 'LOSING_RETURN' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}>Losing Return</button>
      </div>

      {mode === 'CASH_OUT' ? <>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs font-bold uppercase tracking-wider text-gray-500">Business Date</p><p className="mt-1 text-xl font-black text-gray-900">{businessStatus?.businessDate || 'Not available'}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider text-gray-500">Cashier</p><p className="mt-1 font-black text-gray-900">{user?.fullName || user?.username || 'Unavailable'}</p><p className="text-xs text-gray-500">{user?.role || 'Role unavailable'}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider text-gray-500">Operational Status</p><Badge variant={isSystemLocked ? 'danger' : 'success'}>{isSystemLocked ? 'SYSTEM LOCKED' : 'OPEN FOR OPERATIONS'}</Badge></div>
          <div><p className="text-xs font-bold uppercase tracking-wider text-gray-500">Transaction Type</p><p className="mt-1 font-black text-gray-900">Customer Cash-Out</p></div>
        </div>
      </Card>

      {isSystemLocked && <LockedActionNotice />}
      {reconciliationFinalized && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-black text-amber-800">CASHIER RECONCILIATION SUBMITTED — new Cash-Outs are disabled for this Business Date.</div>}

      <Card>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input label="Customer Search" value={customerQuery}
              onChange={(event) => setCustomerQuery(event.target.value)}
              placeholder="Customer code, name, or phone" />
            <div className="flex items-end">
              <Button type="button" onClick={handleCustomerSearch} disabled={isSearching || isVerifying}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
          {customers.length > 0 && !selectedCustomer && (
            <div className="grid gap-2">
              {customers.map((customer) => (
                <button key={customer.id} type="button" onClick={() => verifyCustomer(customer)}
                  disabled={isVerifying}
                  className="rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-60">
                  <p className="font-semibold text-gray-900">{customer.fullName}</p>
                  <p className="text-sm text-gray-600">{customer.customerCode} | {customer.phone || 'Phone unavailable'}</p>
                </button>
              ))}
            </div>
          )}
          {isVerifying && <p className="text-sm text-gray-600">Verifying active customer session...</p>}
        </div>
      </Card>

      {selectedCustomer && (
        <Card>
          <div className="grid gap-4 md:grid-cols-5">
            <div><p className="text-sm text-gray-500">Customer Code</p><p className="font-semibold">{selectedCustomer.customerCode}</p></div>
            <div><p className="text-sm text-gray-500">Full Name</p><p className="font-semibold">{selectedCustomer.fullName}</p></div>
            <div><p className="text-sm text-gray-500">Status</p><Badge variant={getStatusBadgeVariant(selectedCustomer.status)}>{selectedCustomer.status}</Badge></div>
            <div><p className="text-sm text-gray-500">Session</p><p className="font-semibold">{activeSession?.sessionCode || 'Code unavailable'}</p></div>
            <div><p className="text-sm text-gray-500">Entry / Badge</p><p className="font-semibold text-emerald-700">ACTIVE · Badge unavailable</p></div>
          </div>
        </Card>
      )}

      {isSummaryLoading && <Card><p className="text-sm text-gray-600">Loading authoritative financial position...</p></Card>}
      {financialPosition && (
        <Card>
          <div className="grid gap-4 md:grid-cols-5">
            <div><p className="text-sm text-gray-500">Total Buy-In</p><p className="font-semibold">{formatNpr(financialPosition.totalBuyIn)}</p></div>
            <div><p className="text-sm text-gray-500">Verified Wins</p><p className="font-semibold">{formatNpr(financialPosition.verifiedGamingWin)}</p></div>
            <div><p className="text-sm text-gray-500">Verified Losses</p><p className="font-semibold">{formatNpr(financialPosition.verifiedGamingLoss)}</p></div>
            <div><p className="text-sm text-gray-500">Previous Cash-Out</p><p className="font-semibold">{formatNpr(financialPosition.totalCashOut)}</p></div>
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
              <p className="text-sm font-medium text-emerald-700">Available Cash-Out</p>
              <p className="text-xl font-bold text-emerald-900">{formatNpr(availableCashOut)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">Position reflects persisted transactions and currently supported verified TABLE gaming activity.</p>
        </Card>
      )}

      <LockGuard fallback={<LockedActionNotice />}>
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-700">Cash Paid</p><p className="mt-1 text-2xl font-black text-emerald-900">{formatNpr(denominationTotal)}</p><p className="mt-1 text-xs text-emerald-700">Derived from returned chip denominations</p></div>
              <div>
                <label htmlFor="paymentMethod" className="mb-2 block text-sm font-medium text-gray-700">Payment Method <span className="text-red-500">*</span></label>
                <select id="paymentMethod" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  disabled={submissionDisabled} {...register('paymentMethod', { required: true })}>
                  {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Returned Chip Denominations</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {denominations.map((denomination) => (
                  <div key={denomination} className="rounded-xl border border-gray-200 bg-white p-3"><p className="text-sm font-bold text-gray-800">{formatNpr(denomination)}</p><div className="mt-2 flex items-center gap-2"><button type="button" disabled={submissionDisabled} onClick={() => { setChipQuantities((current) => ({ ...current, [denomination]: Math.max(0, current[denomination] - 1) })); submissionRef.current = { key: null, signature: null } }} className="h-10 w-10 rounded-lg border border-gray-200 bg-gray-50 text-lg font-black disabled:opacity-50">−</button><input type="number" min="0" step="1" value={chipQuantities[denomination]} onChange={(event) => { setChipQuantities((current) => ({ ...current, [denomination]: Math.max(0, Math.trunc(Number(event.target.value) || 0)) })); submissionRef.current = { key: null, signature: null } }} disabled={submissionDisabled} className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 text-center font-black disabled:bg-gray-100"/><button type="button" disabled={submissionDisabled} onClick={() => { setChipQuantities((current) => ({ ...current, [denomination]: current[denomination] + 1 })); submissionRef.current = { key: null, signature: null } }} className="h-10 w-10 rounded-lg bg-gray-900 text-lg font-black text-white disabled:opacity-50">+</button></div></div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-50 p-4"><span className="font-semibold text-blue-800">Returned Chips Total</span><strong className="text-xl text-blue-950">{formatNpr(denominationTotal)}</strong></div>
            </div>

            {requiresReference(paymentMethod) && (
              <Input label="Payment Reference" required {...register('paymentReference', { required: 'Payment reference is required' })}
                error={errors.paymentReference?.message} disabled={submissionDisabled} />
            )}

            <div>
              <label htmlFor="remarks" className="mb-2 block text-sm font-medium text-gray-700">Remarks</label>
              <textarea id="remarks" rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                disabled={submissionDisabled} {...register('remarks')} />
            </div>

            {denominationTotal > 0 && selectedCustomer && <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              Cash paid {formatNpr(denominationTotal)} · Returned chips {formatNpr(denominationTotal)} · Available {formatNpr(availableCashOut)}
            </div>}
            {successMessage && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">{successMessage}</div>}
            {errorMessage && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{errorMessage}</div>}
            <div className="flex justify-end border-t border-gray-200 pt-5">
              <Button type="submit" disabled={submissionDisabled}>{isSubmitting ? 'Recording...' : 'Record Cash-Out'}</Button>
            </div>
          </form>
        </Card>
      </LockGuard>

      {selectedCustomer && (
        <Card>
          <h2 className="text-lg font-bold text-gray-900">Persisted Cash-Out History</h2>
          {cashOutHistory.length === 0 ? <p className="mt-3 text-sm text-gray-500">No persisted Cash-Outs for this session.</p> : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead><tr className="text-left text-gray-500"><th className="py-2 pr-4">Code</th><th className="py-2 pr-4">Amount</th><th className="py-2 pr-4">Method</th><th className="py-2 pr-4">Time</th><th className="py-2">Status</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {cashOutHistory.map((transaction) => <tr key={transaction.id}>
                    <td className="py-2 pr-4 font-medium">{transaction.cashOutCode}</td>
                    <td className="py-2 pr-4">{formatNpr(transaction.cashPaid)}</td>
                    <td className="py-2 pr-4">{transaction.paymentMode}</td>
                    <td className="py-2 pr-4">{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'Unavailable'}</td>
                    <td className="py-2"><Badge variant="success">PERSISTED</Badge></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <ConfirmDialog isOpen={Boolean(pendingCashOut)} title="Confirm Cash-Out"
        description={`Record ${formatNpr(pendingCashOut?.numericAmount)} for ${selectedCustomer?.fullName || 'selected customer'}?`}
        confirmLabel="Record Cash-Out" variant="warning" isLoading={isSubmitting}
        onConfirm={confirmCashOut} onCancel={() => !isSubmitting && setPendingCashOut(null)} />
      </> : <>
        <Card><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs font-bold uppercase text-gray-500">Transaction Type</p><p className="mt-1 text-xl font-black">Losing Return</p></div><div><p className="text-xs font-bold uppercase text-gray-500">Business Date</p><p className="mt-1 font-black">{businessStatus?.businessDate || 'Unavailable'}</p></div><div><p className="text-xs font-bold uppercase text-gray-500">Cashier</p><p className="mt-1 font-black">{user?.fullName || user?.username || 'Unavailable'}</p></div><div><Badge variant={reconciliationFinalized || isSystemLocked ? 'danger' : 'success'}>{isSystemLocked ? 'SYSTEM LOCKED' : reconciliationFinalized ? 'RECONCILIATION SUBMITTED' : 'OPEN FOR OPERATIONS'}</Badge></div></div></Card>
        {reconciliationFinalized && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-black text-amber-800">CASHIER RECONCILIATION SUBMITTED — new Losing Returns are disabled for this Business Date.</div>}
        <Card><div className="space-y-4"><div className="flex flex-col gap-3 md:flex-row"><Input label="Customer Search" value={customerQuery} onChange={(event)=>setCustomerQuery(event.target.value)} placeholder="Customer code, name, or phone"/><div className="flex items-end"><Button type="button" onClick={handleCustomerSearch} disabled={isSearching||isVerifying}>{isSearching?'Searching...':'Search'}</Button></div></div>{customers.length>0&&<div className="space-y-2">{customers.map((customer)=><button type="button" key={customer.id} onClick={()=>verifyCustomer(customer)} disabled={isVerifying} className="flex w-full justify-between rounded-xl border border-gray-200 p-3 text-left hover:bg-gray-50"><span><strong>{customer.fullName}</strong><span className="ml-2 text-sm text-gray-500">{customer.customerCode}</span></span><span className="text-sm font-bold">Verify</span></button>)}</div>}{selectedCustomer&&<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><strong>{selectedCustomer.fullName}</strong><p className="text-sm text-emerald-700">{selectedCustomer.customerCode} · Active session {activeSession?.sessionCode || activeSession?.id}</p><Button type="button" className="mt-3" onClick={calculateLosingReturn} disabled={isSummaryLoading}>Calculate Eligibility</Button></div>}</div></Card>
        {losingEligibility&&<Card><h2 className="text-lg font-black">Authoritative Losing Return Eligibility</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Total Buy-Ins',losingEligibility.totalBuyIn],['Verified Wins',losingEligibility.verifiedWins],['Verified Losses',losingEligibility.verifiedLosses],['Previous Cash-Outs',losingEligibility.previousCashOuts],['Previous Losing Returns',losingEligibility.previousLosingReturns],['Eligible Verified Loss',losingEligibility.eligibleVerifiedLoss],['Minimum Required Loss',losingEligibility.minimumEligibleLoss],['Return Rate',`${Number(losingEligibility.returnRate||0)*100}%`],['Available Return',losingEligibility.availableReturnAmount]].map(([label,value])=><div key={label} className="rounded-xl bg-gray-50 p-3"><p className="text-xs font-bold uppercase text-gray-500">{label}</p><p className="mt-1 font-black">{label==='Return Rate'?value:formatNpr(value)}</p></div>)}</div><div className={`mt-4 rounded-xl border p-4 text-sm font-bold ${losingEligibility.eligible?'border-emerald-200 bg-emerald-50 text-emerald-800':'border-amber-300 bg-amber-50 text-amber-800'}`}>Eligibility Status: {losingEligibility.eligible?'ELIGIBLE':'NOT ELIGIBLE'}<p className="mt-1 font-medium">{losingEligibility.eligibilityReason}</p></div><p className="mt-4 text-sm text-gray-600">Eligible verified loss = max(verified losses − verified wins, 0). Previous persisted returns are deducted from the 10% payout.</p><textarea rows={3} value={losingRemarks} onChange={(event)=>setLosingRemarks(event.target.value)} placeholder="Optional remarks" className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2" disabled={isSubmitting||reconciliationFinalized||isSystemLocked}/><div className="mt-4 flex justify-end"><Button type="button" onClick={postLosingReturn} disabled={!losingEligibility.eligible||isSubmitting||isSystemLocked||reconciliationFinalized||isReconciliationLoading}>{isSubmitting?'Posting...':`Post Losing Return ${formatNpr(losingEligibility.availableReturnAmount)}`}</Button></div></Card>}
        {losingReturnResult&&<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">Persisted {losingReturnResult.losingReturnCode} · {formatNpr(losingReturnResult.amountPaid)}</div>}
        {successMessage&&<div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">{successMessage}</div>}{errorMessage&&<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{errorMessage}</div>}
      </>}
    </div>
  )
}

export default CashOut
