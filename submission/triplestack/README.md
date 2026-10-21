<img src="public/logo.svg" alt="ReliefHub" width="240" />

# TripleStack — ReliefHub: Flood Relief Coordination Dashboard

ReliefHub is a web dashboard for coordinating flood relief in Sindh. It gives relief organisations one shared view of camps, their needs, warehouse inventory, dispatches, donations and volunteers, and it highlights underserved camps so duplicate deliveries are avoided and urgent gaps are filled first.

Built for **HacktoberFest 3.0 — Challenge #10** ([issue](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/10)).

## Team

| Member | Role |
| --- | --- |
| Muhammad Saeed | Team Lead |
| Haque Nawaz | Developer |

## Technologies used

| Layer | Choice |
| --- | --- |
| Frontend | React 18, Vite 6, React Router 6 |
| Styling | Tailwind CSS 4 |
| Chart | Recharts |
| Mock API | JSON Server 0.17 (used as a library) with custom validated write routes |
| Storage | `server/db.json`, a local JSON file created from `server/seed.json` |
| Tests | Node's built-in test runner (`node:test`), no extra dependencies |

---

## Quick start

**Prerequisite:** Node.js 18 or newer (tested with Node 24 LTS).

```bash
cd submission/triplestack
npm install
npm run dev
```

Then open **http://localhost:5173**.

`npm run dev` starts both processes:

| Process | URL |
| --- | --- |
| Mock API (JSON Server) | http://localhost:3001 |
| Web app (Vite) | http://localhost:5173 |

To run them separately, use `npm run api` and `npm run web` in two terminals.

On first start, the API copies `server/seed.json` to `server/db.json`. After that, **every change persists across restarts**. To start over, use either:

- **Reset demo data** in the sidebar (Coordinator role), while the API is running, or
- `npm run reset-db`, with the API stopped.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API and web app together |
| `npm run api` | Mock API only, on port 3001 (`PORT` overrides it) |
| `npm run web` | Vite dev server only |
| `npm run build` | Production build into `dist/` |
| `npm test` | API, business-rule and advisor test suite (20 tests) |
| `npm run reset-db` | Restore `server/db.json` from the seed (stop the API first) |

### Environment

Copy `.env.example` to `.env` only if you need different ports or URLs.

- `VITE_API_URL` is the API base URL the web app calls (default `http://localhost:3001`).
- `PORT` is the port the API listens on (default `3001`).

---

## Features

### 1. Camp management
- Create, edit and delete camps. Each camp has a name, district, capacity, current families and status.
- Inputs are validated: names are required and unique, numbers must be whole and non-negative, and families cannot exceed capacity.
- Search by name or district, and filter by status (Active, Full, Closed).
- **Automatic Full status:** a camp is marked Full when current families reach capacity, and returns to Active when they drop below it. Closed is a manual state.
- Closing a camp unassigns its volunteers.
- A camp cannot be deleted while it has Pending or In Transit dispatches. This guarantees reserved stock is never lost.
- The camp detail page shows the camp's needs, dispatches and volunteers in one place.

### 2. Camp needs and warehouse
- Add, edit and remove needs. Each need is linked to a camp and an inventory item, with a required quantity and a High, Medium or Low priority.
- **Fulfilment progress** is shown as fulfilled ÷ required. Each row also shows the quantity reserved by open dispatches and the quantity still unreserved.
- Fulfilled quantity only changes when a dispatch is delivered, never by hand.
- A camp cannot hold two needs for the same item, which prevents duplicate deliveries.
- Inventory CRUD covers name, category, unit, stock and reorder level.
- **Low Stock** items (stock ≤ reorder level) are highlighted in the table, in the sidebar badge and on the dashboard.

### 3. Dispatches and stock reservations
- Choose a camp, one of its needs and a quantity. The form shows available stock, the unreserved need and the maximum allowed.
- **Stock is reserved immediately** when a dispatch is created.
- A dispatch is rejected if it exceeds available stock, or if it exceeds the need's remaining unreserved quantity: `required − fulfilled − (Pending + In Transit dispatches)`.
- Allowed statuses and transitions:
  - Pending → In Transit, Delivered or Cancelled
  - In Transit → Delivered or Cancelled
  - Delivered and Cancelled are final.
- **Delivered** adds the quantity to the need's fulfilled quantity exactly once.
- **Cancelled** returns the reserved quantity to stock exactly once.
- The dispatches page has status filters and Mark In Transit / Mark Delivered / Cancel actions. Delivered and Cancel ask for confirmation.

