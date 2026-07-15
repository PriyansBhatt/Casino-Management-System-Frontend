import { APPROVAL_STATUSES, ALERT_STATUSES, ALERT_TYPES } from '../constants/directorConstants'

export function getApprovalStatusBadgeVariant(status) {
  switch (status) {
    case APPROVAL_STATUSES.APPROVED:
      return 'success'
    case APPROVAL_STATUSES.REJECTED:
      return 'danger'
    case APPROVAL_STATUSES.PENDING:
      return 'warning'
    default:
      return 'default'
  }
}

export function getAlertStatusBadgeVariant(status) {
  switch (status) {
    case ALERT_STATUSES.REVIEWED:
      return 'success'
    case ALERT_STATUSES.DISMISSED:
      return 'default'
    case ALERT_STATUSES.OPEN:
      return 'warning'
    default:
      return 'default'
  }
}

export function getAlertTypeBadgeVariant(type) {
  switch (type) {
    case ALERT_TYPES.HIGH_VALUE_BUY_IN:
    case ALERT_TYPES.HIGH_VALUE_CASH_OUT:
      return 'danger'
    case ALERT_TYPES.WATCHLIST_CUSTOMER:
    case ALERT_TYPES.SUSPICIOUS_CUSTOMER:
      return 'warning'
    case ALERT_TYPES.TABLE_PENDING_REVIEW:
    case ALERT_TYPES.SYSTEM_UNLOCK_REQUEST:
      return 'info'
    default:
      return 'default'
  }
}

export function formatApprovalType(type) {
  return (type || 'UNKNOWN')
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

export function formatAlertType(type) {
  return formatApprovalType(type)
}

export function isHighValueAmount(amount) {
  return Number(amount || 0) >= 100000
}
