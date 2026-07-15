import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import LockGuard from '../../components/business/LockGuard'
import LockedActionNotice from '../../components/business/LockedActionNotice'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import { getTables, openTableSession } from '../../api/pitApi'
import { TABLE_STATUSES } from '../../constants/pitConstants'
import { formatGameType, getTableStatusBadgeVariant } from '../../utils/pitUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { getErrorMessage } from '../../utils/errorUtils'

const formatAmount = (amount) => `NPR ${Number(amount || 0).toLocaleString()}`

const OpenTableSession = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { businessStatus, isSystemLocked } = useBusinessStatus()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      dealerName: '',
      pitBossName: user?.fullName || user?.username || '',
      openingAmount: '',
      shoeReference: '',
      remarks: '',
    },
  })

  useEffect(() => {
    const loadTables = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const tableData = await getTables()
        const openableTables = tableData.filter(
          (table) => table.status === TABLE_STATUSES.AVAILABLE || table.status === TABLE_STATUSES.CLOSED
        )
        setTables(openableTables)
        const stateTable = openableTables.find((table) => table.id === String(state?.tableId))
        if (stateTable) {
          setSelectedTable(stateTable)
        }
      } catch (error) {
        const message = getErrorMessage(error)
        setErrorMessage(message)
        showToast({ type: 'error', title: 'Failed to Load Tables', message })
      } finally {
        setIsLoading(false)
      }
    }

    loadTables()
  }, [state?.tableId])

  const onSubmit = async (data) => {
    setSuccessMessage('')
    setErrorMessage('')

    if (!selectedTable) {
      setErrorMessage('Table is required.')
      return
    }

    setIsSubmitting(true)

    try {
      const session = await openTableSession({
        tableId: selectedTable.id,
        tableCode: selectedTable.tableCode,
        tableName: selectedTable.tableName,
        gameType: selectedTable.gameType,
        dealerName: data.dealerName,
        pitBossName: data.pitBossName,
        openingAmount: data.openingAmount,
        shoeReference: data.shoeReference,
        remarks: data.remarks,
        businessDate: businessStatus?.businessDate,
        createdBy: user?.username || user?.fullName || 'Pit Boss',
        createdAt: new Date().toISOString(),
        status: 'OPEN',
      })

      safeLogAuditEvent({
        module: AUDIT_MODULES.PIT,
        action: AUDIT_ACTIONS.OPEN_SESSION,
        severity: AUDIT_SEVERITY.MEDIUM,
        description: `Table session ${session.reference} opened for ${selectedTable.tableName}.`,
        businessDate: businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'TABLE_SESSION',
        entityId: session.id,
        newValue: session,
      })

      setSuccessMessage(`Table session opened successfully. Reference: ${session.reference}`)
      showToast({
        type: 'success',
        title: 'Table Session Opened',
        message: `Reference: ${session.reference}`,
      })
      setTimeout(() => {
        if (session?.id) {
          navigate(`/pit/sessions/${session.id}`)
        } else {
          navigate('/pit/tables')
        }
      }, 600)
    } catch (error) {
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showToast({ type: 'error', title: 'Open Session Failed', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Open Table Session"
        description="Open a table-level session for the current casino Business Date."
        actions={<Button variant="outline" onClick={() => navigate('/pit/tables')}>Back to Tables</Button>}
      />

      <Card className="border-blue-200 bg-blue-50">
        <p className="text-sm text-blue-900">
          This module tracks table-level sessions and totals only. It does not track every individual
          player at the table.
        </p>
      </Card>

      <Card>
        <p className="text-sm font-medium text-gray-500">Current Business Date</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {businessStatus?.businessDate || 'Not available'}
        </p>
      </Card>

      {isSystemLocked && <LockedActionNotice />}

      <Card>
        <div className="space-y-4">
          <div>
            <label htmlFor="tableSelect" className="mb-2 block text-sm font-medium text-gray-700">
              Select Table <span className="text-red-500">*</span>
            </label>
            <select
              id="tableSelect"
              value={selectedTable?.id || ''}
              onChange={(event) => {
                const table = tables.find((item) => item.id === event.target.value)
                setSelectedTable(table || null)
              }}
              disabled={isLoading || isSubmitting || isSystemLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select available or closed table</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.tableCode} - {table.tableName}
                </option>
              ))}
            </select>
          </div>

          {selectedTable && (
            <div className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-5">
              <div>
                <p className="text-sm text-gray-500">Table Code</p>
                <p className="font-semibold text-gray-900">{selectedTable.tableCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Table Name</p>
                <p className="font-semibold text-gray-900">{selectedTable.tableName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Game Type</p>
                <p className="font-semibold text-gray-900">{formatGameType(selectedTable.gameType)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bet Range</p>
                <p className="font-semibold text-gray-900">
                  {formatAmount(selectedTable.minimumBet)} - {formatAmount(selectedTable.maximumBet)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={getTableStatusBadgeVariant(selectedTable.status)}>
                  {selectedTable.status}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </Card>

      <LockGuard fallback={<LockedActionNotice />}>
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Dealer Name"
                required
                {...register('dealerName', { required: 'Dealer name is required' })}
                error={errors.dealerName?.message}
                disabled={isSubmitting || isSystemLocked}
              />
              <Input
                label="Pit Boss Name"
                required
                {...register('pitBossName', { required: 'Pit boss name is required' })}
                error={errors.pitBossName?.message}
                disabled={isSubmitting || isSystemLocked}
              />
              <Input
                label="Opening Amount"
                type="number"
                min="0"
                step="0.01"
                required
                {...register('openingAmount', {
                  required: 'Opening amount is required',
                  min: { value: 0, message: 'Opening amount must be 0 or greater' },
                })}
                error={errors.openingAmount?.message}
                disabled={isSubmitting || isSystemLocked}
              />
              <Input
                label="Shoe/Round Reference"
                {...register('shoeReference')}
                disabled={isSubmitting || isSystemLocked}
              />
            </div>

            <div>
              <label htmlFor="remarks" className="mb-2 block text-sm font-medium text-gray-700">
                Remarks
              </label>
              <textarea
                id="remarks"
                rows={3}
                disabled={isSubmitting || isSystemLocked}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('remarks')}
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

            <div className="flex justify-end border-t border-gray-200 pt-5">
              <Button type="submit" disabled={isSubmitting || isSystemLocked}>
                {isSubmitting ? 'Opening...' : 'Open Table Session'}
              </Button>
            </div>
          </form>
        </Card>
      </LockGuard>
    </div>
  )
}

export default OpenTableSession
