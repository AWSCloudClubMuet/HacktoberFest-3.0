# ReliefHub: Flood Relief Coordination Dashboard

A web dashboard for relief organizations responding to the Sindh floods. It gives coordinators and field volunteers one shared view of camps, camp needs, warehouse inventory, dispatches, donations and volunteers, so deliveries are not duplicated and the camps lacking food, clean water or medicine are visible first.

## Features

| Milestone | Area | Highlights |
|---|---|---|
| 1 | Camp Management | Camp CRUD with validation, search by name/district, status filter, auto-**Full** when families reach capacity |
| 2 | Needs & Warehouse | Needs linked to inventory items, High/Medium/Low priority, fulfilment progress bars, inventory CRUD, **Low Stock** highlighting |
| 3 | Dispatches & Reservations | Stock reserved at creation, over-dispatch prevention, Pending / In Transit / Delivered / Cancelled workflow, status filters |
| 4 | Donations & Volunteers | Cash and In-Kind donations (in-kind raises stock), cash and per-category totals, skill search/filter, single-camp assignment |
| 5 | Dashboard | KPI cards, fulfilment-by-category bar chart, **Critical Gaps** table linked to camps |
| 6 | Mock API & Seed Data | All reads/writes over HTTP to a JSON Server backend with seeded data |

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Recharts
- **Mock backend:** JSON Server (`json-server@0.17.4`) serving `db.json`
- **Tooling:** Node.js 18+, npm 9+

> Any framework works for this brief. If you use a different one, update the Setup and Project Structure sections accordingly.

## Getting Started

### Prerequisites
- Node.js 18 or newer
- npm 9 or newer

### Install
```bash
git clone <your-repo-url> reliefhub
cd reliefhub
npm install
```

### Run
```bash
# Terminal 1: mock API on http://localhost:3001
npm run api

# Terminal 2: frontend on http://localhost:5173
npm run dev
```

Or run both together:
```bash
npm run start:all
```

### Reset seed data
```bash
npm run seed      # regenerates db.json from the seed script
```

### Environment
Create `.env` (optional):
```
VITE_API_URL=http://localhost:3001
```

### Suggested `package.json` scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "api": "json-server --watch db.json --port 3001",
    "seed": "node scripts/seed.js",
    "start:all": "concurrently \"npm run api\" \"npm run dev\""
  }
}
```

## Project Structure
```
reliefhub/
├── db.json                  # Mock database (seeded)
├── scripts/seed.js          # Seed generator
├── src/
│   ├── api/                 # fetch wrappers per collection
│   ├── components/          # shared UI (tables, modals, badges, progress bars)
│   ├── context/RoleContext  # Admin / Field Volunteer role
│   ├── pages/
│   │   ├── Dashboard
│   │   ├── Camps            # list, form, detail (needs + volunteers)
│   │   ├── Inventory
│   │   ├── Dispatches
│   │   ├── Donations
│   │   └── Volunteers
│   ├── utils/               # business-rule helpers (fulfilment, reservations)
│   └── App.jsx
└── README.md
```

## Roles

Roles are selected from a role switcher in the header (no authentication required for the hackathon).

| Capability | Relief Coordinator (Admin) | Field Volunteer |
|---|---|---|
| View dashboard, camps, needs, inventory | Yes | Yes |
| Create / edit / delete camps | Yes | No |
| Manage inventory | Yes | No |
| Create dispatches and change their status | Yes | Mark In Transit / Delivered only |
| Record donations | Yes | Yes |
| Register / assign volunteers | Yes | View only |

## Data Model

| Collection | Fields |
|---|---|
| `camps` | id, name, district, capacity, current_families, status (Open / Full / Closed) |
| `inventory` | id, name, category, unit, stock, reorder_level |
| `needs` | id, camp_id, inventory_item_id, required_quantity, priority (High / Medium / Low), fulfilled_quantity |
| `dispatches` | id, camp_id, need_id, quantity, status (Pending / In Transit / Delivered / Cancelled) |
| `donations` | id, type (Cash / In-Kind), amount_or_quantity, item_id, category |
| `volunteers` | id, name, skill (Medical / Logistics / Cooking / Driving / Counselling), camp_id |

## Mock API

Base URL: `http://localhost:3001`

