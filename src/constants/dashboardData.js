import { ROLES } from './roles'

export const DASHBOARD_DATA = {
  [ROLES.SUPER_ADMIN]: {
    title: 'Super Admin Dashboard',
    description: 'Monitor system control, role access, and Business Date operations.',
    stats: [
      { title: 'Active Users', value: '42', description: 'Users active for current Business Date.', icon: 'US', variant: 'info' },
      { title: 'System Status', value: 'Open', description: 'Transaction lock awareness is active.', icon: 'ST', variant: 'success' },
      { title: 'Admin Tasks', value: '6', description: 'Mock configuration tasks pending review.', icon: 'AD', variant: 'warning' },
    ],
    quickActions: [
      { title: 'Users', description: 'Manage admin users.', path: '/admin/users', icon: 'US' },
      { title: 'Roles', description: 'Review role access.', path: '/admin/roles', icon: 'RL' },
      { title: 'Departments', description: 'Manage departments.', path: '/admin/departments', icon: 'DP' },
      { title: 'Business Date Settings', description: 'Configure Business Date rules.', path: '/admin/business-date', icon: 'BD' },
      { title: 'System Lock Settings', description: 'Configure lock window.', path: '/admin/system-lock', icon: 'LK' },
      { title: 'System Settings', description: 'Configure operating thresholds.', path: '/admin/settings', icon: 'SS' },
      { title: 'Permissions', description: 'Review route permissions.', path: '/admin/permissions', icon: 'PM' },
      { title: 'Audit Logs', description: 'Review traceable system activity.', path: '/audit-logs', icon: 'AL' },
    ],
    notices: [
      'All mock totals are scoped to the active Business Date.',
      'Sensitive transaction actions will respect System Lock in later phases.',
    ],
  },
  [ROLES.DIRECTOR]: {
    title: 'Director Dashboard',
    description: 'Review approvals, alerts, and settlement lock awareness.',
    stats: [
      { title: 'Pending Approvals', value: '8', description: 'Mock approvals for current Business Date.', icon: 'OK', variant: 'warning' },
      { title: 'High Value Alerts', value: '3', description: 'Mock alerts awaiting director review.', icon: 'HV', variant: 'danger' },
      { title: 'System Unlock Requests', value: '1', description: 'Placeholder count for lock exceptions.', icon: 'UN', variant: 'info' },
    ],
    quickActions: [
      { title: 'Approvals', description: 'Open approval placeholder.', path: '/director/approvals', icon: 'OK' },
      { title: 'High Value Alerts', description: 'Review mock high value alerts.', path: '/director/high-value-alerts', icon: 'HV' },
      { title: 'Suspicious Alerts', description: 'Review suspicious activity placeholders.', path: '/director/suspicious-alerts', icon: 'SA' },
      { title: 'Approval History', description: 'Review approved and rejected decisions.', path: '/director/approval-history', icon: 'AH' },
      { title: 'System Unlock', description: 'Request or review settlement unlock placeholder.', path: '/director/system-unlock', icon: 'UN' },
      { title: 'Reports', description: 'Open management report placeholder.', path: '/reports', icon: 'RP' },
    ],
    notices: [
      'Director views use Business Date totals, not calendar date totals.',
      'Unlock requests require a valid reason when real workflow is added.',
    ],
  },
  [ROLES.ADMIN]: {
    title: 'Admin Dashboard',
    description: 'Manage administrative setup and Business Date controls.',
    stats: [
      { title: 'Role Profiles', value: '11', description: 'Mock role profiles configured.', icon: 'RL', variant: 'info' },
      { title: 'Locked Actions', value: '0', description: 'No mock actions blocked right now.', icon: 'LK', variant: 'success' },
      { title: 'Setup Tasks', value: '4', description: 'Business Date setup placeholders.', icon: 'ST', variant: 'warning' },
    ],
    quickActions: [
      { title: 'Users', description: 'Manage user placeholder.', path: '/admin/users', icon: 'US' },
      { title: 'Roles', description: 'Manage role placeholder.', path: '/admin/roles', icon: 'RL' },
      { title: 'Departments', description: 'Manage department setup.', path: '/admin/departments', icon: 'DP' },
      { title: 'Business Date Settings', description: 'Open Business Date settings.', path: '/admin/business-date', icon: 'BD' },
      { title: 'System Lock Settings', description: 'Open lock settings.', path: '/admin/system-lock', icon: 'LK' },
      { title: 'System Settings', description: 'Open global settings.', path: '/admin/settings', icon: 'SS' },
      { title: 'Permissions', description: 'Review route permissions.', path: '/admin/permissions', icon: 'PM' },
      { title: 'Audit Logs', description: 'Review audit trail.', path: '/audit-logs', icon: 'AL' },
    ],
    notices: [
      'Admin mock metrics are for current Business Date configuration only.',
      'System Lock controls are placeholders until backend integration.',
    ],
  },
  [ROLES.RECEPTIONIST]: {
    title: 'Reception Dashboard',
    description: 'Track guest intake activity for the current Business Date.',
    stats: [
      { title: "Today's New Customers", value: 'Coming soon', description: 'Business Date customer registrations will appear here.', icon: 'CR', variant: 'info' },
      { title: 'Customer Search', value: 'Ready', description: 'Search placeholder is available for role testing.', icon: 'CS', variant: 'default' },
      { title: 'Customer Registration', value: 'Ready', description: 'Registration placeholder is available for role testing.', icon: 'CR', variant: 'success' },
    ],
    quickActions: [
      { title: 'New Customer', description: 'Open customer registration placeholder.', path: '/reception/customers/new', icon: 'CR' },
      { title: 'Customer Search', description: 'Open customer search placeholder.', path: '/reception/customers/search', icon: 'CS' },
    ],
    notices: [
      'Reception counts follow the casino Business Date.',
      'Customer verification reminders will appear here in a later phase.',
      'Future transaction-linked actions will check System Lock.',
    ],
  },
  [ROLES.CASHIER]: {
    title: 'Cashier Dashboard',
    description: 'Monitor cashier transaction placeholders for the active Business Date.',
    stats: [
      { title: "Today's Buy-In", value: 'Coming soon', description: 'Business Date buy-in totals will appear here.', icon: 'BI', variant: 'success' },
      { title: "Today's Cash-Out", value: 'Coming soon', description: 'Business Date cash-out totals will appear here.', icon: 'CO', variant: 'info' },
      { title: 'Net Cash Position', value: 'Coming soon', description: 'Business Date net cash position will appear here.', icon: 'NC', variant: 'warning' },
    ],
    quickActions: [
      { title: 'Buy-In', description: 'Open buy-in placeholder.', path: '/cashier/buy-in', icon: 'BI' },
      { title: 'Cash-Out', description: 'Open cash-out placeholder.', path: '/cashier/cash-out', icon: 'CO' },
      { title: 'Wallet Transactions', description: 'Open wallet placeholder.', path: '/cashier/wallet-transactions', icon: 'WT' },
      { title: 'Daily Report', description: 'Open daily report placeholder.', path: '/cashier/daily-report', icon: 'DR' },
    ],
    notices: [
      'Cashier financial values are Business Date mock totals.',
      'Buy-in, cash-out, wallet, and daily report actions will respect System Lock.',
    ],
  },
  [ROLES.PIT_BOSS]: {
    title: 'Pit Boss Dashboard',
    description: 'Monitor table sessions and lock-aware pit operations.',
    stats: [
      { title: 'Open Tables', value: '7', description: 'Mock active tables for current Business Date.', icon: 'TB', variant: 'success' },
      { title: 'Open Sessions', value: '18', description: 'Mock table sessions.', icon: 'OS', variant: 'info' },
      { title: 'Close Queue', value: '2', description: 'Mock sessions pending close.', icon: 'CL', variant: 'warning' },
    ],
    quickActions: [
      { title: 'Tables', description: 'Open table placeholder.', path: '/pit/tables', icon: 'TB' },
      { title: 'Open Sessions', description: 'Open session placeholder.', path: '/pit/open-sessions', icon: 'OS' },
      { title: 'Close Sessions', description: 'Close session placeholder.', path: '/pit/close-sessions', icon: 'CL' },
      { title: 'Table Reports', description: 'Open table report placeholder.', path: '/pit/table-reports', icon: 'TR' },
    ],
    notices: [
      'Pit metrics are scoped to active Business Date sessions.',
      'Open and close session actions will be blocked during System Lock.',
    ],
  },
  [ROLES.STORE_KEEPER]: {
    title: 'Store Keeper Dashboard',
    description: 'Track store requests, stock, and delivery placeholders.',
    stats: [
      { title: 'Department Requests', value: '12', description: 'Mock requests for current Business Date.', icon: 'RQ', variant: 'warning' },
      { title: 'Low Stock Alerts', value: '5', description: 'Mock inventory alerts.', icon: 'ST', variant: 'danger' },
      { title: 'Deliveries', value: '3', description: 'Mock deliveries awaiting receipt.', icon: 'DL', variant: 'info' },
    ],
    quickActions: [
      { title: 'Department Requests', description: 'Open request placeholder.', path: '/store/department-requests', icon: 'RQ' },
      { title: 'Stock', description: 'Open stock placeholder.', path: '/store/stock', icon: 'ST' },
      { title: 'Delivery Receive', description: 'Open delivery placeholder.', path: '/store/delivery-receive', icon: 'DL' },
    ],
    notices: [
      'Store movement summaries use Business Date context.',
      'Delivery receive actions will respect System Lock.',
    ],
  },
  [ROLES.PROCUREMENT]: {
    title: 'Procurement Dashboard',
    description: 'Prepare vendor quotation and purchase order placeholders.',
    stats: [
      { title: 'Open Requisitions', value: '9', description: 'Mock requisitions awaiting procurement.', icon: 'PR', variant: 'warning' },
      { title: 'Vendor Quotations', value: '6', description: 'Mock quotations in progress.', icon: 'VQ', variant: 'info' },
      { title: 'Purchase Orders', value: '4', description: 'Mock orders for current Business Date review.', icon: 'PO', variant: 'success' },
    ],
    quickActions: [
      { title: 'Procurement List', description: 'Open procurement placeholder.', path: '/procurement/list', icon: 'PL' },
      { title: 'Vendor Quotations', description: 'Open quotation placeholder.', path: '/procurement/vendor-quotations', icon: 'VQ' },
      { title: 'Purchase Orders', description: 'Open purchase order placeholder.', path: '/procurement/purchase-orders', icon: 'PO' },
    ],
    notices: [
      'Procurement mock values are operational summaries for the current Business Date.',
      'Lock awareness is ready for future approval-sensitive actions.',
    ],
  },
  [ROLES.ACCOUNTS]: {
    title: 'Accounts Dashboard',
    description: 'Monitor accounting placeholders and lock-sensitive payments.',
    stats: [
      { title: 'Bills Pending', value: '11', description: 'Mock bills for Business Date processing.', icon: 'BL', variant: 'warning' },
      { title: 'Cash Expenses', value: 'NPR 85,000', description: 'Mock expenses for current Business Date.', icon: 'CE', variant: 'info' },
      { title: 'Cheque Payments', value: 'NPR 140,000', description: 'Mock cheque payments awaiting review.', icon: 'CP', variant: 'success' },
    ],
    quickActions: [
      { title: 'Bills', description: 'Open bills placeholder.', path: '/accounts/bills', icon: 'BL' },
      { title: 'Cash Expenses', description: 'Open expenses placeholder.', path: '/accounts/cash-expenses', icon: 'CE' },
      { title: 'Cheque Payments', description: 'Open cheque placeholder.', path: '/accounts/cheque-payments', icon: 'CP' },
      { title: 'Vendor Payments', description: 'Review vendor payment history.', path: '/accounts/vendor-payments', icon: 'VP' },
      { title: 'Accounts Reports', description: 'Open accounts report placeholder.', path: '/accounts/reports', icon: 'AR' },
    ],
    notices: [
      'All accounting values are Business Date mock totals.',
      'Cash expense and cheque payment actions will respect System Lock.',
    ],
  },
  [ROLES.DEPARTMENT_HEAD]: {
    title: 'Department Head Dashboard',
    description: 'Track department requests and receipt confirmations.',
    stats: [
      { title: 'My Requests', value: '5', description: 'Mock requests raised this Business Date.', icon: 'MR', variant: 'info' },
      { title: 'Pending Receipt', value: '2', description: 'Mock items awaiting confirmation.', icon: 'RC', variant: 'warning' },
      { title: 'Approved Requests', value: '7', description: 'Mock approvals for current Business Date.', icon: 'OK', variant: 'success' },
    ],
    quickActions: [
      { title: 'My Requests', description: 'Open request placeholder.', path: '/department/my-requests', icon: 'MR' },
      { title: 'Confirm Received', description: 'Open receipt confirmation placeholder.', path: '/department/confirm-received', icon: 'RC' },
    ],
    notices: [
      'Department request counts follow the casino Business Date.',
      'Future receipt actions can be made System Lock aware.',
    ],
  },
  [ROLES.AUDITOR]: {
    title: 'Auditor Dashboard',
    description: 'Review audit placeholders and Business Date activity.',
    stats: [
      { title: 'Audit Logs', value: '128', description: 'Mock events captured for current Business Date.', icon: 'AL', variant: 'info' },
      { title: 'Compliance Flags', value: '4', description: 'Mock flags awaiting review.', icon: 'CM', variant: 'warning' },
      { title: 'Locked Period Checks', value: 'Ready', description: 'System Lock evidence can be reviewed later.', icon: 'LK', variant: 'success' },
    ],
    quickActions: [
      { title: 'Audit Logs', description: 'Open audit log placeholder.', path: '/audit-logs', icon: 'AL' },
      { title: 'Audit Reports', description: 'Open audit report placeholder.', path: '/audit/reports', icon: 'AU' },
    ],
    notices: [
      'Audit summaries should always be interpreted by Business Date.',
      'System Lock events will be auditable in later phases.',
    ],
  },
}

export default DASHBOARD_DATA
