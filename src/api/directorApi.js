import axiosInstance from './axiosInstance'
import CUSTOMER_MOCK_DATA from '../constants/customerMockData'
import { BUY_IN, CASH_OUT } from '../constants/transactionTypes'
import { TABLE_SESSION_STATUSES } from '../constants/pitConstants'
import {
  ALERT_STATUSES,
  ALERT_TYPES,
  APPROVAL_STATUSES,
  APPROVAL_TYPES,
} from '../constants/directorConstants'
import { isHighValueAmount } from '../utils/directorUtils'

const approvalsStorageKey = 'casino_mock_director_approvals'
const alertStatusStorageKey = 'casino_mock_director_alert_statuses'
const cashierStorageKey = 'casino_mock_cashier_transactions'
const pitSessionsStorageKey = 'casino_mock_pit_sessions'
const customerStorageKey = 'casino_mock_customers'
const isMockDirectorEnabled = () => import.meta.env.VITE_USE_MOCK_DIRECTOR === 'true'
const wait = () => new Promise((resolve) => setTimeout(resolve, 250))

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    if (!value) return fallback
    const parsed = JSON.parse(value)
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback
    if (fallback && typeof fallback === 'object') {
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback
    }
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

const getTransactions = () => readStorage(cashierStorageKey, [])
const getPitSessions = () => readStorage(pitSessionsStorageKey, [])
const getCustomers = () => readStorage(customerStorageKey, CUSTOMER_MOCK_DATA)

const getApprovalSeed = () => [
  {
    id: 'APP-HVB-001',
    reference: 'APP-HVB-001',
    type: APPROVAL_TYPES.HIGH_VALUE_TRANSACTION,
    title: 'High-value buy-in approval',
    description: 'Mock approval for a high-value buy-in transaction.',
    amount: 250000,
    status: APPROVAL_STATUSES.PENDING,
    businessDate: '2083-03-04',
    requestedBy: 'Cashier User',
    requestedAt: new Date().toISOString(),
    reason: 'Buy-in amount exceeds approval threshold.',
  },
  {
    id: 'APP-HVC-001',
    reference: 'APP-HVC-001',
    type: APPROVAL_TYPES.HIGH_VALUE_TRANSACTION,
    title: 'High-value cash-out approval',
    description: 'Mock approval for a high-value cash-out transaction.',
    amount: 180000,
    status: APPROVAL_STATUSES.PENDING,
    businessDate: '2083-03-04',
    requestedBy: 'Cashier User',
    requestedAt: new Date().toISOString(),
    reason: 'Cash-out amount exceeds approval threshold.',
  },
  {
    id: 'APP-SYS-001',
    reference: 'APP-SYS-001',
    type: APPROVAL_TYPES.SYSTEM_UNLOCK,
    title: 'System unlock request placeholder',
    description: 'Mock system unlock approval item for director review.',
    status: APPROVAL_STATUSES.PENDING,
    businessDate: '2083-03-04',
    requestedBy: 'System Admin',
    requestedAt: new Date().toISOString(),
    reason: 'Settlement lock requires authorized override for urgent review.',
  },
  {
    id: 'APP-TBL-001',
    reference: 'APP-TBL-001',
    type: APPROVAL_TYPES.TABLE_REVIEW,
    title: 'Table pending review',
    description: 'Mock approval for a table session pending review.',
    status: APPROVAL_STATUSES.PENDING,
    businessDate: '2083-03-04',
    requestedBy: 'Pit Boss User',
    requestedAt: new Date().toISOString(),
    reason: 'Table close was marked review required.',
  },
  {
    id: 'APP-MAN-001',
    reference: 'APP-MAN-001',
    type: APPROVAL_TYPES.MANUAL_CORRECTION,
    title: 'Manual correction request',
    description: 'Mock approval for a manual correction.',
    amount: 12000,
    status: APPROVAL_STATUSES.PENDING,
    businessDate: '2083-03-04',
    requestedBy: 'Admin User',
    requestedAt: new Date().toISOString(),
    reason: 'Correction requested for operator entry mismatch.',
  },
]

const getApprovals = () => readStorage(approvalsStorageKey, getApprovalSeed())
const saveApprovals = (approvals) => saveStorage(approvalsStorageKey, approvals)

const getAlertStatusMap = () => readStorage(alertStatusStorageKey, {})
const saveAlertStatusMap = (statusMap) => saveStorage(alertStatusStorageKey, statusMap)

