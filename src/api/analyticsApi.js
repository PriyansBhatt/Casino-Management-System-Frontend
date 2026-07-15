import axiosInstance from './axiosInstance'
import { BUY_IN, CASH_OUT } from '../constants/transactionTypes'
import { REQUEST_STATUSES, STOCK_STATUSES } from '../constants/storeConstants'
import { BILL_STATUSES, PAYMENT_STATUSES } from '../constants/accountsConstants'
import { TABLE_SESSION_STATUSES } from '../constants/pitConstants'
import { ALERT_STATUSES, APPROVAL_STATUSES } from '../constants/directorConstants'
import { AUDIT_SEVERITY } from '../constants/auditConstants'
import { calculateTotalAmount, groupByBusinessDate } from '../utils/analyticsUtils'

const isMockAnalyticsEnabled = () => import.meta.env.VITE_USE_MOCK_ANALYTICS === 'true'
const wait = () => new Promise((resolve) => setTimeout(resolve, 250))

const storageKeys = {
  cashierTransactions: 'casino_mock_cashier_transactions',
  pitSessions: 'casino_mock_pit_sessions',
  storeRequests: 'casino_mock_store_department_requests',
  stockItems: 'casino_mock_store_stock_items',
  procurementItems: 'casino_mock_store_procurement_items',
  bills: 'casino_mock_accounts_bills',
  expenses: 'casino_mock_accounts_expenses',
  payments: 'casino_mock_accounts_payments',
  customers: 'casino_mock_customers',
  approvals: 'casino_mock_director_approvals',
  alertStatuses: 'casino_mock_director_alert_statuses',
  auditLogs: 'casino_mock_audit_logs',
}

const readStorage = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback
    if (fallback && typeof fallback === 'object') {
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback
    }
    return parsed ?? fallback
  } catch (error) {
    console.error(`Failed to read analytics storage ${key}:`, error)
    return fallback
  }
}

const filterByBusinessDate = (items = [], businessDate) => {
  if (!businessDate || businessDate === 'ALL') return items
  return items.filter((item) => item.businessDate === businessDate)
}

const getMockData = (filters = {}) => {
  const businessDate = filters.businessDate

  return {
    transactions: filterByBusinessDate(readStorage(storageKeys.cashierTransactions), businessDate),
    pitSessions: filterByBusinessDate(readStorage(storageKeys.pitSessions), businessDate),
    storeRequests: filterByBusinessDate(readStorage(storageKeys.storeRequests), businessDate),
    procurementItems: filterByBusinessDate(readStorage(storageKeys.procurementItems), businessDate),
    bills: filterByBusinessDate(readStorage(storageKeys.bills), businessDate),
    expenses: filterByBusinessDate(readStorage(storageKeys.expenses), businessDate),
    payments: filterByBusinessDate(readStorage(storageKeys.payments), businessDate),
    stockItems: readStorage(storageKeys.stockItems),
    customers: readStorage(storageKeys.customers),
    approvals: filterByBusinessDate(readStorage(storageKeys.approvals), businessDate),
    alertStatuses: readStorage(storageKeys.alertStatuses, {}),
    auditLogs: filterByBusinessDate(readStorage(storageKeys.auditLogs), businessDate),
  }
}

const buildCashierAnalytics = (transactions, businessDate) => {
  const buyIns = transactions.filter((item) => item.transactionType === BUY_IN)
  const cashOuts = transactions.filter((item) => item.transactionType === CASH_OUT)
  const totalBuyIn = calculateTotalAmount(buyIns)
  const totalCashOut = calculateTotalAmount(cashOuts)

  return {
    businessDate: businessDate || 'ALL',
    totalBuyIn,
    totalCashOut,
    netCashPosition: totalBuyIn - totalCashOut,
    totalTransactions: transactions.length,
    uniqueCustomers: new Set(transactions.map((item) => item.customerId).filter(Boolean)).size,
    highValueTransactions: transactions.filter((item) => Number(item.amount || 0) >= 100000).length,
    transactionsByBusinessDate: groupByBusinessDate(transactions),
  }
}

const buildPitAnalytics = (pitSessions, businessDate) => {
  const closedSessions = pitSessions.filter((item) => item.status === TABLE_SESSION_STATUSES.CLOSED)
  const openSessions = pitSessions.filter((item) => item.status === TABLE_SESSION_STATUSES.OPEN)
  const pendingReviewSessions = pitSessions.filter(
    (item) => item.status === TABLE_SESSION_STATUSES.PENDING_REVIEW
  )
  const totalOpeningAmount = calculateTotalAmount(pitSessions, 'openingAmount')
  const totalClosingAmount = calculateTotalAmount(closedSessions, 'closingAmount')

  return {
    businessDate: businessDate || 'ALL',
    totalSessions: pitSessions.length,
    openSessions: openSessions.length,
    closedSessions: closedSessions.length,
    pendingReviewSessions: pendingReviewSessions.length,
    totalOpeningAmount,
    totalClosingAmount,
    netTablePosition: totalClosingAmount - totalOpeningAmount,
  }
}

