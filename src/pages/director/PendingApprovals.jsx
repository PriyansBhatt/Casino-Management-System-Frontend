import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useToast from '../../hooks/useToast'
import { approveRequest, getPendingApprovals, rejectRequest } from '../../api/directorApi'
import { APPROVAL_STATUSES, APPROVAL_TYPES } from '../../constants/directorConstants'
import { formatApprovalType, getApprovalStatusBadgeVariant } from '../../utils/directorUtils'
import { formatDateTime } from '../../utils/customerUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { getErrorMessage } from '../../utils/errorUtils'

const formatAmount = (amount) => amount ? `NPR ${Number(amount).toLocaleString()}` : 'Not available'

const PendingApprovals = () => {
  const { user } = useAuth()
  const { businessStatus } = useBusinessStatus()
  const { showToast } = useToast()
  const [approvals, setApprovals] = useState([])
  const [type, setType] = useState('')
  const [status, setStatus] = useState(APPROVAL_STATUSES.PENDING)
  const [businessDate, setBusinessDate] = useState('')
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [action, setAction] = useState('')
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  useEffect(() => {
    if (businessStatus?.businessDate && !businessDate) {
      setBusinessDate(businessStatus.businessDate)
    }
  }, [businessDate, businessStatus?.businessDate])

  const loadApprovals = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getPendingApprovals({ type, status, businessDate })
      setApprovals(data)
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Approvals Failed to Load', message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadApprovals()
  }, [businessDate, status, type])

  const openAction = (approval, nextAction) => {
    setSelectedApproval(approval)
    setAction(nextAction)
    setNote('')
    setMessage('')
    setError('')
  }

  const submitAction = async () => {
    if (!selectedApproval) return

    if (action === 'reject' && !note.trim()) {
      setError('Rejection reason is required.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      if (action === 'approve') {
        await approveRequest(selectedApproval.id, {
          approvedBy: user?.username || user?.fullName || 'Director',
          remarks: note,
        })
        safeLogAuditEvent({
          module: AUDIT_MODULES.DIRECTOR,
          action: AUDIT_ACTIONS.APPROVE,
          severity: AUDIT_SEVERITY.HIGH,
          description: `Approval ${selectedApproval.reference || selectedApproval.id} approved.`,
          businessDate: selectedApproval.businessDate || businessDate,
          performedBy: user?.fullName || user?.username,
          performedByRole: user?.role,
          entityType: 'APPROVAL',
          entityId: selectedApproval.id,
          newValue: { status: APPROVAL_STATUSES.APPROVED, approval: selectedApproval },
          reason: note,
        })
        setMessage('Approval request approved successfully.')
        showToast({ type: 'success', title: 'Approval Approved', message: selectedApproval.reference || selectedApproval.id })
      } else {
        await rejectRequest(selectedApproval.id, {
          rejectedBy: user?.username || user?.fullName || 'Director',
          remarks: note,
        })
        safeLogAuditEvent({
          module: AUDIT_MODULES.DIRECTOR,
          action: AUDIT_ACTIONS.REJECT,
          severity: AUDIT_SEVERITY.HIGH,
          description: `Approval ${selectedApproval.reference || selectedApproval.id} rejected.`,
          businessDate: selectedApproval.businessDate || businessDate,
          performedBy: user?.fullName || user?.username,
          performedByRole: user?.role,
          entityType: 'APPROVAL',
          entityId: selectedApproval.id,
          newValue: { status: APPROVAL_STATUSES.REJECTED, approval: selectedApproval },
          reason: note,
        })
        setMessage('Approval request rejected successfully.')
        showToast({ type: 'success', title: 'Approval Rejected', message: selectedApproval.reference || selectedApproval.id })
      }

      setSelectedApproval(null)
      setAction('')
      setNote('')
      setIsConfirmOpen(false)
      await loadApprovals()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Approval Update Failed', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Approvals"
        description="Review approval requests by casino Business Date."
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="approvalType" className="mb-2 block text-sm font-medium text-gray-700">
              Approval Type
            </label>
            <select
              id="approvalType"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All types</option>
              {Object.values(APPROVAL_TYPES).map((approvalType) => (
                <option key={approvalType} value={approvalType}>
                  {formatApprovalType(approvalType)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="approvalStatus" className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="approvalStatus"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={APPROVAL_STATUSES.PENDING}>PENDING</option>
              <option value="">All statuses</option>
              <option value={APPROVAL_STATUSES.APPROVED}>APPROVED</option>
              <option value={APPROVAL_STATUSES.REJECTED}>REJECTED</option>
            </select>
          </div>

          <Input
            label="Business Date"
            value={businessDate}
            onChange={(event) => setBusinessDate(event.target.value)}
            placeholder="Business Date"
          />
        </div>
      </Card>

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <div className="space-y-4">
        {isLoading && <Card>Loading approvals...</Card>}
        {!isLoading && approvals.length === 0 && (
          <Card>
            <p className="font-semibold text-gray-900">No approvals found.</p>
            <p className="mt-1 text-sm text-gray-600">Adjust filters or create mock approval activity.</p>
          </Card>
        )}
        {!isLoading && approvals.map((approval) => (
          <Card key={approval.id}>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-500">Reference</p>
                  <p className="font-semibold text-gray-900">{approval.reference || approval.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-semibold text-gray-900">{formatApprovalType(approval.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Requested By</p>
                  <p className="font-semibold text-gray-900">{approval.requestedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-semibold text-gray-900">{formatAmount(approval.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Date</p>
                  <p className="font-semibold text-gray-900">{approval.businessDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={getApprovalStatusBadgeVariant(approval.status)}>{approval.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(approval.requestedAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="font-semibold text-gray-900">{approval.reason || approval.description || 'Not available'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <Button size="sm" onClick={() => openAction(approval, 'approve')}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => openAction(approval, 'reject')}>Reject</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedApproval && (
        <Card className="border-blue-200 bg-blue-50">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-blue-700">
                {action === 'approve' ? 'Approve Request' : 'Reject Request'}
              </p>
              <p className="mt-1 font-semibold text-blue-950">
                {selectedApproval.reference || selectedApproval.id} | {formatApprovalType(selectedApproval.type)}
              </p>
            </div>
            <div>
              <label htmlFor="approvalNote" className="mb-2 block text-sm font-medium text-gray-700">
                {action === 'approve' ? 'Approval Note' : 'Rejection Reason'}
                {action === 'reject' && <span className="text-red-500"> *</span>}
              </label>
              <textarea
                id="approvalNote"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSelectedApproval(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant={action === 'approve' ? 'primary' : 'danger'}
                onClick={() => setIsConfirmOpen(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
        description={`${action === 'approve' ? 'Approve' : 'Reject'} ${selectedApproval?.reference || selectedApproval?.id || 'this request'}?`}
        confirmLabel={action === 'approve' ? 'Approve Request' : 'Reject Request'}
        variant={action === 'approve' ? 'success' : 'danger'}
        isLoading={isSubmitting}
        onConfirm={submitAction}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}

export default PendingApprovals