const applyAlertStatus = (alerts) => {
  const statusMap = getAlertStatusMap()
  return alerts.map((alert) => ({
    ...alert,
    status: statusMap[alert.id]?.status || alert.status,
    reviewedBy: statusMap[alert.id]?.reviewedBy || alert.reviewedBy,
    reviewedAt: statusMap[alert.id]?.reviewedAt || alert.reviewedAt,
    reviewRemarks: statusMap[alert.id]?.reviewRemarks || alert.reviewRemarks,
  }))
}

const generateHighValueAlerts = (filters = {}) => {
  const alerts = getTransactions()
    .filter((transaction) => isHighValueAmount(transaction.amount))
    .filter((transaction) => !filters.businessDate || transaction.businessDate === filters.businessDate)
    .map((transaction) => ({
      id: `ALERT-TX-${transaction.id}`,
      type: transaction.transactionType === BUY_IN
        ? ALERT_TYPES.HIGH_VALUE_BUY_IN
        : ALERT_TYPES.HIGH_VALUE_CASH_OUT,
      title: `High value ${transaction.transactionType === BUY_IN ? 'buy-in' : 'cash-out'}`,
      description: `${transaction.customerName} recorded NPR ${Number(transaction.amount).toLocaleString()}.`,
      amount: transaction.amount,
      reference: transaction.reference,
      customerCode: transaction.customerCode,
      customerName: transaction.customerName,
      businessDate: transaction.businessDate,
      sourceId: transaction.id,
      status: ALERT_STATUSES.OPEN,
      createdAt: transaction.createdAt,
    }))

  return applyAlertStatus(alerts)
}

const generateSuspiciousAlerts = (filters = {}) => {
  const customers = getCustomers()
  const customerMap = new Map(customers.map((customer) => [String(customer.id), customer]))
  const transactionAlerts = getTransactions()
    .filter((transaction) => !filters.businessDate || transaction.businessDate === filters.businessDate)
    .map((transaction) => ({ transaction, customer: customerMap.get(String(transaction.customerId)) }))
    .filter(({ customer }) => customer?.status === 'WATCHLIST' || customer?.riskLevel === 'HIGH')
    .map(({ transaction, customer }) => ({
      id: `ALERT-CUST-${transaction.id}`,
      type: customer.status === 'WATCHLIST'
        ? ALERT_TYPES.WATCHLIST_CUSTOMER
        : ALERT_TYPES.SUSPICIOUS_CUSTOMER,
      title: customer.status === 'WATCHLIST' ? 'Watchlist customer activity' : 'High risk customer activity',
      description: `${customer.fullName} has transaction ${transaction.reference}.`,
      amount: transaction.amount,
      reference: transaction.reference,
      customerCode: customer.customerCode,
      customerName: customer.fullName,
      relatedEntity: customer.customerCode,
      businessDate: transaction.businessDate,
      sourceId: transaction.id,
      status: ALERT_STATUSES.OPEN,
      createdAt: transaction.createdAt,
    }))

  const tableAlerts = getPitSessions()
    .filter((session) => session.status === TABLE_SESSION_STATUSES.PENDING_REVIEW)
    .filter((session) => !filters.businessDate || session.businessDate === filters.businessDate)
    .map((session) => ({
      id: `ALERT-TABLE-${session.id}`,
      type: ALERT_TYPES.TABLE_PENDING_REVIEW,
      title: 'Table session pending review',
      description: `${session.tableCode} ${session.tableName} requires review.`,
      relatedEntity: session.tableCode,
      tableName: session.tableName,
      businessDate: session.businessDate,
      reference: session.reference,
      sourceId: session.id,
      status: ALERT_STATUSES.OPEN,
      createdAt: session.closedAt || session.openedAt,
    }))

  const systemUnlockAlerts = getApprovals()
    .filter((approval) => approval.type === APPROVAL_TYPES.SYSTEM_UNLOCK)
    .filter((approval) => !filters.businessDate || approval.businessDate === filters.businessDate)
    .map((approval) => ({
      id: `ALERT-UNLOCK-${approval.id}`,
      type: ALERT_TYPES.SYSTEM_UNLOCK_REQUEST,
      title: 'System unlock request',
      description: approval.reason || approval.description,
      relatedEntity: approval.reference || approval.id,
      businessDate: approval.businessDate,
      reference: approval.reference || approval.id,
      sourceId: approval.id,
      status: ALERT_STATUSES.OPEN,
      createdAt: approval.requestedAt,
    }))

  return applyAlertStatus([...transactionAlerts, ...tableAlerts, ...systemUnlockAlerts])
}