### 4. Donations and volunteers
- Record **Cash** donations (PKR, unrestricted or earmarked for a category) and **In-Kind** donations (an item and a quantity).
- In-kind donations **increase the item's stock** and take the item's category.
- Totals show cash received and a per-category table with cash, in-kind units and the number of donations.
- Deleting an in-kind donation reverses its stock. This is refused if the stock has already been dispatched.
- Register volunteers and search them by name. Filter by skill (Medical, Logistics, Cooking, Driving, Counselling) and by assigned or unassigned.
- Assign, reassign and unassign volunteers. Each volunteer can have only one assignment because `camp_id` holds a single value.
- **Closed camps cannot receive volunteers.** They appear disabled in the UI, and the API rejects the assignment.

### 5. Dashboard and Critical Gaps
- **KPIs:**
  - Active camps
  - Families sheltered
  - Overall fulfilment
  - Low-stock item count
  - Volunteers deployed
- **Needs attention** (action center): four live tiles with direct links to the records concerned.
  - Critical gaps, linking to each camp.
  - Low-stock items.
  - Dispatches awaiting delivery, oldest first.
  - Camps at capacity.
- **Bar chart** of fulfilment percentage by item category, with a labelled 40% threshold line, tooltips (needs and critical gaps per category) and a table view. Clicking a bar or category opens the Needs page filtered to that category.
- **Critical Gaps table:** High-priority needs below 40% fulfilment, worst first. Each row links to its camp and to a pre-filled dispatch form.

### 7. Allocation Advisor (extra)
An explainable "what to dispatch next" panel on the dashboard. It uses only ReliefHub's own data; there is no external or AI service.

- **Ranking:** urgency = priority weight (High 3, Medium 2, Low 1) × the share of the need not yet delivered or on the way.
- **Quantities:** stock is allocated in rank order. A suggestion never exceeds the item's stock left after higher-ranked suggestions, or the need's remaining unreserved quantity.
- **Skipped:** Closed camps and fully covered needs. Needs that can't be served from stock are flagged.
- **Explained:** each suggestion lists why it was chosen (priority, fulfilment, what is already on the way, and any stock limit).
- **Approval:** **Review** opens the normal dispatch form pre-filled. The coordinator approves it and the API validates it as usual. Field Volunteers see the suggestions but cannot act on them.

The logic lives in [`shared/advisor.js`](shared/advisor.js) and is covered by `tests/advisor.test.js`.

### 6. Mock API and seed data
- All reads and writes go over HTTP to the six collections. Nothing is hard-coded in the UI.
- Rich seed data is described below.

### Roles
A role switcher in the header simulates the two roles from the brief. It is a demo approach, not real authentication. The UI sends an `X-Role` header and the API enforces it.

| Role | Can do |
| --- | --- |
| **Relief Coordinator (Admin)** | Everything |
| **Field Volunteer** | View everything, update a camp's current families (headcount), and mark dispatches In Transit or Delivered. Every other write returns `403`. |

### UX details
- Loading, empty and error states, including an "API unreachable" screen with a retry button.
- Toasts after every action.
- Inline field validation that uses the same rules as the API.
- Confirmation before destructive or irreversible actions.
- Buttons are disabled while a request is in flight, so a double click cannot submit twice.
- Responsive sidebar, plus a mobile navigation drawer that closes with Escape.
- Keyboard-accessible native `<dialog>` modals, labelled form controls and a skip link.
- Dialogs open on their first field. Confirmation dialogs open on **Cancel**, so pressing Enter never deletes anything.
- A failed submit moves focus to the first invalid field.
- Sortable columns on every management table (with `aria-sort`), consistent search and filter controls, and **Clear filters**.
- Colour is used consistently: red only for critical gaps, amber for warnings (low stock, camps at capacity), and teal or green for healthy states.
- Respects `prefers-reduced-motion`.

### Branding
The ReliefHub mark is a navy **shield** (protection) holding an off-white **roof chevron** (shelter and recovery) above teal **flood waves**. Colours: navy `#0f2a44`, teal `#14b8a6`, off-white `#f6f4ee`.

| File | Use |
| --- | --- |
| `src/components/Logo.jsx` | Sidebar and header |
| `public/favicon.svg` | Browser tab (heavier strokes for 16px) |
| `public/logo.svg` | Wordmark used in this README |

All three are local SVGs; no remote assets or fonts are loaded.

---

## How data consistency is guaranteed

Business rules live in one module, [`shared/domain.js`](shared/domain.js). The API and the React UI both import it, so the UI shows exactly the errors the API would return.

