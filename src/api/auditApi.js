import axiosInstance from './axiosInstance'
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_SEVERITY,
} from '../constants/auditConstants'
import { generateAuditReference } from '../utils/auditUtils'

const auditLogsStorageKey = 'casino_mock_audit_logs'
const isMockAuditEnabled = () => import.meta.env.VITE_USE_MOCK_AUDIT === 'true'
const wait = () => new Promise((resolve) => setTimeout(resolve, 250))

const readStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback
    return parsed ?? fallback
  } catch (error) {
    console.error(`Failed to read ${key}:`, error)
    return fallback
  }
}

const saveStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to save ${key}:`, error)
  }
}

const seedAuditLogs = () => [
  {
    id: '1',
    reference: 'AUD-20830304-001',
    module: AUDIT_MODULES.AUTH,
    action: AUDIT_ACTIONS.LOGIN,
    severity: AUDIT_SEVERITY.LOW,
    description: 'Super Admin logged in.',
    businessDate: '2083-03-04',
    performedBy: 'admin',
    performedByRole: 'SUPER_ADMIN',
    entityType: 'USER_SESSION',
    entityId: 'admin',
    oldValue: null,
    newValue: { loginStatus: 'SUCCESS' },
    reason: '',
    metadata: { ipAddress: '127.0.0.1', mock: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    reference: 'AUD-20830304-002',
    module: AUDIT_MODULES.RECEPTION,
    action: AUDIT_ACTIONS.CREATE,
    severity: AUDIT_SEVERITY.MEDIUM,
    description: 'Customer record created by Receptionist.',
    businessDate: '2083-03-04',
    performedBy: 'reception',
    performedByRole: 'RECEPTIONIST',
    entityType: 'CUSTOMER',
    entityId: 'CUST-0001',
    oldValue: null,
    newValue: { customerCode: 'CUST-0001' },
    reason: 'New customer registration.',
    metadata: { mock: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    reference: 'AUD-20830304-003',
    module: AUDIT_MODULES.CASHIER,
    action: AUDIT_ACTIONS.CREATE,
    severity: AUDIT_SEVERITY.HIGH,
    description: 'Buy-In transaction created by Cashier.',
    businessDate: '2083-03-04',
    performedBy: 'cashier',
    performedByRole: 'CASHIER',
    entityType: 'WALLET_TRANSACTION',
    entityId: 'BI-MOCK-001',
    oldValue: null,
    newValue: { transactionType: 'BUY_IN', amount: 100000 },
    reason: '',
    metadata: { mock: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    reference: 'AUD-20830304-004',
    module: AUDIT_MODULES.CASHIER,
    action: AUDIT_ACTIONS.CREATE,
    severity: AUDIT_SEVERITY.MEDIUM,
    description: 'Cash-Out transaction created by Cashier.',
    businessDate: '2083-03-04',
    performedBy: 'cashier',
    performedByRole: 'CASHIER',
    entityType: 'WALLET_TRANSACTION',
    entityId: 'CO-MOCK-001',
    oldValue: null,
    newValue: { transactionType: 'CASH_OUT', amount: 40000 },
    reason: '',
    metadata: { mock: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    reference: 'AUD-20830304-005',
    module: AUDIT_MODULES.PIT,
    action: AUDIT_ACTIONS.OPEN_SESSION,
    severity: AUDIT_SEVERITY.MEDIUM,
    description: 'Table session opened by Pit Boss.',
    businessDate: '2083-03-04',
    performedBy: 'pitboss',
    performedByRole: 'PIT_BOSS',
    entityType: 'TABLE_SESSION',
    entityId: 'TBL-001',
    oldValue: null,
    newValue: { status: 'OPEN' },
    reason: 'Start of table operation.',
    metadata: { mock: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    reference: 'AUD-20830304-006',
    module: AUDIT_MODULES.ACCOUNTS,
    action: AUDIT_ACTIONS.BILL_VERIFIED,
    severity: AUDIT_SEVERITY.MEDIUM,
    description: 'Bill verified by Accounts.',
    businessDate: '2083-03-04',
    performedBy: 'accounts',
    performedByRole: 'ACCOUNTS',
    entityType: 'BILL',
    entityId: 'BILL-20830304-001',
    oldValue: { status: 'PENDING' },
    newValue: { status: 'VERIFIED' },
    reason: 'Bill details matched procurement delivery.',
    metadata: { mock: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: '7',
    reference: 'AUD-20830304-007',
    module: AUDIT_MODULES.SYSTEM_LOCK,
    action: AUDIT_ACTIONS.SYSTEM_UNLOCK_REQUEST,
    severity: AUDIT_SEVERITY.CRITICAL,
    description: 'System unlock requested by Director.',
    businessDate: '2083-03-04',
    performedBy: 'director',
    performedByRole: 'DIRECTOR',
    entityType: 'SYSTEM_UNLOCK_REQUEST',
    entityId: 'APP-SYS-001',
    oldValue: { systemStatus: 'LOCKED' },
    newValue: { unlockRequested: true },
    reason: 'Urgent operation during settlement lock.',
    metadata: { mock: true },
    createdAt: new Date().toISOString(),
  },
]

let mockAuditLogs = readStorage(auditLogsStorageKey, seedAuditLogs())
const saveAuditLogs = () => saveStorage(auditLogsStorageKey, mockAuditLogs)
const nextId = () => String(Math.max(0, ...mockAuditLogs.map((log) => Number(log.id) || 0)) + 1)

const filterLogs = (logs, filters = {}) => {
  return logs.filter((log) => {
    const moduleMatches = !filters.module || log.module === filters.module
    const actionMatches = !filters.action || log.action === filters.action
    const severityMatches = !filters.severity || log.severity === filters.severity
    const roleMatches = !filters.performedByRole || log.performedByRole === filters.performedByRole
    const userSearch = filters.performedBy?.toLowerCase()
    const userMatches =
      !userSearch ||
      [log.performedBy, log.performedByRole].some((value) =>
        value?.toLowerCase().includes(userSearch)
      )
    const entityTypeMatches =
      !filters.entityType ||
      log.entityType?.toLowerCase().includes(filters.entityType.toLowerCase())
    const businessDateMatches = !filters.businessDate || log.businessDate === filters.businessDate
    const search = filters.search?.toLowerCase()
    const searchMatches =
      !search ||
      [log.reference, log.description, log.entityType, log.entityId]
        .some((value) => value?.toLowerCase().includes(search))

    return moduleMatches && actionMatches && severityMatches && roleMatches && userMatches && entityTypeMatches && businessDateMatches && searchMatches
  })
}

export const auditApi = {
  getAuditLogs: async (filters = {}) => {
    if (isMockAuditEnabled()) {
      await wait()
      return filterLogs(mockAuditLogs, filters).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    const response = await axiosInstance.get('/audit-logs', { params: filters })
    return response.data
  },

  getAuditLogById: async (id) => {
    if (isMockAuditEnabled()) {
      await wait()
      const log = mockAuditLogs.find((item) => item.id === String(id))
      if (!log) throw new Error('Audit log not found')
      return log
    }

    const response = await axiosInstance.get(`/audit-logs/${id}`)
    return response.data
  },

  createAuditLog: async (payload) => {
    if (isMockAuditEnabled()) {
      await wait()
      const log = {
        id: nextId(),
        reference: payload.reference || generateAuditReference(),
        severity: payload.severity || AUDIT_SEVERITY.LOW,
        createdAt: new Date().toISOString(),
        ...payload,
      }
      mockAuditLogs = [log, ...mockAuditLogs]
      saveAuditLogs()
      return log
    }

    const response = await axiosInstance.post('/audit-logs', payload)
    return response.data
  },

  exportAuditLogs: async (filters = {}) => {
    if (isMockAuditEnabled()) {
      await wait()
      return {
        message: 'Export feature will be added in final compliance/export workflow.',
        filters,
        totalRecords: filterLogs(mockAuditLogs, filters).length,
      }
    }

    const response = await axiosInstance.get('/audit-logs/export', { params: filters })
    return response.data
  },
}

export const getAuditLogs = auditApi.getAuditLogs
export const getAuditLogById = auditApi.getAuditLogById
export const createAuditLog = auditApi.createAuditLog
export const exportAuditLogs = auditApi.exportAuditLogs

export default auditApi
