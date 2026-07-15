import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { getAuditLogById } from '../../api/auditApi'
import {
  formatAuditAction,
  getAuditModuleBadgeVariant,
  getAuditSeverityBadgeVariant,
  safeStringifyAuditValue,
} from '../../utils/auditUtils'
import { formatDateTime } from '../../utils/customerUtils'

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-gray-900">{value || 'Not available'}</p>
  </div>
)

const ValueCard = ({ title, value }) => (
  <Card>
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-gray-950 p-4 text-sm text-gray-100">
      {safeStringifyAuditValue(value)}
    </pre>
  </Card>
)

const AuditLogDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [log, setLog] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadLog = async () => {
      setIsLoading(true)
      setError('')

      try {
        setLog(await getAuditLogById(id))
      } catch (err) {
        setError(err.message || 'Failed to load audit log details.')
      } finally {
        setIsLoading(false)
      }
    }

    loadLog()
  }, [id])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log Details"
        description="Inspect a traceable casino action with Business Date, actor, entity, and value changes."
        actions={<Button variant="outline" onClick={() => navigate('/audit-logs')}>Back to Audit Logs</Button>}
      />

      {isLoading && <Card><p className="text-sm text-gray-600">Loading audit log details...</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      {!isLoading && log && (
        <>
          <Card>
            <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{log.reference}</h2>
                <p className="mt-1 text-sm text-gray-600">{log.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={getAuditModuleBadgeVariant(log.module)}>{log.module}</Badge>
                <Badge variant={getAuditSeverityBadgeVariant(log.severity)}>{log.severity}</Badge>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <DetailItem label="Audit Reference" value={log.reference} />
              <DetailItem label="Module" value={log.module} />
              <DetailItem label="Action" value={formatAuditAction(log.action)} />
              <DetailItem label="Severity" value={log.severity} />
              <DetailItem label="Business Date" value={log.businessDate} />
              <DetailItem label="Timestamp" value={formatDateTime(log.createdAt)} />
              <DetailItem label="Performed By" value={log.performedBy} />
              <DetailItem label="Performed By Role" value={log.performedByRole} />
              <DetailItem label="Entity Type" value={log.entityType} />
              <DetailItem label="Entity ID" value={log.entityId} />
              <DetailItem label="Reason" value={log.reason} />
              <DetailItem label="Description" value={log.description} />
            </div>
          </Card>

          <ValueCard title="Metadata" value={log.metadata} />

          {log.oldValue !== null && log.oldValue !== undefined && (
            <ValueCard title="Old Value" value={log.oldValue} />
          )}

          {log.newValue !== null && log.newValue !== undefined && (
            <ValueCard title="New Value" value={log.newValue} />
          )}
        </>
      )}
    </div>
  )
}

export default AuditLogDetails
