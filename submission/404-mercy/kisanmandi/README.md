# KisanMandi: Crop Prices & Produce Marketplace
**Team 404 MERCY | Hackathon Project**

> A responsive, mobile-first web application for farmers in Sindh, Pakistan to discover sample wholesale crop prices, compare markets, set price alerts, calculate potential profits, and list produce for wholesale buyers.

> ⚠️ **Notice**: Fictional sample data — not live mandi prices.

---

## 🌾 Overview & Features

### 1. Onboarding & Demo Role Switcher
- Fast onboarding form validating Name, Pakistani Mobile (`03XXXXXXXXX`), District, and Role (**Farmer** or **Buyer**).
- Creates user record directly in the HTTP API (`POST /users`).
- Session user is retained in React state (no fake credentials or client-only mock storage).
- Interactive **Demo User Switcher** modal backed by API user records to seamlessly demonstrate both Farmer and Buyer experiences.

### 2. Crop Prices & Daily Changes
- Filter prices by **Market** (Hyderabad, Sukkur, Larkana) and **Category** (Grains, Cash Crops, Vegetables, Fruits).
- Live crop search input.
- Computes daily change amount (`₨`) and percentage change (`%`) between today and yesterday.
- Handles edge cases: missing previous day prices, zero prices (displayed as "Percentage unavailable").
- Visual indicators: ▲ green for price increase, ▼ red for decrease, `=` gray for unchanged.
- **Refresh button** performs live API fetches and automatically triggers active alert re-evaluations.

### 3. Price Trends & Market Comparison (14 Days)
- Chronological 14-day interactive line chart rendered via **Recharts**.
- Summary statistics calculated strictly from the selected crop & market history: **Min Price**, **Arithmetic Average**, and **Max Price**.
- **Market Comparison Table**: compares the latest price of the selected crop across all 3 markets, sorted from highest to lowest, with the highest-priced market highlighted.
- Explicit notice displayed when record dates vary across markets.

### 4. Marketplace & Listing Management
- Active produce feed dynamically loaded from `GET /listings?status=active`.
- Filter listings by Crop, District, and Grade (Grade A, B, C).
- Sort listings by **Newest First** or **Asking Price (Ascending)**.
- Direct contact actions:
  - 📞 **Call**: `tel:+92...`
  - 💬 **WhatsApp**: `https://wa.me/92...` (normalized to international format).
- **Dynamic Price Classification Labels**:
  - Compares asking price against average market price across all markets for that crop.
  - `Below Market`: `< -5%` (Green)
  - `At Market`: `-5%` to `+5%` inclusive (Amber)
  - `Above Market`: `> +5%` (Red)
  - Boundary conditions (`-5.0%` and `+5.0%`) handled accurately.
- **Farmer Listing CRUD**:
  - Create listings with Quantity (> 0), Asking Price (> 0), District, Grade, Available-from Date (today or future), Contact Phone.
  - Edit listings with ownership validation.
  - Mark listings as **Sold** (immediately removes them from the active marketplace feed).
  - Delete listings.
  - Role-based authorization: Buyers cannot create, edit, sell, or delete listings. Re-checked against API before mutations.

### 5. Price Alerts
- Farmers can create alerts for any Crop + Market combination with **Above** (`>= targetPrice`) or **Below** (`<= targetPrice`) conditions and positive target price.
- Live toggle switches to activate / deactivate alerts. Inactive alerts never trigger.
- Alerts are automatically re-evaluated whenever prices refresh.
- Triggered states persist to `db.json` via HTTP `PATCH /alerts/{id}`.
- Alerts tab badge displays the live count of active triggered alerts without double-counting on repeated refreshes.

### 6. Interactive Profit Calculator
- Select Crop and Market to dynamically pull the latest mandi rate.
- Input Quantity (> 0) and Cost of Production per unit (≥ 0).
- **Interactive Price Adjustment Slider** (`-20%` to `+20%`, defaulting to `0%`):
  - Recalculates selling price, revenue, total cost, net profit/loss, and profit margin live as the slider moves.
