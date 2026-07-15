export function formatCustomerCode(id) {
  return `CUST-${String(id).padStart(4, '0')}`
}

export function getRiskBadgeVariant(riskLevel) {
  switch (riskLevel) {
    case 'LOW':
      return 'success'
    case 'MEDIUM':
      return 'warning'
    case 'HIGH':
      return 'danger'
    default:
      return 'default'
  }
}

export function getStatusBadgeVariant(status) {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'WATCHLIST':
      return 'danger'
    default:
      return 'default'
  }
}

export function formatDateTime(value) {
  if (!value) {
    return 'Not available'
  }

  return new Date(value).toLocaleString()
}
