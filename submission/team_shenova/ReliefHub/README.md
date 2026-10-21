# ReliefHub — Flood Relief Coordination Dashboard
### Humanitarian Logistics & Emergency Coordination Platform for Sindh, Pakistan

**ReliefHub** is a mission-critical, data-driven humanitarian coordination platform designed to organize and streamline flood-relief operations across flood-affected districts in Sindh, Pakistan (Sukkur, Dadu, Larkana, Khairpur, Jacobabad).

The platform answers five essential operational questions:
1. **Which relief camps are operating, full, or closed?** (Real-time camp registry with occupancy progress)
2. **What supplies does each camp need?** (Prioritized commodity requirements, fulfilled vs unmet demand)
3. **Which supplies are available, running low, or already reserved?** (Warehouse inventory tracking with reorder thresholds)
4. **Which deliveries are pending, in transit, delivered, or cancelled?** (Live cargo dispatch tracking with immediate stock reservations)
5. **Which camps have the most urgent unmet needs?** (Dynamic Critical Gaps triage table for High-priority shortages below 40% fulfilment)

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Installation
Navigate into the ReliefHub project directory:
```bash
cd submission/team_shenova/ReliefHub
npm install
```

### 2. Running Frontend and Backend Together
To launch both the hardened REST API server and the Vite React frontend with a single command:
```bash
npm start
# or npm run dev:all
```

Alternatively, run them in separate terminal tabs:
```bash
# Tab 1: Mock REST API Server (Port 3001)
npm run server

# Tab 2: Vite React Frontend (Port 5173)
npm run dev
```

