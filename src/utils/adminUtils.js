import { DEPARTMENT_TYPES, USER_STATUSES } from '../constants/adminConstants'

export function getUserStatusBadgeVariant(status) {
  switch (status) {
    case USER_STATUSES.ACTIVE:
      return 'success'
    case USER_STATUSES.LOCKED:
      return 'danger'
    case USER_STATUSES.INACTIVE:
      return 'warning'
    default:
      return 'default'
  }
}

export function getDepartmentTypeBadgeVariant(type) {
  switch (type) {
    case DEPARTMENT_TYPES.MANAGEMENT:
    case DEPARTMENT_TYPES.AUDIT:
      return 'danger'
    case DEPARTMENT_TYPES.ACCOUNTS:
    case DEPARTMENT_TYPES.CASHIER:
      return 'success'
    case DEPARTMENT_TYPES.PROCUREMENT:
    case DEPARTMENT_TYPES.STORE:
      return 'warning'
    case DEPARTMENT_TYPES.RECEPTION:
    case DEPARTMENT_TYPES.PIT:
      return 'info'
    default:
      return 'default'
  }
}

export function formatSettingLabel(key) {
  return (key || '')
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

export function generateUserReference() {
  return `USR-${Date.now().toString().slice(-6)}`
}

export function generateDepartmentReference() {
  return `DEPT-${Date.now().toString().slice(-6)}`
}
