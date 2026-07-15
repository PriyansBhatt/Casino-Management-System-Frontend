import { TABLE_SESSION_STATUSES, TABLE_STATUSES } from '../constants/pitConstants'

export function formatGameType(type) {
  return (type || 'UNKNOWN')
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

export function getTableStatusBadgeVariant(status) {
  switch (status) {
    case TABLE_STATUSES.AVAILABLE:
      return 'success'
    case TABLE_STATUSES.OPEN:
      return 'info'
    case TABLE_STATUSES.MAINTENANCE:
      return 'warning'
    default:
      return 'default'
  }
}

export function getSessionStatusBadgeVariant(status) {
  switch (status) {
    case TABLE_SESSION_STATUSES.OPEN:
      return 'success'
    case TABLE_SESSION_STATUSES.PENDING_REVIEW:
      return 'warning'
    case TABLE_SESSION_STATUSES.CLOSED:
      return 'default'
    default:
      return 'default'
  }
}

export function calculateTableNet(openingAmount = 0, closingAmount = 0) {
  return Number(closingAmount) - Number(openingAmount)
}

export function generateTableSessionReference() {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `TS-${timestamp}-${random}`
}