Every write goes through a custom route in [`server/server.js`](server/server.js). Each route does four things:

1. Validates the request against the current data.
2. Updates every affected collection in memory. For example, creating a dispatch subtracts its quantity from stock and adds the dispatch record.
3. Saves the database with one `db.write()`.
4. Returns `400` (validation), `403` (role), `404` (missing record) or `409` (invalid state, such as delivering an already delivered dispatch).

Each handler runs synchronously, and Node handles one request at a time. So each operation is applied all-or-nothing, and two simultaneous "Mark Delivered" requests cannot both succeed. The test suite fires such requests in parallel to check this. Delivered and Cancelled are final states, which is what makes fulfilment and stock restoration happen exactly once.

### Dashboard formulas

| Metric | Formula |
| --- | --- |
| Active camps | Camps whose status is not Closed (Active + Full) |
| Families sheltered | Sum of `current_families` over non-Closed camps |
| Need fulfilment | `min(100, fulfilled_quantity ÷ required_quantity × 100)` |
| Overall fulfilment | Average of need fulfilment across all needs. Items use different units (kg, litres, kits), so quantities are not added across units. |
| Fulfilment by category | Average need fulfilment of the needs whose item is in that category |
| Low-stock items | Items with `stock ≤ reorder_level` |
| Volunteers deployed | Volunteers with a `camp_id` that points to an existing camp |
| Critical gap | `priority = High` and fulfilment < 40%, sorted by lowest fulfilment, then largest unmet quantity |

`inventory.stock` is **available** stock, already net of open reservations. The inventory page shows the reserved quantity separately.

---

## API

Base URL: `http://localhost:3001`.

