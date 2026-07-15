import { AUDIT_MODULES, AUDIT_SEVERITY } from '../constants/auditConstants'

export function getAuditSeverityBadgeVariant(severity) {
  switch (severity) {
    case AUDIT_SEVERITY.CRITICAL:
      return 'danger'
    case AUDIT_SEVERITY.HIGH:
      return 'danger'
    case AUDIT_SEVERITY.MEDIUM:
      return 'warning'
    default:
      return 'default'
  }
}

export function getAuditModuleBadgeVariant(module) {
  switch (module) {
    case AUDIT_MODULES.AUTH:
    case AUDIT_MODULES.ADMIN:
    case AUDIT_MODULES.SYSTEM_LOCK:
      return 'warning'
    case AUDIT_MODULES.CASHIER:
    case AUDIT_MODULES.ACCOUNTS:
      return 'success'
    case AUDIT_MODULES.DIRECTOR:
    case AUDIT_MODULES.AUDIT:
      return 'danger'
    case AUDIT_MODULES.REPORTS:
    case AUDIT_MODULES.BUSINESS_STATUS:
      return 'info'
    default:
      return 'default'
  }
}

export function formatAuditAction(action) {
  return (action || 'UNKNOWN')
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

export function generateAuditReference() {
  return `AUD-${Date.now().toString().slice(-8)}`
}

export function safeStringifyAuditValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not available'
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch (error) {
    return String(value)
  }
}
