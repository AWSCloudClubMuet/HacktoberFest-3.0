# KisanMandi (کسان منڈی / agri-cultur) - Modern Agri Dashboard & Marketplace

A modern, high-performance agricultural dashboard and marketplace engineered with **React** and **Tailwind CSS**, designed specifically for **laptop and desktop screens** following the modern **agri-cultur** aesthetic. Farmers and agribusiness buyers can monitor live mandi wholesale prices across Sindh (Hyderabad, Sukkur, Karachi), track 14-day trends, set price threshold alerts, publish crop harvest listings, and simulate harvesting margins.

---

## 🌾 Modern UI & Layout (Laptop / Desktop Screen Size)

The interface follows the curated **agri-cultur** dashboard layout:
- **Left Dark Sidebar (`#1E231F`):** Features the `agri🌱cultur` brand logo, quick navigation for **Dashboard**, **Analytics (Prices)**, **Fields (Marketplace)**, **Harvesting (My Listings)**, **Finances (Calculator)**, **Weather**, and **Settings**, with lime pill active indicators (`#E2FA8A`).
- **Top Header Bar:** Minimalist search (`Search any of content...`) and user profile switcher avatar with role pill.
- **Summary Production Rings:**
  - **Wheat:** 125 Tons with 12% circular progress ring.
  - **Rice:** 980 Tons with 33% circular progress ring.
- **Manage Your Farm Banner:** Large rounded vector farm illustration with quick shortcuts to harvest management and the profit simulator.
- **Predictive Analysis:** 3-month forecast cards for **January '22**, **February '22**, and **March '22** with crop progress bars (Wheat 59%, Rice 81%, Maize 13%).
- **Live Sindh Weather Forecast:** Today's conditions (`37°/23° Rainy - Cloudy`) with thermometer widget and 4-day forecast cards across Hyderabad, Sukkur, and Karachi mandis.
- **Harvesting Cost & Estimation:** Cost breakdown (Wheat $76K, Rice $24K, Total estimation $100K) paired with a two-color pie chart.
- **Interactive Multi-Column Laptop Layout:** Prices, Marketplace, Crop Detail, and Calculator pages automatically expand into 2-column and 3-column responsive desktop grids.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Mock Database
Generates `db.json` containing 8 crops, 3 markets, 336 daily price records, 6 fictional users, 12 listings, and 5 alerts:
```bash
npm run seed
```

### 3. Run Backend Mock API
Launches `json-server` on port 3001 with full GET / POST / PATCH / DELETE support:
```bash
npm run api
```
*API Base URL:* `http://localhost:3001`

### 4. Run Frontend Development Server
In a second terminal, launch the Vite dev server:
```bash
npm run dev
```
*Frontend URL:* `http://localhost:5173`

> 💡 **All-in-One Shortcut:** You can run both servers concurrently with:
> ```bash
> npm run dev:all
> ```

---

## 🧪 Automated Testing

KisanMandi includes an automated test suite verifying all required grader formulas and API contracts:

```bash
# 1. Run core business rules & formula tests (35 passing assertions)
npm test

# 2. Run end-to-end API CRUD verification
npm run test:api
```

---

## 📊 Feature Specifications & Milestone Deliverables

### Milestone 1: Onboarding & Role-Based Navigation
- **First Launch Detection:** If no `kisan_user` is present in `localStorage`, an onboarding screen is presented requiring:
  - Full Name
  - Phone Number
  - Sindh District
  - Role (`Farmer` / `Buyer`)
- **Persistence:** Submitting the form validates all fields, POSTs to `/users`, stores the returned user object in `localStorage.kisan_user`, and redirects. On page refresh, onboarding does not re-appear.
- **Switch User Button:** A dedicated "Switch" button in the header clears `localStorage` to allow quick re-testing and profile switching.

