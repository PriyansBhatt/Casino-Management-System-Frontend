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
import { searchCustomers } from '../../api/customerApi'
import { getCustomerTransactionReport } from '../../api/reportApi'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { safeLogAuditEvent } from '../../services/auditService'
import { exportToCsv } from '../../utils/exportUtils'
import {
  formatTransactionType,
  getTransactionTypeBadgeVariant,
} from '../../utils/transactionUtils'
import {
  formatDateTime,
  getRiskBadgeVariant,
  getStatusBadgeVariant,
} from '../../utils/customerUtils'

const formatAmount = (amount) => `NPR ${Number(amount || 0).toLocaleString()}`

const CustomerTransactionReport = () => {
  const { businessStatus } = useBusinessStatus()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [businessDate, setBusinessDate] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [report, setReport] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [exportMessage, setExportMessage] = useState('')

  useEffect(() => {
    if (businessStatus?.businessDate && !businessDate) {
      setBusinessDate(businessStatus.businessDate)
    }
  }, [businessDate, businessStatus?.businessDate])

  useEffect(() => {
    const loadReport = async () => {
      if (!selectedCustomer) {
        setReport(null)
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const data = await getCustomerTransactionReport(selectedCustomer.id, { businessDate })
        setReport(data)
      } catch (err) {
        setError(err.message || 'Failed to load customer transaction report.')
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [businessDate, selectedCustomer])

  const handleCustomerSearch = async () => {
    setIsSearching(true)
    setError('')

    try {
      const results = await searchCustomers(customerQuery)
      setCustomers(results)
    } catch (err) {
      setError(err.message || 'Failed to search customers.')
    } finally {
      setIsSearching(false)
    }
  }

  const transactions = report?.transactions || []

  const handleExport = async () => {
    if (transactions.length === 0) {
      setExportMessage('No data available to export for the selected filters.')
      showToast({ type: 'warning', title: 'Nothing to Export', message: 'No data available to export for the selected filters.' })
      return
    }

    const rows = transactions.map((transaction) => ({
      Reference: transaction.reference,
      Type: transaction.transactionType,
      Amount: transaction.amount,
      'Payment Method': transaction.paymentMethod,
      'Business Date': transaction.businessDate,
      'Created By': transaction.createdBy,
      'Created At': transaction.createdAt,
      Remarks: transaction.remarks || '',
    }))
    exportToCsv(`customer-transaction-report-${businessDate || 'all'}.csv`, rows)
    setExportMessage(`Exported ${rows.length} rows.`)
    showToast({ type: 'success', title: 'CSV Exported', message: `${rows.length} rows exported.` })
    await safeLogAuditEvent({
      module: AUDIT_MODULES.REPORTS,
      action: AUDIT_ACTIONS.EXPORT,
      severity: AUDIT_SEVERITY.LOW,
      description: 'Customer Transaction Report exported.',
      businessDate,
      performedBy: user?.fullName || user?.username,
      performedByRole: user?.role,
      entityType: 'REPORT_EXPORT',
      entityId: selectedCustomer?.id,
      metadata: {
        reportName: 'Customer Transaction Report',
        businessDate,
        rowCount: rows.length,
        customerCode: selectedCustomer?.customerCode,
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Transaction Report"
        description="Review a customer's buy-ins and cash-outs by Business Date."
        actions={<Button variant="outline" onClick={handleExport}>Export CSV</Button>}
      />

      {exportMessage && (
        <Card className="border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-900">{exportMessage}</p>
        </Card>
      )}

      <Card>
        <div className="grid gap-4 lg:grid-cols-3">
          <Input
            label="Customer Search"
            value={customerQuery}
            onChange={(event) => setCustomerQuery(event.target.value)}
            placeholder="Customer code, name, or phone"
          />
          <Input
            label="Business Date"
            value={businessDate}
            onChange={(event) => setBusinessDate(event.target.value)}
            placeholder="Business Date"
          />
          <div className="flex items-end">
            <Button type="button" onClick={handleCustomerSearch} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search Customer'}
            </Button>
          </div>
        </div>

        {customers.length > 0 && (
          <div className="mt-4 grid gap-2">
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
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </Card>
      )}

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
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={getStatusBadgeVariant(selectedCustomer.status)}>
                {selectedCustomer.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Risk Level</p>
              <Badge variant={getRiskBadgeVariant(selectedCustomer.riskLevel)}>
                {selectedCustomer.riskLevel}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {selectedCustomer && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard title="Total Buy-In" value={isLoading ? 'Loading...' : formatAmount(report?.totalBuyIn)} description="Selected Business Date only." icon="BI" variant="success" />
          <DashboardCard title="Total Cash-Out" value={isLoading ? 'Loading...' : formatAmount(report?.totalCashOut)} description="Selected Business Date only." icon="CO" variant="warning" />
          <DashboardCard title="Net Position" value={isLoading ? 'Loading...' : formatAmount(report?.netPosition)} description="Total Buy-In minus Total Cash-Out." icon="NP" variant={Number(report?.netPosition || 0) >= 0 ? 'info' : 'danger'} />
          <DashboardCard title="Total Transactions" value={isLoading ? 'Loading...' : report?.transactionCount || 0} description="Selected customer transactions." icon="TX" />
        </div>
      )}

      {selectedCustomer && (
        <Card className="overflow-hidden p-0">
          {isLoading && <p className="p-6 text-sm text-gray-600">Loading transactions...</p>}
          {!isLoading && transactions.length === 0 && (
            <div className="p-6 text-center">
              <p className="font-semibold text-gray-900">No transactions found.</p>
              <p className="mt-1 text-sm text-gray-600">
                This customer has no transactions for the selected Business Date.
              </p>
            </div>
          )}
          {!isLoading && transactions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Reference', 'Type', 'Amount', 'Payment Method', 'Business Date', 'Created By', 'Created At', 'Remarks'].map((header) => (
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
                      <td className="px-4 py-3 text-sm text-gray-700">{transaction.remarks || 'Not available'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default CustomerTransactionReport
