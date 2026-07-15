import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import { getProcurementList, markProcurementOrdered } from '../../api/storeApi'
import { REQUEST_STATUSES } from '../../constants/storeConstants'
import { getRequestStatusBadgeVariant } from '../../utils/storeUtils'
import { formatDateTime } from '../../utils/customerUtils'

const statuses = Object.values(REQUEST_STATUSES)

const ProcurementList = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { businessStatus } = useBusinessStatus()
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [filters, setFilters] = useState({ status: '', businessDate: '', vendor: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (businessStatus?.businessDate && !filters.businessDate) {
      setFilters((current) => ({ ...current, businessDate: businessStatus.businessDate }))
    }
  }, [businessStatus?.businessDate, filters.businessDate])

  const loadItems = async () => {
    setIsLoading(true)
    setError('')
    try {
      setItems(await getProcurementList(filters))
    } catch (err) {
      setError(err.message || 'Failed to load procurement items.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [filters])

  const markOrdered = async (item) => {
    setIsSaving(true)
    setMessage('')
    setError('')
    try {
      await markProcurementOrdered(item.id, { orderedBy: user?.username || user?.fullName })
      setMessage(`${item.reference} marked ordered.`)
      await loadItems()
    } catch (err) {
      setError(err.message || 'Failed to mark item ordered.')
    } finally {
      setIsSaving(false)
    }
  }

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  return (
    <div className="space-y-6">
      <PageHeader title="Procurement List" description="Track procurement items created from store review." />

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-700">Status</label>
            <select id="status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <Input label="Business Date" value={filters.businessDate} onChange={(event) => updateFilter('businessDate', event.target.value)} />
          <Input label="Vendor" value={filters.vendor} onChange={(event) => updateFilter('vendor', event.target.value)} placeholder="Selected vendor" />
        </div>
      </Card>

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading procurement items...</p>}
        {!isLoading && !error && items.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-semibold text-gray-900">No procurement items found.</p>
            <p className="mt-1 text-sm text-gray-600">Move a store request to procurement to create one.</p>
          </div>
        )}
        {!isLoading && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Procurement Reference', 'Source Request Reference', 'Department', 'Item Count', 'Status', 'Business Date', 'Created At', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{item.reference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.requestReference || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.departmentName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.items?.length || 1}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getRequestStatusBadgeVariant(item.status)}>{item.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDateTime(item.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => navigate(`/procurement/vendor-quotations?procurementId=${item.id}`)}>Add/View Quotations</Button>
                        <Button size="sm" variant="secondary" onClick={() => markOrdered(item)} disabled={isSaving}>Mark Ordered</Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedItem(item)}>View Details</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedItem && (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{selectedItem.reference}</h2>
              <p className="mt-1 text-sm text-gray-600">{selectedItem.itemName} - {selectedItem.quantity} {selectedItem.unit}</p>
              <p className="mt-1 text-sm text-gray-600">Selected vendor: {selectedItem.selectedQuotation?.vendorName || 'Not selected'}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setSelectedItem(null)}>Close</Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default ProcurementList
