import { useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import BusinessStatusBadge from '../../components/business/BusinessStatusBadge'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import { requestSystemUnlock } from '../../api/businessStatusApi'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { getErrorMessage } from '../../utils/errorUtils'

const SystemUnlock = () => {
  const { businessStatus } = useBusinessStatus()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleSubmit = async () => {
    setSuccessMessage('')
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await requestSystemUnlock({
        businessDate: businessStatus?.businessDate,
        reason,
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.SYSTEM_LOCK,
        action: AUDIT_ACTIONS.SYSTEM_UNLOCK_REQUEST,
        severity: AUDIT_SEVERITY.CRITICAL,
        description: 'System unlock requested.',
        businessDate: businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'SYSTEM_UNLOCK_REQUEST',
        entityId: businessStatus?.businessDate,
        newValue: { requested: true, systemStatus: businessStatus?.systemStatus },
        reason,
      })
      setSuccessMessage('Unlock request submitted successfully.')
      showToast({
        type: 'success',
        title: 'Unlock Requested',
        message: `Business Date: ${businessStatus?.businessDate || 'Not available'}`,
      })
      setReason('')
      setIsConfirmOpen(false)
    } catch (error) {
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showToast({ type: 'error', title: 'Unlock Request Failed', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Unlock"
        description="Submit a placeholder unlock request for settlement lock review."
      />

      <Card className="max-w-3xl">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Current Business Date</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {businessStatus?.businessDate || 'Not available'}
              </p>
            </div>
            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Current System Status</p>
              <div className="mt-2">
                <BusinessStatusBadge status={businessStatus?.systemStatus || 'UNKNOWN'} />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="unlockReason" className="mb-2 block text-sm font-medium text-gray-700">
              Unlock Reason
            </label>
            <textarea
              id="unlockReason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={5}
              placeholder="Enter a valid reason for requesting system unlock"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          <Button onClick={() => setIsConfirmOpen(true)} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting ? 'Submitting...' : 'Request Unlock'}
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm System Unlock Request"
        description="Submit this system unlock request for management review?"
        confirmLabel="Request Unlock"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={handleSubmit}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}

export default SystemUnlock
