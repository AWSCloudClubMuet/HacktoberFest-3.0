# ReliefHub: Requirements

## 1. Purpose
Provide a single dashboard for flood-relief coordination in Sindh that prevents duplicate deliveries and surfaces camps lacking food, clean water or medicine.

## 2. Users
- **Relief Coordinator (Admin):** full access.
- **Field Volunteer:** limited access (view data, record donations, update dispatch delivery status).

## 3. Functional Requirements

### Camp Management
- FR-1.1 Create, edit and delete camps (name, district, capacity, current families, status).
- FR-1.2 Validate input (required fields, numeric ranges, current families ≥ 0, capacity ≥ 1).
- FR-1.3 Search by name or district; filter by status.
- FR-1.4 Automatically mark a camp Full when current families ≥ capacity.
- FR-1.5 Enforce role permissions.

### Needs & Warehouse
- FR-2.1 Add, edit, remove camp needs linked to an inventory item.
- FR-2.2 Store required quantity and priority (High / Medium / Low).
- FR-2.3 Display fulfilment progress = fulfilled ÷ required.
- FR-2.4 Inventory CRUD (name, category, unit, stock, reorder level).
- FR-2.5 Flag items with stock ≤ reorder level as Low Stock.

### Dispatches & Reservations
- FR-3.1 Create a dispatch by choosing camp, need and quantity.
- FR-3.2 Reserve stock immediately on creation.
- FR-3.3 Reject quantity > available stock.
- FR-3.4 Reject quantity > required − fulfilled − other Pending/In Transit dispatches.
- FR-3.5 Support Pending, In Transit, Delivered, Cancelled statuses with Mark In Transit / Mark Delivered / Cancel actions.
- FR-3.6 Delivered increases need fulfilment; cancelling an undelivered dispatch restores stock.
- FR-3.7 Filter dispatches by status.

### Donations & Volunteers
- FR-4.1 Record Cash and In-Kind donations; In-Kind increases item stock.
- FR-4.2 Show total cash received and totals per donation category.
- FR-4.3 Register volunteers; search/filter by skill (Medical, Logistics, Cooking, Driving, Counselling).
- FR-4.4 Assign/unassign volunteers to camps; one assignment per volunteer; no assignment to Closed camps.

### Dashboard & Critical Gaps
- FR-5.1 KPIs: active camps, families sheltered, overall fulfilment %, low-stock item count, volunteers deployed.
- FR-5.2 Bar chart of fulfilment % by item category.
- FR-5.3 Critical Gaps table: High-priority needs < 40% fulfilled, sorted worst first, linking to each camp.

### Mock API & Seed Data
- FR-6.1 All reads and writes go through HTTP to a mock API.
- FR-6.2 Collections: camps, inventory, needs, dispatches, donations, volunteers.
- FR-6.3 Seed: 8 camps (≥ 4 districts, one Full, one Closed), 12 inventory items (≥ 2 Low Stock), 20 needs (≥ 3 Critical Gaps), 10 dispatches, 10 donations, 15 volunteers.

## 4. Non-Functional Requirements
- NFR-1 Responsive layout usable on tablet and mobile (field use).
- NFR-2 Clear loading, empty and error states for every API call.
- NFR-3 Destructive actions require confirmation.
- NFR-4 Data remains consistent after a page refresh.
- NFR-5 Status and priority use colour plus text/icon (not colour alone).
- NFR-6 Setup in under 5 minutes using the README.

## 5. Software Requirements

| Item | Version |
|---|---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Modern browser | Chrome, Edge, Firefox (latest) |

### Runtime dependencies
| Package | Purpose |
|---|---|
| react, react-dom (^18) | UI |
| react-router-dom (^6) | Routing |
| recharts (^2) | Category fulfilment chart |

### Dev dependencies
| Package | Purpose |
|---|---|
| vite, @vitejs/plugin-react | Build and dev server |
| json-server (0.17.4) | Mock API |
| concurrently | Run API and frontend together |

### Install
```bash
npm install react react-dom react-router-dom recharts
npm install -D vite @vitejs/plugin-react json-server@0.17.4 concurrently
```

## 6. Constraints
- Hackathon time limit: 5 h 30 min.
- Data must be fetched and mutated through the mock API only (no local-only state as source of truth).
- AI assistants are permitted.

## 7. Acceptance Criteria
1. All six milestones demonstrable end to end with seeded data.
2. No dispatch can exceed stock or the need's remaining unreserved quantity.
3. Stock and fulfilment values reconcile after create, deliver and cancel flows.
4. Dashboard KPIs, chart and Critical Gaps agree with underlying data.
5. README instructions start both API and frontend successfully.