Each collection (`camps`, `inventory`, `needs`, `dispatches`, `donations`, `volunteers`) supports:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/{collection}` | List (supports `?q=`, `?status=`, `?camp_id=` filters) |
| GET | `/{collection}/:id` | Fetch one |
| POST | `/{collection}` | Create |
| PATCH | `/{collection}/:id` | Partial update |
| DELETE | `/{collection}/:id` | Remove |

JSON Server has no multi-record transactions, so multi-step rules (e.g. dispatch + stock reservation) are applied by the client in sequence, re-reading current values immediately before writing.

## Business Rules

**Camps**
- Name, district required; capacity ≥ 1; current families ≥ 0.
- When `current_families >= capacity`, status becomes **Full** automatically. If capacity later rises above families, a Full camp reverts to Open. Closed camps stay Closed.

**Needs**
- Progress = `fulfilled_quantity / required_quantity`.
- Each need references one inventory item.

**Inventory**
- **Low Stock** when `stock <= reorder_level`.

**Dispatches**
- Creating a dispatch immediately reduces `inventory.stock` by the dispatch quantity.
- Quantity must be a positive number ≤ available stock.
- Quantity must be ≤ `required − fulfilled − (other Pending/In Transit dispatches for that need)`.
- Transitions: Pending → In Transit → Delivered; Pending or In Transit → Cancelled.
- **Delivered** increases the need's `fulfilled_quantity`.
- **Cancelling** an undelivered dispatch restores stock. Delivered dispatches cannot be cancelled.

**Donations**
- Cash donations add to the cash total.
- In-Kind donations require an item and increase that item's stock.
- Totals are shown overall and per category.

**Volunteers**
- One assignment per volunteer; cannot be assigned to a Closed camp.
- Unassign sets `camp_id` to `null`.

**Dashboard**
- Active camps = camps not Closed.
- Families sheltered = sum of `current_families` across active camps.
- Overall fulfilment % = total fulfilled ÷ total required across all needs.
- Critical Gaps = High-priority needs with fulfilment < 40%, sorted ascending by fulfilment, each linking to its camp.

## Seed Data (minimum)

- 8 camps across ≥ 4 Sindh districts (e.g. Sukkur, Larkana, Dadu, Jacobabad, Khairpur), including one Full and one Closed
- 12 inventory items (≥ 2 Low Stock) across categories such as Food, Water, Medicine, Shelter, Hygiene
- 20 needs (≥ 3 Critical Gaps)
- 10 dispatches covering all four statuses
- 10 donations (mix of Cash and In-Kind)
- 15 volunteers covering all five skills, some unassigned

## Manual Test Checklist

- [ ] Add a camp with invalid input and see validation errors
- [ ] Set families equal to capacity and confirm status flips to Full
- [ ] Search camps by district and filter by status
- [ ] Item at/below reorder level shows Low Stock
- [ ] Dispatch more than stock is blocked
- [ ] Dispatch more than remaining unreserved need is blocked
- [ ] Creating a dispatch lowers stock; cancelling restores it
- [ ] Delivering a dispatch raises need progress
- [ ] In-Kind donation increases item stock
- [ ] Volunteer cannot be assigned to a Closed camp or two camps
- [ ] Dashboard KPIs, category chart and Critical Gaps match the data
- [ ] Refreshing the page keeps all changes (persisted via API)

## Scripts Summary

| Command | Description |
|---|---|
| `npm run dev` | Start frontend |
| `npm run api` | Start mock API |
| `npm run start:all` | Start both |
| `npm run seed` | Reset seed data |
| `npm run build` | Production build |

## License
MIT (or as required by the hackathon).
