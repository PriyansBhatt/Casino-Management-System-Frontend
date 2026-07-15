import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import DashboardCard from '../../components/dashboard/DashboardCard'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import { getTableSessions } from '../../api/pitApi'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { GAME_TYPES, TABLE_SESSION_STATUSES } from '../../constants/pitConstants'
import { safeLogAuditEvent } from '../../services/auditService'
import { exportToCsv } from '../../utils/exportUtils'
import { calculateTableNet, formatGameType, getSessionStatusBadgeVariant } from '../../utils/pitUtils'
import { formatDateTime } from '../../utils/customerUtils'

const formatAmount = (amount) => `NPR ${Number(amount || 0).toLocaleString()}`

const TableReports = () => {
  const navigate = useNavigate()
  const { businessStatus } = useBusinessStatus()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [businessDate, setBusinessDate] = useState('')
  const [gameType, setGameType] = useState('')
  const [status, setStatus] = useState('')
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportMessage, setExportMessage] = useState('')

  useEffect(() => {
    if (businessStatus?.businessDate && !businessDate) {
      setBusinessDate(businessStatus.businessDate)
    }
  }, [businessDate, businessStatus?.businessDate])

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await getTableSessions({ businessDate, status })
        setSessions(data.filter((session) => !gameType || session.gameType === gameType))
      } catch (err) {
        setError(err.message || 'Failed to load table reports.')
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [businessDate, gameType, status])

  const totalOpen = sessions.filter((session) => session.status === TABLE_SESSION_STATUSES.OPEN).length
  const totalClosed = sessions.filter((session) => session.status === TABLE_SESSION_STATUSES.CLOSED).length
  const pendingReview = sessions.filter((session) => session.status === TABLE_SESSION_STATUSES.PENDING_REVIEW).length
  const totalOpening = sessions.reduce((sum, session) => sum + Number(session.openingAmount || 0), 0)
  const totalClosing = sessions.reduce((sum, session) => sum + Number(session.closingAmount || 0), 0)
  const netPosition = totalClosing - totalOpening

  const handleExport = async () => {
    if (sessions.length === 0) {
      setExportMessage('No data available to export for the selected filters.')
      showToast({ type: 'warning', title: 'Nothing to Export', message: 'No data available to export for the selected filters.' })
      return
    }

    const rows = sessions.map((session) => ({
      Reference: session.reference,
      Table: `${session.tableCode} | ${session.tableName}`,
      'Game Type': formatGameType(session.gameType),
      Dealer: session.dealerName,
      'Pit Boss': session.pitBossName,
      'Opening Amount': session.openingAmount,
      'Closing Amount': session.closingAmount ?? '',
      'Net Position': session.netAmount ?? calculateTableNet(session.openingAmount, session.closingAmount || 0),
      'Business Date': session.businessDate,
      Status: session.status,
    }))
    exportToCsv(`pit-table-reports-${businessDate || 'all'}.csv`, rows)
    setExportMessage(`Exported ${rows.length} rows.`)
    showToast({ type: 'success', title: 'CSV Exported', message: `${rows.length} rows exported.` })
    await safeLogAuditEvent({
      module: AUDIT_MODULES.REPORTS,
      action: AUDIT_ACTIONS.EXPORT,
      severity: AUDIT_SEVERITY.LOW,
      description: 'Pit Table Reports exported.',
      businessDate,
      performedBy: user?.fullName || user?.username,
      performedByRole: user?.role,
      entityType: 'REPORT_EXPORT',
      metadata: { reportName: 'Pit Table Reports', businessDate, rowCount: rows.length },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Table Reports"
        description="Business Date table-level reports. No individual player tracking."
        actions={<Button variant="outline" onClick={handleExport}>Export CSV</Button>}
      />

      {exportMessage && <Card className="border-blue-200 bg-blue-50"><p className="text-sm text-blue-700">{exportMessage}</p></Card>}

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="Business Date"
            value={businessDate}
            onChange={(event) => setBusinessDate(event.target.value)}
            placeholder="Business Date"
          />
          <div>
            <label htmlFor="gameType" className="mb-2 block text-sm font-medium text-gray-700">Game Type</label>
            <select id="gameType" value={gameType} onChange={(event) => setGameType(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All game types</option>
              {Object.values(GAME_TYPES).map((type) => (
                <option key={type} value={type}>{formatGameType(type)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-700">Status</label>
            <select id="status" value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All statuses</option>
              {Object.values(TABLE_SESSION_STATUSES).map((sessionStatus) => (
                <option key={sessionStatus} value={sessionStatus}>{sessionStatus}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardCard title="Total Open Sessions" value={isLoading ? 'Loading...' : totalOpen} description="Selected Business Date." icon="OS" variant="success" />
        <DashboardCard title="Total Closed Sessions" value={isLoading ? 'Loading...' : totalClosed} description="Selected Business Date." icon="CL" />
        <DashboardCard title="Total Opening Amount" value={isLoading ? 'Loading...' : formatAmount(totalOpening)} description="Table opening totals." icon="OP" variant="info" />
        <DashboardCard title="Total Closing Amount" value={isLoading ? 'Loading...' : formatAmount(totalClosing)} description="Table closing totals." icon="CA" variant="warning" />
        <DashboardCard title="Net Table Position" value={isLoading ? 'Loading...' : formatAmount(netPosition)} description="Closing minus opening." icon="NP" variant={netPosition >= 0 ? 'success' : 'danger'} />
        <DashboardCard title="Pending Review Sessions" value={isLoading ? 'Loading...' : pendingReview} description="Clearly marked for review." icon="PR" variant="warning" />
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading table sessions...</p>}
        {!isLoading && sessions.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-semibold text-gray-900">No table sessions found.</p>
            <p className="mt-1 text-sm text-gray-600">Open or close sessions for this Business Date to see reports.</p>
          </div>
        )}
        {!isLoading && sessions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Reference', 'Table', 'Game Type', 'Dealer', 'Pit Boss', 'Opening Amount', 'Closing Amount', 'Net Position', 'Business Date', 'Status', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sessions.map((session) => {
                  const net = session.netAmount ?? calculateTableNet(session.openingAmount, session.closingAmount || 0)
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{session.reference}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{session.tableCode} | {session.tableName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatGameType(session.gameType)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{session.dealerName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{session.pitBossName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{formatAmount(session.openingAmount)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{session.closingAmount === null ? 'Not available' : formatAmount(session.closingAmount)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{formatAmount(net)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{session.businessDate}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant={getSessionStatusBadgeVariant(session.status)}>{session.status}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/pit/sessions/${session.id}`)}>
                          View Details
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default TableReports
