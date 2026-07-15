import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import { getTransactionReport } from '../../api/reportApi'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { BUY_IN, CASH_OUT, PAYMENT_METHODS } from '../../constants/transactionTypes'
import { safeLogAuditEvent } from '../../services/auditService'
import { exportToCsv } from '../../utils/exportUtils'
import {
  formatTransactionType,
  getTransactionTypeBadgeVariant,
} from '../../utils/transactionUtils'
import { formatDateTime } from '../../utils/customerUtils'

const formatAmount = (amount) => `NPR ${Number(amount || 0).toLocaleString()}`

const TransactionReport = () => {
  const { businessStatus } = useBusinessStatus()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [businessDate, setBusinessDate] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [transactionType, setTransactionType] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportMessage, setExportMessage] = useState('')

  useEffect(() => {
    if (businessStatus?.businessDate && !businessDate) {
      setBusinessDate(businessStatus.businessDate)
    }
  }, [businessDate, businessStatus?.businessDate])

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await getTransactionReport({
          businessDate,
          customerSearch,
          transactionType,
          paymentMethod,
        })
        setReport(data)
      } catch (err) {
        setError(err.message || 'Failed to load transaction report.')
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [businessDate, customerSearch, paymentMethod, transactionType])

  const transactions = report?.transactions || []

  const handleExport = async () => {
    if (transactions.length === 0) {
      setExportMessage('No data available to export for the selected filters.')
      showToast({ type: 'warning', title: 'Nothing to Export', message: 'No data available to export for the selected filters.' })
      return
    }

    const rows = transactions.map((transaction) => ({
      Reference: transaction.reference,
      'Customer Code': transaction.customerCode,
      'Customer Name': transaction.customerName,
      Type: transaction.transactionType,
      Amount: transaction.amount,
      'Payment Method': transaction.paymentMethod,
      'Business Date': transaction.businessDate,
      'Created By': transaction.createdBy,
      'Created At': transaction.createdAt,
    }))
    exportToCsv(`transaction-report-${businessDate || 'all'}.csv`, rows)
    setExportMessage(`Exported ${rows.length} rows.`)
    showToast({ type: 'success', title: 'CSV Exported', message: `${rows.length} rows exported.` })
    await safeLogAuditEvent({
      module: AUDIT_MODULES.REPORTS,
      action: AUDIT_ACTIONS.EXPORT,
      severity: AUDIT_SEVERITY.LOW,
      description: 'Transaction Report exported.',
      businessDate,
      performedBy: user?.fullName || user?.username,
      performedByRole: user?.role,
      entityType: 'REPORT_EXPORT',
      metadata: { reportName: 'Transaction Report', businessDate, rowCount: rows.length },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction Report"
        description="Filter cashier transactions by Business Date, customer, type, and payment method."
        actions={
          <Button variant="outline" onClick={handleExport}>
            Export CSV
          </Button>
        }
      />

      {exportMessage && (
        <Card className="border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-900">{exportMessage}</p>
        </Card>
      )}

      <Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input label="Business Date" value={businessDate} onChange={(event) => setBusinessDate(event.target.value)} placeholder="Business Date" />
          <Input label="Customer Search" value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Customer name or code" />

          <div>
            <label htmlFor="transactionType" className="mb-2 block text-sm font-medium text-gray-700">Transaction Type</label>
            <select id="transactionType" value={transactionType} onChange={(event) => setTransactionType(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All</option>
              <option value={BUY_IN}>BUY_IN</option>
              <option value={CASH_OUT}>CASH_OUT</option>
            </select>
          </div>

          <div>
            <label htmlFor="paymentMethod" className="mb-2 block text-sm font-medium text-gray-700">Payment Method</label>
            <select id="paymentMethod" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All</option>
              {Object.values(PAYMENT_METHODS).map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading transaction report...</p>}
        {!isLoading && !error && transactions.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-semibold text-gray-900">No transactions found.</p>
            <p className="mt-1 text-sm text-gray-600">
              Adjust the Business Date or filters to find cashier transactions.
            </p>
          </div>
        )}
        {!isLoading && transactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Reference', 'Customer Code', 'Customer Name', 'Type', 'Amount', 'Payment Method', 'Business Date', 'Created By', 'Created At'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{transaction.reference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{transaction.customerCode}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{transaction.customerName}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={getTransactionTypeBadgeVariant(transaction.transactionType)}>
                        {formatTransactionType(transaction.transactionType)}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{formatAmount(transaction.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{transaction.paymentMethod}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{transaction.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{transaction.createdBy}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDateTime(transaction.createdAt)}</td>
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

export default TransactionReport
