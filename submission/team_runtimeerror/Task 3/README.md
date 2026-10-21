# ReliefHub: Flood Relief Coordination Dashboard

## 🎯 Goal

A web dashboard to manage flood-relief camps, their needs, warehouse inventory, dispatches, donations and volunteers, while highlighting underserved camps.

## 🏢 Scenario

During flood response in Sindh, relief organizations need one shared view to prevent duplicate deliveries and prioritize camps lacking food, clean water, or medicines. ReliefHub gives them that view, and the server enforces the stock and reservation rules so the interface cannot over-dispatch.

---

## 🧰 Tech stack

- **Frontend:** a single page, `public/index.html` (plain HTML, CSS and JavaScript, no build step).
- **Backend / mock API:** a custom Node.js HTTP server, `server.js`. It needs no packages and uses only Node's built-in modules.
- **Storage:** `db.json`, a file the server reads at start and rewrites after every change.
- **Seed data:** `seed.js` builds the starting data and also restores it on reset.

## ▶️ How to run

You need Node.js 18 or newer. There is nothing to install.

```
cd ReliefHub
node server.js
```

Then open **http://localhost:3001** in a browser. `npm start` does the same thing.

| Setting | Default | How to change |
|---|---|---|
| Port | `3001` | `PORT=4000 node server.js` |
| Admin PIN | `1234` | `ADMIN_PIN=9876 node server.js` |

If `db.json` is missing, the server creates it from the seed data. To start fresh, stop the server and delete `db.json`.

**Restore the demo data while the server is running** (needs the admin PIN):

```
curl -X POST localhost:3001/api/reset -H "x-pin: 1234"
```

---

## 📁 Project structure

| File | Purpose |
|---|---|
| `server.js` | Mock REST API, validation, business rules and roles |
| `seed.js` | Seed data (also used by reset) |
| `db.json` | Saved data, created and updated by the server |
| `public/index.html` | The dashboard interface |
| `PLAN_AND_PITCH.md` | Time plan, pitch outline and demo script for the hackathon |
| `package.json` | Defines `npm start` |

---

## 📍 Milestones and how each is covered

### 🧩 Milestone 1: Camp Management

**Problem:** Maintain a trustworthy camp registry.

| Rule | How it is handled |
|---|---|
| Two roles: Relief Coordinator (Admin) and Field Volunteer | Admin can do everything. A Field Volunteer can only read data and update a camp's `current_families`. |
| Create, edit and delete camps with validation | Name needs at least 3 characters, district is required, capacity must be a whole number of at least 1, current families must be a whole number of 0 or more and cannot exceed capacity. |
| Search by name or district, filter by status | Search box and status filter on the Camps page. |
| Mark a camp **Full** automatically at capacity | The server sets status to `Full` when `current_families >= capacity` and back to `Active` when there is room. `Closed` is never changed automatically. |

Closing a camp unassigns its volunteers. A camp with Pending or In Transit dispatches cannot be deleted, and deleting a camp also removes its needs.

### 🧩 Milestone 2: Camp Needs & Warehouse

**Problem:** Track unmet demand against actual supplies.

| Rule | How it is handled |
|---|---|
| Add, edit and remove a camp's needs, each linked to an inventory item | `needs` collection. New needs cannot be added to a Closed camp. |
| Required quantity and High / Medium / Low priority | Quantity must be at least 1. Priority must be one of the three values. |
| Fulfilment progress | `fulfilled_quantity ÷ required_quantity`, shown as a progress bar per need. |
| Inventory CRUD | Name, category, unit, stock and reorder level, all required. Stock and reorder level must be whole numbers of 0 or more. |
| **Low Stock** highlight | Items with `stock <= reorder_level` are badged Low Stock. |

The server also blocks deleting an item that is used by a need, deleting a need that has Pending or In Transit dispatches, and lowering a need's required quantity below what is already fulfilled or reserved.

### 🧩 Milestone 3: Dispatches & Stock Reservations

**Problem:** Allocate resources without over-dispatching.

Creating a dispatch takes a camp, a need and a quantity. The server then:

1. Rejects the dispatch if the need does not belong to the chosen camp, or the camp is Closed.
2. Rejects a quantity above the item's **available stock**.
3. Rejects a quantity above the need's **remaining unreserved quantity**: `required − fulfilled − other Pending/In Transit dispatches`.
4. Takes the quantity out of stock **immediately** and saves the dispatch as `Pending`.

| Action | Allowed from | Effect |
|---|---|---|
| Mark In Transit | Pending | Status changes. Stock stays reserved. |
| Mark Delivered | In Transit | Need's `fulfilled_quantity` increases. |
| Cancel | Pending or In Transit | Stock is restored. |

Delivered and Cancelled dispatches are final. The Dispatches page has status filters, and each need also has a **Dispatch** shortcut. Dispatches cannot be deleted, so the list works as a ledger.

