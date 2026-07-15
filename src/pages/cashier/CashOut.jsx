import { useState } from 'react'
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
import { searchCustomers } from '../../api/customerApi'
import { createCashOut } from '../../api/cashierApi'
import { PAYMENT_METHODS } from '../../constants/transactionTypes'
import { getRiskBadgeVariant, getStatusBadgeVariant } from '../../utils/customerUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { getErrorMessage } from '../../utils/errorUtils'

const paymentMethods = Object.values(PAYMENT_METHODS)

const CashOut = () => {
  const { businessStatus, isSystemLocked } = useBusinessStatus()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [customerQuery, setCustomerQuery] = useState('')
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [pendingCashOut, setPendingCashOut] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      amount: '',
      paymentMethod: PAYMENT_METHODS.CASH,
      remarks: '',
    },
  })

  const amount = watch('amount')

  const handleCustomerSearch = async () => {
    setIsSearching(true)
    setErrorMessage('')

    try {
      const results = await searchCustomers(customerQuery)
      setCustomers(results)
    } catch (error) {
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showToast({ type: 'error', title: 'Customer Search Failed', message })
    } finally {
      setIsSearching(false)
    }
  }

  const onSubmit = (data) => {
    setSuccessMessage('')
    setErrorMessage('')

    if (!selectedCustomer) {
      setErrorMessage('Customer is required.')
      showToast({ type: 'warning', title: 'Customer Required', message: 'Select a customer before recording cash-out.' })
      return
    }

    setPendingCashOut(data)
  }

  const confirmCashOut = async () => {
    const data = pendingCashOut
    if (!data || !selectedCustomer) return
    setIsSubmitting(true)

    try {
      const transaction = await createCashOut({
        customerId: selectedCustomer.id,
        customerCode: selectedCustomer.customerCode,
        customerName: selectedCustomer.fullName,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        remarks: data.remarks,
        businessDate: businessStatus?.businessDate,
        createdBy: user?.username || user?.fullName || 'Cashier',
      })

      safeLogAuditEvent({
        module: AUDIT_MODULES.CASHIER,
        action: AUDIT_ACTIONS.CREATE,
        severity: Number(data.amount || 0) >= 100000 ? AUDIT_SEVERITY.HIGH : AUDIT_SEVERITY.MEDIUM,
        description: `Cash-out ${transaction.reference} created for ${selectedCustomer.fullName}.`,
        businessDate: businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'CASH_OUT',
        entityId: transaction.id,
        newValue: {
          customerId: selectedCustomer.id,
          customerCode: selectedCustomer.customerCode,
          customerName: selectedCustomer.fullName,
          amount: Number(data.amount || 0),
          reference: transaction.reference,
          businessDate: businessStatus?.businessDate,
        },
      })

      setSuccessMessage(`Cash-out recorded successfully. Reference: ${transaction.reference}`)
      showToast({
        type: 'success',
        title: 'Cash-Out Recorded',
        message: `Reference: ${transaction.reference}`,
      })
      setPendingCashOut(null)
      reset()
    } catch (error) {
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showToast({ type: 'error', title: 'Cash-Out Failed', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const showCustomerWarning =
    selectedCustomer?.riskLevel === 'HIGH' || selectedCustomer?.status === 'WATCHLIST'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash-Out"
        description="Record customer cash-out transactions for the current Business Date."
      />

      <Card>
        <p className="text-sm font-medium text-gray-500">Current Business Date</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {businessStatus?.businessDate || 'Not available'}
        </p>
      </Card>

      {isSystemLocked && <LockedActionNotice />}

      <Card>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              label="Customer Search"
              value={customerQuery}
              onChange={(event) => setCustomerQuery(event.target.value)}
              placeholder="Customer code, name, or phone"
            />
            <div className="flex items-end">
              <Button type="button" onClick={handleCustomerSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {customers.length > 0 && (
            <div className="grid gap-2">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelectedCustomer(customer)}
                  className="rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <p className="font-semibold text-gray-900">{customer.fullName}</p>
                  <p className="text-sm text-gray-600">
                    {customer.customerCode} | {customer.phone}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {selectedCustomer && (
        <Card>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <p className="text-sm text-gray-500">Customer Code</p>
              <p className="font-semibold text-gray-900">{selectedCustomer.customerCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-semibold text-gray-900">{selectedCustomer.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-semibold text-gray-900">{selectedCustomer.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Risk Level</p>
              <Badge variant={getRiskBadgeVariant(selectedCustomer.riskLevel)}>
                {selectedCustomer.riskLevel}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={getStatusBadgeVariant(selectedCustomer.status)}>
                {selectedCustomer.status}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {showCustomerWarning && (
        <Card className="border-amber-200 bg-amber-50 text-amber-900">
          <p className="font-semibold">Customer Risk Warning</p>
          <p className="mt-1 text-sm">
            This customer is marked as high risk/watchlist. Please verify with supervisor if required.
          </p>
        </Card>
      )}

      <LockGuard fallback={<LockedActionNotice />}>
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Amount"
                type="number"
                min="1"
                step="0.01"
                required
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 1, message: 'Amount must be greater than 0' },
                })}
                error={errors.amount?.message}
                disabled={isSubmitting || isSystemLocked}
              />

              <div>
                <label htmlFor="paymentMethod" className="mb-2 block text-sm font-medium text-gray-700">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  id="paymentMethod"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting || isSystemLocked}
                  {...register('paymentMethod', { required: 'Payment method is required' })}
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                {errors.paymentMethod && (
                  <p className="mt-1 text-sm text-red-500">{errors.paymentMethod.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="remarks" className="mb-2 block text-sm font-medium text-gray-700">
                Remarks
              </label>
              <textarea
                id="remarks"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || isSystemLocked}
                {...register('remarks')}
              />
            </div>

            {amount && selectedCustomer && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                Confirmation will be requested for NPR {amount} cash-out for {selectedCustomer.fullName}.
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end border-t border-gray-200 pt-5">
              <Button type="submit" disabled={isSubmitting || isSystemLocked}>
                {isSubmitting ? 'Recording...' : 'Record Cash-Out'}
              </Button>
            </div>
          </form>
        </Card>
      </LockGuard>

      <ConfirmDialog
        isOpen={Boolean(pendingCashOut)}
        title="Confirm Cash-Out"
        description={`Are you sure you want to record cash-out of NPR ${pendingCashOut?.amount || 0} for ${selectedCustomer?.fullName || 'selected customer'}?`}
        confirmLabel="Record Cash-Out"
        variant="warning"
        isLoading={isSubmitting}
        onConfirm={confirmCashOut}
        onCancel={() => setPendingCashOut(null)}
      />
    </div>
  )
}

export default CashOut
