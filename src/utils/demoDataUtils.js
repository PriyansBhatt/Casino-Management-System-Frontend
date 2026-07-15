const BUSINESS_DATE = '2083-03-04'
const now = () => new Date().toISOString()

const storageKeys = {
  customers: 'casino_mock_customers',
  cashierTransactions: 'casino_mock_cashier_transactions',
  pitTables: 'casino_mock_pit_tables',
  pitSessions: 'casino_mock_pit_sessions',
  storeRequests: 'casino_mock_store_department_requests',
  stockItems: 'casino_mock_store_stock_items',
  procurementItems: 'casino_mock_store_procurement_items',
  vendorQuotations: 'casino_mock_store_vendor_quotations',
  accountsBills: 'casino_mock_accounts_bills',
  accountsExpenses: 'casino_mock_accounts_expenses',
  accountsPayments: 'casino_mock_accounts_payments',
  directorApprovals: 'casino_mock_director_approvals',
  directorAlertStatuses: 'casino_mock_director_alert_statuses',
  auditLogs: 'casino_mock_audit_logs',
  notifications: 'casino_mock_notifications',
  adminUsers: 'casino_mock_admin_users',
  adminDepartments: 'casino_mock_admin_departments',
  adminSettings: 'casino_mock_admin_settings',
}

const readArray = (key) => {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error(`Failed to read demo data ${key}:`, error)
    return []
  }
}

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value))

