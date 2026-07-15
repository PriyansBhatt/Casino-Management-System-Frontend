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
import { getVendorPaymentHistory } from '../../api/accountsApi'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '../../constants/accountsConstants'
import { safeLogAuditEvent } from '../../services/auditService'
import { exportToCsv } from '../../utils/exportUtils'
import {
  getPaymentMethodBadgeVariant,
  getPaymentStatusBadgeVariant,
} from '../../utils/accountsUtils'

const paymentMethods = Object.values(PAYMENT_METHODS)
const paymentStatuses = Object.values(PAYMENT_STATUSES)
const formatMoney = (value) => `NPR ${Number(value || 0).toLocaleString()}`

const VendorPaymentHistory = () => {
  const { businessStatus } = useBusinessStatus()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [payments, setPayments] = useState([])
  const [filters, setFilters] = useState({
    vendor: '',
    businessDate: '',
    paymentMethod: '',
    status: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (businessStatus?.businessDate && !filters.businessDate) {
      setFilters((current) => ({ ...current, businessDate: businessStatus.businessDate }))
    }
  }, [businessStatus?.businessDate, filters.businessDate])

  useEffect(() => {
    const loadPayments = async () => {
      setIsLoading(true)
      setError('')

      try {
        setPayments(await getVendorPaymentHistory(filters))
      } catch (err) {
        setError(err.message || 'Failed to load vendor payment history.')
      } finally {
        setIsLoading(false)
      }
    }

    loadPayments()
  }, [filters])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const totalCash = payments
    .filter((payment) => payment.paymentMethod === PAYMENT_METHODS.CASH)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const totalCheque = payments
    .filter((payment) => payment.paymentMethod === PAYMENT_METHODS.CHEQUE)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const totalBank = payments
    .filter((payment) => payment.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const totalVendors = new Set(payments.map((payment) => payment.vendorName).filter(Boolean)).size

  const handleExport = async () => {
    if (payments.length === 0) {
      setMessage('No data available to export for the selected filters.')
      showToast({ type: 'warning', title: 'Nothing to Export', message: 'No data available to export for the selected filters.' })
      return
    }

    const rows = payments.map((payment) => ({
      'Vendor Name': payment.vendorName,
      'Payment Reference': payment.paymentReference,
      'Bill Reference': payment.billReference || payment.billId || '',
      'Amount Paid': payment.amount,
      'Payment Method': payment.paymentMethod,
      'Cheque Number': payment.chequeNumber || '',
      'Payment Date': payment.paymentDate,
      'Business Date': payment.businessDate,
      Status: payment.status,
      'Paid By': payment.paidBy,
      Remarks: payment.remarks || '',
    }))
    exportToCsv(`vendor-payment-history-${filters.businessDate || 'all'}.csv`, rows)
    setMessage(`Exported ${rows.length} rows.`)
    showToast({ type: 'success', title: 'CSV Exported', message: `${rows.length} rows exported.` })
    await safeLogAuditEvent({
      module: AUDIT_MODULES.REPORTS,
      action: AUDIT_ACTIONS.EXPORT,
      severity: AUDIT_SEVERITY.LOW,
      description: 'Vendor Payment History exported.',
      businessDate: filters.businessDate,
      performedBy: user?.fullName || user?.username,
      performedByRole: user?.role,
      entityType: 'REPORT_EXPORT',
      metadata: {
        reportName: 'Vendor Payment History',
        businessDate: filters.businessDate,
        rowCount: rows.length,
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Payment History"
        description="Review vendor-wise Business Date payment history."
        actions={<Button variant="outline" onClick={handleExport}>Export CSV</Button>}
      />

      {message && <Card className="border-blue-200 bg-blue-50"><p className="text-sm text-blue-700">{message}</p></Card>}

      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Input
            label="Vendor Name"
            value={filters.vendor}
            onChange={(event) => updateFilter('vendor', event.target.value)}
            placeholder="Search vendor"
          />
          <Input
            label="Business Date"
            value={filters.businessDate}
            onChange={(event) => updateFilter('businessDate', event.target.value)}
          />
          <div>
            <label htmlFor="paymentMethod" className="mb-2 block text-sm font-medium text-gray-700">Payment Method</label>
            <select id="paymentMethod" value={filters.paymentMethod} onChange={(event) => updateFilter('paymentMethod', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All methods</option>
              {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="paymentStatus" className="mb-2 block text-sm font-medium text-gray-700">Payment Status</label>
            <select id="paymentStatus" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All statuses</option>
              {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardCard title="Total Paid" value={formatMoney(totalPaid)} icon="TP" variant="success" />
        <DashboardCard title="Total Cash Payments" value={formatMoney(totalCash)} icon="CA" variant="info" />
        <DashboardCard title="Total Cheque Payments" value={formatMoney(totalCheque)} icon="CH" variant="warning" />
        <DashboardCard title="Total Bank Transfers" value={formatMoney(totalBank)} icon="BT" variant="default" />
        <DashboardCard title="Total Vendors Paid" value={totalVendors} icon="VP" variant="info" />
      </div>

      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading vendor payments...</p>}
        {!isLoading && !error && payments.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-semibold text-gray-900">No vendor payments found.</p>
            <p className="mt-1 text-sm text-gray-600">Record bill payments to build vendor history.</p>
          </div>
        )}
        {payments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Vendor Name', 'Payment Reference', 'Bill Reference', 'Amount Paid', 'Payment Method', 'Cheque Number', 'Payment Date', 'Business Date', 'Status', 'Paid By', 'Remarks'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{payment.vendorName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.paymentReference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.billReference || payment.billId || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{formatMoney(payment.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getPaymentMethodBadgeVariant(payment.paymentMethod)}>{payment.paymentMethod}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.chequeNumber || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.paymentDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getPaymentStatusBadgeVariant(payment.status)}>{payment.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.paidBy}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{payment.remarks || 'Not available'}</td>
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

export default VendorPaymentHistory
