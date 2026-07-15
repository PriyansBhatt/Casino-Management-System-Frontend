import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import { confirmDepartmentReceived, getDepartmentRequests } from '../../api/storeApi'
import { REQUEST_STATUSES } from '../../constants/storeConstants'
import { getRequestStatusBadgeVariant } from '../../utils/storeUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'

const DepartmentConfirmation = () => {
  const { user } = useAuth()
  const { businessStatus } = useBusinessStatus()
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadRequests = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getDepartmentRequests({
        status: REQUEST_STATUSES.PENDING_DEPARTMENT_CONFIRMATION,
        businessDate: businessStatus?.businessDate,
      })
      setRequests(data)
    } catch (err) {
      setError(err.message || 'Failed to load department confirmations.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [businessStatus?.businessDate])

  const confirmReceived = async () => {
    if (!selectedRequest) return
    setIsSaving(true)
    setMessage('')
    setError('')
    try {
      const updated = await confirmDepartmentReceived(selectedRequest.id, {
        confirmedBy: user?.username || user?.fullName,
        remarks,
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.STORE,
        action: AUDIT_ACTIONS.UPDATE,
        severity: AUDIT_SEVERITY.MEDIUM,
        description: `Department request ${selectedRequest.reference} confirmed received.`,
        businessDate: selectedRequest.businessDate || businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'DEPARTMENT_REQUEST',
        entityId: selectedRequest.id,
        newValue: updated,
        reason: remarks,
      })
      setMessage(`${selectedRequest.reference} confirmed received.`)
      setSelectedRequest(null)
      setRemarks('')
      await loadRequests()
    } catch (err) {
      setError(err.message || 'Failed to confirm received.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Confirmation"
        description="Confirm fully delivered request items before final closure."
      />

      <Card className="border-blue-200 bg-blue-50">
        <p className="text-sm text-blue-900">
          Partial delivery does not close the full request automatically. Full delivery moves the request here for department confirmation. Accounts bill/payment will be handled in Phase 13.
        </p>
      </Card>

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading requests waiting for confirmation...</p>}
        {!isLoading && !error && requests.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-semibold text-gray-900">No requests waiting for department confirmation.</p>
            <p className="mt-1 text-sm text-gray-600">Fully delivered requests will appear here.</p>
          </div>
        )}
        {requests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Request Reference', 'Department', 'Items', 'Delivery Status', 'Business Date', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{request.reference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{request.departmentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {(request.items || []).map((item) => `${item.itemName} (${item.quantity} ${item.unit})`).join(', ')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getRequestStatusBadgeVariant(request.status)}>{request.deliveryStatus || request.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{request.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Button size="sm" onClick={() => setSelectedRequest(request)}>Confirm Received</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedRequest && (
        <Card className="border-blue-200 bg-blue-50">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-blue-950">Confirm {selectedRequest.reference}</h2>
              <p className="mt-1 text-sm text-blue-900">
                Confirm only after the department has physically received the delivered items.
              </p>
            </div>
            <div>
              <label htmlFor="confirmationRemarks" className="mb-2 block text-sm font-medium text-gray-700">Confirmation Remarks</label>
              <textarea id="confirmationRemarks" rows={3} value={remarks} onChange={(event) => setRemarks(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSelectedRequest(null)} disabled={isSaving}>Cancel</Button>
              <Button onClick={confirmReceived} disabled={isSaving}>{isSaving ? 'Confirming...' : 'Confirm Received'}</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default DepartmentConfirmation
