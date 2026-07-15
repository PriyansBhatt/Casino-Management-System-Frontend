import { ROLES } from './roles'
import {
  ACCOUNTS_ROLES,
  ADMIN_ROLES,
  ALL_ROLES,
  AUDIT_ROLES,
  CASHIER_ROLES,
  MANAGEMENT_ROLES,
  PIT_ROLES,
  PROCUREMENT_ROLES,
  RECEPTION_ROLES,
  STORE_ROLES,
} from './permissions'

const DEPARTMENT_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.DIRECTOR,
  ROLES.ADMIN,
  ROLES.DEPARTMENT_HEAD,
]

const REPORT_ROLES = [ROLES.SUPER_ADMIN, ROLES.DIRECTOR, ROLES.ADMIN, ROLES.AUDITOR]
const DIRECTOR_ROLES = [ROLES.SUPER_ADMIN, ROLES.DIRECTOR, ROLES.ADMIN]

export const MENU_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'DB', allowedRoles: ALL_ROLES },
  { label: 'Notifications', path: '/notifications', icon: 'NT', allowedRoles: ALL_ROLES },
  { label: 'Users', path: '/admin/users', icon: 'US', allowedRoles: ADMIN_ROLES },
  { label: 'Roles', path: '/admin/roles', icon: 'RL', allowedRoles: ADMIN_ROLES },
  { label: 'Departments', path: '/admin/departments', icon: 'DP', allowedRoles: ADMIN_ROLES },
  { label: 'Business Date', path: '/admin/business-date', icon: 'BD', allowedRoles: ADMIN_ROLES },
  { label: 'System Lock', path: '/admin/system-lock', icon: 'LK', allowedRoles: ADMIN_ROLES },
  { label: 'System Settings', path: '/admin/settings', icon: 'SS', allowedRoles: ADMIN_ROLES },
  { label: 'Permissions', path: '/admin/permissions', icon: 'PM', allowedRoles: ADMIN_ROLES },
  { label: 'Demo Control Panel', path: '/demo/control-panel', icon: 'DM', allowedRoles: ADMIN_ROLES },
  { label: 'Approvals', path: '/director/approvals', icon: 'OK', allowedRoles: DIRECTOR_ROLES },
  { label: 'High Value Alerts', path: '/director/high-value-alerts', icon: 'HV', allowedRoles: DIRECTOR_ROLES },
  { label: 'Suspicious Alerts', path: '/director/suspicious-alerts', icon: 'SA', allowedRoles: DIRECTOR_ROLES },
  { label: 'Approval History', path: '/director/approval-history', icon: 'AH', allowedRoles: DIRECTOR_ROLES },
  { label: 'System Unlock', path: '/director/system-unlock', icon: 'UN', allowedRoles: DIRECTOR_ROLES },
  { label: 'Customer Registration', path: '/reception/customers/new', icon: 'CR', allowedRoles: RECEPTION_ROLES },
  { label: 'Customer Search', path: '/reception/customers/search', icon: 'CS', allowedRoles: RECEPTION_ROLES },
  { label: 'Buy-In', path: '/cashier/buy-in', icon: 'BI', allowedRoles: CASHIER_ROLES },
  { label: 'Cash-Out', path: '/cashier/cash-out', icon: 'CO', allowedRoles: CASHIER_ROLES },
  { label: 'Wallet Transactions', path: '/cashier/wallet-transactions', icon: 'WT', allowedRoles: CASHIER_ROLES },
  { label: 'Daily Report', path: '/cashier/daily-report', icon: 'DR', allowedRoles: CASHIER_ROLES },
  { label: 'Tables', path: '/pit/tables', icon: 'TB', allowedRoles: PIT_ROLES },
  { label: 'Open Sessions', path: '/pit/open-sessions', icon: 'OS', allowedRoles: PIT_ROLES },
  { label: 'Close Sessions', path: '/pit/close-sessions', icon: 'CL', allowedRoles: PIT_ROLES },
  { label: 'Table Reports', path: '/pit/table-reports', icon: 'TR', allowedRoles: PIT_ROLES },
  { label: 'Department Requests', path: '/store/department-requests', icon: 'RQ', allowedRoles: STORE_ROLES },
  { label: 'Stock', path: '/store/stock', icon: 'ST', allowedRoles: STORE_ROLES },
  { label: 'Delivery Receive', path: '/store/delivery-receive', icon: 'DL', allowedRoles: STORE_ROLES },
  { label: 'Procurement List', path: '/procurement/list', icon: 'PL', allowedRoles: PROCUREMENT_ROLES },
  { label: 'Vendor Quotations', path: '/procurement/vendor-quotations', icon: 'VQ', allowedRoles: PROCUREMENT_ROLES },
  { label: 'Purchase Orders', path: '/procurement/purchase-orders', icon: 'PO', allowedRoles: PROCUREMENT_ROLES },
  { label: 'Bills', path: '/accounts/bills', icon: 'BL', allowedRoles: ACCOUNTS_ROLES },
  { label: 'Cash Expenses', path: '/accounts/cash-expenses', icon: 'CE', allowedRoles: ACCOUNTS_ROLES },
  { label: 'Cheque Payments', path: '/accounts/cheque-payments', icon: 'CP', allowedRoles: ACCOUNTS_ROLES },
  { label: 'Vendor Payments', path: '/accounts/vendor-payments', icon: 'VP', allowedRoles: ACCOUNTS_ROLES },
  { label: 'Accounts Reports', path: '/accounts/reports', icon: 'AR', allowedRoles: ACCOUNTS_ROLES },
  { label: 'My Requests', path: '/department/my-requests', icon: 'MR', allowedRoles: DEPARTMENT_ROLES },
  { label: 'Confirm Received', path: '/department/confirm-received', icon: 'RC', allowedRoles: DEPARTMENT_ROLES },
  { label: 'Audit Logs', path: '/audit-logs', icon: 'AL', allowedRoles: AUDIT_ROLES },
  { label: 'Audit Reports', path: '/audit/reports', icon: 'AU', allowedRoles: AUDIT_ROLES },
  { label: 'Management Analytics', path: '/analytics/management', icon: 'MA', allowedRoles: REPORT_ROLES },
  { label: 'Test Checklist', path: '/testing/checklist', icon: 'TC', allowedRoles: REPORT_ROLES },
  { label: 'Daily Business Report', path: '/reports/daily-business', icon: 'DBR', allowedRoles: REPORT_ROLES },
  { label: 'Customer Transactions', path: '/reports/customer-transactions', icon: 'CTR', allowedRoles: REPORT_ROLES },
  { label: 'Transaction Report', path: '/reports/transactions', icon: 'TXR', allowedRoles: REPORT_ROLES },
  { label: 'Losing Return Preview', path: '/reports/losing-return-preview', icon: 'LR', allowedRoles: REPORT_ROLES },
]

export default MENU_ITEMS
