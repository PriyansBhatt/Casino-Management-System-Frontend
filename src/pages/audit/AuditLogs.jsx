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
import { getAuditLogs } from '../../api/auditApi'
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_SEVERITY,
} from '../../constants/auditConstants'
import { safeLogAuditEvent } from '../../services/auditService'
import { exportToCsv } from '../../utils/exportUtils'
import {
  formatAuditAction,
  getAuditModuleBadgeVariant,
  getAuditSeverityBadgeVariant,
} from '../../utils/auditUtils'
import { formatDateTime } from '../../utils/customerUtils'

const modules = Object.values(AUDIT_MODULES)
const actions = Object.values(AUDIT_ACTIONS)
const severities = Object.values(AUDIT_SEVERITY)

const AuditLogs = () => {
  const navigate = useNavigate()
  const { businessStatus } = useBusinessStatus()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [logs, setLogs] = useState([])
  const [filters, setFilters] = useState({
    businessDate: '',
    module: '',
    action: '',
    severity: '',
    performedBy: '',
    entityType: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (businessStatus?.businessDate && !filters.businessDate) {
      setFilters((current) => ({ ...current, businessDate: businessStatus.businessDate }))
    }
  }, [businessStatus?.businessDate, filters.businessDate])

  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true)
      setError('')

      try {
        setLogs(await getAuditLogs(filters))
      } catch (err) {
        setError(err.message || 'Failed to load audit logs.')
      } finally {
        setIsLoading(false)
      }
    }

    loadLogs()
  }, [filters])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      businessDate: businessStatus?.businessDate || '',
      module: '',
      action: '',
      severity: '',
      performedBy: '',
      entityType: '',
    })
  }

  const handleExport = async () => {
    if (logs.length === 0) {
      setMessage('No data available to export for the selected filters.')
      showToast({ type: 'warning', title: 'Nothing to Export', message: 'No data available to export for the selected filters.' })
      return
    }

    const rows = logs.map((log) => ({
      'Audit Reference': log.reference,
      Module: log.module,
      Action: log.action,
      Severity: log.severity,
      Description: log.description,
      'Performed By': log.performedBy,
      Role: log.performedByRole,
      'Business Date': log.businessDate,
      Timestamp: log.createdAt,
      'Entity Type': log.entityType || '',
    }))
    exportToCsv(`audit-logs-${filters.businessDate || 'all'}.csv`, rows)
    setMessage(`Exported ${rows.length} rows.`)
    showToast({ type: 'success', title: 'CSV Exported', message: `${rows.length} rows exported.` })
    await safeLogAuditEvent({
      module: AUDIT_MODULES.AUDIT,
      action: AUDIT_ACTIONS.EXPORT,
      severity: AUDIT_SEVERITY.MEDIUM,
      description: 'Audit Logs exported.',
      businessDate: filters.businessDate,
      performedBy: user?.fullName || user?.username,
      performedByRole: user?.role,
      entityType: 'AUDIT_EXPORT',
      metadata: { reportName: 'Audit Logs', businessDate: filters.businessDate, rowCount: rows.length },
    })
  }

  const systemLockLogs = logs.filter((log) =>
    [AUDIT_MODULES.SYSTEM_LOCK, AUDIT_ACTIONS.SYSTEM_UNLOCK, AUDIT_ACTIONS.SYSTEM_UNLOCK_REQUEST].includes(log.module) ||
    [AUDIT_ACTIONS.SYSTEM_UNLOCK, AUDIT_ACTIONS.SYSTEM_UNLOCK_REQUEST].includes(log.action)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Trace important casino actions by Business Date, user, role, module, action, and timestamp."
        actions={<Button variant="outline" onClick={handleExport}>Export CSV</Button>}
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Input
            label="Business Date"
            value={filters.businessDate}
            onChange={(event) => updateFilter('businessDate', event.target.value)}
          />
          <div>
            <label htmlFor="module" className="mb-2 block text-sm font-medium text-gray-700">Module</label>
            <select id="module" value={filters.module} onChange={(event) => updateFilter('module', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All modules</option>
              {modules.map((module) => <option key={module} value={module}>{module}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="action" className="mb-2 block text-sm font-medium text-gray-700">Action</label>
            <select id="action" value={filters.action} onChange={(event) => updateFilter('action', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All actions</option>
              {actions.map((action) => <option key={action} value={action}>{formatAuditAction(action)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="severity" className="mb-2 block text-sm font-medium text-gray-700">Severity</label>
            <select id="severity" value={filters.severity} onChange={(event) => updateFilter('severity', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All severities</option>
              {severities.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
            </select>
          </div>
          <Input
            label="User/Role Search"
            value={filters.performedBy}
            onChange={(event) => updateFilter('performedBy', event.target.value)}
            placeholder="User text"
          />
          <Input
            label="Entity Type"
            value={filters.entityType}
            onChange={(event) => updateFilter('entityType', event.target.value)}
            placeholder="CUSTOMER, BILL"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={resetFilters}>Reset Filters</Button>
        </div>
      </Card>

      {message && <Card className="border-blue-200 bg-blue-50"><p className="text-sm text-blue-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardCard title="Total Logs" value={logs.length} icon="AL" variant="info" />
        <DashboardCard title="Critical Logs" value={logs.filter((log) => log.severity === AUDIT_SEVERITY.CRITICAL).length} icon="CR" variant="danger" />
        <DashboardCard title="High Severity Logs" value={logs.filter((log) => log.severity === AUDIT_SEVERITY.HIGH).length} icon="HI" variant="danger" />
        <DashboardCard title="Actions Business Date" value={logs.filter((log) => !filters.businessDate || log.businessDate === filters.businessDate).length} icon="BD" variant="success" />
        <DashboardCard title="System Lock Related Logs" value={systemLockLogs.length} icon="SL" variant="warning" />
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading audit logs...</p>}
        {!isLoading && !error && logs.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-semibold text-gray-900">No audit logs found.</p>
            <p className="mt-1 text-sm text-gray-600">Adjust filters to review other Business Date activity.</p>
          </div>
        )}
        {logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Audit Reference', 'Module', 'Action', 'Severity', 'Description', 'Performed By', 'Role', 'Business Date', 'Timestamp', 'Entity Type', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{log.reference}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getAuditModuleBadgeVariant(log.module)}>{log.module}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatAuditAction(log.action)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getAuditSeverityBadgeVariant(log.severity)}>{log.severity}</Badge></td>
                    <td className="min-w-64 px-4 py-3 text-sm text-gray-700">{log.description}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{log.performedBy}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{log.performedByRole}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{log.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDateTime(log.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{log.entityType || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/audit-logs/${log.id}`)}>
                        View Details
                      </Button>
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

export default AuditLogs