const buildStoreAnalytics = (storeRequests, stockItems, procurementItems, businessDate) => {
  return {
    businessDate: businessDate || 'ALL',
    totalRequests: storeRequests.length,
    pendingStoreReview: storeRequests.filter(
      (item) => item.status === REQUEST_STATUSES.PENDING_STORE_REVIEW
    ).length,
    procurementRequired: storeRequests.filter(
      (item) => item.status === REQUEST_STATUSES.PROCUREMENT_REQUIRED
    ).length,
    confirmedReceived: storeRequests.filter(
      (item) => item.status === REQUEST_STATUSES.CONFIRMED_RECEIVED
    ).length,
    lowStockItems: stockItems.filter((item) => item.status === STOCK_STATUSES.LOW_STOCK).length,
    outOfStockItems: stockItems.filter((item) => item.status === STOCK_STATUSES.OUT_OF_STOCK).length,
    procurementItems: procurementItems.length,
    orderedProcurementItems: procurementItems.filter(
      (item) => item.status === REQUEST_STATUSES.ORDERED
    ).length,
    partialDeliveries: procurementItems.filter(
      (item) => item.status === REQUEST_STATUSES.PARTIALLY_DELIVERED
    ).length,
    fullDeliveries: procurementItems.filter(
      (item) => item.status === REQUEST_STATUSES.FULLY_DELIVERED
    ).length,
    departmentConfirmationsPending: procurementItems.filter(
      (item) => item.status === REQUEST_STATUSES.PENDING_DEPARTMENT_CONFIRMATION
    ).length,
  }
}

const buildAccountsAnalytics = (bills, expenses, payments, businessDate) => {
  const completedPayments = payments.filter((item) => item.status === PAYMENT_STATUSES.COMPLETED)

  return {
    businessDate: businessDate || 'ALL',
    totalBills: bills.length,
    pendingBills: bills.filter((item) => item.status === BILL_STATUSES.PENDING).length,
    paidBills: bills.filter((item) => item.status === BILL_STATUSES.PAID).length,
    totalBillAmount: calculateTotalAmount(bills, 'billAmount'),
    totalPaidAmount: calculateTotalAmount(bills, 'paidAmount'),
    totalRemainingAmount: calculateTotalAmount(bills, 'remainingAmount'),
    totalExpenses: calculateTotalAmount(expenses),
    totalPayments: calculateTotalAmount(completedPayments),
    highValuePayments: completedPayments.filter((item) => Number(item.amount || 0) >= 100000).length,
  }
}

const buildCustomerAnalytics = (customers, transactions, businessDate) => {
  const transactionsByCustomer = transactions.reduce((groups, transaction) => {
    const customerId = transaction.customerId || 'unknown'
    return {
      ...groups,
      [customerId]: [...(groups[customerId] || []), transaction],
    }
  }, {})

  const netLossByCustomer = Object.entries(transactionsByCustomer).map(([customerId, items]) => {
    const totalBuyIn = calculateTotalAmount(
      items.filter((item) => item.transactionType === BUY_IN)
    )
    const totalCashOut = calculateTotalAmount(
      items.filter((item) => item.transactionType === CASH_OUT)
    )
    return {
      customerId,
      customerName: items[0]?.customerName || 'Unknown customer',
      totalBuyIn,
      totalCashOut,
      netVerifiedLoss: Math.max(totalBuyIn - totalCashOut, 0),
    }
  })

  return {
    businessDate: businessDate || 'ALL',
    totalCustomers: customers.length,
    newCustomers: customers.filter(
      (item) => !businessDate || businessDate === 'ALL' || item.createdAt?.startsWith(businessDate)
    ).length,
    activeCustomers: customers.filter((item) => item.status === 'ACTIVE').length,
    watchlistCustomers: customers.filter((item) => item.status === 'WATCHLIST').length,
    highRiskCustomers: customers.filter((item) => item.riskLevel === 'HIGH').length,
    customersWithTransactions: Object.keys(transactionsByCustomer).length,
    netLossByCustomer,
  }
}

