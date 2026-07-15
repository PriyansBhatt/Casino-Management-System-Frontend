import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LockGuard from '../../components/business/LockGuard'
import LockedActionNotice from '../../components/business/LockedActionNotice'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import { closeTableSession, getTableSessions } from '../../api/pitApi'
import { TABLE_SESSION_STATUSES } from '../../constants/pitConstants'
import { calculateTableNet, formatGameType, getSessionStatusBadgeVariant } from '../../utils/pitUtils'
import { formatDateTime } from '../../utils/customerUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { getErrorMessage } from '../../utils/errorUtils'

const formatAmount = (amount) => `NPR ${Number(amount || 0).toLocaleString()}`

const CloseTableSession = () => {
  const navigate = useNavigate()
  const { businessStatus, isSystemLocked } = useBusinessStatus()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [pendingCloseData, setPendingCloseData] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      closingAmount: '',
      closingRemarks: '',
      reviewRequired: false,
    },
  })

  const closingAmount = watch('closingAmount')

  const loadSessions = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await getTableSessions({
        businessDate: businessStatus?.businessDate,
        status: TABLE_SESSION_STATUSES.OPEN,
      })
      setSessions(data)
    } catch (error) {
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showToast({ type: 'error', title: 'Failed to Load Sessions', message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [businessStatus?.businessDate])

  const onSubmit = (data) => {
    setSuccessMessage('')
    setErrorMessage('')

    if (!selectedSession) {
      setErrorMessage('Select an open table session to close.')
      showToast({ type: 'warning', title: 'Session Required', message: 'Select an open table session to close.' })
      return
    }

    setPendingCloseData(data)
  }

  const confirmCloseSession = async () => {
    const data = pendingCloseData
    if (!selectedSession || !data) return
    setIsSubmitting(true)

    try {
      const status = data.reviewRequired
        ? TABLE_SESSION_STATUSES.PENDING_REVIEW
        : TABLE_SESSION_STATUSES.CLOSED
      const closedSession = await closeTableSession(selectedSession.id, {
        closingAmount: data.closingAmount,
        closingRemarks: data.closingRemarks,
        closedBy: user?.username || user?.fullName || 'Pit Boss',
        closedAt: new Date().toISOString(),
        status,
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.PIT,
        action: AUDIT_ACTIONS.CLOSE_SESSION,
        severity:
          status === TABLE_SESSION_STATUSES.PENDING_REVIEW
            ? AUDIT_SEVERITY.HIGH
            : AUDIT_SEVERITY.MEDIUM,
        description: `Table session ${selectedSession.reference} closed.`,
        businessDate: selectedSession.businessDate || businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'TABLE_SESSION',
        entityId: selectedSession.id,
        newValue: closedSession,
        reason: data.closingRemarks,
      })
      setSuccessMessage(`Session closed. Net position: ${formatAmount(closedSession.netAmount)}`)
      showToast({
        type: 'success',
        title: 'Table Session Closed',
        message: `Net position: ${formatAmount(closedSession.netAmount)}`,
      })
      setSelectedSession(null)
      setPendingCloseData(null)
      reset()
      await loadSessions()
    } catch (error) {
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showToast({ type: 'error', title: 'Close Session Failed', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Close Table Session"
        description="Close open table-level sessions for the current Business Date."
      />

      <Card className="border-blue-200 bg-blue-50">
        <p className="text-sm text-blue-900">
          Reports and closing actions use Business Date, not calendar date. This module tracks
          table-level totals only and does not track individual players.
        </p>
      </Card>

      {isSystemLocked && <LockedActionNotice />}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading open sessions...</p>}
        {!isLoading && sessions.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-semibold text-gray-900">No open sessions found.</p>
            <p className="mt-1 text-sm text-gray-600">Open table sessions will appear here.</p>
          </div>
        )}
        {!isLoading && sessions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Session Reference', 'Table Code', 'Table Name', 'Game Type', 'Dealer Name', 'Pit Boss Name', 'Opening Amount', 'Business Date', 'Opened At', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{session.reference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{session.tableCode}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{session.tableName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatGameType(session.gameType)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{session.dealerName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{session.pitBossName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{formatAmount(session.openingAmount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{session.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDateTime(session.openedAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setSelectedSession(session)} disabled={isSystemLocked}>
                          Close Session
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/pit/sessions/${session.id}`)}>
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedSession && (
        <LockGuard fallback={<LockedActionNotice />}>
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Closing Session</p>
                  <p className="font-semibold text-gray-900">
                    {selectedSession.reference} | {selectedSession.tableName}
                  </p>
                </div>
                <Badge variant={getSessionStatusBadgeVariant(selectedSession.status)}>
                  {selectedSession.status}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Closing Amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  {...register('closingAmount', {
                    required: 'Closing amount is required',
                    min: { value: 0, message: 'Closing amount must be 0 or greater' },
                  })}
                  error={errors.closingAmount?.message}
                  disabled={isSubmitting}
                />
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Calculated Net</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatAmount(calculateTableNet(selectedSession.openingAmount, closingAmount || 0))}
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="closingRemarks" className="mb-2 block text-sm font-medium text-gray-700">
                  Closing Remarks
                </label>
                <textarea
                  id="closingRemarks"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                  {...register('closingRemarks')}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register('reviewRequired')} />
                Review Required
              </label>

              {successMessage && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">{successMessage}</div>}
              {errorMessage && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{errorMessage}</div>}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <Button type="button" variant="secondary" onClick={() => setSelectedSession(null)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isSystemLocked}>
                  {isSubmitting ? 'Closing...' : 'Close Session'}
                </Button>
              </div>
            </form>
          </Card>
        </LockGuard>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingCloseData)}
        title="Confirm Close Table Session"
        description={`Close ${selectedSession?.reference || 'selected session'} with closing amount NPR ${pendingCloseData?.closingAmount || 0}?`}
        confirmLabel="Close Session"
        variant="warning"
        isLoading={isSubmitting}
        onConfirm={confirmCloseSession}
        onCancel={() => setPendingCloseData(null)}
      />
    </div>
  )
}

export default CloseTableSession
