import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import TableToolbar from '../../components/ui/TableToolbar'
import LockedActionNotice from '../../components/business/LockedActionNotice'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useToast from '../../hooks/useToast'
import { createExpense, getExpenses } from '../../api/accountsApi'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../constants/accountsConstants'
import { getPaymentMethodBadgeVariant } from '../../utils/accountsUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { getErrorMessage } from '../../utils/errorUtils'

const categories = Object.values(EXPENSE_CATEGORIES)
const paymentMethods = Object.values(PAYMENT_METHODS)
const formatMoney = (value) => `NPR ${Number(value || 0).toLocaleString()}`

const CashExpenses = () => {
  const { user } = useAuth()
  const { businessStatus, isSystemLocked } = useBusinessStatus()
  const { showToast } = useToast()
  const [expenses, setExpenses] = useState([])
  const [filters, setFilters] = useState({ category: '', businessDate: '', paymentMethod: '' })
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      category: EXPENSE_CATEGORIES.PROCUREMENT,
      description: '',
      amount: '',
      paymentMethod: PAYMENT_METHODS.CASH,
      expenseDate: '',
      remarks: '',
    },
  })

  useEffect(() => {
    if (businessStatus?.businessDate && !filters.businessDate) {
      setFilters((current) => ({ ...current, businessDate: businessStatus.businessDate }))
    }
  }, [businessStatus?.businessDate, filters.businessDate])

  const loadExpenses = async () => {
    setIsLoading(true)
    setError('')
    try {
      setExpenses(await getExpenses(filters))
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Expenses Failed to Load', message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [filters])

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  const resetFilters = () => {
    setFilters({ category: '', businessDate: businessStatus?.businessDate || '', paymentMethod: '' })
  }

  const onSubmit = async (data) => {
    setIsSaving(true)
    setMessage('')
    setError('')
    try {
      const expense = await createExpense({
        ...data,
        amount: Number(data.amount || 0),
        businessDate: businessStatus?.businessDate,
        createdBy: user?.username || user?.fullName,
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.ACCOUNTS,
        action: AUDIT_ACTIONS.CREATE,
        severity: Number(data.amount || 0) >= 100000 ? AUDIT_SEVERITY.HIGH : AUDIT_SEVERITY.MEDIUM,
        description: `Expense ${expense.expenseReference} created.`,
        businessDate: businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'EXPENSE',
        entityId: expense.id,
        newValue: expense,
        reason: data.remarks,
      })
      setMessage('Expense created.')
      showToast({ type: 'success', title: 'Expense Created', message: expense.expenseReference })
      reset()
      setShowForm(false)
      await loadExpenses()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Create Expense Failed', message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Expenses"
        description="Record Business Date based cash and operating expenses."
        actions={<Button onClick={() => setShowForm((value) => !value)}>{showForm ? 'Close Form' : 'Create Expense'}</Button>}
      />

      {isSystemLocked && <LockedActionNotice />}

      <TableToolbar
        title="Expense Filters"
        description="Cash expenses should use the current Business Date unless reviewing all dates intentionally."
        onReset={resetFilters}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="categoryFilter" className="mb-2 block text-sm font-medium text-gray-700">Category</label>
            <select id="categoryFilter" value={filters.category} onChange={(event) => updateFilter('category', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <Input label="Business Date" value={filters.businessDate} onChange={(event) => updateFilter('businessDate', event.target.value)} />
          <div>
            <label htmlFor="methodFilter" className="mb-2 block text-sm font-medium text-gray-700">Payment Method</label>
            <select id="methodFilter" value={filters.paymentMethod} onChange={(event) => updateFilter('paymentMethod', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All methods</option>
              {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
            </select>
          </div>
        </div>
      </TableToolbar>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Create Expense</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label>
                <select id="category" {...register('category', { required: 'Category is required' })} disabled={isSaving} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <Input label="Description" required {...register('description', { required: 'Description is required' })} error={errors.description?.message} disabled={isSaving || isSystemLocked} />
              <Input label="Amount" type="number" min="1" required {...register('amount', { required: 'Amount is required', min: { value: 1, message: 'Amount must be greater than 0' } })} error={errors.amount?.message} disabled={isSaving || isSystemLocked} />
              <div>
                <label htmlFor="paymentMethod" className="mb-2 block text-sm font-medium text-gray-700">Payment Method <span className="text-red-500">*</span></label>
                <select id="paymentMethod" {...register('paymentMethod', { required: 'Payment method is required' })} disabled={isSaving || isSystemLocked} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </div>
              <Input label="Expense Date" type="date" required {...register('expenseDate', { required: 'Expense date is required' })} error={errors.expenseDate?.message} disabled={isSaving || isSystemLocked} />
              <Input label="Business Date" value={businessStatus?.businessDate || 'Not available'} disabled />
              <div className="md:col-span-3">
                <label htmlFor="remarks" className="mb-2 block text-sm font-medium text-gray-700">Remarks</label>
                <textarea id="remarks" rows={3} {...register('remarks')} disabled={isSaving || isSystemLocked} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving || isSystemLocked}>{isSaving ? 'Saving...' : 'Create Expense'}</Button>
            </div>
          </form>
        </Card>
      )}

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading expenses...</p>}
        {!isLoading && !error && expenses.length === 0 && (
          <div className="p-6">
            <EmptyState
              title="No expenses found"
              description="Create an expense for the current Business Date."
              action={<Button variant="secondary" onClick={resetFilters}>Reset Filters</Button>}
            />
          </div>
        )}
        {expenses.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Expense Reference', 'Category', 'Description', 'Amount', 'Payment Method', 'Business Date', 'Expense Date', 'Created By', 'Remarks'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{expense.expenseReference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{expense.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{expense.description}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{formatMoney(expense.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getPaymentMethodBadgeVariant(expense.paymentMethod)}>{expense.paymentMethod}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{expense.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{expense.expenseDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{expense.createdBy}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{expense.remarks || 'Not available'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default CashExpenses