const filterApprovals = (items, filters = {}) => {
  return items.filter((item) => {
    const statusMatches = !filters.status || item.status === filters.status
    const typeMatches = !filters.type || item.type === filters.type
    const businessDateMatches =
      !filters.businessDate || item.businessDate === filters.businessDate
    return statusMatches && typeMatches && businessDateMatches
  })
}

const filterByStatus = (items, filters = {}) => {
  return items.filter((item) => !filters.status || item.status === filters.status)
}

export const directorApi = {
  getPendingApprovals: async (filters = {}) => {
    if (isMockDirectorEnabled()) {
      await wait()
      return filterApprovals(getApprovals(), {
        ...filters,
        status: filters.status || APPROVAL_STATUSES.PENDING,
      })
    }

    const response = await axiosInstance.get('/director/approvals', { params: filters })
    return response.data
  },

  getApprovalHistory: async (filters = {}) => {
    if (isMockDirectorEnabled()) {
      await wait()
      return filterApprovals(
        getApprovals().filter((approval) => approval.status !== APPROVAL_STATUSES.PENDING),
        filters
      )
    }

    const response = await axiosInstance.get('/director/approvals/history', { params: filters })
    return response.data
  },

  approveRequest: async (id, payload) => {
    if (isMockDirectorEnabled()) {
      await wait()
      const approvals = getApprovals()
      const updated = approvals.map((approval) =>
        approval.id === id
          ? {
              ...approval,
              status: APPROVAL_STATUSES.APPROVED,
              decisionBy: payload?.approvedBy || payload?.decisionBy,
              decisionAt: new Date().toISOString(),
              decisionRemarks: payload?.remarks || '',
            }
          : approval
      )
      saveApprovals(updated)
      return updated.find((approval) => approval.id === id)
    }

    const response = await axiosInstance.post(`/director/approvals/${id}/approve`, payload)
    return response.data
  },

  rejectRequest: async (id, payload) => {
    if (isMockDirectorEnabled()) {
      await wait()
      const approvals = getApprovals()
      const updated = approvals.map((approval) =>
        approval.id === id
          ? {
              ...approval,
              status: APPROVAL_STATUSES.REJECTED,
              decisionBy: payload?.rejectedBy || payload?.decisionBy,
              decisionAt: new Date().toISOString(),
              decisionRemarks: payload?.remarks || '',
            }
          : approval
      )
      saveApprovals(updated)
      return updated.find((approval) => approval.id === id)
    }

    const response = await axiosInstance.post(`/director/approvals/${id}/reject`, payload)
    return response.data
  },

  getHighValueAlerts: async (filters = {}) => {
    if (isMockDirectorEnabled()) {
      await wait()
      return filterByStatus(generateHighValueAlerts(filters), filters)
    }

    const response = await axiosInstance.get('/director/alerts/high-value', { params: filters })
    return response.data
  },

  getSuspiciousAlerts: async (filters = {}) => {
    if (isMockDirectorEnabled()) {
      await wait()
      return filterByStatus(generateSuspiciousAlerts(filters), filters)
    }

    const response = await axiosInstance.get('/director/alerts/suspicious', { params: filters })
    return response.data
  },

  markAlertReviewed: async (id, payload) => {
    if (isMockDirectorEnabled()) {
      await wait()
      const statusMap = getAlertStatusMap()
      const nextMap = {
        ...statusMap,
        [id]: {
          status: payload?.status || ALERT_STATUSES.REVIEWED,
          reviewedBy: payload?.reviewedBy,
          reviewedAt: new Date().toISOString(),
          reviewRemarks: payload?.remarks || '',
        },
      }
      saveAlertStatusMap(nextMap)
      return { id, ...nextMap[id] }
    }

    const response = await axiosInstance.post(`/director/alerts/${id}/review`, payload)
    return response.data
  },
}

export const getPendingApprovals = directorApi.getPendingApprovals
export const getApprovalHistory = directorApi.getApprovalHistory
export const approveRequest = directorApi.approveRequest
export const rejectRequest = directorApi.rejectRequest
export const getHighValueAlerts = directorApi.getHighValueAlerts
export const getSuspiciousAlerts = directorApi.getSuspiciousAlerts
export const markAlertReviewed = directorApi.markAlertReviewed

export default directorApi