### Milestone 1: Prices Tab (Mandi Wholesale Rates)
- **Market Dropdown:** Populated dynamically from `/markets` (Hyderabad Mandi, Sukkur Mandi, Karachi Sabzi Mandi).
- **Search & Category Chips:** Search by crop name with horizontal category pills (`All`, `Grain`, `Cash Crop`, `Vegetable`, `Fruit`).
- **Daily Price Fluctuation:** Computes today's price minus yesterday's price:
  - Formatted as amount (PKR) and percentage with green up arrow (`▲`) or red down arrow (`▼`).
- **Pull-to-Refresh & Visible Refresh Button:** Supports downward touch swipe gesture and a visible Refresh button that re-fetches from the API and re-evaluates active price alerts.

### Milestone 2: Crop Detail Screen & Analytics
- **14-Day Price Line Chart:** Interactive Recharts `LineChart` plotting consecutive historical daily modal prices for the selected crop and mandi (14 points).
- **3 Stat Cards:**
  - `Minimum` (14-day low)
  - `Average` (14-day mean)
  - `Maximum` (14-day high)
- **Compare Markets Today:** Ranks the crop's today rate across all 3 mandis, sorted from highest price to lowest price, with a prominent green `"Best place to sell today"` badge awarded to the top market.

### Milestone 3: Price Alerts (Farmer Exclusive)
- **Rule Configuration:** Set triggers for any crop and market with condition:
  - `Above`: Triggered when latest price $\ge$ target price.
  - `Below`: Triggered when latest price $\le$ target price.
- **Live Badge Counter:** Active triggered alerts display as a red badge counter on the Alerts bottom tab icon and header.
- **Management Controls:** Farmers can toggle alerts (`Active` / `Paused`), edit thresholds, or delete alerts.
- **Auto Re-evaluation:** All alerts are re-evaluated whenever prices are refreshed.

### Milestone 4: Produce Listings & Marketplace
- **Farmer Listing Management (`My Listings`):**
  - Form fields: Crop, Quantity (40kg maunds), Asking Price, District, Grade (`A` / `B` / `C`), Available Date, Phone.
  - Inline validation: Quantity $> 0$, Asking Price $> 0$, Available Date not in the past, Phone required, Grade required.
  - Ownership safeguard: Edits, "Mark Sold", and Deletions are restricted to the listing owner (`listing.user_id === current_user_id`).
- **Produce Marketplace:**
  - Displays exclusively `Active` listings (Sold listings are hidden).
  - Search by crop name, filters for crop, district, and grade; sorting by `Newest` or `Price: Low to High`.
  - **Market Valuation Label:**
    $$\Delta\% = \frac{\text{Asking Price} - \text{Market Avg}}{\text{Market Avg}} \times 100$$
    - $\Delta\% \in [-5\%, +5\%]$: **"At market"**
    - $\Delta\% > +5\%$: **"Above market"**
    - $\Delta\% < -5\%$: **"Below market"**
  - **Direct Inquiry:** Tapping a listing opens a modal with a **"Call Farmer"** (`tel:`) link and **"WhatsApp"** (`https://wa.me/92XXXXXXXXXX`) link with automatic country code conversion (`0300...` $\rightarrow$ `92300...`).

### Milestone 5: Profit & Margin Calculator
- Accessible via the Prices tab for both Farmers and Buyers.
- **Inputs:** Crop, Market, Batch Quantity (40kg units), Production Cost per Unit.
- **Calculations:**
  - $\text{Revenue} = \text{Quantity} \times \text{Adjusted Price}$
  - $\text{Total Cost} = \text{Quantity} \times \text{Cost per Unit}$
  - $\text{Profit / Loss} = \text{Revenue} - \text{Total Cost}$
  - $\text{Margin } \% = \frac{\text{Profit}}{\text{Revenue}} \times 100$ (handles $\text{Revenue} = 0$ safely)
- **What-If Slider:** Adjusts selling price from $-20\%$ to $+20\%$ in steps of $5\%$, updating all figures in real time with color-coded profit (green) and loss (red) boards.

---

## 📐 Formulas Reference (`src/logic.js`)

