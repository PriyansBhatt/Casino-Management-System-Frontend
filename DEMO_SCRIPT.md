# Casino Management System Demo Script

This script is for a frontend prototype/demo using mock localStorage data.

## Final Client Explanation

This is a frontend prototype/demo with mock data. Final production use requires backend APIs, database persistence, server-side validation, server-side role authorization, and secure audit storage.

The demo shows the intended user experience and workflow coverage. It does not replace backend security, accounting controls, compliance checks, or database-backed audit trails.

## A. Admin Demo

Login:

```text
admin / admin123
```

Steps:

1. Show the role-based dashboard.
2. Point out the Business Date and System Status in the topbar.
3. Explain that Business Date is separate from calendar date.
4. Open Demo Control Panel.
5. Seed demo data.
6. Open Admin settings.
7. Show Business Date Settings.
8. Show System Lock Settings.
9. Show System Settings.
10. Show Permission Overview and explain that backend APIs must enforce final security.

Key talking points:

- System Lock protects the settlement period.
- Demo data is frontend localStorage only.
- Production security must be enforced by backend APIs.

## B. Reception Demo

Login:

```text
reception / reception123
```

Steps:

1. Open Customer Search.
2. Search by customer code, name, or phone.
3. Open a customer profile.
4. Show status and risk badges.
5. Register a new customer.
6. Show duplicate phone/document warning when applicable.
7. Return to profile and explain customer lookup workflow.

Key talking points:

- Reception supports quick lookup for regular customers.
- High-risk and watchlist customers are clearly marked.

## C. Cashier Demo

Login:

```text
cashier / cashier123
```

Steps:

1. Open Buy-In.
2. Select a customer.
3. Show that Business Date is auto-attached and cannot be manually changed.
4. Create a buy-in.
5. Open Cash-Out.
6. Select a customer and create a cash-out.
7. Open Wallet Transactions.
8. Show filtered transactions by Business Date.
9. Open Daily Cashier Summary.
10. Show total buy-in, cash-out, and net cash position.

Key talking points:

- Cashier transactions use current Business Date.
- Sensitive actions should be blocked by System Lock.
- High-value transactions can feed alerts and audit logs.

## D. Pit Boss Demo

Login:

```text
pitboss / pitboss123
```

Steps:

1. Open Tables.
2. Show available, open, closed, and maintenance status examples.
3. Open a table session.
4. Show dealer, pit boss, opening amount, and Business Date.
5. Close a table session.
6. Add or review remarks if needed.
7. Open Table Reports.
8. Show open, closed, and pending review sessions.

Key talking points:

- Pit module tracks table sessions and table-level totals.
- It does not track every individual player at the table.

## E. Director Demo

Login:

```text
director / director123
```

Steps:

1. Open Pending Approvals.
2. Approve or reject a request.
3. Open Approval History.
4. Open High Value Alerts.
5. Mark an alert reviewed.
6. Open Suspicious Alerts.
7. Review watchlist, suspicious, system unlock, or pending table review examples.
8. Open Management Analytics.
9. Show KPIs for the selected Business Date.

Key talking points:

- Director views approvals, risk indicators, and management-level summaries.
- Alerts and approvals should be backed by backend workflow in production.

## F. Store, Procurement, and Department Demo

Store login:

```text
store / store123
```

Steps:

1. Create or review a department request.
2. Mark stock available, procurement required, or rejected.
3. Open Stock Management and show low stock item.

Procurement login:

```text
procurement / procurement123
```

Steps:

1. Open Procurement List.
2. Open Vendor Quotations.
3. Add multiple vendor quotations.
4. Select a quotation.
5. Open Purchase Orders.
6. Mark purchase order ordered.

Store login again:

```text
store / store123
```

Steps:

1. Open Delivery Receive.
2. Receive partial delivery.
3. Receive full delivery.
4. Explain that full delivery moves toward department confirmation.

Department login:

```text
department / department123
```

Steps:

1. Open Confirm Received.
2. Confirm department received items.

Key talking points:

- Store workflow supports partial delivery and full delivery.
- Department confirmation is part of the workflow before closure.
- Accounts handles final bills and payment later in the workflow.

## G. Accounts Demo

Login:

```text
accounts / accounts123
```

Steps:

1. Open Bills.
2. Create or verify a bill.
3. Record a payment.
4. Show cheque payment rules if payment method is cheque.
5. Open Cash Expenses and create an expense.
6. Open Vendor Payment History.
7. Open Accounts Reports.
8. Show totals for selected Business Date.

Key talking points:

- Bills and payments use Business Date.
- Final payment rules should be verified by Accounts before production deployment.

## H. Auditor Demo

Login:

```text
auditor / auditor123
```

Steps:

1. Open Audit Logs.
2. Filter by Business Date, module, action, severity, user/role, or entity type.
3. Open Audit Log Details.
4. Show old/new values and metadata where available.
5. Show exported/report trail if available.

Key talking points:

- Important actions are traceable by Business Date, user, role, module, action type, and timestamp.
- Production audit logs must be stored securely in the backend database.

## Casino-Specific Reminders

- Business Date is separate from calendar date.
- System Lock protects the settlement period.
- Losing Return Preview uses net verified customer loss, not gross buy-in.
- Pit module tracks table-level totals, not every player.
- Frontend permissions are only UI protection; backend security is mandatory.