Collections: `/camps`, `/inventory`, `/needs`, `/dispatches`, `/donations`, `/volunteers`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/{collection}`, `/{collection}/:id` | Standard JSON Server reads, including filters such as `/needs?camp_id=3`, `/dispatches?status=Pending` and `/{collection}?_sort=id&_order=desc` |
| POST | `/{collection}` | Creates a record after validation. The server assigns the `id`. |
| PATCH / PUT | `/{collection}/:id` | Partial update after validation. |
| PATCH | `/dispatches/:id` `{ "status": "In Transit" \| "Delivered" \| "Cancelled" }` | The only way a dispatch changes. It applies the stock and fulfilment effects. |
| DELETE | `/{collection}/:id` | Refused (`409`) when it would break consistency, for example a camp or need with open dispatches, or an item referenced by needs or donations. |
| PATCH / PUT | `/donations/:id` | Not allowed (`405`). Donations are a ledger, so delete and re-record instead. |
| POST | `/_reset` | Restores the seed data (Coordinator only). |
| GET | `/health` | Health check. |

Errors are returned as `{ "error": "message", "fields": { "field": "message" } }`.

### Data model

| Collection | Fields |
| --- | --- |
| camps | `id, name, district, capacity, current_families, status` (Active/Full/Closed) |
| inventory | `id, name, category, unit, stock, reorder_level` |
| needs | `id, camp_id, inventory_item_id, required_quantity, priority, fulfilled_quantity` |
| dispatches | `id, camp_id, need_id, quantity, status`, plus `created_at`, `updated_at` |
| donations | `id, type (Cash/In-Kind), amount_or_quantity, item_id, category`, plus `donor`, `created_at` |
| volunteers | `id, name, skill, camp_id` (`null` = unassigned) |

### Seed data (`server/seed.json`)

The seed meets or exceeds every minimum in the brief, and `npm test` checks these counts and relationships.

| Collection | Seeded |
| --- | --- |
| Camps | **8** camps across **6 districts** (Dadu, Larkana, Jacobabad, Sukkur, Khairpur, Thatta), including **1 Full** (Johi Relief Camp) and **1 Closed** (Sukkur Barrage Shelter) |
| Inventory | **12** items in 5 categories, **3 Low Stock** (Water Purification Tablets, Antimalarial Kits, Cooking Oil) |
| Needs | **20** needs, **5 Critical Gaps** |
| Dispatches | **10** dispatches: 3 Pending, 2 In Transit, 4 Delivered, 1 Cancelled. Stock is already net of open reservations, and every need satisfies fulfilled + reserved ≤ required. |
| Donations | **10** donations (5 Cash, 5 In-Kind) |
| Volunteers | **15** volunteers, 3 per skill, 10 assigned and 5 unassigned |

All names are fictional.

---

## Project structure

```
submission/triplestack/
├── server/
│   ├── server.js        # JSON Server + validated write routes
│   ├── seed.json        # pristine seed data (committed)
│   ├── db.json          # working database (created on first run, git-ignored)
│   └── reset.js         # npm run reset-db
├── shared/
│   ├── domain.js        # business rules, validation and dashboard metrics (used by API and UI)
│   └── advisor.js       # Allocation Advisor ranking and stock-safe suggestions
├── public/              # favicon.svg, logo.svg (local brand assets)
├── src/
│   ├── api/client.js    # the one place the UI talks HTTP
│   ├── state/           # data loading/mutations, toasts
│   ├── hooks/           # useForm (validation + submit), useSort (table sorting)
│   ├── components/      # layout, logo, UI primitives, tables, modals, forms
│   └── pages/           # Dashboard, Camps, CampDetail, Needs, Inventory, Dispatches, Donations, Volunteers
├── tests/
│   ├── api.test.js      # boots the API on a temp DB and tests the rules over HTTP
│   ├── domain.test.js   # seed integrity + dashboard formulas
│   └── advisor.test.js  # advisor never exceeds stock or remaining need
├── index.html, vite.config.js, package.json, .env.example
```

## Testing

```bash
npm test
```

There are 20 automated tests. The API tests start a real API instance on a temporary copy of the seed. Together they check:

- All six collections are served with the seeded counts.
- Camp validation, and auto Full / back to Active.
- Create, edit and delete persist.
- Negative stock is rejected.
- Dispatches over stock, over the unreserved remainder, to the wrong camp or to a Closed camp are rejected.
- Stock is reserved on creation. Delivery fulfils exactly once and cancellation restores exactly once, both checked with parallel duplicate requests. Invalid transitions are rejected.
- Open dispatches block need and camp deletion.
- In-kind donations add stock, cash donations don't, and deleting an in-kind donation reverses its stock.
- Volunteer assignment rules hold: no Closed camps, a single assignment, and closing a camp unassigns its volunteers.
- Field Volunteer permissions are enforced.
- Seed minimums and relationships are valid, and dashboard metrics match hand-computed values, including empty data.
- Allocation Advisor:
  - Suggestions never exceed stock (including stock shared between needs) or the remaining unreserved need.
  - Closed camps are skipped.
  - The ranking is the documented one.

---

## Demo walkthrough (about 5 minutes)

1. **Dashboard.** Point out the KPIs, the **Needs attention** tiles, the category chart (click a bar to drill into its needs) and the 5 Critical Gaps, ranked worst first. Open **How suggestions are ranked** in the Allocation Advisor and explain the formula.
2. Click **Dispatch** on the top gap (Antimalarial Kits, Ratodero).
   - Try 46: it is rejected because only 45 are in stock.
   - Dispatch 10. Then open **Inventory**: stock dropped 45 → 35 and the Reserved column shows 10.
3. Open **Dispatches** and mark that dispatch **In Transit**, then **Delivered**. The need goes 5 → 15 fulfilled and the dashboard updates.
4. **Cancel** a Pending dispatch. The stock comes back, and the Cancel button disappears so it cannot be repeated.
5. **Camps.** Edit a camp so families equal capacity, and the status becomes **Full**. Search by district and filter by status.
6. **Donations.** Record an In-Kind donation of Water Purification Tablets. Stock rises, and the Low Stock flag clears once stock is above the reorder level.
7. **Volunteers.** Filter by skill and assign an unassigned volunteer. The Closed Sukkur camp is disabled.
8. Switch the role to **Field Volunteer**. Admin buttons disappear, but headcount updates and Mark Delivered still work.
9. Restart the servers and refresh. All changes are still there. **Reset demo data** restores the seed.

## Known limitations

- **Roles are simulated.** The `X-Role` header is trusted, and requests without it are treated as Coordinator so the API is easy to explore with curl. There is no authentication; the brief does not require it for a mock API.
- **Single-process consistency.** Atomicity relies on one Node process writing one JSON file. Running several API instances against the same file would not be safe.
- If writing `db.json` fails (for example, the disk is full), the in-memory state may be ahead of the file until the next successful write.
- Dispatch quantity, camp and need cannot be edited after creation. To change them, cancel the dispatch and create a new one. This is intentional.
- In-kind "units" in the donations-by-category table are summed across items with different units (for example kg and bottles). Use them as a volume indicator, not a measurement.
- Light theme only.
- The Allocation Advisor is a transparent rule-based heuristic, not an optimiser. It does not consider travel distance, road access or any real-time information outside ReliefHub.
