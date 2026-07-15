import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import { getPayments } from '../../api/accountsApi'
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '../../constants/accountsConstants'
import {
  getPaymentMethodBadgeVariant,
  getPaymentStatusBadgeVariant,
} from '../../utils/accountsUtils'

const paymentStatuses = Object.values(PAYMENT_STATUSES)
const formatMoney = (value) => `NPR ${Number(value || 0).toLocaleString()}`

const ChequePayments = () => {
  const { businessStatus } = useBusinessStatus()
  const [payments, setPayments] = useState([])
  const [filters, setFilters] = useState({ vendor: '', businessDate: '', status: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

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
        setPayments(await getPayments({ ...filters, paymentMethod: PAYMENT_METHODS.CHEQUE }))
      } catch (err) {
        setError(err.message || 'Failed to load cheque payments.')
      } finally {
        setIsLoading(false)
      }
    }

    loadPayments()
  }, [filters])

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cheque Payments"
        description="Review cheque payments recorded against bills and vendors."
      />

      <Card className="border-blue-200 bg-blue-50">
        <p className="text-sm text-blue-900">
          Cheque payments are normally processed weekly as per casino accounts workflow.
        </p>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Vendor Name" value={filters.vendor} onChange={(event) => updateFilter('vendor', event.target.value)} />
          <Input label="Business Date" value={filters.businessDate} onChange={(event) => updateFilter('businessDate', event.target.value)} />
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-700">Payment Status</label>
            <select id="status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All statuses</option>
              {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading cheque payments...</p>}
        {!isLoading && !error && payments.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-semibold text-gray-900">No cheque payments found.</p>
            <p className="mt-1 text-sm text-gray-600">Record a cheque payment from Bills to see it here.</p>
          </div>
        )}
        {payments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Payment Reference', 'Vendor Name', 'Bill Reference', 'Amount', 'Cheque Number', 'Payment Date', 'Business Date', 'Status', 'Paid By', 'Remarks'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{payment.paymentReference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.vendorName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.billReference || payment.billId || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{formatMoney(payment.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.chequeNumber || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.paymentDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getPaymentStatusBadgeVariant(payment.status)}>{payment.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{payment.paidBy}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{payment.remarks || 'Not available'} <Badge variant={getPaymentMethodBadgeVariant(payment.paymentMethod)}>{payment.paymentMethod}</Badge></td>
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

export default ChequePayments
