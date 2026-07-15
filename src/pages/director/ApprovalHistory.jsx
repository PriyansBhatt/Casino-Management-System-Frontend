import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import TableToolbar from '../../components/ui/TableToolbar'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import { getApprovalHistory } from '../../api/directorApi'
import { APPROVAL_STATUSES, APPROVAL_TYPES } from '../../constants/directorConstants'
import { formatApprovalType, getApprovalStatusBadgeVariant } from '../../utils/directorUtils'
import { formatDateTime } from '../../utils/customerUtils'

const ApprovalHistory = () => {
  const { businessStatus } = useBusinessStatus()
  const [history, setHistory] = useState([])
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [businessDate, setBusinessDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const resetFilters = () => {
    setStatus('')
    setType('')
    setBusinessDate(businessStatus?.businessDate || '')
  }

  useEffect(() => {
    if (businessStatus?.businessDate && !businessDate) {
      setBusinessDate(businessStatus.businessDate)
    }
  }, [businessDate, businessStatus?.businessDate])

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await getApprovalHistory({ status, type, businessDate })
        setHistory(data)
      } catch (err) {
        setError(err.message || 'Failed to load approval history.')
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [businessDate, status, type])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval History"
        description="Approved and rejected director decisions by casino Business Date."
      />

      <TableToolbar
        title="History Filters"
        description="Approval history is always reviewed by casino Business Date."
        onReset={resetFilters}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="historyStatus" className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="historyStatus"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value={APPROVAL_STATUSES.APPROVED}>APPROVED</option>
              <option value={APPROVAL_STATUSES.REJECTED}>REJECTED</option>
            </select>
          </div>

          <div>
            <label htmlFor="historyType" className="mb-2 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="historyType"
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

          <Input
            label="Business Date"
            value={businessDate}
            onChange={(event) => setBusinessDate(event.target.value)}
            placeholder="Business Date"
          />
        </div>
      </TableToolbar>

      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading approval history...</p>}
        {!isLoading && !error && history.length === 0 && (
          <div className="p-6">
            <EmptyState
              title="No approval history found"
              description="Approve or reject a pending request to see it here."
              action={<Button variant="secondary" onClick={resetFilters}>Reset Filters</Button>}
            />
          </div>
        )}
        {!isLoading && history.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Reference', 'Type', 'Requested By', 'Reviewed By', 'Status', 'Review Note', 'Business Date', 'Created At', 'Reviewed At'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {history.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">
                      {approval.reference || approval.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {formatApprovalType(approval.type)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {approval.requestedBy}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {approval.decisionBy || 'Not available'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={getApprovalStatusBadgeVariant(approval.status)}>
                        {approval.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {approval.decisionRemarks || 'Not available'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {approval.businessDate}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {formatDateTime(approval.requestedAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {formatDateTime(approval.decisionAt)}
                    </td>
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

export default ApprovalHistory
