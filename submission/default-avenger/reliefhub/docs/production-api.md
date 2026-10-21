# Production API (Phase 1 foundation)

## Architecture and current scope

The existing `npm start` path remains the JSON Server demo. The production-oriented API is a separate Node.js/Express service using PostgreSQL. This keeps the existing browser experience and seeded demo intact while providing a transactional server-side foundation. **The current browser UI is not yet wired to this API.** Do not use the JSON Server demo or its demo credentials for public or operational deployment.

The API currently provides password sign-in, expiring bearer sessions, server-enforced role gates, paginated collection reads, audit-log reads, and transactional dispatch create/status operations. The schema also creates ledger, dispatch-event, donation, camp-accessibility, batch, and audit structures for subsequent phases. Only implemented routes are operational; database tables do not imply that all corresponding workflows or screens are complete.

## Setup

Requirements: Node.js 18+, PostgreSQL 14+, and a PostgreSQL database dedicated to ReliefHub.

1. Install project dependencies with `npm install`.
2. Copy `.env.example` to a private environment file and set `DATABASE_URL`. Use a database role limited to the ReliefHub database. For TLS-enabled PostgreSQL, set `PGSSL=true`.
3. Apply the initial schema using `npm run db:migrate`.
4. For a local isolated demonstration only, import the current JSON Server snapshot using `npm run seed:api`. This refuses to run against a non-empty database and hashes imported passwords. The imported demo passwords are publicly known and weak; change/replace them before any non-demo use. This importer is not a secure production user-provisioning workflow.
5. Start the API with `npm run start:api`. It listens on `API_PORT` (default 8000). `GET /health/live` checks process liveness; `GET /health/ready` checks database connectivity.

`FRONTEND_ORIGINS` accepts a comma-separated exact origin allowlist for a separately hosted frontend. Leave it empty when serving the frontend and API from the same origin. The frontend integration, production user provisioning/password recovery, and deployment secret injection are not implemented yet.

## Authentication and roles

`POST /api/v1/auth/login` accepts JSON `{ "username": "...", "password": "..." }` and returns an opaque 256-bit bearer token with an eight-hour server-side session. Only the SHA-256 digest of that random token is stored. Password hashes use Node.js scrypt with a random per-user salt. Sign-in attempts are rate-limited per API process.

Send `Authorization: Bearer <accessToken>` to all `/api/v1` routes other than login. `POST /api/v1/auth/logout` revokes the current token. The schema recognizes `system_administrator`, `relief_coordinator`, `warehouse_manager`, `field_volunteer`, and `finance_audit_officer`.

| Action | Permitted roles |
|---|---|
| Read camps, inventory, needs, dispatches | Any authenticated role |
| Read donations or audit logs | System administrator, finance/audit officer |
| Create/reserve a dispatch | System administrator, relief coordinator, warehouse manager |
| Move a pending dispatch to in transit or cancel an eligible dispatch | System administrator, relief coordinator, warehouse manager |
| Confirm a full receipt | System administrator, relief coordinator, warehouse manager, or volunteer assigned to the destination camp |
| Confirm a partial/discrepant receipt | System administrator or relief coordinator; recipient confirmation and a discrepancy reason are required |

Role authorization is enforced by the API, not inferred from the browser. User administration, role-change approval, account recovery, and broader finance/warehouse write APIs remain outstanding.

## API routes

All list responses use `{ "data": [...], "pagination": { "limit": 50, "offset": 0, "total": 0 } }`; list endpoints accept `limit` (1–100) and non-negative `offset`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Sign in and create an expiring session |
| `POST` | `/api/v1/auth/logout` | Revoke the current session |
| `GET` | `/api/v1/camps` | List camps, including nullable coordinates/access status |
| `GET` | `/api/v1/inventory` | List items with on-hand, reserved, and calculated available stock |
| `GET` | `/api/v1/needs` | List camp needs |
| `GET` | `/api/v1/dispatches` | List dispatches |
| `GET` | `/api/v1/donations` | Finance/admin donation read |
| `GET` | `/api/v1/audit-logs` | Finance/admin audit read |
| `POST` | `/api/v1/dispatches` | Atomically reserve stock and create a dispatch |
| `PATCH` | `/api/v1/dispatches/{id}/status` | Record in-transit, cancellation, or receipt transition |

Dispatch creation example:

```http
POST /api/v1/dispatches
Authorization: Bearer <token>
Idempotency-Key: dispatch-create-0000001
Content-Type: application/json

{
  "needId": 1,
  "quantity": 25,
  "sourceWarehouse": "Sukkur warehouse",
  "driver": "Driver name",
  "vehicle": "Vehicle identifier",
  "estimatedArrival": "2026-10-22T09:00:00Z"
}
```

