import { createNotification, getNotifications } from '../api/notificationApi'
import { ROLES } from '../constants/roles'
import {
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
} from '../constants/notificationConstants'
import { BILL_STATUSES, PAYMENT_METHODS } from '../constants/accountsConstants'
import { AUDIT_SEVERITY } from '../constants/auditConstants'
import { TABLE_SESSION_STATUSES } from '../constants/pitConstants'
import { REQUEST_STATUSES, STOCK_STATUSES } from '../constants/storeConstants'

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
    console.error(`Failed to read ${key}:`, error)
    return fallback
  }
}

const countWhere = (items, predicate) => items.filter(predicate).length

const addIfNeeded = async (existingReferences, notification) => {
  if (existingReferences.has(notification.reference)) {
    return null
  }

  const created = await createNotification(notification)
  existingReferences.add(notification.reference)
  return created
}

export async function generateSystemNotificationsForUser(user, businessStatus) {
  if (!user?.role) {
    return []
  }

  try {
    const existing = await getNotifications({})
    const existingReferences = new Set(existing.map((item) => item.reference))
    const created = []
    const businessDate = businessStatus?.businessDate

    const transactions = readStorage('casino_mock_cashier_transactions')
    const tableSessions = readStorage('casino_mock_pit_sessions')
    const departmentRequests = readStorage('casino_mock_store_department_requests')
    const stockItems = readStorage('casino_mock_store_stock_items')
    const procurementItems = readStorage('casino_mock_store_procurement_items')
    const bills = readStorage('casino_mock_accounts_bills')
    const payments = readStorage('casino_mock_accounts_payments')
    const auditLogs = readStorage('casino_mock_audit_logs')
    const customers = readStorage('casino_mock_customers')
    const approvals = readStorage('casino_mock_director_approvals')

    const createForRole = async (notification) => {
      const result = await addIfNeeded(existingReferences, {
        status: 'UNREAD',
        businessDate,
        ...notification,
      })
      if (result) created.push(result)
    }

    const managementRoles = [ROLES.DIRECTOR, ROLES.SUPER_ADMIN, ROLES.ADMIN]
    if (managementRoles.includes(user.role)) {
      const pendingApprovals = countWhere(approvals, (item) => item.status === 'PENDING')
      const highValueTransactions = countWhere(transactions, (item) => Number(item.amount || 0) >= 100000)
      const suspiciousCustomers = countWhere(customers, (item) => item.riskLevel === 'HIGH' || item.status === 'WATCHLIST')
      const unlockRequests = countWhere(approvals, (item) => item.type === 'SYSTEM_UNLOCK' && item.status === 'PENDING')
      const pendingReviewTables = countWhere(tableSessions, (item) => item.status === TABLE_SESSION_STATUSES.PENDING_REVIEW)

      if (pendingApprovals > 0) {
        await createForRole({
          reference: `SYS-DIRECTOR-PENDING-APPROVALS-${businessDate || 'ALL'}`,
          title: 'Pending approvals available',
          message: `${pendingApprovals} approval request(s) are waiting for management review.`,
          type: NOTIFICATION_TYPES.APPROVAL,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          targetRoles: managementRoles,
        })
      }
      if (highValueTransactions > 0) {
        await createForRole({
          reference: `SYS-DIRECTOR-HIGH-VALUE-${businessDate || 'ALL'}`,
          title: 'High-value transaction alerts',
          message: `${highValueTransactions} high-value transaction(s) detected in mock cashier data.`,
          type: NOTIFICATION_TYPES.ALERT,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          targetRoles: managementRoles,
        })
      }
      if (suspiciousCustomers > 0) {
        await createForRole({
          reference: 'SYS-DIRECTOR-SUSPICIOUS-CUSTOMERS',
          title: 'Suspicious customer reminders',
          message: `${suspiciousCustomers} high-risk/watchlist customer record(s) need attention.`,
          type: NOTIFICATION_TYPES.ALERT,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          targetRoles: managementRoles,
        })
      }
      if (unlockRequests > 0) {
        await createForRole({
          reference: `SYS-DIRECTOR-UNLOCK-REQUESTS-${businessDate || 'ALL'}`,
          title: 'System unlock requests',
          message: `${unlockRequests} system unlock request(s) are waiting for review.`,
          type: NOTIFICATION_TYPES.SYSTEM_LOCK,
          priority: NOTIFICATION_PRIORITIES.CRITICAL,
          targetRoles: managementRoles,
        })
      }
      if (pendingReviewTables > 0) {
        await createForRole({
          reference: `SYS-DIRECTOR-TABLE-REVIEW-${businessDate || 'ALL'}`,
          title: 'Table sessions pending review',
          message: `${pendingReviewTables} table session(s) are marked pending review.`,
          type: NOTIFICATION_TYPES.PIT,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          targetRoles: managementRoles,
        })
      }
    }

    if (user.role === ROLES.CASHIER) {
      if (businessStatus?.isLocked) {
        await createForRole({
          reference: `SYS-CASHIER-LOCKED-${businessDate || 'ALL'}`,
          title: 'System lock warning',
          message: 'System is locked. Buy-in, cash-out, and sensitive cashier actions are disabled.',
          type: NOTIFICATION_TYPES.SYSTEM_LOCK,
          priority: NOTIFICATION_PRIORITIES.CRITICAL,
          targetRoles: [ROLES.CASHIER],
        })
      }
      await createForRole({
        reference: `SYS-CASHIER-BUSINESS-DATE-${businessDate || 'ALL'}`,
        title: 'Use current Business Date',
        message: `Record cashier transactions under Business Date ${businessDate || 'Not available'}.`,
        type: NOTIFICATION_TYPES.BUSINESS_DATE,
        priority: NOTIFICATION_PRIORITIES.MEDIUM,
        targetRoles: [ROLES.CASHIER],
      })
      await createForRole({
        reference: `SYS-CASHIER-DAILY-REPORT-${businessDate || 'ALL'}`,
        title: 'Daily report reminder',
        message: 'Review the cashier daily report before settlement.',
        type: NOTIFICATION_TYPES.CASHIER,
        priority: NOTIFICATION_PRIORITIES.LOW,
        targetRoles: [ROLES.CASHIER],
      })
    }

    if (user.role === ROLES.RECEPTIONIST) {
      const riskyCustomers = countWhere(customers, (item) => item.riskLevel === 'HIGH' || item.status === 'WATCHLIST')
      if (riskyCustomers > 0) {
        await createForRole({
          reference: 'SYS-RECEPTION-RISKY-CUSTOMERS',
          title: 'Watchlist/high-risk customer reminder',
          message: `${riskyCustomers} customer record(s) are marked high-risk or watchlist.`,
          type: NOTIFICATION_TYPES.ALERT,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          targetRoles: [ROLES.RECEPTIONIST],
        })
      }
      await createForRole({
        reference: 'SYS-RECEPTION-DUPLICATE-CHECK',
        title: 'Duplicate customer check reminder',
        message: 'Search by customer code, name, or phone before registering a new customer.',
        type: NOTIFICATION_TYPES.INFO,
        priority: NOTIFICATION_PRIORITIES.MEDIUM,
        targetRoles: [ROLES.RECEPTIONIST],
      })
    }

    if (user.role === ROLES.PIT_BOSS) {
      const openSessions = countWhere(tableSessions, (item) => item.status === TABLE_SESSION_STATUSES.OPEN)
      const pendingReview = countWhere(tableSessions, (item) => item.status === TABLE_SESSION_STATUSES.PENDING_REVIEW)
      if (openSessions > 0) {
        await createForRole({
          reference: `SYS-PIT-OPEN-SESSIONS-${businessDate || 'ALL'}`,
          title: 'Open table session reminder',
          message: `${openSessions} table session(s) are currently open.`,
          type: NOTIFICATION_TYPES.PIT,
          priority: NOTIFICATION_PRIORITIES.MEDIUM,
          targetRoles: [ROLES.PIT_BOSS],
        })
      }
      if (pendingReview > 0) {
        await createForRole({
          reference: `SYS-PIT-PENDING-REVIEW-${businessDate || 'ALL'}`,
          title: 'Pending review table sessions',
          message: `${pendingReview} table session(s) require review.`,
          type: NOTIFICATION_TYPES.PIT,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          targetRoles: [ROLES.PIT_BOSS],
        })
      }
    }

    if (user.role === ROLES.STORE_KEEPER) {
      const newRequests = countWhere(departmentRequests, (item) => item.status === REQUEST_STATUSES.PENDING_STORE_REVIEW)
      const lowStock = countWhere(stockItems, (item) =>
        item.status === STOCK_STATUSES.LOW_STOCK ||
        Number(item.currentStock || 0) <= Number(item.minimumStock || 0)
      )
      const deliveryReceive = countWhere(procurementItems, (item) =>
        [REQUEST_STATUSES.ORDERED, REQUEST_STATUSES.PARTIALLY_DELIVERED].includes(item.status)
      )

      if (newRequests > 0) {
        await createForRole({
          reference: `SYS-STORE-NEW-REQUESTS-${businessDate || 'ALL'}`,
          title: 'New department requests',
          message: `${newRequests} department request(s) are pending store review.`,
          type: NOTIFICATION_TYPES.STORE,
          priority: NOTIFICATION_PRIORITIES.MEDIUM,
          targetRoles: [ROLES.STORE_KEEPER],
        })
      }
      if (lowStock > 0) {
        await createForRole({
          reference: 'SYS-STORE-LOW-STOCK',
          title: 'Low stock alerts',
          message: `${lowStock} stock item(s) are at or below minimum stock.`,
          type: NOTIFICATION_TYPES.STORE,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          targetRoles: [ROLES.STORE_KEEPER],
        })
      }
      if (deliveryReceive > 0) {
        await createForRole({
          reference: `SYS-STORE-DELIVERY-RECEIVE-${businessDate || 'ALL'}`,
          title: 'Pending delivery receive',
          message: `${deliveryReceive} procurement item(s) are ready for delivery receive.`,
          type: NOTIFICATION_TYPES.STORE,
          priority: NOTIFICATION_PRIORITIES.MEDIUM,
          targetRoles: [ROLES.STORE_KEEPER],
        })
      }
    }

    if (user.role === ROLES.PROCUREMENT) {
      const awaitingQuotations = countWhere(procurementItems, (item) => item.status === REQUEST_STATUSES.PROCUREMENT_REQUIRED)
      const purchaseOrders = countWhere(procurementItems, (item) => item.selectedQuotation && item.status !== REQUEST_STATUSES.ORDERED)
      if (awaitingQuotations > 0) {
        await createForRole({
          reference: `SYS-PROC-QUOTATIONS-${businessDate || 'ALL'}`,
          title: 'Vendor quotations needed',
          message: `${awaitingQuotations} procurement item(s) are awaiting vendor quotations.`,
          type: NOTIFICATION_TYPES.STORE,
          priority: NOTIFICATION_PRIORITIES.MEDIUM,
          targetRoles: [ROLES.PROCUREMENT],
        })
      }
      if (purchaseOrders > 0) {
        await createForRole({
          reference: `SYS-PROC-PURCHASE-ORDERS-${businessDate || 'ALL'}`,
          title: 'Purchase orders pending',
          message: `${purchaseOrders} procurement item(s) have selected quotations and need ordering.`,
          type: NOTIFICATION_TYPES.STORE,
          priority: NOTIFICATION_PRIORITIES.MEDIUM,
          targetRoles: [ROLES.PROCUREMENT],
        })
      }
    }

    if (user.role === ROLES.ACCOUNTS) {
      const pendingBills = countWhere(bills, (item) => item.status === BILL_STATUSES.PENDING)
      const chequePayments = countWhere(payments, (item) => item.paymentMethod === PAYMENT_METHODS.CHEQUE)
      const highValuePayments = countWhere(payments, (item) => Number(item.amount || 0) >= 100000)
      if (pendingBills > 0) {
        await createForRole({
          reference: `SYS-ACCOUNTS-PENDING-BILLS-${businessDate || 'ALL'}`,
          title: 'Pending bills',
          message: `${pendingBills} bill(s) are pending accounts review.`,
          type: NOTIFICATION_TYPES.ACCOUNTS,
          priority: NOTIFICATION_PRIORITIES.MEDIUM,
          targetRoles: [ROLES.ACCOUNTS],
        })
      }
      if (chequePayments > 0) {
        await createForRole({
          reference: `SYS-ACCOUNTS-CHEQUE-PAYMENTS-${businessDate || 'ALL'}`,
          title: 'Cheque payment reminder',
          message: `${chequePayments} cheque payment record(s) are available for review.`,
          type: NOTIFICATION_TYPES.ACCOUNTS,
          priority: NOTIFICATION_PRIORITIES.MEDIUM,
          targetRoles: [ROLES.ACCOUNTS],
        })
      }
      if (highValuePayments > 0) {
        await createForRole({
          reference: `SYS-ACCOUNTS-HIGH-PAYMENTS-${businessDate || 'ALL'}`,
          title: 'High-value payment reminder',
          message: `${highValuePayments} payment(s) are at or above NPR 100,000.`,
          type: NOTIFICATION_TYPES.ACCOUNTS,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          targetRoles: [ROLES.ACCOUNTS],
        })
      }
    }

    if (user.role === ROLES.DEPARTMENT_HEAD) {
      const waitingConfirmation = countWhere(departmentRequests, (item) => item.status === REQUEST_STATUSES.PENDING_DEPARTMENT_CONFIRMATION)
      if (waitingConfirmation > 0) {
        await createForRole({
          reference: `SYS-DEPT-CONFIRM-${businessDate || 'ALL'}`,
          title: 'Requests waiting for confirmation',
          message: `${waitingConfirmation} request(s) are waiting for received confirmation.`,
          type: NOTIFICATION_TYPES.STORE,
          priority: NOTIFICATION_PRIORITIES.MEDIUM,
          targetRoles: [ROLES.DEPARTMENT_HEAD],
        })
      }
      await createForRole({
        reference: `SYS-DEPT-STATUS-UPDATES-${businessDate || 'ALL'}`,
        title: 'Department request status updates',
        message: 'Review My Requests for the latest store/procurement status.',
        type: NOTIFICATION_TYPES.INFO,
        priority: NOTIFICATION_PRIORITIES.LOW,
        targetRoles: [ROLES.DEPARTMENT_HEAD],
      })
    }

    if (user.role === ROLES.AUDITOR) {
      const criticalLogs = countWhere(auditLogs, (item) =>
        [AUDIT_SEVERITY.HIGH, AUDIT_SEVERITY.CRITICAL].includes(item.severity)
      )
      const unlockLogs = countWhere(auditLogs, (item) =>
        item.action === 'SYSTEM_UNLOCK_REQUEST' || item.module === 'SYSTEM_LOCK'
      )
      if (criticalLogs > 0) {
        await createForRole({
          reference: `SYS-AUDIT-HIGH-LOGS-${businessDate || 'ALL'}`,
          title: 'Critical/high audit logs',
          message: `${criticalLogs} high or critical audit log(s) are available for review.`,
          type: NOTIFICATION_TYPES.AUDIT,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          targetRoles: [ROLES.AUDITOR],
        })
      }
      if (unlockLogs > 0) {
        await createForRole({
          reference: `SYS-AUDIT-UNLOCK-LOGS-${businessDate || 'ALL'}`,
          title: 'System unlock audit reminder',
          message: `${unlockLogs} system lock/unlock audit event(s) should be reviewed.`,
          type: NOTIFICATION_TYPES.AUDIT,
          priority: NOTIFICATION_PRIORITIES.CRITICAL,
          targetRoles: [ROLES.AUDITOR],
        })
      }
    }

    return created
  } catch (error) {
    console.error('Notification generation failed:', error)
    return []
  }
}

export default generateSystemNotificationsForUser
