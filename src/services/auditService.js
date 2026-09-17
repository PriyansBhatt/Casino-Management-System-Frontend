import { authoritativeTestMode } from '../utils/testEnvironment'
import { createAuditLog } from '../api/auditApi'
import { AUDIT_SEVERITY } from '../constants/auditConstants'

export async function logAuditEvent(payload) {
  return createAuditLog({
    module: payload.module,
    action: payload.action,
    severity: payload.severity || AUDIT_SEVERITY.LOW,
    description: payload.description,
    businessDate: payload.businessDate,
    performedBy: payload.performedBy,
    performedByRole: payload.performedByRole,
    entityType: payload.entityType,
    entityId: payload.entityId,
    oldValue: payload.oldValue,
    newValue: payload.newValue,
    reason: payload.reason,
    metadata: payload.metadata,
  })
}

export async function safeLogAuditEvent(payload) {
  // Legacy client audit submission has no supported backend write contract.
  // Authoritative backend operations retain their own persisted auditing.
  if (authoritativeTestMode) return null
  try {
    return await logAuditEvent(payload)
  } catch (error) {
    console.error('Audit logging failed:', error)
    return null
  }
}

export default logAuditEvent