### 🧩 Milestone 4: Donations & Volunteers

**Problem:** Track incoming contributions and deploy volunteers.

- **Donations:** `Cash` and `In-Kind`. An In-Kind donation needs an inventory item and **adds its quantity to that item's stock**. A Cash donation needs a category. The page shows total cash received and totals per category. Donations cannot be edited or deleted.
- **Volunteers:** name and one skill (Medical, Logistics, Cooking, Driving or Counselling), with search and skill filter.
- **Assignment:** a volunteer has a single `camp_id`, so only one assignment is possible. Assigning to a Closed camp is rejected. Unassigning clears `camp_id`.

### 🧩 Milestone 5: Dashboard & Critical Gaps

**Problem:** Make urgent resource shortages visible.

- KPIs: active camps, families sheltered, overall fulfilment percentage, low-stock item count and volunteers deployed.
- Bar chart: fulfilment percentage by item category.
- **Critical Gaps** table: High-priority needs under 40% fulfilment, worst gap first, each linking back to its camp.

### 🧩 Milestone 6: Mock API & Seed Data

All reads and writes go over HTTP to the collections `camps`, `inventory`, `needs`, `dispatches`, `donations` and `volunteers`.

Seed data in `seed.js`, checked against the requirements:

| Collection | Requirement | Seeded |
|---|---|---|
| Camps | 8 camps, at least 4 districts, one Full, one Closed | 8 camps, 7 districts, 1 Full, 1 Closed |
| Inventory | 12 items, at least 2 Low Stock | 12 items, 3 Low Stock (Flour, Water Purification Tablets, Paracetamol) |
| Needs | 20 needs, at least 3 Critical Gaps | 20 needs, 6 Critical Gaps |
| Dispatches | 10 | 10 (covering all four statuses) |
| Donations | 10 | 10 (5 Cash, 5 In-Kind) |
| Volunteers | 15 | 15 (9 assigned, 6 unassigned) |

---

## 🗃️ Data model

| Collection | Fields |
|---|---|
| `camps` | id, name, district, capacity, current_families, status (Active / Full / Closed) |
| `inventory` | id, name, category, unit, stock, reorder_level |
| `needs` | id, camp_id, inventory_item_id, required_quantity, priority (High / Medium / Low), fulfilled_quantity |
| `dispatches` | id, camp_id, need_id, quantity, status (Pending / In Transit / Delivered / Cancelled) |
| `donations` | id, type (Cash / In-Kind), amount_or_quantity, item_id, category, donor |
| `volunteers` | id, name, skill, camp_id |

## 🔌 API reference

Base URL: `http://localhost:3001/api`. Replies are JSON. Errors look like `{ "error": "message" }` with a 400, 403, 404 or 405 status.

| Method | Path | Use |
|---|---|---|
| GET | `/api/<collection>` | List all records |
| GET | `/api/<collection>/<id>` | One record |
| POST | `/api/<collection>` | Create. Dispatches and donations run their own rule checks. |
| PUT / PATCH | `/api/<collection>/<id>` | Update. For dispatches, send `{ "status": "In Transit" }` and so on. |
| DELETE | `/api/<collection>/<id>` | Delete (not allowed for dispatches and donations) |
| POST | `/api/login` | Body `{ "role": "admin", "pin": "1234" }` or `{ "role": "volunteer" }`. Returns a `token`. |
| POST | `/api/reset` | Restore seed data (admin only) |

Write requests need the token from `/api/login` in an `x-token` header. Without one, the caller is treated as a Field Volunteer. Sending the same `x-idem` header on a repeated POST returns the first result instead of creating a duplicate.

---

## ⚠️ Known issue: the interface does not sign in yet

Testing the server and the page together shows a mismatch:

- The server decides the role from the login token (`x-token`), and anyone without a token is a Field Volunteer.
- The page never calls `/api/login`. It sends a plain `x-role` header, which the server ignores.

So the page can read all data, but its create, edit, delete and dispatch actions are refused with "Only the Relief Coordinator (Admin) can do this". The same actions work when called directly with a valid token. Direct API calls confirmed that over-dispatching is rejected (for example, 9999 tablets returns "Only 150 strips … in stock") and that a valid dispatch is created.

To fix it, the page needs a sign-in step that posts the role and PIN to `/api/login` and sends the returned token as `x-token` on every request.

## 🔒 Other notes

- Roles are demo-level security. Real authentication, an audit log and offline mode are not included.
- Changing `db.json` by hand while the server is running is not safe, because the server keeps its own copy in memory.
- To use a real database later, replace `db.json` with a database. The API paths can stay the same.

## ✅ Expected deliverable

A running mock API with seeded data and a fully integrated interface covering all six milestones.