Receipt updates use `status: "delivered"`, `receivedQuantity`, and `recipientConfirmation`. When the received quantity is below the reserved quantity, an authorized coordinator/administrator must also supply `discrepancyReason`. Include a new `Idempotency-Key` for each distinct write; reusing a key with a different request returns `409`.

Errors use `{ "error": { "code": "...", "message": "..." } }`. Unexpected server errors return a generic message; details are written to server logs without request bodies or bearer tokens.

## Transaction and ledger guarantees

- Dispatch creation locks the need and inventory rows, checks both unfulfilled/unreserved need and physically available stock, inserts the dispatch, records the reservation movement, event, audit entry, and idempotency response within one PostgreSQL transaction.
- Status changes lock the dispatch row. Delivery locks the physical item and need, applies received quantity once, releases the full reservation, updates fulfilled quantity, records a movement/event/audit entry, and stores the idempotent response in the same transaction.
- Cancellation releases reservations and records history without changing physical on-hand stock.
- `inventory_stock_position` calculates reserved stock from active dispatches; available stock is `on_hand - reserved`.
- Partial receipts require a discrepancy reason and coordinator/administrator authorization. A separate pending-approval queue for disputed receipts is still outstanding.

## Demo import and data interpretation

`npm run seed:api` imports `db.json` into an empty target database. Existing plaintext passwords are re-hashed. The importer reconstructs an opening ledger balance from the snapshot, then adds available imported in-kind donation and delivered-dispatch movements and active-dispatch reservations so the starting available quantity matches the existing demo snapshot. The JSON Server snapshot does not contain original movement history, warehouse identifiers, coordinates, delivery evidence, or assessment provenance; those values are not fabricated. Imported legacy deliveries have an explicit note that their evidence/history is unavailable.

## Testing

- `npm test` runs the existing JSON Server workflow suite. It mutates its configured API and is intended for a disposable test database/snapshot; preserve the user's data before running it.
- `npm run test:api` runs API unit tests plus an integration test. The PostgreSQL concurrency/partial-delivery test is skipped unless `RELIEFHUB_TEST_DATABASE_URL` points to a **disposable PostgreSQL database**. It creates and drops only a randomly named test schema inside that database. Do not point it at a production database.

For local Windows testing, install PostgreSQL 17 with `winget install --id PostgreSQL.PostgreSQL.17 --exact --source winget`, create a disposable database named `reliefhub_test`, then set `RELIEFHUB_TEST_DATABASE_URL` in the same PowerShell window before running `npm run test:api`. Do not put production credentials in the test URL. To avoid sharing or committing the local test password, store the URL in the ignored `.env.test.local` file and load it without printing it:

```powershell
$line = Get-Content .env.test.local | Where-Object { $_ -match '^\s*RELIEFHUB_TEST_DATABASE_URL=' } | Select-Object -First 1
$env:RELIEFHUB_TEST_DATABASE_URL = $line -replace '^\s*RELIEFHUB_TEST_DATABASE_URL=', ''
npm run test:api
```

The integration test verifies concurrent reservations, partial delivery accounting, and idempotent retry behavior. It has not been verified until run against a real PostgreSQL instance.

## Production limitations and operations checklist

This is a foundation, not a production-readiness claim. Before operational deployment:

- Connect and browser-test the existing frontend against the production API; replace demo-only login and route assumptions.
- Provision users securely, rotate all imported/demo passwords, add approved user/role management, account recovery, and reviewable approvals for financial, stock-adjustment, and disputed-delivery actions.
- Complete all inventory receipt/adjustment/batch workflows and donor verification; add the remaining CRUD endpoints and business rules.
- Run migration, concurrency, security, and end-to-end tests on the deployment PostgreSQL version and hosting topology.
- Configure PostgreSQL TLS, network restrictions, least-privilege roles, secret-manager injection, HTTPS, and centralized monitoring/log retention.
- The included rate limiter is in-memory per process; use a shared/distributed limiter when running multiple API instances.
- Schedule encrypted backups, restrict backup access, and test a restore into a separate database before production. A basic manual PostgreSQL backup is `pg_dump --format=custom --file=reliefhub.backup "$DATABASE_URL"`; restore only into a verified target using `pg_restore --clean --if-exists --dbname "$RESTORE_DATABASE_URL" reliefhub.backup`. Automated scheduling, retention, encryption-key management, and a restore drill are not implemented.
- The single initial migration is guarded by `schema_migrations`; future schema changes must be added as ordered migrations and tested before deployment.
- The GIS map, external flood/road providers, offline queue/conflict UI, notification lifecycle, scoring configuration/approval UI, PDF/CSV reporting, monitoring, and full backup automation are planned but not implemented in this phase.