const createDemoData = () => {
  const createdAt = now()
  const customers = [
    { id: '1', customerCode: 'CUST-0001', fullName: 'Aarav Shrestha', phone: '9800000001', email: 'aarav@example.com', nationality: 'Nepali', documentType: 'Citizenship', documentNumber: 'NP-10001', dateOfBirth: '1990-01-15', gender: 'Male', address: 'Kathmandu', status: 'ACTIVE', riskLevel: 'LOW', remarks: 'Regular guest for demo.', createdAt, updatedAt: createdAt },
    { id: '2', customerCode: 'CUST-0002', fullName: 'Maya Gurung', phone: '9800000002', email: 'maya@example.com', nationality: 'Nepali', documentType: 'Passport', documentNumber: 'P-20002', dateOfBirth: '1988-05-20', gender: 'Female', address: 'Pokhara', status: 'WATCHLIST', riskLevel: 'HIGH', remarks: 'Watchlist/high-risk demo customer.', createdAt, updatedAt: createdAt },
    { id: '3', customerCode: 'CUST-0003', fullName: 'Rohan Lama', phone: '9800000003', email: 'rohan@example.com', nationality: 'Indian', documentType: 'Passport', documentNumber: 'IN-30003', dateOfBirth: '1985-08-12', gender: 'Male', address: 'Delhi', status: 'ACTIVE', riskLevel: 'HIGH', remarks: 'High-risk customer for alert demo.', createdAt, updatedAt: createdAt },
  ]

  const cashierTransactions = [
    { id: '1', reference: 'BI-DEMO-001', customerId: '1', customerCode: 'CUST-0001', customerName: 'Aarav Shrestha', amount: 50000, paymentMethod: 'CASH', remarks: 'Normal buy-in demo.', businessDate: BUSINESS_DATE, transactionType: 'BUY_IN', createdBy: 'cashier', createdAt },
    { id: '2', reference: 'CO-DEMO-001', customerId: '1', customerCode: 'CUST-0001', customerName: 'Aarav Shrestha', amount: 20000, paymentMethod: 'CASH', remarks: 'Normal cash-out demo.', businessDate: BUSINESS_DATE, transactionType: 'CASH_OUT', createdBy: 'cashier', createdAt },
    { id: '3', reference: 'BI-DEMO-002', customerId: '2', customerCode: 'CUST-0002', customerName: 'Maya Gurung', amount: 150000, paymentMethod: 'BANK_TRANSFER', remarks: 'High-value buy-in over threshold.', businessDate: BUSINESS_DATE, transactionType: 'BUY_IN', createdBy: 'cashier', createdAt },
    { id: '4', reference: 'BI-DEMO-003', customerId: '3', customerCode: 'CUST-0003', customerName: 'Rohan Lama', amount: 100000, paymentMethod: 'CASH', remarks: 'Net loss preview demo buy-in.', businessDate: BUSINESS_DATE, transactionType: 'BUY_IN', createdBy: 'cashier', createdAt },
  ]

  const pitTables = [
    { id: '1', tableCode: 'TBL-001', tableName: 'Baccarat 1', gameType: 'BACCARAT', location: 'Main Pit', status: 'AVAILABLE', minimumBet: 1000, maximumBet: 100000, remarks: 'Available demo table.' },
    { id: '2', tableCode: 'TBL-002', tableName: 'Blackjack 1', gameType: 'BLACKJACK', location: 'Main Pit', status: 'OPEN', minimumBet: 500, maximumBet: 50000, remarks: 'Open session demo table.' },
    { id: '3', tableCode: 'TBL-003', tableName: 'Roulette 1', gameType: 'ROULETTE', location: 'VIP Pit', status: 'CLOSED', minimumBet: 1000, maximumBet: 75000, remarks: 'Closed demo table.' },
  ]

  const pitSessions = [
    { id: '1', reference: 'TS-DEMO-001', tableId: '2', tableCode: 'TBL-002', tableName: 'Blackjack 1', gameType: 'BLACKJACK', dealerName: 'Dealer Demo', pitBossName: 'Pit Boss Demo', openingAmount: 200000, closingAmount: null, netAmount: null, businessDate: BUSINESS_DATE, status: 'OPEN', openedAt: createdAt, createdBy: 'pitboss', remarks: [] },
    { id: '2', reference: 'TS-DEMO-002', tableId: '3', tableCode: 'TBL-003', tableName: 'Roulette 1', gameType: 'ROULETTE', dealerName: 'Dealer Closed', pitBossName: 'Pit Boss Demo', openingAmount: 150000, closingAmount: 175000, netAmount: 25000, businessDate: BUSINESS_DATE, status: 'CLOSED', openedAt: createdAt, closedAt: createdAt, createdBy: 'pitboss', closedBy: 'pitboss', remarks: [{ text: 'Closed normally for demo.', createdBy: 'pitboss', createdAt }] },
    { id: '3', reference: 'TS-DEMO-003', tableId: '1', tableCode: 'TBL-001', tableName: 'Baccarat 1', gameType: 'BACCARAT', dealerName: 'Dealer Review', pitBossName: 'Pit Boss Demo', openingAmount: 300000, closingAmount: 210000, netAmount: -90000, businessDate: BUSINESS_DATE, status: 'PENDING_REVIEW', openedAt: createdAt, closedAt: createdAt, createdBy: 'pitboss', closedBy: 'pitboss', remarks: [{ text: 'Pending review session for director alert demo.', createdBy: 'pitboss', createdAt }] },
  ]

  const storeRequests = [
    { id: '1', reference: 'REQ-DEMO-001', departmentName: 'Reception', requestedBy: 'Reception Head', requestType: 'NORMAL', items: [{ itemName: 'Guest Cards', quantity: 100, unit: 'pcs', remarks: '' }], reason: 'Daily operations', status: 'PENDING_STORE_REVIEW', businessDate: BUSINESS_DATE, createdAt },
    { id: '2', reference: 'REQ-DEMO-002', departmentName: 'Pit', requestedBy: 'Pit Boss', requestType: 'URGENT', items: [{ itemName: 'Card Shoes', quantity: 2, unit: 'pcs', remarks: 'Urgent replacement' }], reason: 'Table support', status: 'PROCUREMENT_REQUIRED', businessDate: BUSINESS_DATE, createdAt },
    { id: '3', reference: 'REQ-DEMO-003', departmentName: 'Accounts', requestedBy: 'Accounts Head', requestType: 'NEXT_DAY', items: [{ itemName: 'Cheque Books', quantity: 5, unit: 'books', remarks: 'Next-day request' }], reason: 'Payment processing', status: 'PENDING_DEPARTMENT_CONFIRMATION', deliveryStatus: 'FULL', businessDate: BUSINESS_DATE, createdAt },
  ]

  const stockItems = [
    { id: '1', itemCode: 'STK-001', itemName: 'Guest Cards', category: 'Reception', currentStock: 500, minimumStock: 100, unit: 'pcs', location: 'Store A', status: 'IN_STOCK', remarks: 'Normal stock.' },
    { id: '2', itemCode: 'STK-002', itemName: 'Card Shoes', category: 'Pit', currentStock: 1, minimumStock: 3, unit: 'pcs', location: 'Store B', status: 'LOW_STOCK', remarks: 'Low stock demo.' },
  ]

  const procurementItems = [
    { id: '1', reference: 'PROC-DEMO-001', requestId: '2', requestReference: 'REQ-DEMO-002', departmentName: 'Pit', itemName: 'Card Shoes', quantity: 2, unit: 'pcs', status: 'ORDERED', deliveryStatus: 'PARTIAL', businessDate: BUSINESS_DATE, createdAt, selectedQuotation: { id: '1', vendorName: 'Casino Supplies Nepal', quotedAmount: 12000, isSelected: true }, deliveries: [{ id: 'DEL-DEMO-001', receivedItems: 'Card Shoes', receivedQuantity: 1, deliveryStatus: 'PARTIAL', billNumber: 'BILL-DEMO-001', billAmount: 6000, remarks: 'Partial delivery demo.', receivedAt: createdAt }] },
  ]

  const vendorQuotations = [
    { id: '1', procurementId: '1', vendorName: 'Casino Supplies Nepal', vendorContact: '9801111111', quotedAmount: 12000, estimatedDeliveryDate: '2083-03-06', remarks: 'Selected quotation.', isSelected: true, createdAt },
    { id: '2', procurementId: '1', vendorName: 'Hospitality Trade House', vendorContact: '9802222222', quotedAmount: 13500, estimatedDeliveryDate: '2083-03-07', remarks: 'Alternate quotation.', isSelected: false, createdAt },
  ]

  const accountsBills = [
    { id: '1', billReference: 'BILL-DEMO-001', vendorName: 'Casino Supplies Nepal', vendorContact: '9801111111', sourceModule: 'PROCUREMENT', sourceReference: 'PROC-DEMO-001', billNumber: 'CSN-1001', billAmount: 6000, paidAmount: 0, remainingAmount: 6000, status: 'PENDING', businessDate: BUSINESS_DATE, billDate: BUSINESS_DATE, dueDate: '2083-03-08', remarks: 'Pending demo bill.', createdAt },
    { id: '2', billReference: 'BILL-DEMO-002', vendorName: 'Food Vendor Demo', vendorContact: '9803333333', sourceModule: 'MANUAL', sourceReference: 'MANUAL-DEMO', billNumber: 'FVD-2001', billAmount: 25000, paidAmount: 0, remainingAmount: 25000, status: 'VERIFIED', businessDate: BUSINESS_DATE, billDate: BUSINESS_DATE, dueDate: '2083-03-08', remarks: 'Verified demo bill.', createdAt },
    { id: '3', billReference: 'BILL-DEMO-003', vendorName: 'Maintenance Demo', vendorContact: '9804444444', sourceModule: 'MANUAL', sourceReference: 'MANUAL-DEMO', billNumber: 'MNT-3001', billAmount: 18000, paidAmount: 18000, remainingAmount: 0, status: 'PAID', businessDate: BUSINESS_DATE, billDate: BUSINESS_DATE, dueDate: '2083-03-08', remarks: 'Paid demo bill.', createdAt },
  ]

  const accountsExpenses = [
    { id: '1', expenseReference: 'EXP-DEMO-001', category: 'STORE_PURCHASE', description: 'Small cash purchase for demo', amount: 3500, paymentMethod: 'CASH', businessDate: BUSINESS_DATE, expenseDate: BUSINESS_DATE, createdBy: 'accounts', remarks: 'Cash expense demo.', createdAt },
  ]

  const accountsPayments = [
    { id: '1', paymentReference: 'PAY-DEMO-001', billId: '3', billReference: 'BILL-DEMO-003', vendorName: 'Maintenance Demo', amount: 18000, paymentMethod: 'CHEQUE', chequeNumber: 'CHQ-1001', paymentDate: BUSINESS_DATE, businessDate: BUSINESS_DATE, status: 'COMPLETED', paidBy: 'accounts', remarks: 'Cheque payment demo.', createdAt },
  ]

  const directorApprovals = [
    { id: 'APP-DEMO-001', reference: 'APP-DEMO-001', type: 'HIGH_VALUE_TRANSACTION', title: 'High-value buy-in approval', amount: 150000, status: 'PENDING', businessDate: BUSINESS_DATE, requestedBy: 'cashier', requestedAt: createdAt, reason: 'High-value transaction over threshold.' },
    { id: 'APP-DEMO-002', reference: 'APP-DEMO-002', type: 'SYSTEM_UNLOCK', title: 'System unlock request', status: 'PENDING', businessDate: BUSINESS_DATE, requestedBy: 'director', requestedAt: createdAt, reason: 'Demo settlement unlock request.' },
  ]

  const auditLogs = [
    { id: '1', reference: 'AUD-DEMO-001', module: 'AUTH', action: 'LOGIN', severity: 'LOW', description: 'Admin logged in for demo.', businessDate: BUSINESS_DATE, performedBy: 'admin', performedByRole: 'SUPER_ADMIN', entityType: 'USER_SESSION', entityId: 'admin', newValue: { loginStatus: 'SUCCESS' }, createdAt },
    { id: '2', reference: 'AUD-DEMO-002', module: 'RECEPTION', action: 'CREATE', severity: 'MEDIUM', description: 'Customer created for demo.', businessDate: BUSINESS_DATE, performedBy: 'reception', performedByRole: 'RECEPTIONIST', entityType: 'CUSTOMER', entityId: '1', newValue: customers[0], createdAt },
    { id: '3', reference: 'AUD-DEMO-003', module: 'CASHIER', action: 'CREATE', severity: 'HIGH', description: 'High-value buy-in created for demo.', businessDate: BUSINESS_DATE, performedBy: 'cashier', performedByRole: 'CASHIER', entityType: 'BUY_IN', entityId: '3', newValue: cashierTransactions[2], createdAt },
    { id: '4', reference: 'AUD-DEMO-004', module: 'PIT', action: 'CLOSE_SESSION', severity: 'HIGH', description: 'Table session closed pending review.', businessDate: BUSINESS_DATE, performedBy: 'pitboss', performedByRole: 'PIT_BOSS', entityType: 'TABLE_SESSION', entityId: '3', newValue: pitSessions[2], createdAt },
    { id: '5', reference: 'AUD-DEMO-005', module: 'ACCOUNTS', action: 'PAYMENT_RECORDED', severity: 'MEDIUM', description: 'Payment recorded for demo.', businessDate: BUSINESS_DATE, performedBy: 'accounts', performedByRole: 'ACCOUNTS', entityType: 'PAYMENT', entityId: '1', newValue: accountsPayments[0], createdAt },
    { id: '6', reference: 'AUD-DEMO-006', module: 'SYSTEM_LOCK', action: 'SYSTEM_UNLOCK_REQUEST', severity: 'CRITICAL', description: 'System unlock requested for demo.', businessDate: BUSINESS_DATE, performedBy: 'director', performedByRole: 'DIRECTOR', entityType: 'SYSTEM_UNLOCK_REQUEST', entityId: 'APP-DEMO-002', createdAt },
  ]

  const notifications = [
    { id: '1', reference: 'NTF-DEMO-001', title: 'Pending approval available', message: 'Director has pending high-value approval for demo.', type: 'APPROVAL', priority: 'HIGH', status: 'UNREAD', targetRoles: ['SUPER_ADMIN', 'DIRECTOR', 'ADMIN'], businessDate: BUSINESS_DATE, createdAt },
    { id: '2', reference: 'NTF-DEMO-002', title: 'Low stock alert', message: 'Card Shoes are below minimum stock.', type: 'STORE', priority: 'MEDIUM', status: 'UNREAD', targetRoles: ['STORE_KEEPER'], businessDate: BUSINESS_DATE, createdAt },
    { id: '3', reference: 'NTF-DEMO-003', title: 'Pending bill', message: 'Accounts has pending bill BILL-DEMO-001.', type: 'ACCOUNTS', priority: 'MEDIUM', status: 'UNREAD', targetRoles: ['ACCOUNTS'], businessDate: BUSINESS_DATE, createdAt },
    { id: '4', reference: 'NTF-DEMO-004', title: 'Critical audit item', message: 'System unlock request audit log is available.', type: 'AUDIT', priority: 'CRITICAL', status: 'UNREAD', targetRoles: ['AUDITOR', 'SUPER_ADMIN', 'ADMIN'], businessDate: BUSINESS_DATE, createdAt },
  ]

  const adminUsers = [
    { id: '1', fullName: 'Super Admin Demo', username: 'admin', role: 'SUPER_ADMIN', department: 'Management', email: 'admin@example.com', phone: '9809000001', status: 'ACTIVE', createdAt, updatedAt: createdAt },
    { id: '2', fullName: 'Director Demo', username: 'director', role: 'DIRECTOR', department: 'Management', email: 'director@example.com', phone: '9809000002', status: 'ACTIVE', createdAt, updatedAt: createdAt },
    { id: '3', fullName: 'Accounts Demo', username: 'accounts', role: 'ACCOUNTS', department: 'Accounts', email: 'accounts@example.com', phone: '9809000003', status: 'ACTIVE', createdAt, updatedAt: createdAt },
  ]

  const adminDepartments = [
    { id: '1', departmentName: 'Reception', name: 'Reception', departmentType: 'RECEPTION', headName: 'Reception Head', status: 'ACTIVE', remarks: 'Demo department.', createdAt },
    { id: '2', departmentName: 'Cashier', name: 'Cashier', departmentType: 'CASHIER', headName: 'Cashier Head', status: 'ACTIVE', remarks: 'Demo department.', createdAt },
    { id: '3', departmentName: 'Accounts', name: 'Accounts', departmentType: 'ACCOUNTS', headName: 'Accounts Head', status: 'ACTIVE', remarks: 'Demo department.', createdAt },
  ]

  const adminSettings = {
    BUSINESS_DAY_START_TIME: '09:00',
    BUSINESS_DAY_END_TIME: '08:59',
    CASINO_OPERATION_START_TIME: '12:30',
    CASINO_OPERATION_END_TIME: '06:00',
    SETTLEMENT_GRACE_UNTIL: '06:30',
    SYSTEM_LOCK_START_TIME: '06:30',
    SYSTEM_LOCK_END_TIME: '12:30',
    URGENT_CASH_LIMIT: 5000,
    HIGH_VALUE_TRANSACTION_THRESHOLD: 100000,
    LOSING_RETURN_REVIEW_REQUIRED: true,
    DEFAULT_CURRENCY: 'NPR',
    EXPORT_ENABLED: true,
    NOTIFICATIONS_ENABLED: true,
  }

  return {
    customers,
    cashierTransactions,
    pitTables,
    pitSessions,
    storeRequests,
    stockItems,
    procurementItems,
    vendorQuotations,
    accountsBills,
    accountsExpenses,
    accountsPayments,
    directorApprovals,
    directorAlertStatuses: {},
    auditLogs,
    notifications,
    adminUsers,
    adminDepartments,
    adminSettings,
  }
}

