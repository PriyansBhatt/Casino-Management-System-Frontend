import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import { getDepartmentRequests } from '../../api/storeApi'
import { REQUEST_STATUSES, REQUEST_TYPES } from '../../constants/storeConstants'
import {
  calculateRequestTotal,
  getRequestStatusBadgeVariant,
  getRequestTypeBadgeVariant,
} from '../../utils/storeUtils'
import { formatDateTime } from '../../utils/customerUtils'

const requestTypes = Object.values(REQUEST_TYPES)
const requestStatuses = Object.values(REQUEST_STATUSES)

const formatMoney = (value) => `NPR ${Number(value || 0).toLocaleString()}`

const DepartmentRequests = () => {
  const navigate = useNavigate()
  const { businessStatus } = useBusinessStatus()
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [filters, setFilters] = useState({
    requestType: '',
    status: '',
    businessDate: '',
    departmentName: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (businessStatus?.businessDate && !filters.businessDate) {
      setFilters((current) => ({ ...current, businessDate: businessStatus.businessDate }))
    }
  }, [businessStatus?.businessDate, filters.businessDate])

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await getDepartmentRequests(filters)
        setRequests(data)
      } catch (err) {
        setError(err.message || 'Failed to load department requests.')
      } finally {
        setIsLoading(false)
      }
    }

    loadRequests()
  }, [filters])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Requests"
        description="Review department item requests by Business Date, type, status, and department."
        actions={<Button onClick={() => navigate('/store/requests/new')}>Create New Request</Button>}
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="requestType" className="mb-2 block text-sm font-medium text-gray-700">Request Type</label>
            <select id="requestType" value={filters.requestType} onChange={(event) => updateFilter('requestType', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All types</option>
              {requestTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-700">Status</label>
            <select id="status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All statuses</option>
              {requestStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <Input label="Business Date" value={filters.businessDate} onChange={(event) => updateFilter('businessDate', event.target.value)} />
          <Input label="Department Name" value={filters.departmentName} onChange={(event) => updateFilter('departmentName', event.target.value)} placeholder="Search department" />
        </div>
      </Card>

      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading department requests...</p>}
        {!isLoading && !error && requests.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-semibold text-gray-900">No department requests found.</p>
            <p className="mt-1 text-sm text-gray-600">Create a new request to start the store workflow.</p>
          </div>
        )}
        {!isLoading && requests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Reference', 'Department', 'Requested By', 'Request Type', 'Item Count', 'Status', 'Business Date', 'Created At', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{request.reference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{request.departmentName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{request.requestedBy}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getRequestTypeBadgeVariant(request.requestType)}>{request.requestType}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{request.items?.length || 0}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getRequestStatusBadgeVariant(request.status)}>{request.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{request.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDateTime(request.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)}>View Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedRequest && (
        <Card>
          <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{selectedRequest.reference}</h2>
              <p className="mt-1 text-sm text-gray-600">{selectedRequest.reason}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setSelectedRequest(null)}>Close</Button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Department</p>
              <p className="mt-1 text-sm text-gray-900">{selectedRequest.departmentName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Total Estimate</p>
              <p className="mt-1 text-sm text-gray-900">{formatMoney(calculateRequestTotal(selectedRequest.items))}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Business Date</p>
              <p className="mt-1 text-sm text-gray-900">{selectedRequest.businessDate}</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Item', 'Quantity', 'Unit', 'Remarks'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(selectedRequest.items || []).map((item, index) => (
                  <tr key={`${item.itemName}-${index}`}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.remarks || 'Not available'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default DepartmentRequests
