# T0 authoritative local system testing

Use only an approved compatible **test database baseline**. V1 assumes existing core/customer/casino tables; V1–V35 do not bootstrap an empty database. Do not repair, rewrite or squash applied migrations. Verify the baseline and Flyway checksums before startup.

## Backend

From `casino-erp`, export `JWT_SIGNING_SECRET` as a strong random secret of at least 64 UTF-8 bytes. Spring does not automatically load `.env`. Export `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD` for the approved test database; do not rely on embedded local credentials.

```sh
SPRING_PROFILES_ACTIVE=dev TZ=Asia/Kathmandu ./mvnw spring-boot:run -Dspring-boot.run.jvmArguments=-Duser.timezone=Asia/Kathmandu
```

Backend port: 8080. PostgreSQL must already be available. Flyway validates and applies pending migrations during startup. The dev profile can create missing development accounts with known development passwords: use only a disposable approved environment. Do not use dev in production. Existing backend users/authentication are unchanged. Local CORS accepts http://localhost:5173 and http://localhost:3000.

## Frontend

From `Casino-Management-System-main`:

```sh
npm run dev
```

Use `VITE_API_BASE_URL=http://localhost:8080/api`, `VITE_AUTHORITATIVE_TEST_MODE=true`, and every `VITE_USE_MOCK_*` flag set to `false` (see `.env.development.example`). Vite authoritative mode defaults on and forces the 13 discovered mock flags off even if an old environment or shell sets them true. Restart Vite/rebuild after environment changes. Build: `npm run build`.

Authoritative scope: Dashboard supported metrics, Reception, Customers/KYC supported fields, Buy-In, custody, Cash-Out/Losing Return, reconciliation, Pit/Table Mode, Slot occupancy foundation, CRM, complimentary F&B, HR, Running Funds, Business Date and System Lock. Backend roles still govern access.

Deferred: Store/Procurement, Accounts, Analytics, Notifications, demo/checklist utilities, unsupported Admin/settings, Audit UI and unsupported report pages. Direct routes show an unavailable state; normal navigation hides them. Their source remains intact. Legacy client Audit submissions are disabled in T0; backend operation auditing is unchanged. System Lock retains its own navigation entry and reuses the existing real lock controls without loading the unsupported Admin settings form. Badge lifecycle and Slot financial gaming remain outside scope.

All mocks must remain disabled during final testing. `VITE_AUTHORITATIVE_TEST_MODE=false` is an explicit legacy/demo opt-out, never a final-test setting; it restores original route visibility and mock flag selection without deleting code.

## Read-only smoke procedure

Only start against an approved baseline when startup migrations/seeders cannot mutate operational data. Login with an approved existing development account; verify real `/api/business-status/current` and current-open Business Date. Check the operational pages, direct deferred routes, and a simulated failed Business Status request (must show unavailable/error, never fabricated OPEN/date). Do not post financial transactions for this smoke check. Stop only processes started for the check.

T0 does not implement account CRUD, Audit APIs, document uploads, production deployment or a new database baseline.
