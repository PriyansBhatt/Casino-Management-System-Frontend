// Audit records are created exclusively by backend business operations.
export async function logAuditEvent() { return null }
export async function safeLogAuditEvent() { return null }
export default logAuditEvent