const buildDirectorAnalytics = (approvals, alertStatuses, transactions, pitSessions, customers, businessDate) => {
  const highValueAlerts = transactions.filter((item) => Number(item.amount || 0) >= 100000)
  const suspiciousCustomerAlerts = customers.filter(
    (item) => item.status === 'WATCHLIST' || item.riskLevel === 'HIGH'
  )
  const tableAlerts = pitSessions.filter((item) => item.status === TABLE_SESSION_STATUSES.PENDING_REVIEW)
  const openGeneratedAlertCount = [...highValueAlerts, ...suspiciousCustomerAlerts, ...tableAlerts].filter(
    (item) => alertStatuses[`ALERT-TX-${item.id}`]?.status !== ALERT_STATUSES.REVIEWED
  ).length

  return {
    businessDate: businessDate || 'ALL',
    pendingApprovals: approvals.filter((item) => item.status === APPROVAL_STATUSES.PENDING).length,
    openAlerts: openGeneratedAlertCount,
    highValueAlerts: highValueAlerts.length,
    suspiciousAlerts: suspiciousCustomerAlerts.length + tableAlerts.length,
  }
}

const buildAuditAnalytics = (auditLogs, businessDate) => {
  return {
    businessDate: businessDate || 'ALL',
    totalLogs: auditLogs.length,
    criticalLogs: auditLogs.filter((item) => item.severity === AUDIT_SEVERITY.CRITICAL).length,
    highSeverityLogs: auditLogs.filter((item) => item.severity === AUDIT_SEVERITY.HIGH).length,
  }
}

export const analyticsApi = {
  getBusinessAnalytics: async (filters = {}) => {
    if (isMockAnalyticsEnabled()) {
      await wait()
      const data = getMockData(filters)
      const cashier = buildCashierAnalytics(data.transactions, filters.businessDate)
      const pit = buildPitAnalytics(data.pitSessions, filters.businessDate)
      const store = buildStoreAnalytics(
        data.storeRequests,
        data.stockItems,
        data.procurementItems,
        filters.businessDate
      )
      const accounts = buildAccountsAnalytics(data.bills, data.expenses, data.payments, filters.businessDate)
      const customers = buildCustomerAnalytics(data.customers, data.transactions, filters.businessDate)
      const director = buildDirectorAnalytics(
        data.approvals,
        data.alertStatuses,
        data.transactions,
        data.pitSessions,
        data.customers,
        filters.businessDate
      )
      const audit = buildAuditAnalytics(data.auditLogs, filters.businessDate)

      return {
        businessDate: filters.businessDate || 'ALL',
        cashier,
        pit,
        store,
        accounts,
        customers,
        director,
        audit,
      }
    }

    const response = await axiosInstance.get('/analytics/business', { params: filters })
    return response.data
  },

  getCashierAnalytics: async (filters = {}) => {
    if (isMockAnalyticsEnabled()) {
      await wait()
      const data = getMockData(filters)
      return buildCashierAnalytics(data.transactions, filters.businessDate)
    }

    const response = await axiosInstance.get('/analytics/cashier', { params: filters })
    return response.data
  },

  getPitAnalytics: async (filters = {}) => {
    if (isMockAnalyticsEnabled()) {
      await wait()
      const data = getMockData(filters)
      return buildPitAnalytics(data.pitSessions, filters.businessDate)
    }

    const response = await axiosInstance.get('/analytics/pit', { params: filters })
    return response.data
  },

  getStoreAnalytics: async (filters = {}) => {
    if (isMockAnalyticsEnabled()) {
      await wait()
      const data = getMockData(filters)
      return buildStoreAnalytics(data.storeRequests, data.stockItems, data.procurementItems, filters.businessDate)
    }

    const response = await axiosInstance.get('/analytics/store', { params: filters })
    return response.data
  },

  getAccountsAnalytics: async (filters = {}) => {
    if (isMockAnalyticsEnabled()) {
      await wait()
      const data = getMockData(filters)
      return buildAccountsAnalytics(data.bills, data.expenses, data.payments, filters.businessDate)
    }

    const response = await axiosInstance.get('/analytics/accounts', { params: filters })
    return response.data
  },

  getCustomerAnalytics: async (filters = {}) => {
    if (isMockAnalyticsEnabled()) {
      await wait()
      const data = getMockData(filters)
      return buildCustomerAnalytics(data.customers, data.transactions, filters.businessDate)
    }

    const response = await axiosInstance.get('/analytics/customers', { params: filters })
    return response.data
  },
}

export const getBusinessAnalytics = analyticsApi.getBusinessAnalytics
export const getCashierAnalytics = analyticsApi.getCashierAnalytics
export const getPitAnalytics = analyticsApi.getPitAnalytics
export const getStoreAnalytics = analyticsApi.getStoreAnalytics
export const getAccountsAnalytics = analyticsApi.getAccountsAnalytics
export const getCustomerAnalytics = analyticsApi.getCustomerAnalytics

export default analyticsApi
