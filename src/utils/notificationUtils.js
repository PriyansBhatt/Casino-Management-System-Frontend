import { NOTIFICATION_PRIORITIES, NOTIFICATION_TYPES } from '../constants/notificationConstants'

export function getNotificationTypeBadgeVariant(type) {
  switch (type) {
    case NOTIFICATION_TYPES.SUCCESS:
      return 'success'
    case NOTIFICATION_TYPES.WARNING:
    case NOTIFICATION_TYPES.APPROVAL:
    case NOTIFICATION_TYPES.STORE:
      return 'warning'
    case NOTIFICATION_TYPES.DANGER:
    case NOTIFICATION_TYPES.ALERT:
    case NOTIFICATION_TYPES.SYSTEM_LOCK:
      return 'danger'
    case NOTIFICATION_TYPES.ACCOUNTS:
    case NOTIFICATION_TYPES.CASHIER:
    case NOTIFICATION_TYPES.PIT:
    case NOTIFICATION_TYPES.AUDIT:
    case NOTIFICATION_TYPES.BUSINESS_DATE:
      return 'info'
    default:
      return 'default'
  }
}

export function getNotificationPriorityBadgeVariant(priority) {
  switch (priority) {
    case NOTIFICATION_PRIORITIES.CRITICAL:
    case NOTIFICATION_PRIORITIES.HIGH:
      return 'danger'
    case NOTIFICATION_PRIORITIES.MEDIUM:
      return 'warning'
    default:
      return 'default'
  }
}

export function generateNotificationReference() {
  return `NTF-${Date.now().toString().slice(-8)}`
}

export function formatNotificationType(type) {
  return (type || 'INFO')
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}
