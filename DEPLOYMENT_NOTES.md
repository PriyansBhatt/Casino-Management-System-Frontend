# Casino Management System Deployment Notes

This React + Vite frontend is prepared for demo mode and later production deployment.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The default Vite server runs on:

```text
http://localhost:5173
```

## Production Build

Create a production build:

```bash
npm run build
```

Preview the built app locally:

```bash
npm run preview
```

## Environment Variables

Create an environment file from the appropriate template:

- `.env.development.example` for local demo/mock mode
- `.env.production.example` for real API mode

Required variables:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_USE_MOCK_AUTH=true
VITE_USE_MOCK_BUSINESS_STATUS=true
VITE_USE_MOCK_CUSTOMERS=true
VITE_USE_MOCK_CASHIER=true
VITE_USE_MOCK_REPORTS=true
VITE_USE_MOCK_PIT=true
VITE_USE_MOCK_DIRECTOR=true
VITE_USE_MOCK_STORE=true
VITE_USE_MOCK_ACCOUNTS=true
VITE_USE_MOCK_AUDIT=true
VITE_USE_MOCK_ADMIN=true
VITE_USE_MOCK_NOTIFICATIONS=true
VITE_USE_MOCK_ANALYTICS=true
```

## Mock Mode

When a `VITE_USE_MOCK_*` flag is `true`, that module uses frontend mock data and localStorage. This is useful for client demos, UI testing, and frontend development before backend APIs are available.

Demo/mock data is not production storage. It can be reset, seeded, or cleared from the Demo Control Panel. Use that page only for frontend demo/testing.

## Production API Mode

For production, set every mock flag to `false` and point `VITE_API_BASE_URL` to the real backend API:

```env
VITE_API_BASE_URL=https://your-production-api-domain.com/api
VITE_USE_MOCK_AUTH=false
VITE_USE_MOCK_BUSINESS_STATUS=false
VITE_USE_MOCK_CUSTOMERS=false
VITE_USE_MOCK_CASHIER=false
VITE_USE_MOCK_REPORTS=false
VITE_USE_MOCK_PIT=false
VITE_USE_MOCK_DIRECTOR=false
VITE_USE_MOCK_STORE=false
VITE_USE_MOCK_ACCOUNTS=false
VITE_USE_MOCK_AUDIT=false
VITE_USE_MOCK_ADMIN=false
VITE_USE_MOCK_NOTIFICATIONS=false
VITE_USE_MOCK_ANALYTICS=false
```

The backend should expose matching API routes for authentication, business status, customers, cashier, pit, director, store/procurement, accounts, reports, audit logs, notifications, admin, and analytics.

## Security Reminders

Frontend role checks are only UI protection. Backend APIs must enforce all role permissions.

JWT validation must happen in the backend. Do not trust client-side tokens without server verification.

Audit logs must be stored in a backend database in production.

Business Date and System Lock rules must be enforced by backend APIs. Sensitive casino transactions must not rely only on frontend checks.

Sensitive actions such as buy-in, cash-out, table open/close, delivery receive, bill payments, system unlock, and approvals should be validated again by the backend.

## Suggested Deployment Options

- Vercel
- Netlify
- Nginx static server
- AWS Amplify

For Nginx or another static server, deploy the contents of the `dist/` folder after running `npm run build`. Configure SPA fallback so unknown routes serve `index.html`.