const writeDemoData = (data) => {
  write(storageKeys.customers, data.customers)
  write(storageKeys.cashierTransactions, data.cashierTransactions)
  write(storageKeys.pitTables, data.pitTables)
  write(storageKeys.pitSessions, data.pitSessions)
  write(storageKeys.storeRequests, data.storeRequests)
  write(storageKeys.stockItems, data.stockItems)
  write(storageKeys.procurementItems, data.procurementItems)
  write(storageKeys.vendorQuotations, data.vendorQuotations)
  write(storageKeys.accountsBills, data.accountsBills)
  write(storageKeys.accountsExpenses, data.accountsExpenses)
  write(storageKeys.accountsPayments, data.accountsPayments)
  write(storageKeys.directorApprovals, data.directorApprovals)
  write(storageKeys.directorAlertStatuses, data.directorAlertStatuses)
  write(storageKeys.auditLogs, data.auditLogs)
  write(storageKeys.notifications, data.notifications)
  write(storageKeys.adminUsers, data.adminUsers)
  write(storageKeys.adminDepartments, data.adminDepartments)
  write(storageKeys.adminSettings, data.adminSettings)
}

export function seedDemoData() {
  writeDemoData(createDemoData())
  return getDemoDataSummary()
}

export function resetAllDemoData() {
  return seedDemoData()
}

export function clearDemoData() {
  Object.values(storageKeys).forEach((key) => localStorage.removeItem(key))
  return getDemoDataSummary()
}

export function getDemoDataSummary() {
  return {
    customers: readArray(storageKeys.customers).length,
    transactions: readArray(storageKeys.cashierTransactions).length,
    tableSessions: readArray(storageKeys.pitSessions).length,
    storeRequests: readArray(storageKeys.storeRequests).length,
    procurementItems: readArray(storageKeys.procurementItems).length,
    bills: readArray(storageKeys.accountsBills).length,
    payments: readArray(storageKeys.accountsPayments).length,
    auditLogs: readArray(storageKeys.auditLogs).length,
    notifications: readArray(storageKeys.notifications).length,
  }
}

export default {
  resetAllDemoData,
  seedDemoData,
  clearDemoData,
  getDemoDataSummary,
}
