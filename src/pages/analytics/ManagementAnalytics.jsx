import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import KpiCard from '../../components/analytics/KpiCard'
import ReportToolbar from '../../components/analytics/ReportToolbar'
import SummaryTable from '../../components/analytics/SummaryTable'
import { analyticsApi } from '../../api/analyticsApi'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import { exportToCsv } from '../../utils/exportUtils'

const currency = (value) => `NPR ${Number(value || 0).toLocaleString()}`
const number = (value) => Number(value || 0).toLocaleString()

const ManagementAnalytics = () => {
  const { businessStatus } = useBusinessStatus()
  const [businessDate, setBusinessDate] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (businessStatus?.businessDate && !businessDate) {
      setBusinessDate(businessStatus.businessDate)
    }
  }, [businessDate, businessStatus?.businessDate])

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await analyticsApi.getBusinessAnalytics({ businessDate })
      setAnalytics(response)
    } catch (loadError) {
      setError(loadError.message || 'Failed to load management analytics.')
    } finally {
      setIsLoading(false)
    }
  }, [businessDate])

  useEffect(() => {
    if (businessDate) {
      loadAnalytics()
    }
  }, [businessDate, loadAnalytics])

  const summaryRows = useMemo(() => {
    if (!analytics) return []

    return [
      {
        Section: 'Cashier',
        'Total Buy-In': analytics.cashier?.totalBuyIn || 0,
        'Total Cash-Out': analytics.cashier?.totalCashOut || 0,
        'Net Position': analytics.cashier?.netCashPosition || 0,
        'Total Transactions': analytics.cashier?.totalTransactions || 0,
        'Unique Customers': analytics.cashier?.uniqueCustomers || 0,
      },
      {
        Section: 'Pit/Table',
        'Open Sessions': analytics.pit?.openSessions || 0,
        'Closed Sessions': analytics.pit?.closedSessions || 0,
        'Total Opening Amount': analytics.pit?.totalOpeningAmount || 0,
        'Total Closing Amount': analytics.pit?.totalClosingAmount || 0,
        'Net Table Position': analytics.pit?.netTablePosition || 0,
        'Pending Review': analytics.pit?.pendingReviewSessions || 0,
      },
      {
        Section: 'Store/Purchase',
        'Pending Requests': analytics.store?.pendingStoreReview || 0,
        'Procurement Required': analytics.store?.procurementRequired || 0,
        'Low Stock Items': analytics.store?.lowStockItems || 0,
        'Partial Deliveries': analytics.store?.partialDeliveries || 0,
        'Full Deliveries': analytics.store?.fullDeliveries || 0,
        'Department Confirmations Pending': analytics.store?.departmentConfirmationsPending || 0,
      },
      {
        Section: 'Accounts',
        'Total Bills': analytics.accounts?.totalBills || 0,
        'Pending Bills': analytics.accounts?.pendingBills || 0,
        'Paid Bills': analytics.accounts?.paidBills || 0,
        'Total Bill Amount': analytics.accounts?.totalBillAmount || 0,
        'Total Paid Amount': analytics.accounts?.totalPaidAmount || 0,
        'Remaining Amount': analytics.accounts?.totalRemainingAmount || 0,
      },
    ]
  }, [analytics])

  const handleExport = () => {
    const exported = exportToCsv(`management-analytics-${businessDate || 'all'}.csv`, summaryRows)
    setMessage(exported ? 'Analytics summary exported.' : 'No analytics rows available to export.')
  }

  const cashierRows = [
    {
      totalBuyIn: currency(analytics?.cashier?.totalBuyIn),
      totalCashOut: currency(analytics?.cashier?.totalCashOut),
      netPosition: currency(analytics?.cashier?.netCashPosition),
      totalTransactions: number(analytics?.cashier?.totalTransactions),
      uniqueCustomers: number(analytics?.cashier?.uniqueCustomers),
    },
  ]

  const pitRows = [
    {
      openSessions: number(analytics?.pit?.openSessions),
      closedSessions: number(analytics?.pit?.closedSessions),
      totalOpeningAmount: currency(analytics?.pit?.totalOpeningAmount),
      totalClosingAmount: currency(analytics?.pit?.totalClosingAmount),
      netTablePosition: currency(analytics?.pit?.netTablePosition),
      pendingReview: number(analytics?.pit?.pendingReviewSessions),
    },
  ]

  const storeRows = [
    {
      pendingRequests: number(analytics?.store?.pendingStoreReview),
      procurementRequired: number(analytics?.store?.procurementRequired),
      lowStockItems: number(analytics?.store?.lowStockItems),
      partialDeliveries: number(analytics?.store?.partialDeliveries),
      fullDeliveries: number(analytics?.store?.fullDeliveries),
      departmentConfirmationsPending: number(analytics?.store?.departmentConfirmationsPending),
    },
  ]

  const accountsRows = [
    {
      totalBills: number(analytics?.accounts?.totalBills),
      pendingBills: number(analytics?.accounts?.pendingBills),
      paidBills: number(analytics?.accounts?.paidBills),
      totalBillAmount: currency(analytics?.accounts?.totalBillAmount),
      totalPaidAmount: currency(analytics?.accounts?.totalPaidAmount),
      remainingAmount: currency(analytics?.accounts?.totalRemainingAmount),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Management Analytics"
        description="Business Date based overview for management, audit, and operational review."
        actions={<Badge variant="info">Business Date: {businessDate || 'Not available'}</Badge>}
      />

      <ReportToolbar
        businessDate={businessDate}
        onBusinessDateChange={setBusinessDate}
        onExport={handleExport}
      >
        <div className="flex items-end">
          <Button type="button" variant="secondary" onClick={loadAnalytics} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </ReportToolbar>

      {message && <Card className="border-blue-200 bg-blue-50 text-sm text-blue-800">{message}</Card>}
      {error && <Card className="border-red-200 bg-red-50 text-sm text-red-700">{error}</Card>}

      <Card className="bg-gray-50 text-sm text-gray-600">
        All analytics on this page are calculated for the selected Business Date. Use ALL only when
        intentionally reviewing cross-date totals. Losing return analysis must use net verified
        customer loss, not gross buy-in.
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Total Buy-In" value={currency(analytics?.cashier?.totalBuyIn)} icon="BI" variant="success" />
        <KpiCard title="Total Cash-Out" value={currency(analytics?.cashier?.totalCashOut)} icon="CO" variant="info" />
        <KpiCard title="Net Cash Position" value={currency(analytics?.cashier?.netCashPosition)} icon="NP" variant="default" />
        <KpiCard title="Total Accounts Payments" value={currency(analytics?.accounts?.totalPayments)} icon="AP" variant="success" />
        <KpiCard title="Total Cash Expenses" value={currency(analytics?.accounts?.totalExpenses)} icon="EX" variant="warning" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Customers" value={number(analytics?.customers?.totalCustomers)} icon="CU" variant="info" />
        <KpiCard title="New Customers" value={number(analytics?.customers?.newCustomers)} description="For selected Business Date" icon="NC" />
        <KpiCard title="Open Table Sessions" value={number(analytics?.pit?.openSessions)} icon="OS" variant="warning" />
        <KpiCard title="Closed Table Sessions" value={number(analytics?.pit?.closedSessions)} icon="CS" />
        <KpiCard title="Pending Store Requests" value={number(analytics?.store?.pendingStoreReview)} icon="SR" variant="warning" />
        <KpiCard title="Pending Approvals" value={number(analytics?.director?.pendingApprovals)} icon="PA" variant="warning" />
        <KpiCard title="Open Alerts" value={number(analytics?.director?.openAlerts)} icon="AL" variant="danger" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="High-Value Transactions" value={number(analytics?.cashier?.highValueTransactions)} icon="HV" variant="danger" />
        <KpiCard title="Watchlist Customers" value={number(analytics?.customers?.watchlistCustomers)} icon="WL" variant="danger" />
        <KpiCard title="Pending Review Table Sessions" value={number(analytics?.pit?.pendingReviewSessions)} icon="PR" variant="warning" />
        <KpiCard title="Critical Audit Logs" value={number(analytics?.audit?.criticalLogs)} icon="CA" variant="danger" />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Cashier Summary</h2>
        <SummaryTable
          columns={[
            { key: 'totalBuyIn', label: 'Total Buy-In' },
            { key: 'totalCashOut', label: 'Total Cash-Out' },
            { key: 'netPosition', label: 'Net Position' },
            { key: 'totalTransactions', label: 'Total Transactions' },
            { key: 'uniqueCustomers', label: 'Unique Customers' },
          ]}
          rows={cashierRows}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Pit/Table Summary</h2>
        <SummaryTable
          columns={[
            { key: 'openSessions', label: 'Open Sessions' },
            { key: 'closedSessions', label: 'Closed Sessions' },
            { key: 'totalOpeningAmount', label: 'Total Opening Amount' },
            { key: 'totalClosingAmount', label: 'Total Closing Amount' },
            { key: 'netTablePosition', label: 'Net Table Position' },
            { key: 'pendingReview', label: 'Pending Review' },
          ]}
          rows={pitRows}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Store/Purchase Summary</h2>
        <SummaryTable
          columns={[
            { key: 'pendingRequests', label: 'Pending Requests' },
            { key: 'procurementRequired', label: 'Procurement Required' },
            { key: 'lowStockItems', label: 'Low Stock Items' },
            { key: 'partialDeliveries', label: 'Partial Deliveries' },
            { key: 'fullDeliveries', label: 'Full Deliveries' },
            { key: 'departmentConfirmationsPending', label: 'Department Confirmations Pending' },
          ]}
          rows={storeRows}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Accounts Summary</h2>
        <SummaryTable
          columns={[
            { key: 'totalBills', label: 'Total Bills' },
            { key: 'pendingBills', label: 'Pending Bills' },
            { key: 'paidBills', label: 'Paid Bills' },
            { key: 'totalBillAmount', label: 'Total Bill Amount' },
            { key: 'totalPaidAmount', label: 'Total Paid Amount' },
            { key: 'remainingAmount', label: 'Remaining Amount' },
          ]}
          rows={accountsRows}
        />
      </div>
    </div>
  )
}

export default ManagementAnalytics
