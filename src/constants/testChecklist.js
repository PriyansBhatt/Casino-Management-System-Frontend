export const TEST_CHECKLIST_GROUPS = [
  {
    id: 'authentication-and-roles',
    title: 'A. Authentication and Roles',
    items: [
      'Login as every mock role',
      'Logout works',
      'Unauthorized routes redirect correctly',
      'Sidebar changes by role',
      'Protected routes cannot open without login',
    ],
  },
  {
    id: 'business-date-and-system-lock',
    title: 'B. Business Date and System Lock',
    items: [
      'Business Date appears in topbar',
      'Business Date appears in transaction pages',
      'Business Date appears in reports',
      'Sensitive actions are disabled when locked',
      'System unlock request page works for Director/Admin',
    ],
  },
  {
    id: 'reception',
    title: 'C. Reception',
    items: [
      'Search customer',
      'Register customer',
      'Edit customer',
      'View profile',
      'Duplicate phone/document warning',
      'Risk/status badges',
    ],
  },
  {
    id: 'cashier',
    title: 'D. Cashier',
    items: [
      'Buy-In',
      'Cash-Out',
      'Wallet Transactions',
      'Daily Cashier Summary',
      'Amount validation',
      'Business Date auto-attached',
      'High-value transaction creates alert/audit if available',
    ],
  },
  {
    id: 'pit-table',
    title: 'E. Pit/Table',
    items: [
      'View tables',
      'Open table session',
      'Close table session',
      'Add session remark',
      'Table report',
      'No individual player tracking',
    ],
  },
  {
    id: 'reports-and-analytics',
    title: 'F. Reports and Analytics',
    items: [
      'Daily Business Report',
      'Transaction Report',
      'Customer Transaction Report',
      'Losing Return Preview',
      'Management Analytics',
      'CSV exports',
      'Losing return based on net loss only',
    ],
  },
  {
    id: 'director',
    title: 'G. Director',
    items: [
      'Pending approvals',
      'Approve/reject',
      'Approval history',
      'High-value alerts',
      'Suspicious alerts',
      'System unlock request',
    ],
  },
  {
    id: 'store-and-procurement',
    title: 'H. Store and Procurement',
    items: [
      'Create department request',
      'Store review',
      'Stock management',
      'Procurement list',
      'Vendor quotations',
      'Purchase order',
      'Partial delivery',
      'Full delivery',
      'Department confirmation',
    ],
  },
  {
    id: 'accounts',
    title: 'I. Accounts',
    items: [
      'Create bill',
      'Verify/reject bill',
      'Record payment',
      'Cash expense',
      'Cheque payments',
      'Vendor payment history',
      'Accounts report',
    ],
  },
  {
    id: 'audit-and-notifications',
    title: 'J. Audit and Notifications',
    items: [
      'Audit logs appear after important actions',
      'Audit details page works',
      'Notifications appear by role',
      'Mark as read',
      'Mark all as read',
    ],
  },
  {
    id: 'admin',
    title: 'K. Admin',
    items: [
      'Users',
      'Roles',
      'Departments',
      'Permission overview',
      'Business Date settings',
      'System Lock settings',
      'System settings',
    ],
  },
]

export const getChecklistItemId = (groupId, itemIndex) => `${groupId}-${itemIndex}`

export default TEST_CHECKLIST_GROUPS
