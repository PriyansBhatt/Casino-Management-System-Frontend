import axiosInstance from './axiosInstance'
import { auditPage } from '../utils/auditLogRead'
export async function getAuditLogs(filters = {}) {
  const response = await axiosInstance.get('/audit-logs', { params: filters })
  if (response.data?.success !== true) throw Error('Audit records unavailable.')
  return auditPage(response.data.data)
}
export default { getAuditLogs }
