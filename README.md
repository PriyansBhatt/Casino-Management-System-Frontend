# Casino Management System Frontend

Frontend prototype for a role-based Casino Management System covering reception, cashier, pit/table operations, store/purchase, accounts, reports, audit logs, notifications, admin settings, and demo mode.

## Tech Stack

- React
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- TanStack Query

## Setup

Install dependencies:

```bash
npm install
```

Start local development:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Environment

Copy an example environment file before running locally:

```bash
cp .env.development.example .env
```

Local demo mode uses mock data stored in localStorage. Production mode should use `.env.production.example` as a starting point and set all mock flags to `false`.

## Mock Login Credentials

| Role | Username | Password |
| --- | --- | --- |
| Super Admin | `admin` | `admin123` |
| Director | `director` | `director123` |
| Cashier | `cashier` | `cashier123` |
| Receptionist | `reception` | `reception123` |
| Pit Boss | `pitboss` | `pitboss123` |
| Store Keeper | `store` | `store123` |
| Procurement | `procurement` | `procurement123` |
| Accounts | `accounts` | `accounts123` |
| Department Head | `department` | `department123` |
| Auditor | `auditor` | `auditor123` |

## Main Modules

- Authentication and role-based access
- Business Date and System Lock
- Reception and customer management
- Cashier buy-in/cash-out
- Wallet transactions
- Reports and analytics
- Pit/table session management
- Director approvals and alerts
- Store and purchase workflow
- Procurement and vendor quotations
- Accounts bills and payments
- Audit logs
- Notifications
- Super Admin settings
- Demo control panel
- Testing checklist

## Important Casino Business Rules

- Business Date is separate from calendar date.
- System Lock protects the settlement period.
- Cashier transactions use the current Business Date.
- Pit module tracks table sessions and table-level totals, not individual players.
- Losing Return Preview uses net verified customer loss, not gross buy-in.
- Store workflow supports partial delivery and department confirmation.
- Frontend permissions must be backed by backend security.

## Demo Mode

The Demo Control Panel can seed, reset, and clear frontend demo data. Demo data is localStorage-only and should not be treated as production storage.

Recommended path:

```text
/demo/control-panel
```

Access is limited to Super Admin and Admin roles.

## Production Note

This is a frontend prototype/demo with mock data. The final production system requires backend APIs, database persistence, server-side validation, server-side role authorization, and secure audit storage.

See `DEPLOYMENT_NOTES.md`, `HANDOVER_NOTES.md`, and `DEMO_SCRIPT.md` for deployment preparation, handover details, and a client demo walkthrough.
