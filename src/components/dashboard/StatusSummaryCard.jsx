import Card from '../ui/Card'
import BusinessStatusBadge from '../business/BusinessStatusBadge'
import useBusinessStatus from '../../hooks/useBusinessStatus'

const fallback = 'Not available'

const StatusSummaryCard = () => {
  const { businessStatus } = useBusinessStatus()

  const rows = [
    ['Business Date', businessStatus?.businessDate || fallback],
    ['System Status', businessStatus?.systemStatus || 'UNKNOWN'],
    ['Operation Window', businessStatus?.operationWindow || fallback],
    ['Settlement Grace Until', businessStatus?.settlementGraceUntil || fallback],
    ['Lock Window', businessStatus?.lockWindow || fallback],
  ]

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Business Status</h2>
          <p className="mt-1 text-sm text-gray-600">
            Current casino business date and lock window summary.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-3">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              {label === 'System Status' ? (
                <BusinessStatusBadge status={value} />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{value}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default StatusSummaryCard