### 3. Application Access URLs
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Mock REST API Endpoints:** [http://localhost:3001](http://localhost:3001)
  - Health: `http://localhost:3001/health`
  - Camps: `http://localhost:3001/camps`
  - Inventory: `http://localhost:3001/inventory`
  - Needs: `http://localhost:3001/needs`
  - Dispatches: `http://localhost:3001/dispatches`
  - Donations: `http://localhost:3001/donations`
  - Volunteers: `http://localhost:3001/volunteers`

### 4. Running Automated Tests
```bash
npm test
```
Executes the comprehensive regression suite (26 passing tests) covering:
1. Business calculation routines and Critical Gaps raw ratio filtering.
2. Full dispatch lifecycle state machine (`Pending` → `In Transit` → `Delivered` / `Cancelled`).
3. Referential-integrity safeguards (blocking unsafe deletes on camps, inventory, and needs).
4. Fulfilment data protection (locking `fulfilled_quantity` as read-only).
5. In-kind donation inventory stock reconciliation and safe deletion.
6. Camp closure guards and volunteer assignment boundary conditions.

> **Note:** Automated API tests execute against an isolated temporary copy (`temp_regression_db.json`) on an ephemeral port. Live seed data in `db.json` is never mutated during testing.

### 5. Configuring the API URL
The frontend reads the backend API URL from the `VITE_API_URL` environment variable defined in `.env`:
```env
VITE_API_URL=http://localhost:3001
```
An `.env.example` file is included in the project root as a reference.

### 6. Troubleshooting Port Conflicts
If port `3001` or `5173` is occupied on your system:
- **Backend Port:** Specify an alternative port via environment variable:
  ```bash
  PORT=3005 npm run server
  ```
  Then update `VITE_API_URL=http://localhost:3005` in `.env`.
- **Frontend Port:** Pass the `--port` flag to Vite:
  ```bash
  npm run dev -- --port 5174
  ```

---

## 🛠️ Technology Stack
- **Frontend Framework:** React 19 + Vite 8
- **Styling:** Custom Vanilla CSS Design System (Midnight navy sidebar `#0f172a`, muted teal action `#0d9488`, slate typography, off-white background `#f8fafc`)
- **Data Visualizations:** Recharts (Fulfilment by Category responsive bar chart)
- **Icons:** Lucide React
- **Backend:** Node.js native HTTP server (`server.js`) with atomic file persistence and serialized write queue
- **Testing:** Node.js native test runner (`node:test` + `node:assert/strict`)

---

## 📂 Project Architecture

```
ReliefHub/
├── package.json               # Scripts, dependencies, and test commands
├── db.json                    # Persistent seed database (6 audited collections)
├── .env.example               # Environment variables template
├── .env                       # Local environment configuration (VITE_API_URL)
├── README.md                  # Project documentation
├── index.html                 # App shell with Inter font & metadata
├── server.js                  # REST API server with state machine & validation
├── start.js                   # Unified development process manager
├── src/
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # App shell, navigation, global state & mutation handlers
│   ├── index.css              # Complete design tokens, components, and layout styling
│   ├── api/
│   │   └── api.js             # HTTP client using Fetch API and VITE_API_URL
│   ├── components/
│   │   ├── Sidebar.jsx        # Deep midnight navy collapsible sidebar with role toggle
│   │   ├── Header.jsx         # Header with page titles, contextual actions & status
│   │   ├── StatCard.jsx       # Operational KPI metric card with navigation links
│   │   ├── DataTable.jsx      # Reusable searchable, filterable data table wrapper
│   │   ├── Modal.jsx          # Accessible dialog with ESC key dismissal
│   │   ├── StatusBadge.jsx    # Standardized color-coded status badges
│   │   └── ProgressBar.jsx    # Threshold-aware occupancy and fulfilment progress bar
│   ├── pages/
│   │   ├── Dashboard.jsx      # 5 KPIs, Recharts category chart & Critical Gaps table
│   │   ├── Camps.jsx          # Camp registry CRUD, occupancy, and auto Full/Active rules
│   │   ├── Inventory.jsx      # Warehouse commodity CRUD, low-stock alerts
│   │   ├── Needs.jsx          # Prioritized camp demands with read-only fulfilment
│   │   ├── Dispatches.jsx     # Dispatch tracking, stock reservation & delivery workflows
│   │   ├── Donations.jsx      # Cash & In-Kind donation management with stock crediting
│   │   └── Volunteers.jsx     # Volunteer roster with skill filters and closed-camp guard
│   └── utils/
│       ├── calculations.js    # Demand, unrounded Critical Gaps, KPI, and category math
│       └── validation.js      # Business rules and input boundary validations
└── tests/
    ├── businessRules.test.js  # Automated unit tests for calculation & validation logic
    └── apiHardening.test.js   # Integration regression tests for REST API endpoints
```

---

## 📋 Implemented Business Rules & Hardening Policies

### 1. Dispatch State Machine (Priority 1)
- **Strict Allowed Transitions:**
  - `Pending` → `In Transit`
  - `Pending` → `Cancelled`
  - `In Transit` → `Delivered`
  - `In Transit` → `Cancelled`
- **Terminal States:** `Delivered` and `Cancelled` are terminal; attempts to reopen them are rejected with HTTP 400.
- **Forced Pending on Creation:** All new dispatches are forced to `Pending`. Client-supplied statuses (such as attempts to create directly as `Delivered`) are rejected or overridden.
- **Immutable Properties:** Dispatch `camp_id`, `need_id`, `quantity`, and `id` cannot be modified after creation.
- **Side Effect Idempotency:**
  - Creating a dispatch deducts warehouse stock immediately (`inventory.stock -= qty`).
  - Marking `Delivered` increments the camp need's `fulfilled_quantity` exactly once without re-deducting stock.
  - Cancelling an undelivered dispatch restores stock to the warehouse exactly once and releases demand reservations.
  - Repeated cancellation or delivery requests are handled idempotently without duplicate side effects.

### 2. Referential Integrity Safeguards
- **Inventory Deletion:** Blocked (HTTP 400) if any camp needs or in-kind donations reference the item.
- **Need Deletion:** Blocked (HTTP 400) if any dispatches reference the need.
- **Camp Deletion:** Blocked (HTTP 400) if any needs, dispatches, or volunteer assignments reference the camp.
- **Foreign Key Validation:** All POST/PATCH requests validate that referenced IDs exist in target collections.

### 3. Fulfilment Data Protection
- `fulfilled_quantity` is strictly read-only in both the frontend UI and backend endpoints. It can only be increased via verified dispatch deliveries.
- `required_quantity` updates must not fall below `fulfilled_quantity + active_reserved_demand`.

### 4. Camp Closure & Volunteer Policy
- **Camp Closure Guard:** The server prevents setting a camp's status to `Closed` if volunteers are currently assigned to it. Volunteers must be reallocated or unassigned before closing the camp.
- **Closed Camp Protection:** New volunteer assignments to `Closed` camps are rejected with HTTP 400.
- **Automatic Occupancy Status:** Active camps automatically transition to `Full` when `current_families >= capacity`, and revert to `Active` when occupancy drops (unless intentionally marked `Closed`).

### 5. In-Kind Donation Accounting
- **Creation:** In-kind donation creation increases the referenced inventory item's stock by `amount_or_quantity`. Cash donations never alter inventory stock.
- **Editing:** In-kind edits compute the quantity delta (`newQty - oldQty`) and verify that warehouse stock does not fall below zero before applying adjustments.
- **Deletion:** Deletion verifies that sufficient stock remains in the warehouse. If donated stock has already been dispatched, deletion is safely rejected with HTTP 400.

### 6. Critical Gaps Unrounded Ratio
- High-priority needs are evaluated using the raw unrounded ratio `fulfilled_quantity / required_quantity < 0.40`. This prevents edge cases (such as 39.96%) from being erroneously rounded up to 40% and excluded.

### 7. Persistence & Concurrency
- The backend uses an in-process serialized write queue and atomic temporary-file replacement (`.tmp` write followed by safe copy/unlink) to prevent race conditions or partial JSON file writes on Windows.
- Collision-resistant IDs are generated using `crypto.randomUUID()`.

---

## 🧪 Demonstration Guide

Follow this sequence to demo the repaired application:
1. **Launch:** Run `npm start` and open `http://localhost:5173`.
2. **Dashboard Overview:** Observe the 5 live KPI summary cards, the Category Fulfilment bar chart, and the Critical Gaps triage table.
3. **Dispatch Workflow:** Click **Dispatch Relief** next to any critical gap. Select a quantity within warehouse stock and unreserved demand. Confirm creation (stock is immediately reserved).
4. **Transition to In Transit:** Go to **Cargo Dispatches** and click **Mark In Transit**.
5. **Confirm Delivery:** Click **Mark Delivered**. Navigate back to **Camp Needs** and observe that `fulfilled_quantity` has increased and the progress bar has updated.
6. **In-Kind Donation:** Go to **Donations**, record an in-kind contribution of 100 units of an item. Switch to **Warehouse Stock** and verify the stock increased. Edit or delete the donation and verify stock reconciliation.
7. **Referential Integrity Demo:** Try deleting an inventory item linked to a need—the server will safely reject the deletion with a clear error banner.
