# 🌊 ReliefHub — Flood Relief Coordination Dashboard (Sindh, Pakistan)

HTML + CSS + vanilla JavaScript frontend, with a **JSON Server** mock REST API. Every read/write is an HTTP request; no operational data is hardcoded in the UI.

## Quick start (2 commands)
Requires **Node.js 18+**.
```bash
npm install
npm start          # resets db.json to a clean seed, then serves API + app on http://localhost:3000
```
Open **http://localhost:3000** (the frontend is served by JSON Server from `./public`; the API lives at the same origin, e.g. `/camps`, `/inventory`).
Keep `npm start` running while using the app. If you open `public/index.html` directly or serve the frontend on another local port, API requests are sent to port 3000.

Reset to fresh seed data any time: `npm run seed` (works while the server is running).

> The app uses a local JSON Server demo database. `npm start` and `npm test` both reset the seeded state so the app remains runnable and predictable in this environment.

## Demo logins
| Role | Username | Password | Can do |
|---|---|---|---|
| Relief Coordinator (Admin) | `admin` | `admin123` | Everything: camp/need/inventory/volunteer CRUD, dispatches, donations, assignments, cancellations |
| Field Volunteer | `volunteer` | `field123` | Read all data, update camp family counts, move dispatches to In Transit / Delivered |

New field volunteers can create an account from the sign-in screen. Self-service accounts are always assigned the volunteer role; coordinator access remains restricted to existing administrator accounts.

> **Prototype only:** this JSON Server demo stores account passwords in `db.json` and is not suitable for real users or public deployment. Use a production identity provider and server-side password hashing before deploying.

## API collections
`camps`, `inventory`, `needs`, `dispatches`, `donations`, `volunteers` (+ `users` for login). Standard JSON Server routes, e.g. `GET /camps?q=sukkur&status=Active`, `PATCH /inventory/5`.

## Production API foundation
The JSON Server above remains a local demo only. A separate PostgreSQL-backed API is available as a foundation via `npm run db:migrate` and `npm run start:api`; configure it using `.env.example`. It adds hashed-password sessions, server-side role checks, and transactional dispatch reservation/receipt operations. The current browser app is not yet integrated with that API, and this does **not** make the demo suitable for production. See [the implementation plan](docs/implementation-plan.md) and [production API guide](docs/production-api.md) for audited limitations and setup.

Seed data: 8 camps in Sukkur / Larkana / Dadu / Jacobabad (incl. 2 Full, 1 Closed), 12 inventory items (2 low-stock), 20 needs (≥3 critical gaps), 10 dispatches (all 4 statuses), 10 donations (5 cash, 5 in-kind), 15 volunteers.

The dashboard's field-photo panels use representative Unsplash photography under the [Unsplash License](https://unsplash.com/license). Images are labeled illustrative and are not live reports from ReliefHub camps.

## Business rules enforced (public/js/services.js)
- Camp becomes **Full** automatically when families ≥ capacity (and returns to Active below it); families cannot exceed capacity; closing a camp releases its volunteers.
- Dispatch **reserves stock immediately**; blocked if qty > unallocated need (over-allocation) or > stock (no negative stock). **Delivered** adds to fulfilment (never above required). **Cancelling** an undelivered dispatch restores stock. Delivered/Cancelled are final.
- In-kind donations add to inventory; cash totals + per-category summary on the Donations page.
- One camp per volunteer; no assignment to Closed camps; duplicate phone/need/camp/item names rejected.
- Referential integrity: camps, needs, items cannot be deleted while referenced.

## Manual test script (≈5 min)
1. Sign in as **admin** → Dashboard shows 5 KPIs, fulfilment-by-category chart, Critical Gaps (click a camp name → its needs).
2. **Camps**: add a camp with capacity 10 and 10 families → badge turns *Full*. Try 11 families → error. Search "Dadu", filter by status.
3. **Inventory**: 2 items flagged *Low Stock* (First Aid Kits, Water Purification Tablets).
4. **Needs → Dispatch**: dispatch more than the unallocated amount → rejected; dispatch a valid qty → stock drops immediately.
5. **Dispatches**: Start → Mark delivered (need progress rises); create another and **Cancel** → stock restored.
6. **Donations**: record an in-kind donation → inventory increases; cash total updates.
7. **Volunteers**: filter by skill; assign one; try assigning again or to *Mehar Girls School Camp* (Closed) → rejected.
8. Sign out, sign in as **volunteer** → admin buttons are hidden; camp rows show "Update families".

Automated check (API must be running): `npm test` (33 workflow assertions; run `npm run seed` afterwards to reset data).

## Structure
```
db.json            generated seed database (npm run seed)
seed.js            seed generator
test.js            workflow tests
public/index.html  app shell + login
public/css/styles.css
public/js/services.js  REST client + business rules
public/js/ui.js        reusable components (modal, table, badge, toast…)
public/js/pages.js     pages + action handlers
public/js/main.js      auth, routing, events
```
