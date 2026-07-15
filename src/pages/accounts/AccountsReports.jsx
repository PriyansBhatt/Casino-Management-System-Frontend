import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import DashboardCard from '../../components/dashboard/DashboardCard'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import { getBills, getExpenses, getPayments } from '../../api/accountsApi'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import {
  BILL_STATUSES,
  PAYMENT_METHODS,
} from '../../constants/accountsConstants'
import { safeLogAuditEvent } from '../../services/auditService'
import { exportToCsv } from '../../utils/exportUtils'
import {
  getBillStatusBadgeVariant,
  getPaymentMethodBadgeVariant,
  getPaymentStatusBadgeVariant,
} from '../../utils/accountsUtils'

const formatMoney = (value) => `NPR ${Number(value || 0).toLocaleString()}`

const AccountsReports = () => {
  const { businessStatus } = useBusinessStatus()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [businessDate, setBusinessDate] = useState('')
  const [bills, setBills] = useState([])
  const [expenses, setExpenses] = useState([])
  const [payments, setPayments] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (businessStatus?.businessDate && !businessDate) {
      setBusinessDate(businessStatus.businessDate)
    }
  }, [businessStatus?.businessDate, businessDate])

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true)
      setError('')

      try {
        const filters = businessDate ? { businessDate } : {}
        const [billData, expenseData, paymentData] = await Promise.all([
          getBills(filters),
          getExpenses(filters),
          getPayments(filters),
        ])
        setBills(billData)
        setExpenses(expenseData)
        setPayments(paymentData)
      } catch (err) {
        setError(err.message || 'Failed to load accounts reports.')
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [businessDate])

  const totalBills = bills.length
  const pendingBills = bills.filter((bill) => bill.status === BILL_STATUSES.PENDING).length
  const verifiedBills = bills.filter((bill) => bill.status === BILL_STATUSES.VERIFIED).length
  const paidBills = bills.filter((bill) => bill.status === BILL_STATUSES.PAID).length
  const totalBillAmount = bills.reduce((sum, bill) => sum + Number(bill.billAmount || 0), 0)
  const totalPaidAmount = bills.reduce((sum, bill) => sum + Number(bill.paidAmount || 0), 0)
  const totalRemainingAmount = bills.reduce((sum, bill) => sum + Number(bill.remainingAmount || 0), 0)
  const totalCashExpenses = expenses
    .filter((expense) => expense.paymentMethod === PAYMENT_METHODS.CASH)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const totalPayments = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  const handleExport = async () => {
    const rows = [
      ...bills.map((bill) => ({
        Section: 'Bill Summary',
        Reference: bill.billReference,
        Vendor: bill.vendorName,
        Amount: bill.billAmount,
        'Paid Amount': bill.paidAmount,
        'Remaining Amount': bill.remainingAmount,
        'Payment Method': '',
        'Business Date': bill.businessDate,
        Status: bill.status,
        'Created By': '',
      })),
      ...expenses.map((expense) => ({
        Section: 'Expense Summary',
        Reference: expense.expenseReference,
        Vendor: '',
        Amount: expense.amount,
        'Paid Amount': '',
        'Remaining Amount': '',
        'Payment Method': expense.paymentMethod,
        'Business Date': expense.businessDate,
        Status: expense.category,
        'Created By': expense.createdBy,
      })),
      ...payments.map((payment) => ({
        Section: 'Payment Summary',
        Reference: payment.paymentReference,
        Vendor: payment.vendorName,
        Amount: payment.amount,
        'Paid Amount': payment.amount,
        'Remaining Amount': '',
        'Payment Method': payment.paymentMethod,
        'Business Date': payment.businessDate,
        Status: payment.status,
        'Created By': payment.paidBy,
      })),
    ]

    if (rows.length === 0) {
      setMessage('No data available to export for the selected filters.')
      showToast({ type: 'warning', title: 'Nothing to Export', message: 'No data available to export for the selected filters.' })
      return
    }

    exportToCsv(`accounts-reports-${businessDate || 'all'}.csv`, rows)
    setMessage(`Exported ${rows.length} rows.`)
    showToast({ type: 'success', title: 'CSV Exported', message: `${rows.length} rows exported.` })
    await safeLogAuditEvent({
      module: AUDIT_MODULES.REPORTS,
      action: AUDIT_ACTIONS.EXPORT,
      severity: AUDIT_SEVERITY.LOW,
      description: 'Accounts Reports exported.',
      businessDate,
      performedBy: user?.fullName || user?.username,
      performedByRole: user?.role,
      entityType: 'REPORT_EXPORT',
      metadata: { reportName: 'Accounts Reports', businessDate, rowCount: rows.length },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts Reports"
        description="Business Date based bills, expenses, and payment summaries."
        actions={<Button variant="outline" onClick={handleExport}>Export CSV</Button>}
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="Business Date"
            value={businessDate}
            onChange={(event) => setBusinessDate(event.target.value)}
            placeholder="Leave blank for all Business Dates"
          />
          <div className="flex items-end">
            <Button type="button" variant="secondary" onClick={() => setBusinessDate('')}>
              Show All Business Dates
            </Button>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Reports use Business Date. Leave the filter blank only when you intentionally want all Business Dates.
        </p>
      </Card>

      {message && <Card className="border-blue-200 bg-blue-50"><p className="text-sm text-blue-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardCard title="Total Bills" value={totalBills} icon="BL" variant="info" />
        <DashboardCard title="Pending Bills" value={pendingBills} icon="PN" variant="warning" />
        <DashboardCard title="Verified Bills" value={verifiedBills} icon="VF" variant="info" />
        <DashboardCard title="Paid Bills" value={paidBills} icon="PD" variant="success" />
        <DashboardCard title="Business Date" value={businessDate || 'All'} icon="BD" variant="default" />
        <DashboardCard title="Total Bill Amount" value={formatMoney(totalBillAmount)} icon="TA" variant="default" />
        <DashboardCard title="Total Paid Amount" value={formatMoney(totalPaidAmount)} icon="PA" variant="success" />
        <DashboardCard title="Total Remaining Amount" value={formatMoney(totalRemainingAmount)} icon="RA" variant="warning" />
        <DashboardCard title="Total Cash Expenses" value={formatMoney(totalCashExpenses)} icon="CE" variant="danger" />
        <DashboardCard title="Total Payments" value={formatMoney(totalPayments)} icon="TP" variant="info" />
      </div>

      {isLoading && <Card><p className="text-sm text-gray-600">Loading accounts reports...</p></Card>}

      {!isLoading && (
        <>
          <Card className="overflow-hidden p-0">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">A. Bill Summary</h2>
            </div>
            {bills.length === 0 ? (
              <p className="p-6 text-sm text-gray-600">No bills found for selected Business Date.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Bill Reference', 'Vendor', 'Bill Amount', 'Paid Amount', 'Remaining Amount', 'Status'].map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {bills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{bill.billReference}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{bill.vendorName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatMoney(bill.billAmount)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatMoney(bill.paidAmount)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{formatMoney(bill.remainingAmount)}</td>
                        <td className="whitespace-nowrap px-4 py-3"><Badge variant={getBillStatusBadgeVariant(bill.status)}>{bill.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">B. Expense Summary</h2>
            </div>
            {expenses.length === 0 ? (
              <p className="p-6 text-sm text-gray-600">No expenses found for selected Business Date.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Expense Reference', 'Category', 'Amount', 'Payment Method', 'Created By'].map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{expense.expenseReference}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{expense.category}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{formatMoney(expense.amount)}</td>
                        <td className="whitespace-nowrap px-4 py-3"><Badge variant={getPaymentMethodBadgeVariant(expense.paymentMethod)}>{expense.paymentMethod}</Badge></td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{expense.createdBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">C. Payment Summary</h2>
            </div>
            {payments.length === 0 ? (
              <p className="p-6 text-sm text-gray-600">No payments found for selected Business Date.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Payment Reference', 'Vendor', 'Amount', 'Payment Method', 'Business Date', 'Status'].map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{payment.paymentReference}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.vendorName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{formatMoney(payment.amount)}</td>
                        <td className="whitespace-nowrap px-4 py-3"><Badge variant={getPaymentMethodBadgeVariant(payment.paymentMethod)}>{payment.paymentMethod}</Badge></td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.businessDate}</td>
                        <td className="whitespace-nowrap px-4 py-3"><Badge variant={getPaymentStatusBadgeVariant(payment.status)}>{payment.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

export default AccountsReports
