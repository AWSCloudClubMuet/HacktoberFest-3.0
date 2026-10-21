# ReliefHub — Flood Relief Coordination Dashboard

A professional web application for coordinating flood relief operations in Sindh, Pakistan. Built for relief organizations to manage camps, needs, inventory, dispatches, donations, and volunteers with real-time insights into critical gaps and resource shortages.

## 🚀 Features

### Core Functionality
- **Camp Management** — Full CRUD for relief camps with capacity tracking, status management (Active/Full/Closed), and automatic status updates
- **Camp Needs** — Track supply requirements per camp with priority levels, fulfillment progress, and remaining demand calculations
- **Warehouse Inventory** — Manage stock levels with categories, reorder alerts, and low-stock notifications
- **Dispatches** — Create and track supply dispatches with stock reservation, status workflow (Pending → In Transit → Delivered/Cancelled), and automatic fulfillment updates
- **Donations** — Record cash and in-kind donations with automatic inventory updates for in-kind contributions
- **Volunteers** — Register volunteers with skills, assign to camps, and track deployment status

### Dashboard & Analytics
- **KPI Cards** — Active camps, families sheltered, overall fulfillment %, low-stock items, deployed volunteers
- **Fulfillment by Category** — Bar chart showing fulfillment percentages across supply categories
- **Critical Gaps Table** — High-priority needs with <40% fulfillment, sorted by urgency
- **Recent Dispatches** — Latest dispatch activity with status tracking
- **Low Stock Alerts** — Items at or below reorder levels

### Authentication & Roles
- **Relief Coordinator (Admin)** — Full access to all features
- **Field Volunteer** — View-only access to camps, needs, inventory, dispatches, and volunteers
- **Demo Credentials** provided for immediate access

## 🛠 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| API Client | Axios |
| Icons | Lucide React |
| Charts | Recharts |
| Mock API | JSON Server |
| Development | Concurrently |

## 📋 Prerequisites

- Node.js 18+ 
- npm 9+

## 🔧 Installation

```bash
# Clone and navigate to project
cd Flood_Relief_Cordination

# Install dependencies
npm install

# Seed the database (optional - runs automatically on first API start)
npm run seed
```

## ▶️ Running the Application

### Option 1: Run Both Servers Together (Recommended)
```bash
npm run dev:all
```
This starts both the JSON Server API (port 3001) and Vite frontend (port 5173) concurrently.

### Option 2: Run Separately

**Terminal 1 - Mock API:**
```bash
npm run api
```
API runs at http://localhost:3001

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend runs at http://localhost:5173

## 🔐 Demo Credentials

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Relief Coordinator (Admin)** | admin@reliefhub.org | admin123 | Full access to all features |
| **Field Volunteer** | volunteer@reliefhub.org | volunteer123 | View-only: camps, needs, inventory, dispatches, volunteers |

## 📊 API Endpoints

All endpoints are served by JSON Server at `http://localhost:3001`

| Collection | Endpoints |
|------------|-----------|
| Camps | `GET/POST /camps`, `GET/PUT/PATCH/DELETE /camps/:id` |
| Inventory | `GET/POST /inventory`, `GET/PUT/PATCH/DELETE /inventory/:id` |
| Needs | `GET/POST /needs`, `GET/PUT/PATCH/DELETE /needs/:id` |
| Dispatches | `GET/POST /dispatches`, `GET/PUT/PATCH/DELETE /dispatches/:id` |
| Donations | `GET/POST /donations`, `GET/PUT/PATCH/DELETE /donations/:id` |
| Volunteers | `GET/POST /volunteers`, `GET/PUT/PATCH/DELETE /volunteers/:id` |

Query parameters supported: `?camp_id=`, `?status=`, `?priority=`, `?category=`, `?skill=`, `?type=`, `?search=`

## 🌱 Seed/Reset Database

```bash
# Re-seed with fresh data
npm run seed

# Reset to backup (if available)
npm run reset-db
```