- Profit margin defined strictly as `(Profit ÷ Revenue) * 100`.
- Safe division handling: if revenue is zero, margin is displayed as "Unavailable".
- Clear color coding and typography distinguishing profit (green) from projected loss (red).

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, Vite, Recharts, Plain CSS with mobile-first media queries.
- **Backend / Mock API**: JSON Server (`db.json`) running on port `3001`.
- **API Communication**: Native browser `fetch()` centralized in `src/services/api.js`.
- **Seed Data Generator**: Deterministic Node.js script (`seed.js`).

---

## 📁 Project Structure

```
kisanmandi/
├── .env                  # Local environment configuration (VITE_API_URL)
├── .env.example          # Template environment file
├── .gitignore            # Git ignore including node_modules, dist, .env
├── db.json               # Persistent JSON Server database (6 collections)
├── index.html            # Application HTML shell
├── package.json          # Dependencies and run scripts
├── seed.js               # Deterministic seed data generator (370 records)
├── verify.js             # Automated 41-check end-to-end verification script
├── vite.config.js        # Vite build configuration (output: dist)
└── src/
    ├── main.jsx          # React DOM entrypoint
    ├── App.jsx           # Root component (onboarding & session routing)
    ├── index.css         # Complete clean agricultural UI design system
    ├── services/
    │   ├── api.js        # Centralized HTTP API client
    │   └── alertService.js # Alert evaluation & persistence logic
    └── components/
        ├── Onboarding.jsx        # First-launch farmer/buyer registration
        ├── AppShell.jsx          # Top bar, demo user switcher, bottom tabs
        ├── PricesScreen.jsx      # Daily price table, search, category filters
        ├── TrendsPanel.jsx       # 14-day Recharts chart, stats, market comparison
        ├── MarketplaceScreen.jsx # Active listings feed, filters, sorting, actions
        ├── AlertsScreen.jsx      # Price alert rules, toggle active, trigger indicators
        ├── MyListingsScreen.jsx  # Farmer produce manager (active vs sold)
        └── ProfitCalculator.jsx  # Production cost & what-if profit calculator
```

---

## 🚀 Quickstart & Commands

### 1. Installation
```bash
npm install
```

### 2. Seed the Database
```bash
npm run seed
```
> Populates `db.json` with 6 users, 8 crops (across 4 categories), 3 markets, 336 prices (14 consecutive days for each crop-market pair), 12 listings, and 5 alerts (total: 370 records).

### 3. Start the Mock API Server
```bash
npm run api
```
> Runs JSON Server on `http://localhost:3001` watching `db.json`.

### 4. Start the Frontend Dev Server
```bash
npm run dev
```
> Runs Vite dev server on `http://localhost:5173`.

### 5. Run Production Build
```bash
npm run build
```
> Compiles static assets into `./dist`.

### 6. Run Verification Suite
```bash
node verify.js
```
> Runs 41 automated checks verifying API endpoints, seed counts, 14-day history, CRUD persistence, ownership checks, boundary logic, and calculations.

---

## 🌐 Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:3001` | Base URL for the JSON Server HTTP API |

For production deployments, set `VITE_API_URL` to your hosted JSON Server API endpoint.

---

## 🧪 Verification Results

Automated verification suite run on `2026-10-21`:
- **41/41 checks passed (100%)**
- Database collections: `users` (6), `crops` (8), `markets` (3), `prices` (336), `listings` (12), `alerts` (5)
- Date coverage: 14 consecutive calendar days for all 24 crop-market pairs
- Boundary price labels: `-5.0%` (At Market), `+5.0%` (At Market), `-5.1%` (Below Market), `+5.1%` (Above Market)
- Ownership checks: Validated and enforced before mutations

---

## 🚢 Deployment Guide

### Frontend Deployment (Netlify / Vercel)
1. Push this repository to GitHub.
2. In Netlify / Vercel, set build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: URL of your deployed JSON Server API.

### API Deployment (Render / Railway / Fly.io)
1. Deploy `db.json` and `package.json` to a Node-compatible hosting provider.
2. Start command: `node node_modules/json-server/lib/bin.js --watch db.json --port $PORT`
3. **Limitation Notice**: JSON Server is a mock HTTP server intended for prototypes and hackathons. On serverless or ephemeral container hosts (like free Render or Heroku without persistent disks), writes to `db.json` will reset upon container restart. For production applications, replace JSON Server with PostgreSQL or MongoDB.