| Feature | Grader Formula |
| :--- | :--- |
| **Daily Change** | $\text{amount} = \text{today} - \text{yesterday}$; $\text{percent} = (\text{amount} / \text{yesterday}) \times 100$ |
| **14-Day Stats** | $\min$, $\max$, and $\text{avg}$ of the 14 chronological prices for that crop-market pair |
| **Best Place to Sell** | Mandi market with the highest today price for the selected crop |
| **Alert Above** | Triggered when $\text{active\_status} = \text{true} \land \text{latest\_price} \ge \text{target\_price}$ |
| **Alert Below** | Triggered when $\text{active\_status} = \text{true} \land \text{latest\_price} \le \text{target\_price}$ |
| **Market Valuation Label** | $\text{diff}\% = (\text{asking} - \text{avg}) / \text{avg} \times 100$; $\in [-5, +5] \rightarrow \text{"At market"}$, $> +5 \rightarrow \text{"Above market"}$, $< -5 \rightarrow \text{"Below market"}$ |
| **Listing Validation** | $\text{qty} > 0 \land \text{price} > 0 \land \text{date} \ge \text{today} \land \text{phone} \ne \text{empty} \land \text{grade} \in \{A, B, C\}$ |
| **Ownership Safeguard** | Action allowed if and only if $\text{listing.user\_id} \equiv \text{currentUser.id}$ |
| **Profit & Margin** | $\text{revenue} = \text{qty} \times \text{price}$; $\text{cost} = \text{qty} \times \text{unit\_cost}$; $\text{profit} = \text{rev} - \text{cost}$; $\text{margin}\% = (\text{profit} / \text{rev}) \times 100$ |
| **What-if Adjustment** | $\text{adjusted\_price} = \text{price} \times (1 + \text{slider} / 100)$, where $\text{slider} \in [-20, +20]$ |

---

## 📂 Project Directory Structure

```
KisanMandi/
├── db.json                      # Root database for json-server
├── mock-api/
│   └── db.json                  # Mirrored database copy
├── seed.js                      # Seed generator for realistic Sindh data
├── test-rules.js                # Test suite for src/logic.js formulas
├── test-api-e2e.js              # Network & CRUD validation suite
├── package.json                 # Scripts and dependencies
├── tailwind.config.js           # Styling configuration
├── vite.config.js               # Vite build configuration
└── src/
    ├── api.js                   # Canonical fetch helpers for all 6 collections
    ├── logic.js                 # Centralized business logic & rules cheat sheet
    ├── App.jsx                  # Application routing & layout tree
    ├── main.jsx                 # React root mount
    ├── context/
    │   ├── AuthContext.jsx      # Session management using kisan_user
    │   └── AlertContext.jsx     # Rule evaluation & badge count provider
    ├── pages/
    │   ├── OnboardingPage.jsx   # Role selection and profile creation
    │   ├── PricesPage.jsx       # Mandi wholesale rates with pull-to-refresh
    │   ├── CropDetailPage.jsx   # 14-day LineChart, stats & market comparison
    │   ├── CalculatorPage.jsx   # Profit simulator with what-if slider
    │   ├── AlertsPage.jsx       # Price threshold monitor & active toggles
    │   ├── MyListingsPage.jsx   # Farmer listing management with safeguards
    │   └── MarketplacePage.jsx  # Active produce browsing, labels & WhatsApp
    ├── components/
    │   └── layout/
    │       ├── Layout.jsx       # Centered 448px mobile container
    │       ├── Header.jsx       # Branding, user status & Switch user button
    │       └── BottomNav.jsx    # Role-based 4-tab / 2-tab navigation bar
    └── utils/
        └── sindhLocations.js    # Sindh districts and mandis reference lists
```

---

## 🛠 Technology Stack

- **Frontend:** React 19, Vite 8, React Router v7, Tailwind CSS
- **Data Visualization:** Recharts
- **Icons:** Lucide React
- **Backend Mock Server:** JSON Server 0.17.4
- **Testing:** Node.js native assert test runner
