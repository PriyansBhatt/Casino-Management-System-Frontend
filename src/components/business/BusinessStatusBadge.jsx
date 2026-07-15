import Badge from '../ui/Badge'
import useBusinessStatus from '../../hooks/useBusinessStatus'

const getBadgeVariant = (status) => {
  switch (status) {
    case 'OPEN':
      return 'success'
    case 'LOCKED':
      return 'danger'
    case 'SETTLEMENT':
      return 'warning'
    default:
      return 'default'
  }
}

const BusinessStatusBadge = ({ status }) => {
  const { businessStatus } = useBusinessStatus()
  const currentStatus = status || businessStatus?.systemStatus || 'UNKNOWN'

  return <Badge variant={getBadgeVariant(currentStatus)}>{currentStatus}</Badge>
}

export default BusinessStatusBadge
