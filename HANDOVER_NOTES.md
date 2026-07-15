# Casino Management System Frontend Handover Notes

## Current Frontend Status

The frontend is a React + Vite prototype/demo for a role-based Casino Management System. It includes role-based routing, dashboards, module screens, mock APIs, demo data, audit logs, notifications, CSV exports, environment templates, and deployment notes.

The app is ready for client UI demos and backend integration planning. It is not a production system by itself.

## Completed Frontend Areas

- Authentication and role-based route protection
- Main layout, sidebar, topbar, mobile sidebar, notifications, and responsive UI
- Business Date and System Lock frontend context
- Role-based dashboards
- Reception customer search, registration, profile, and edit screens
- Cashier buy-in, cash-out, wallet transactions, and daily summary
- Reports, losing return preview, CSV export, and management analytics
- Pit/table sessions, reports, and table-level session tracking
- Director approvals, approval history, high-value alerts, suspicious alerts, and system unlock request placeholder
- Store request, stock, delivery, procurement, vendor quotation, purchase order, and department confirmation flows
- Accounts bills, cash expenses, cheque payments, vendor payment history, and accounts reports
- Audit logs and audit detail pages
- Notification center and role-based mock notifications
- Super Admin users, roles, departments, permissions, business date settings, system lock settings, and system settings
- Demo Control Panel for seed/reset/clear demo data
- Testing checklist for manual demo readiness

## Mock and localStorage Only

The following areas currently use frontend mock APIs and localStorage:

- Mock authentication and users
- Business status
- Customers
- Cashier transactions
- Reports and analytics
- Pit tables and table sessions
- Director approvals and alerts
- Store, procurement, quotations, deliveries, and confirmations
- Accounts bills, expenses, and payments
- Audit logs
- Notifications
- Admin users, departments, and settings
- Demo data utilities

Mock data is useful for demos and frontend testing, but it is not durable, secure, or authoritative.

## Expected Backend APIs Later

The frontend is prepared for API-backed mode through `VITE_API_BASE_URL` and `VITE_USE_MOCK_*` flags. Backend APIs are expected for:

- Authentication, JWT issuance, logout, and current user
- Users, roles, departments, and settings
- Business Date and System Lock status
- Customers
- Cashier buy-ins, cash-outs, wallet transactions, and cashier summaries
- Reports and analytics
- Pit tables and table sessions
- Director approvals, approval history, high-value alerts, suspicious alerts, and unlock requests
- Store requests, stock, procurement, quotations, deliveries, and department confirmations
- Accounts bills, expenses, payments, vendor history, and summaries
- Audit log creation, query, detail, and export
- Notifications and unread counts

## Must Be Enforced in Backend

- Role permissions and route/API authorization
- JWT validation and token expiry
- Business Date assignment and validation
- System Lock restrictions for sensitive actions
- Transaction amount validation and high-value thresholds
- Cashier transaction integrity
- Losing return eligibility based on net verified customer loss, not gross buy-in
- Pit/table logic using table-level sessions and totals, not individual player tracking
- Store workflow status transitions, partial delivery, full delivery, and department confirmation
- Accounts bill/payment validation and remaining amount calculations
- Audit log persistence in a backend database
- Notification generation and delivery rules
- Admin settings persistence and change audit

## Suggested Backend Integration Order

1. Auth and users
2. Business Date and System Lock
3. Customers
4. Cashier transactions
5. Reports
6. Pit/table sessions
7. Store/procurement
8. Accounts
9. Director approvals/alerts
10. Audit logs
11. Notifications
12. Admin settings

## Integration Notes

Start by wiring backend authentication and current-user loading. After that, connect Business Date/System Lock because many transaction screens depend on those values.

Keep mock mode available during integration so each module can be switched over independently. When a module is connected to real APIs, set the related `VITE_USE_MOCK_*` flag to `false`.

The frontend already redirects `401` responses to `/login` and `403` responses to `/unauthorized`. Backend responses should use those status codes consistently.
