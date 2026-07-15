import { ROLES } from './roles'
import { DEPARTMENT_TYPES, SETTING_KEYS, USER_STATUSES } from './adminConstants'

const now = new Date().toISOString()

export const ADMIN_MOCK_USERS = [
  { id: '1', fullName: 'Super Admin User', username: 'admin', role: ROLES.SUPER_ADMIN, department: 'Management', email: 'admin@casino.local', phone: '9800000001', status: USER_STATUSES.ACTIVE, createdAt: now, updatedAt: now },
  { id: '2', fullName: 'Director User', username: 'director', role: ROLES.DIRECTOR, department: 'Management', email: 'director@casino.local', phone: '9800000002', status: USER_STATUSES.ACTIVE, createdAt: now, updatedAt: now },
  { id: '3', fullName: 'Admin User', username: 'systemadmin', role: ROLES.ADMIN, department: 'Management', email: 'systemadmin@casino.local', phone: '9800000003', status: USER_STATUSES.ACTIVE, createdAt: now, updatedAt: now },
  { id: '4', fullName: 'Reception User', username: 'reception', role: ROLES.RECEPTIONIST, department: 'Reception', email: 'reception@casino.local', phone: '9800000004', status: USER_STATUSES.ACTIVE, createdAt: now, updatedAt: now },
  { id: '5', fullName: 'Cashier User', username: 'cashier', role: ROLES.CASHIER, department: 'Cashier', email: 'cashier@casino.local', phone: '9800000005', status: USER_STATUSES.ACTIVE, createdAt: now, updatedAt: now },
  { id: '6', fullName: 'Pit Boss User', username: 'pitboss', role: ROLES.PIT_BOSS, department: 'Pit', email: 'pitboss@casino.local', phone: '9800000006', status: USER_STATUSES.ACTIVE, createdAt: now, updatedAt: now },
  { id: '7', fullName: 'Store Keeper User', username: 'store', role: ROLES.STORE_KEEPER, department: 'Store', email: 'store@casino.local', phone: '9800000007', status: USER_STATUSES.ACTIVE, createdAt: now, updatedAt: now },
  { id: '8', fullName: 'Procurement User', username: 'procurement', role: ROLES.PROCUREMENT, department: 'Procurement', email: 'procurement@casino.local', phone: '9800000008', status: USER_STATUSES.ACTIVE, createdAt: now, updatedAt: now },
  { id: '9', fullName: 'Accounts User', username: 'accounts', role: ROLES.ACCOUNTS, department: 'Accounts', email: 'accounts@casino.local', phone: '9800000009', status: USER_STATUSES.ACTIVE, createdAt: now, updatedAt: now },
  { id: '10', fullName: 'Department Head User', username: 'department', role: ROLES.DEPARTMENT_HEAD, department: 'Casino Operations', email: 'department@casino.local', phone: '9800000010', status: USER_STATUSES.ACTIVE, createdAt: now, updatedAt: now },
  { id: '11', fullName: 'Auditor User', username: 'auditor', role: ROLES.AUDITOR, department: 'Audit', email: 'auditor@casino.local', phone: '9800000011', status: USER_STATUSES.ACTIVE, createdAt: now, updatedAt: now },
]

export const ADMIN_MOCK_DEPARTMENTS = [
  { id: '1', reference: 'DEPT-001', name: 'Reception', type: DEPARTMENT_TYPES.RECEPTION, status: 'ACTIVE', remarks: 'Customer registration and lookup.', createdAt: now, updatedAt: now },
  { id: '2', reference: 'DEPT-002', name: 'Cashier', type: DEPARTMENT_TYPES.CASHIER, status: 'ACTIVE', remarks: 'Buy-in, cash-out, and wallet handling.', createdAt: now, updatedAt: now },
  { id: '3', reference: 'DEPT-003', name: 'Pit', type: DEPARTMENT_TYPES.PIT, status: 'ACTIVE', remarks: 'Table session operations.', createdAt: now, updatedAt: now },
  { id: '4', reference: 'DEPT-004', name: 'Store', type: DEPARTMENT_TYPES.STORE, status: 'ACTIVE', remarks: 'Inventory and delivery receiving.', createdAt: now, updatedAt: now },
  { id: '5', reference: 'DEPT-005', name: 'Procurement', type: DEPARTMENT_TYPES.PROCUREMENT, status: 'ACTIVE', remarks: 'Vendor quotations and purchase orders.', createdAt: now, updatedAt: now },
  { id: '6', reference: 'DEPT-006', name: 'Accounts', type: DEPARTMENT_TYPES.ACCOUNTS, status: 'ACTIVE', remarks: 'Bills, payments, and expenses.', createdAt: now, updatedAt: now },
  { id: '7', reference: 'DEPT-007', name: 'Management', type: DEPARTMENT_TYPES.MANAGEMENT, status: 'ACTIVE', remarks: 'Director and admin oversight.', createdAt: now, updatedAt: now },
  { id: '8', reference: 'DEPT-008', name: 'Audit', type: DEPARTMENT_TYPES.AUDIT, status: 'ACTIVE', remarks: 'Audit log and evidence review.', createdAt: now, updatedAt: now },
]

export const ADMIN_DEFAULT_SETTINGS = {
  [SETTING_KEYS.BUSINESS_DAY_START_TIME]: '09:00',
  [SETTING_KEYS.BUSINESS_DAY_END_TIME]: '08:59',
  [SETTING_KEYS.CASINO_OPERATION_START_TIME]: '12:30',
  [SETTING_KEYS.CASINO_OPERATION_END_TIME]: '06:00',
  [SETTING_KEYS.SETTLEMENT_GRACE_UNTIL]: '06:30',
  [SETTING_KEYS.SYSTEM_LOCK_START_TIME]: '06:30',
  [SETTING_KEYS.SYSTEM_LOCK_END_TIME]: '12:30',
  [SETTING_KEYS.SYSTEM_LOCK_REASON]: 'Settlement Period',
  [SETTING_KEYS.DIRECTOR_ADMIN_UNLOCK_REQUIRED]: true,
  [SETTING_KEYS.URGENT_CASH_LIMIT]: 5000,
  [SETTING_KEYS.HIGH_VALUE_TRANSACTION_THRESHOLD]: 100000,
  [SETTING_KEYS.LOSING_RETURN_REVIEW_REQUIRED]: true,
  [SETTING_KEYS.DEFAULT_CURRENCY]: 'NPR',
  [SETTING_KEYS.EXPORT_ENABLED]: false,
  [SETTING_KEYS.NOTIFICATIONS_ENABLED]: false,
  businessDateNote: 'Business Date is separate from calendar date.',
  losingReturnNote: 'Losing return must be based on net verified customer loss, not gross buy-in.',
}

export default {
  users: ADMIN_MOCK_USERS,
  departments: ADMIN_MOCK_DEPARTMENTS,
  settings: ADMIN_DEFAULT_SETTINGS,
}
