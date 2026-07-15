import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useToast from '../../hooks/useToast'
import { getSuspiciousAlerts, markAlertReviewed } from '../../api/directorApi'
import { ALERT_STATUSES, ALERT_TYPES } from '../../constants/directorConstants'
import {
  formatAlertType,
  getAlertStatusBadgeVariant,
  getAlertTypeBadgeVariant,
} from '../../utils/directorUtils'
import { formatDateTime } from '../../utils/customerUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { getErrorMessage } from '../../utils/errorUtils'

const suspiciousTypes = [
  ALERT_TYPES.WATCHLIST_CUSTOMER,
  ALERT_TYPES.SUSPICIOUS_CUSTOMER,
  ALERT_TYPES.TABLE_PENDING_REVIEW,
  ALERT_TYPES.SYSTEM_UNLOCK_REQUEST,
]

const SuspiciousAlerts = () => {
  const { user } = useAuth()
  const { businessStatus } = useBusinessStatus()
  const { showToast } = useToast()
  const [alerts, setAlerts] = useState([])
  const [businessDate, setBusinessDate] = useState('')
  const [status, setStatus] = useState(ALERT_STATUSES.OPEN)
  const [type, setType] = useState('')
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (businessStatus?.businessDate && !businessDate) {
      setBusinessDate(businessStatus.businessDate)
    }
  }, [businessDate, businessStatus?.businessDate])

  const loadAlerts = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getSuspiciousAlerts({ businessDate, status, type })
      setAlerts(data.filter((alert) => !type || alert.type === type))
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Alerts Failed to Load', message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [businessDate, status, type])

  const handleMarkReviewed = async () => {
    if (!selectedAlert) return

    setIsSaving(true)
    setError('')

    try {
      await markAlertReviewed(selectedAlert.id, {
        status: ALERT_STATUSES.REVIEWED,
        reviewedBy: user?.username || user?.fullName || 'Director',
        remarks: reviewNote,
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.DIRECTOR,
        action: AUDIT_ACTIONS.REVIEW,
        severity: AUDIT_SEVERITY.HIGH,
        description: `Suspicious alert ${selectedAlert.id} reviewed.`,
        businessDate: selectedAlert.businessDate || businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'ALERT',
        entityId: selectedAlert.id,
        newValue: { status: ALERT_STATUSES.REVIEWED, alert: selectedAlert },
        reason: reviewNote,
      })
      setMessage('Alert marked reviewed.')
      showToast({ type: 'success', title: 'Alert Reviewed', message: selectedAlert.id })
      setSelectedAlert(null)
      setReviewNote('')
      await loadAlerts()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Review Failed', message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suspicious Alerts"
        description="Review watchlist, high-risk customer, table review, and system unlock alerts."
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Business Date" value={businessDate} onChange={(event) => setBusinessDate(event.target.value)} placeholder="Business Date" />
          <div>
            <label htmlFor="alertStatus" className="mb-2 block text-sm font-medium text-gray-700">Alert Status</label>
            <select id="alertStatus" value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={ALERT_STATUSES.OPEN}>OPEN</option>
              <option value={ALERT_STATUSES.REVIEWED}>REVIEWED</option>
              <option value={ALERT_STATUSES.DISMISSED}>DISMISSED</option>
              <option value="">All</option>
            </select>
          </div>
          <div>
            <label htmlFor="alertType" className="mb-2 block text-sm font-medium text-gray-700">Alert Type</label>
            <select id="alertType" value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All types</option>
              {suspiciousTypes.map((alertType) => (
                <option key={alertType} value={alertType}>{formatAlertType(alertType)}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading suspicious alerts...</p>}
        {!isLoading && !error && alerts.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-semibold text-gray-900">No open alerts for selected business date.</p>
            <p className="mt-1 text-sm text-gray-600">
              Watchlist/high-risk customer transactions, pending review tables, and unlock requests appear here.
            </p>
          </div>
        )}
        {!isLoading && alerts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Alert Reference', 'Type', 'Related Entity', 'Customer/Table', 'Business Date', 'Status', 'Created At', 'Notes', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {alerts.map((alert) => (
                  <tr key={alert.id} className={alert.status === ALERT_STATUSES.OPEN ? 'bg-amber-50/40' : 'hover:bg-gray-50'}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{alert.id}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getAlertTypeBadgeVariant(alert.type)}>{formatAlertType(alert.type)}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{alert.relatedEntity || alert.reference || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{alert.customerName || alert.tableName || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{alert.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getAlertStatusBadgeVariant(alert.status)}>{alert.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDateTime(alert.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{alert.reviewRemarks || alert.description || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Button size="sm" onClick={() => setSelectedAlert(alert)} disabled={alert.status === ALERT_STATUSES.REVIEWED}>
                        Mark Reviewed
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedAlert && (
        <Card className="border-blue-200 bg-blue-50">
          <div className="space-y-4">
            <p className="font-semibold text-blue-950">Review {selectedAlert.id}</p>
            <div>
              <label htmlFor="reviewNote" className="mb-2 block text-sm font-medium text-gray-700">Review Note</label>
              <textarea id="reviewNote" rows={3} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSelectedAlert(null)} disabled={isSaving}>Cancel</Button>
              <Button onClick={handleMarkReviewed} disabled={isSaving}>{isSaving ? 'Saving...' : 'Mark Reviewed'}</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default SuspiciousAlerts
