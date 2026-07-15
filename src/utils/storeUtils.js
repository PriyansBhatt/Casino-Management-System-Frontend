import { REQUEST_STATUSES, REQUEST_TYPES, STOCK_STATUSES } from '../constants/storeConstants'

export function getRequestStatusBadgeVariant(status) {
  switch (status) {
    case REQUEST_STATUSES.STOCK_ISSUED:
    case REQUEST_STATUSES.APPROVED:
    case REQUEST_STATUSES.FULLY_DELIVERED:
    case REQUEST_STATUSES.CONFIRMED_RECEIVED:
    case REQUEST_STATUSES.CLOSED:
      return 'success'
    case REQUEST_STATUSES.PENDING_STORE_REVIEW:
    case REQUEST_STATUSES.PENDING_DIRECTOR_APPROVAL:
    case REQUEST_STATUSES.PENDING_DEPARTMENT_CONFIRMATION:
    case REQUEST_STATUSES.PARTIALLY_DELIVERED:
      return 'warning'
    case REQUEST_STATUSES.REJECTED:
    case REQUEST_STATUSES.PROCUREMENT_REQUIRED:
      return 'danger'
    default:
      return 'default'
  }
}

export function getRequestTypeBadgeVariant(type) {
  switch (type) {
    case REQUEST_TYPES.URGENT:
      return 'danger'
    case REQUEST_TYPES.NEXT_DAY:
      return 'warning'
    default:
      return 'default'
  }
}

export function getStockStatusBadgeVariant(status) {
  switch (status) {
    case STOCK_STATUSES.IN_STOCK:
      return 'success'
    case STOCK_STATUSES.LOW_STOCK:
      return 'warning'
    case STOCK_STATUSES.OUT_OF_STOCK:
      return 'danger'
    default:
      return 'default'
  }
}

export function isLowStock(item) {
  return Number(item?.currentStock || 0) <= Number(item?.minimumStock || 0)
}

export function calculateRequestTotal(items = []) {
  return items.reduce(
    (total, item) => total + Number(item.quantity || 0) * Number(item.estimatedRate || item.rate || 0),
    0
  )
}

export function generateRequestReference() {
  const timestamp = Date.now().toString().slice(-6)
  return `REQ-${timestamp}`
}

export function generateProcurementReference() {
  const timestamp = Date.now().toString().slice(-6)
  return `PRC-${timestamp}`
}