The seed script creates a backup at `public/db/db.json.backup` before overwriting.

## 🏗 Project Structure

```
src/
├── api/                 # API service layers
│   ├── client.js        # Axios instance
│   ├── camps.api.js
│   ├── inventory.api.js
│   ├── needs.api.js
│   ├── dispatches.api.js
│   ├── donations.api.js
│   └── volunteers.api.js
├── components/
│   ├── layout/          # Sidebar, Header, Layout wrapper
│   ├── ui/              # Reusable UI components (Button, Modal, Table, etc.)
│   └── ...
├── context/
│   └── AuthContext.jsx  # Authentication & role management
├── pages/               # Page components
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Camps.jsx
│   ├── CampDetails.jsx
│   ├── Needs.jsx
│   ├── Inventory.jsx
│   ├── Dispatches.jsx
│   ├── Donations.jsx
│   └── Volunteers.jsx
├── services/
│   ├── dispatch.service.js  # Dispatch business logic
│   └── donations.service.js # Donation business logic
├── utils/
│   ├── calculations.js      # Business calculations
│   ├── validation.js        # Form validation
│   └── formatting.js        # Display formatting
├── App.jsx
└── main.jsx
```

## ⚙️ Business Rules

### Camp Status Logic
- **Active** → **Full** when `current_families >= capacity`
- **Full** → **Active** when `current_families < capacity` (only if not manually Closed)
- **Closed** camps are excluded from active counts and volunteer assignments

### Dispatch & Stock Reservation
1. **Creating a dispatch** reserves stock immediately (deducts from inventory)
2. **Pending/In Transit** dispatches consume reserved stock
3. **Delivered** dispatches increase need's `fulfilled_quantity` (no second stock deduction)
4. **Cancelled** dispatches restore quantity to inventory stock
5. **Delivered dispatches cannot be cancelled** — prevents double fulfillment reversal

### Fulfillment Calculations
- **Need fulfillment %** = `fulfilled_quantity / required_quantity × 100`
- **Remaining demand** = `required - fulfilled - (Pending + In Transit quantities)`
- **Available stock** = `inventory stock - (Pending + In Transit dispatch quantities for that item)`
- **Overall fulfillment** = `Σ fulfilled / Σ required × 100`
- **Critical gaps** = High-priority needs with fulfillment < 40%

### Donations
- **Cash**: Increases total cash tracking, no inventory impact
- **In-Kind**: Increases corresponding inventory stock exactly once

### Volunteers
- One active camp assignment per volunteer
- Cannot assign to Closed camps
- Unassigned volunteers shown as "Available"

## ⚠️ Known Limitations

1. **Mock API Concurrency** — JSON Server is single-threaded; concurrent requests may race. The dispatch service implements duplicate-action protection but true atomicity requires a real database.

2. **No Real Authentication** — Demo auth uses localStorage only. Not production-ready.

3. **No Multi-Record Transactions** — Stock reservation + dispatch creation + need update are sequential API calls. Failure mid-sequence could leave inconsistent state (mitigated by error handling).

4. **Client-Side Calculations** — Some dashboard metrics computed in-browser. For large datasets, move to backend aggregation.

5. **No Audit Trail** — Changes not logged. Add `created_by`/`updated_by` fields for production.

6. **Single User Session** — No concurrent user support in mock API.

## 📝 License

MIT License — Built for hackathon demonstration purposes.

## 🤝 Contributing

This is a hackathon project. For production use, consider:
- PostgreSQL/MySQL with proper transactions
- JWT-based authentication with role-based access control
- WebSocket integration for real-time updates
- Comprehensive test suite (unit + integration)
- CI/CD pipeline
- Accessibility audit (WCAG 2.1 AA)

---

**Built for Pandas-Bros Hackathon Team**  
*Flood Relief Coordination Dashboard — Sindh, Pakistan*