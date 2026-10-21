# ReliefHub production-readiness plan

## Audit findings

The existing application is a vanilla HTML/CSS/JavaScript single-page dashboard backed by JSON Server and `db.json`. Its operational collections are camps, inventory, needs, dispatches, donations, volunteers, and users. The seven existing screens and seed/test workflow remain available in demo mode.

The audit found these material production gaps:

- Demo authentication stores clear-text passwords in the JSON file. Authorization is performed in browser JavaScript and is not a server security boundary.
- Dispatch reservation, cancellation, delivery fulfilment, and in-kind receipt currently update separate JSON resources over independent HTTP requests. They are not atomic and can race.
- The demo models one inventory quantity and has no immutable movement ledger, delivery evidence, status-event history, session expiry, relational constraints, or server-side pagination.
- Camps have no coordinates or recorded access/assessment state; the current seed provides no verified GIS or hazard data.
- Notifications are derived in the UI and do not have persistent acknowledgement, deduplication, or resolution records.
- There is no production database configuration, migration/backup workflow, or offline synchronization protocol.

## Phased execution

| Phase | Scope | Status |
|---|---|---|
| 1. Integrity and security | Add a separate PostgreSQL API path, relational constraints, salted password hashing, expiring server sessions, rate-limited sign-in, server-side role gates, audit records, idempotency, and transactional dispatch reservation/receipt. Keep JSON Server as the local demo mode. | In progress; foundation and HTTP/unit tests implemented. PostgreSQL transaction/concurrency integration test could not run because no local PostgreSQL server/client is available; frontend integration also remains outstanding. |
| 2. Operational visibility | Complete the immutable movement ledger, stock adjustment approvals, batches/expiry, donation verification, complete dispatch evidence and discrepancy review, reconciliation exports. | Not started. |
| 3. Field operations | Add camp GIS/accessibility UI, verified/unverified reporting, notification acknowledgement/deduplication, and protected offline drafts/sync conflict resolution. | Not started. |
| 4. Intelligence and reports | Add explainable configurable prioritization with human approval, reconciled date/district/category reporting, and privacy-safe exports. | Not started. |
| 5. Resilience and deployment | Integrate the production API with the frontend, test all deployment workflows and concurrency against PostgreSQL, complete backup/restore drills, monitoring/security checks, and deployment documentation. | Not started. |

Detailed API setup, migration, import, and current limitations are documented in [production-api.md](./production-api.md).

## Verification recorded so far

- Existing demo workflow tests: 33 passed against an isolated copy of the seeded JSON database.
- Production API tests: 5 passed; the PostgreSQL concurrency/receipt test was skipped because `RELIEFHUB_TEST_DATABASE_URL` is not configured.
- JavaScript syntax checks passed; `npm audit --omit=dev` reported zero known production dependency vulnerabilities.
- Browser smoke check passed for the unchanged dashboard, its five KPI cards, and the three locally served illustrative photos.
- The original `db.json` still contains only the seeded admin and volunteer users and the original operational record counts.

## Compatibility and safety boundaries

- `npm start`, the JSON Server API, the existing UI routes, demo accounts, and seed data are retained.
- The production API is an explicit alternate path; the current browser UI still targets JSON Server and must not be presented as using production authentication.
- The legacy importer hashes existing passwords, reconstructs opening stock and available dispatch history from the snapshot, and labels unverifiable historical fields as unrecorded. It never invents camp coordinates, hazard reports, or delivery evidence.
- A successful local demo test is not evidence of production readiness. PostgreSQL integration tests require an explicitly configured disposable database.
