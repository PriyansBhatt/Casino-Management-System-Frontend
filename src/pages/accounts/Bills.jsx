import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import TableToolbar from '../../components/ui/TableToolbar'
import LockedActionNotice from '../../components/business/LockedActionNotice'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useToast from '../../hooks/useToast'
import {
  createBill,
  createPayment,
  getBills,
  updateBillStatus,
} from '../../api/accountsApi'
import { BILL_STATUSES, PAYMENT_METHODS } from '../../constants/accountsConstants'
import {
  getBillStatusBadgeVariant,
  getPaymentMethodBadgeVariant,
} from '../../utils/accountsUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { getErrorMessage } from '../../utils/errorUtils'

const billStatuses = Object.values(BILL_STATUSES)
const paymentMethods = Object.values(PAYMENT_METHODS)
const sourceModules = ['MANUAL', 'PROCUREMENT', 'STORE', 'ACCOUNTS']
const formatMoney = (value) => `NPR ${Number(value || 0).toLocaleString()}`

const Bills = () => {
  const { user } = useAuth()
  const { businessStatus, isSystemLocked } = useBusinessStatus()
  const { showToast } = useToast()
  const [bills, setBills] = useState([])
  const [filters, setFilters] = useState({
    status: '',
    vendor: '',
    businessDate: '',
    sourceModule: '',
  })
  const [showBillForm, setShowBillForm] = useState(false)
  const [paymentBill, setPaymentBill] = useState(null)
  const [rejectBill, setRejectBill] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingPaymentData, setPendingPaymentData] = useState(null)
  const [pendingRejectData, setPendingRejectData] = useState(null)

  const {
    register: registerBill,
    handleSubmit: handleBillSubmit,
    reset: resetBill,
    formState: { errors: billErrors },
  } = useForm({
    defaultValues: {
      vendorName: '',
      vendorContact: '',
      billNumber: '',
      billAmount: '',
      billDate: '',
      dueDate: '',
      sourceModule: 'MANUAL',
      sourceReference: '',
      remarks: '',
    },
  })

  const {
    register: registerPayment,
    handleSubmit: handlePaymentSubmit,
    watch: watchPayment,
    reset: resetPayment,
    formState: { errors: paymentErrors },
  } = useForm({
    defaultValues: {
      amount: '',
      paymentMethod: PAYMENT_METHODS.CASH,
      chequeNumber: '',
      remarks: '',
    },
  })

  const {
    register: registerReject,
    handleSubmit: handleRejectSubmit,
    reset: resetReject,
    formState: { errors: rejectErrors },
  } = useForm({ defaultValues: { rejectionReason: '' } })

  const selectedPaymentMethod = watchPayment('paymentMethod')

  useEffect(() => {
    if (businessStatus?.businessDate && !filters.businessDate) {
      setFilters((current) => ({ ...current, businessDate: businessStatus.businessDate }))
    }
  }, [businessStatus?.businessDate, filters.businessDate])

  const loadBills = async () => {
    setIsLoading(true)
    setError('')
    try {
      setBills(await getBills(filters))
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Bills Failed to Load', message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBills()
  }, [filters])

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  const resetFilters = () => {
    setFilters({
      status: '',
      vendor: '',
      businessDate: businessStatus?.businessDate || '',
      sourceModule: '',
    })
  }

  const verifyBill = async (bill) => {
    setIsSaving(true)
    setMessage('')
    setError('')
    try {
      await updateBillStatus(bill.id, {
        status: BILL_STATUSES.VERIFIED,
        verifiedBy: user?.username || user?.fullName,
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.ACCOUNTS,
        action: AUDIT_ACTIONS.BILL_VERIFIED,
        severity: AUDIT_SEVERITY.MEDIUM,
        description: `Bill ${bill.billReference} verified.`,
        businessDate: bill.businessDate || businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'BILL',
        entityId: bill.id,
        newValue: { ...bill, status: BILL_STATUSES.VERIFIED },
      })
      setMessage(`${bill.billReference} verified.`)
      showToast({ type: 'success', title: 'Bill Verified', message: bill.billReference })
      await loadBills()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Verify Bill Failed', message })
    } finally {
      setIsSaving(false)
    }
  }

  const onReject = (data) => {
    if (!rejectBill) return
    setPendingRejectData(data)
  }

  const confirmReject = async () => {
    const data = pendingRejectData
    if (!rejectBill || !data) return
    setIsSaving(true)
    setMessage('')
    setError('')
    try {
      await updateBillStatus(rejectBill.id, {
        status: BILL_STATUSES.REJECTED,
        rejectedBy: user?.username || user?.fullName,
        rejectionReason: data.rejectionReason,
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.ACCOUNTS,
        action: AUDIT_ACTIONS.BILL_REJECTED,
        severity: AUDIT_SEVERITY.MEDIUM,
        description: `Bill ${rejectBill.billReference} rejected.`,
        businessDate: rejectBill.businessDate || businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'BILL',
        entityId: rejectBill.id,
        newValue: { ...rejectBill, status: BILL_STATUSES.REJECTED },
        reason: data.rejectionReason,
      })
      setMessage(`${rejectBill.billReference} rejected.`)
      showToast({ type: 'success', title: 'Bill Rejected', message: rejectBill.billReference })
      setRejectBill(null)
      setPendingRejectData(null)
      resetReject()
      await loadBills()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Reject Bill Failed', message })
    } finally {
      setIsSaving(false)
    }
  }

  const onCreateBill = async (data) => {
    setIsSaving(true)
    setMessage('')
    setError('')
    try {
      const bill = await createBill({
        ...data,
        billAmount: Number(data.billAmount || 0),
        businessDate: businessStatus?.businessDate,
        createdBy: user?.username || user?.fullName,
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.ACCOUNTS,
        action: AUDIT_ACTIONS.CREATE,
        severity: Number(data.billAmount || 0) >= 100000 ? AUDIT_SEVERITY.HIGH : AUDIT_SEVERITY.MEDIUM,
        description: `Bill ${bill.billReference} created.`,
        businessDate: businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'BILL',
        entityId: bill.id,
        newValue: bill,
      })
      setMessage('Manual bill created.')
      showToast({ type: 'success', title: 'Bill Created', message: bill.billReference })
      setShowBillForm(false)
      resetBill()
      await loadBills()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Create Bill Failed', message })
    } finally {
      setIsSaving(false)
    }
  }

  const onRecordPayment = (data) => {
    if (!paymentBill) return
    if (isSystemLocked) {
      setError('System is locked. Payment recording is disabled during settlement period.')
      showToast({ type: 'warning', title: 'System Locked', message: 'Payment recording is disabled during settlement period.' })
      return
    }
    const amount = Number(data.amount || 0)
    if (amount > Number(paymentBill.remainingAmount || 0)) {
      setError('Payment cannot exceed bill remaining amount.')
      showToast({ type: 'warning', title: 'Invalid Payment', message: 'Payment cannot exceed bill remaining amount.' })
      return
    }
    if (data.paymentMethod === PAYMENT_METHODS.CHEQUE && !data.chequeNumber?.trim()) {
      setError('Cheque number is required for cheque payment.')
      showToast({ type: 'warning', title: 'Cheque Number Required', message: 'Cheque number is required for cheque payment.' })
      return
    }
    setPendingPaymentData(data)
  }

  const confirmRecordPayment = async () => {
    const data = pendingPaymentData
    if (!paymentBill || !data) return
    const amount = Number(data.amount || 0)
    setIsSaving(true)
    setMessage('')
    setError('')
    try {
      const payment = await createPayment({
        billId: paymentBill.id,
        billReference: paymentBill.billReference,
        vendorName: paymentBill.vendorName,
        amount,
        paymentMethod: data.paymentMethod,
        chequeNumber: data.chequeNumber,
        paymentDate: new Date().toISOString().slice(0, 10),
        businessDate: businessStatus?.businessDate,
        paidBy: user?.username || user?.fullName,
        remarks: data.remarks,
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.ACCOUNTS,
        action: AUDIT_ACTIONS.PAYMENT_RECORDED,
        severity: amount >= 100000 ? AUDIT_SEVERITY.HIGH : AUDIT_SEVERITY.MEDIUM,
        description: `Payment recorded for bill ${paymentBill.billReference}.`,
        businessDate: businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'PAYMENT',
        entityId: payment.id,
        newValue: payment,
        reason: data.remarks,
      })
      setMessage(`Payment recorded for ${paymentBill.billReference}.`)
      showToast({ type: 'success', title: 'Payment Recorded', message: paymentBill.billReference })
      setPaymentBill(null)
      setPendingPaymentData(null)
      resetPayment()
      await loadBills()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Record Payment Failed', message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills"
        description="Verify bills and record Business Date based payments."
        actions={<Button onClick={() => setShowBillForm((value) => !value)}>{showBillForm ? 'Close Form' : 'Create Manual Bill'}</Button>}
      />

      <Card className="border-blue-200 bg-blue-50">
        <p className="text-sm text-blue-900">
          Accounts should verify final payment rules before real deployment. Bills and payments use Business Date.
        </p>
      </Card>

      {isSystemLocked && <LockedActionNotice />}

      <TableToolbar
        title="Bill Filters"
        description="Keep Business Date selected unless intentionally reviewing all records."
        onReset={resetFilters}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-700">Bill Status</label>
            <select id="status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All statuses</option>
              {billStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <Input label="Vendor Name" value={filters.vendor} onChange={(event) => updateFilter('vendor', event.target.value)} />
          <Input label="Business Date" value={filters.businessDate} onChange={(event) => updateFilter('businessDate', event.target.value)} />
          <div>
            <label htmlFor="sourceModule" className="mb-2 block text-sm font-medium text-gray-700">Source Module</label>
            <select id="sourceModule" value={filters.sourceModule} onChange={(event) => updateFilter('sourceModule', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All sources</option>
              {sourceModules.map((module) => <option key={module} value={module}>{module}</option>)}
            </select>
          </div>
        </div>
      </TableToolbar>

      {showBillForm && (
        <Card>
          <form onSubmit={handleBillSubmit(onCreateBill)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Create Manual Bill</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Vendor Name" required {...registerBill('vendorName', { required: 'Vendor name is required' })} error={billErrors.vendorName?.message} disabled={isSaving} />
              <Input label="Vendor Contact" {...registerBill('vendorContact')} disabled={isSaving} />
              <Input label="Bill Number" required {...registerBill('billNumber', { required: 'Bill number is required' })} error={billErrors.billNumber?.message} disabled={isSaving} />
              <Input label="Bill Amount" type="number" min="1" required {...registerBill('billAmount', { required: 'Bill amount is required', min: { value: 1, message: 'Amount must be greater than 0' } })} error={billErrors.billAmount?.message} disabled={isSaving} />
              <Input label="Bill Date" type="date" required {...registerBill('billDate', { required: 'Bill date is required' })} error={billErrors.billDate?.message} disabled={isSaving} />
              <Input label="Due Date" type="date" {...registerBill('dueDate')} disabled={isSaving} />
              <Input label="Source Module" {...registerBill('sourceModule')} disabled={isSaving} />
              <Input label="Source Reference" {...registerBill('sourceReference')} disabled={isSaving} />
              <Input label="Business Date" value={businessStatus?.businessDate || 'Not available'} disabled />
              <div className="md:col-span-3">
                <label htmlFor="billRemarks" className="mb-2 block text-sm font-medium text-gray-700">Remarks</label>
                <textarea id="billRemarks" rows={3} {...registerBill('remarks')} disabled={isSaving} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowBillForm(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Create Bill'}</Button>
            </div>
          </form>
        </Card>
      )}

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading bills...</p>}
        {!isLoading && !error && bills.length === 0 && (
          <div className="p-6">
            <EmptyState
              title="No bills found"
              description="Create a manual bill or receive a store delivery with bill details."
              action={<Button variant="secondary" onClick={resetFilters}>Reset Filters</Button>}
            />
          </div>
        )}
        {bills.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Bill Reference', 'Vendor Name', 'Source Reference', 'Bill Number', 'Bill Amount', 'Paid Amount', 'Remaining Amount', 'Status', 'Business Date', 'Due Date', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{bill.billReference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{bill.vendorName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{bill.sourceReference || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{bill.billNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatMoney(bill.billAmount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatMoney(bill.paidAmount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{formatMoney(bill.remainingAmount)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getBillStatusBadgeVariant(bill.status)}>{bill.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{bill.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{bill.dueDate || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => verifyBill(bill)} disabled={isSaving || [BILL_STATUSES.PAID, BILL_STATUSES.REJECTED].includes(bill.status)}>Verify Bill</Button>
                        <Button size="sm" variant="danger" onClick={() => setRejectBill(bill)} disabled={isSaving || bill.status === BILL_STATUSES.PAID}>Reject Bill</Button>
                        <Button size="sm" variant="secondary" onClick={() => setPaymentBill(bill)} disabled={isSystemLocked || Number(bill.remainingAmount || 0) <= 0 || bill.status === BILL_STATUSES.REJECTED}>Record Payment</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {paymentBill && (
        <Card className="border-blue-200 bg-blue-50">
          <form onSubmit={handlePaymentSubmit(onRecordPayment)} className="space-y-4">
            <h2 className="text-lg font-semibold text-blue-950">Record Payment for {paymentBill.billReference}</h2>
            <p className="text-sm text-blue-900">Remaining amount: {formatMoney(paymentBill.remainingAmount)}</p>
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Amount" type="number" min="1" max={paymentBill.remainingAmount} required {...registerPayment('amount', { required: 'Amount is required', min: { value: 1, message: 'Amount must be greater than 0' }, max: { value: Number(paymentBill.remainingAmount || 0), message: 'Payment cannot exceed remaining amount' } })} error={paymentErrors.amount?.message} disabled={isSaving || isSystemLocked} />
              <div>
                <label htmlFor="paymentMethod" className="mb-2 block text-sm font-medium text-gray-700">Payment Method</label>
                <select id="paymentMethod" {...registerPayment('paymentMethod')} disabled={isSaving || isSystemLocked} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </div>
              <Input label="Cheque Number" required={selectedPaymentMethod === PAYMENT_METHODS.CHEQUE} {...registerPayment('chequeNumber', { validate: (value) => selectedPaymentMethod !== PAYMENT_METHODS.CHEQUE || Boolean(value?.trim()) || 'Cheque number is required' })} error={paymentErrors.chequeNumber?.message} disabled={isSaving || isSystemLocked} />
              <div className="md:col-span-3">
                <label htmlFor="paymentRemarks" className="mb-2 block text-sm font-medium text-gray-700">Remarks</label>
                <textarea id="paymentRemarks" rows={3} {...registerPayment('remarks')} disabled={isSaving || isSystemLocked} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Badge variant={getPaymentMethodBadgeVariant(selectedPaymentMethod)}>{selectedPaymentMethod}</Badge>
              <Button type="button" variant="secondary" onClick={() => setPaymentBill(null)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving || isSystemLocked}>{isSaving ? 'Recording...' : 'Record Payment'}</Button>
            </div>
          </form>
        </Card>
      )}

      {rejectBill && (
        <Card className="border-red-200 bg-red-50">
          <form onSubmit={handleRejectSubmit(onReject)} className="space-y-4">
            <h2 className="text-lg font-semibold text-red-950">Reject {rejectBill.billReference}</h2>
            <div>
              <label htmlFor="rejectionReason" className="mb-2 block text-sm font-medium text-gray-700">Rejection Reason <span className="text-red-500">*</span></label>
              <textarea id="rejectionReason" rows={3} {...registerReject('rejectionReason', { required: 'Rejection reason is required' })} disabled={isSaving} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {rejectErrors.rejectionReason && <p className="mt-1 text-sm text-red-500">{rejectErrors.rejectionReason.message}</p>}
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setRejectBill(null)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" variant="danger" disabled={isSaving}>{isSaving ? 'Rejecting...' : 'Reject Bill'}</Button>
            </div>
          </form>
        </Card>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingPaymentData)}
        title="Confirm Payment"
        description={`Record ${pendingPaymentData?.paymentMethod || 'payment'} of ${formatMoney(pendingPaymentData?.amount)} for ${paymentBill?.billReference || 'selected bill'}?`}
        confirmLabel="Record Payment"
        variant="warning"
        isLoading={isSaving}
        onConfirm={confirmRecordPayment}
        onCancel={() => setPendingPaymentData(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingRejectData)}
        title="Confirm Bill Rejection"
        description={`Reject ${rejectBill?.billReference || 'selected bill'}?`}
        confirmLabel="Reject Bill"
        variant="danger"
        isLoading={isSaving}
        onConfirm={confirmReject}
        onCancel={() => setPendingRejectData(null)}
      />
    </div>
  )
}

export default Bills
