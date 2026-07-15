import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import BusinessStatusBadge from '../../components/business/BusinessStatusBadge'
import DashboardCard from '../../components/dashboard/DashboardCard'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import { getDailyBusinessReport } from '../../api/reportApi'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { safeLogAuditEvent } from '../../services/auditService'
import { exportToCsv } from '../../utils/exportUtils'
import {
  formatTransactionType,
  getTransactionTypeBadgeVariant,
} from '../../utils/transactionUtils'
import { formatDateTime } from '../../utils/customerUtils'

const formatAmount = (amount) => `NPR ${Number(amount || 0).toLocaleString()}`

const DailyBusinessReport = () => {
  const { businessStatus } = useBusinessStatus()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [businessDate, setBusinessDate] = useState('')
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
        const data = await getDailyBusinessReport({ businessDate })
        setReport(data)
      } catch (err) {
        setError(err.message || 'Failed to load daily business report.')
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [businessDate])

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
      Remarks: transaction.remarks || '',
    }))
    exportToCsv(`daily-business-report-${businessDate || 'all'}.csv`, rows)
    setExportMessage(`Exported ${rows.length} rows.`)
    showToast({ type: 'success', title: 'CSV Exported', message: `${rows.length} rows exported.` })
    await safeLogAuditEvent({
      module: AUDIT_MODULES.REPORTS,
      action: AUDIT_ACTIONS.EXPORT,
      severity: AUDIT_SEVERITY.LOW,
      description: 'Daily Business Report exported.',
      businessDate,
      performedBy: user?.fullName || user?.username,
      performedByRole: user?.role,
      entityType: 'REPORT_EXPORT',
      metadata: { reportName: 'Daily Business Report', businessDate, rowCount: rows.length },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Business Report"
        description="Business Date report for casino cashier activity."
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
        <Input
          label="Business Date"
          value={businessDate}
          onChange={(event) => setBusinessDate(event.target.value)}
          placeholder="Business Date"
        />
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Total Buy-In" value={isLoading ? 'Loading...' : formatAmount(report?.totalBuyIn)} description="Selected Business Date only." icon="BI" variant="success" />
        <DashboardCard title="Total Cash-Out" value={isLoading ? 'Loading...' : formatAmount(report?.totalCashOut)} description="Selected Business Date only." icon="CO" variant="warning" />
        <DashboardCard title="Net Cash Position" value={isLoading ? 'Loading...' : formatAmount(report?.netPosition)} description="Total Buy-In minus Total Cash-Out." icon="NC" variant={Number(report?.netPosition || 0) >= 0 ? 'info' : 'danger'} />
        <DashboardCard title="Total Transactions" value={isLoading ? 'Loading...' : report?.transactionCount || 0} description="Selected Business Date only." icon="TX" variant="default" />
        <DashboardCard title="Unique Customers" value={isLoading ? 'Loading...' : report?.uniqueCustomers || 0} description="Customers with transactions." icon="UC" variant="info" />
        <DashboardCard title="Business Date" value={businessDate || 'Not available'} description="Reports do not use calendar date." icon="BD" variant="info" />
        <Card>
          <p className="text-sm font-medium text-gray-500">System Status</p>
          <div className="mt-3">
            <BusinessStatusBadge status={businessStatus?.systemStatus || 'UNKNOWN'} />
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading report transactions...</p>}
        {!isLoading && !error && transactions.length === 0 && (
          <div className="p-6">
            <EmptyState
              title="No transactions found"
              description="This report only includes transactions for the selected Business Date."
            />
          </div>
        )}
        {!isLoading && transactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Reference', 'Customer Code', 'Customer Name', 'Type', 'Amount', 'Payment Method', 'Created By', 'Created At', 'Remarks'].map((header) => (
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
    </div>
  )
}

export default DailyBusinessReport
