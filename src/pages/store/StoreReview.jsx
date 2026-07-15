import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import {
  createProcurementItem,
  getDepartmentRequests,
  reviewDepartmentRequest,
} from '../../api/storeApi'
import { REQUEST_STATUSES } from '../../constants/storeConstants'
import {
  getRequestStatusBadgeVariant,
  getRequestTypeBadgeVariant,
} from '../../utils/storeUtils'
import { formatDateTime } from '../../utils/customerUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'

const StoreReview = () => {
  const { user } = useAuth()
  const { businessStatus } = useBusinessStatus()
  const [requests, setRequests] = useState([])
  const [rejectRequestId, setRejectRequestId] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadRequests = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getDepartmentRequests({
        status: REQUEST_STATUSES.PENDING_STORE_REVIEW,
        businessDate: businessStatus?.businessDate,
      })
      setRequests(data)
    } catch (err) {
      setError(err.message || 'Failed to load pending store review requests.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [businessStatus?.businessDate])

  const markStockAvailable = async (request) => {
    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      const updated = await reviewDepartmentRequest(request.id, {
        status: REQUEST_STATUSES.STOCK_AVAILABLE,
        reviewedBy: user?.username || user?.fullName,
        reviewRemarks: 'Stock marked available by store.',
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.STORE,
        action: AUDIT_ACTIONS.REVIEW,
        severity: AUDIT_SEVERITY.MEDIUM,
        description: `Department request ${request.reference} reviewed as stock available.`,
        businessDate: request.businessDate || businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'DEPARTMENT_REQUEST',
        entityId: request.id,
        newValue: updated,
      })
      setMessage(`${request.reference} marked as stock available.`)
      await loadRequests()
    } catch (err) {
      setError(err.message || 'Failed to update request.')
    } finally {
      setIsSaving(false)
    }
  }

  const markProcurementRequired = async (request) => {
    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      const procurementItems = await Promise.all(
        (request.items || []).map((item) =>
          createProcurementItem({
            requestId: request.id,
            requestReference: request.reference,
            departmentName: request.departmentName,
            itemName: item.itemName,
            quantity: Number(item.quantity || 0),
            unit: item.unit,
            businessDate: request.businessDate,
            createdBy: user?.username || user?.fullName,
          })
        )
      )
      const updated = await reviewDepartmentRequest(request.id, {
        status: REQUEST_STATUSES.PROCUREMENT_REQUIRED,
        reviewedBy: user?.username || user?.fullName,
        reviewRemarks: 'Procurement required due to unavailable stock.',
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.PROCUREMENT,
        action: AUDIT_ACTIONS.CREATE,
        severity: AUDIT_SEVERITY.MEDIUM,
        description: `Procurement item created for request ${request.reference}.`,
        businessDate: request.businessDate || businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'PROCUREMENT_ITEM',
        entityId: procurementItems[0]?.id || request.id,
        newValue: { request: updated, procurementItems },
      })
      setMessage(`${request.reference} moved to procurement.`)
      await loadRequests()
    } catch (err) {
      setError(err.message || 'Failed to create procurement item.')
    } finally {
      setIsSaving(false)
    }
  }

  const rejectRequest = async (request) => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required.')
      return
    }

    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      const updated = await reviewDepartmentRequest(request.id, {
        status: REQUEST_STATUSES.REJECTED,
        reviewedBy: user?.username || user?.fullName,
        rejectionReason,
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.STORE,
        action: AUDIT_ACTIONS.REJECT,
        severity: AUDIT_SEVERITY.MEDIUM,
        description: `Department request ${request.reference} rejected.`,
        businessDate: request.businessDate || businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'DEPARTMENT_REQUEST',
        entityId: request.id,
        newValue: updated,
        reason: rejectionReason,
      })
      setMessage(`${request.reference} rejected.`)
      setRejectRequestId('')
      setRejectionReason('')
      await loadRequests()
    } catch (err) {
      setError(err.message || 'Failed to reject request.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Review"
        description="Review pending department requests and decide stock issue, procurement, or rejection."
      />

      <Card>
        <p className="text-sm text-gray-600">
          Business Date: <span className="font-semibold text-gray-900">{businessStatus?.businessDate || 'Not available'}</span>
        </p>
      </Card>

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      {isLoading && <Card><p className="text-sm text-gray-600">Loading pending requests...</p></Card>}
      {!isLoading && requests.length === 0 && (
        <Card>
          <p className="font-semibold text-gray-900">No requests pending store review.</p>
          <p className="mt-1 text-sm text-gray-600">New department requests will appear here.</p>
        </Card>
      )}

      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">{request.reference}</h2>
                  <Badge variant={getRequestTypeBadgeVariant(request.requestType)}>{request.requestType}</Badge>
                  <Badge variant={getRequestStatusBadgeVariant(request.status)}>{request.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {request.departmentName} requested by {request.requestedBy} on {formatDateTime(request.createdAt)}
                </p>
                <p className="mt-2 text-sm text-gray-700">{request.reason}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => markStockAvailable(request)} disabled={isSaving}>Stock Available</Button>
                <Button size="sm" variant="secondary" onClick={() => markProcurementRequired(request)} disabled={isSaving}>Procurement Required</Button>
                <Button size="sm" variant="danger" onClick={() => setRejectRequestId(request.id)} disabled={isSaving}>Reject</Button>
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
                  {(request.items || []).map((item, index) => (
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

            {rejectRequestId === request.id && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <label htmlFor={`reject-${request.id}`} className="mb-2 block text-sm font-medium text-gray-700">Rejection Reason</label>
                <textarea id={`reject-${request.id}`} rows={3} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setRejectRequestId('')} disabled={isSaving}>Cancel</Button>
                  <Button variant="danger" size="sm" onClick={() => rejectRequest(request)} disabled={isSaving}>{isSaving ? 'Rejecting...' : 'Confirm Reject'}</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

export default StoreReview
