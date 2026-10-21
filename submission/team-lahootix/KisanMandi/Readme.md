# 🌾 KisanMandi — Sindh Mandi Crop Prices & Produce Marketplace
TEAM Member : Muhammad Mubasher Hussain 
KisanMandi is a mobile-first web application designed for agricultural communities in Sindh, Pakistan. It empowers smallholder farmers and agricultural buyers with real-time wholesale mandi benchmarks, 14-day price history trends, customizable price threshold alerts, interactive profit forecasting, and a direct produce marketplace.

---

## 🛠️ Tech Stack

- **Frontend Framework:** React 18 + Vite + TypeScript
- **Styling & Icons:** Tailwind CSS (mobile-first, customized agricultural palette), Lucide React
- **Client Routing:** React Router v6 (role-based route guards and tab layouts)
- **Data Fetching & Cache:** `@tanstack/react-query` v5 with optimistic queries and pull-to-refresh invalidation
- **Data Visualization:** Recharts (14-day trend line charts with min/max/average markers)
- **Forms & Validation:** `react-hook-form` + `zod` + `@hookform/resolvers`
- **Date Handling:** `date-fns` (ISO local date comparisons)
- **Mock REST API:** `json-server@0.17.4` serving 6 relational collections
- **Seed Generator:** Deterministic PRNG (`mulberry32`) generating 14 consecutive days of realistic price fluctuations
- **Test Runner:** Vitest (13 suites, 92 unit and integration tests)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Setup & Local Development

1. **Clone repository & install dependencies:**
   ```bash
   git clone <repo-url>
   cd KisanMandi
   npm install
   ```

2. **Environment Configuration:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *Default `.env`:*
   ```env
   VITE_API_URL=http://localhost:3001
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   This script executes `npm run seed` to generate `server/db.json` with fresh 14-day consecutive data ending today, and concurrently launches:
   - **Mock REST API:** `http://localhost:3001`
   - **Frontend App:** `http://localhost:5173`

   > **Note:** To start the servers without overwriting mutations in `server/db.json`, run `npm run dev:noseed`.

4. **Run Unit & Integration Tests:**
   ```bash
   npm test
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 📦 Mock API Collections & Seed Architecture

The application communicates exclusively via HTTP with the `json-server` mock backend. No domain data is bundled in the frontend.

| Collection | Seed Count | Description |
|---|---|---|
| `/crops` | **8** crops | Spanning 4 categories: Grains (Wheat, Rice IRRI-6), Cash Crops (Cotton Phutti), Vegetables (Onion, Tomato, Potato), Fruits (Sindhri Mango, Banana). |
| `/markets` | **3** mandis | Hyderabad Sabzi Mandi, Sukkur Wholesale Mandi, Mirpurkhas Fruit & Grain Mandi. |
| `/prices` | **336** records | 14 consecutive days $\times$ 8 crops $\times$ 3 markets. Daily bounded random walk ($\pm3\%$ per day, clamped to $\pm15\%$ of base price). |
| `/users` | **6** profiles | Fictional profiles (4 Farmers, 2 Buyers) with valid Pakistani phone numbers across Sindh districts. |
| `/listings` | **12** listings | Mix of active and sold produce listings with grades A/B/C and prices spanning Below, At, and Above market. |
| `/alerts` | **5** alerts | Farmer-configured price threshold alerts (`Above` and `Below`) with at least 2 pre-triggered alerts. |

---

## 🗺️ Feature-to-Milestone Map

| Milestone | Specification | Features Implemented |
|---|---|---|
| **M1: User Roles & Price Discovery** | SPEC §5 | • Onboarding profile setup (`Name`, `Phone`, `District`, `Role`).<br>• Role-based navigation: **Farmer** (Prices, Marketplace, Alerts, My Listings); **Buyer** (Prices, Marketplace).<br>• Wholesale price discovery: Mandi selector, search debounce, category chips, daily change ($\Delta \text{PKR}$ and $\%$ with $\blacktriangle/\blacktriangledown$), pull-to-refresh. |
| **M2: Trends & Market Comparison** | SPEC §6 | • 14-day Recharts line chart (`dd MMM` formatting, custom tooltip).<br>• Statistics cards: Minimum, Maximum, 14-day Average.<br>• Mandi comparison list sorted highest price first with **"🏆 Best place to sell today"** badge. |
| **M3: Price Alerts** | SPEC §7 | • Alert evaluation engine (`Above` triggers when $\text{price} \ge \text{target}$; `Below` triggers when $\text{price} \le \text{target}$).<br>• Triggered active alerts badge on Alerts tab updating live.<br>• Full CRUD: Create, Edit, Toggle pause/active, and Delete with ConfirmDialog. |
| **M4: Produce Listings & Marketplace** | SPEC §8 | • Listing form with validation ($>0$ qty, $>0$ price, future availability date, Pakistani mobile).<br>• Marketplace with multi-attribute filtering (Crop, District, Grade) and sorting (Newest, Price Ascending).<br>• Market position benchmark labels: **At market** ($\pm5\%$), **Below market** ($<-5\%$), **Above market** ($>+5\%$).<br>• Direct contact actions: `tel:<phone>` and formatted WhatsApp `wa.me/92XXXXXXXXXX`.<br>• Ownership safeguards: Non-owners cannot edit, mark sold, or delete listings. |
| **M5: Profit Calculator** | SPEC §9 | • Interactive calculator pre-filled via `?crop=&market=`.<br>• Real-time what-if price simulation slider ($-20\%$ to $+20\%$) and quick shortcut buttons.<br>• Live output cards: Expected Revenue, Production Cost, Net Profit/Loss, Margin $\%$.<br>• Scenario comparison table (Bear $-20\%$, Base $0\%$, Bull $+20\%$).<br>• Absolute zero/NaN protection on all calculations. |
| **M6: Architectural Compliance & QA** | SPEC §10, 11, 14 | • Exclusively HTTP REST data flow (zero hard-coded domain JSON in `src/`).<br>• `localStorage` restricted solely to `currentUserId`.<br>• Double-submit prevention on all forms.<br>• Responsive layout tested at 375px, 414px, and 1024px. |

---

## 📝 Key Architectural Decisions & Assumptions (from `NOTES.md`)

1. **Listings Sorting Helper (`created_at`):**
   - Produce listings include a UTC ISO timestamp (`created_at`) to enable sorting by "Newest" on the Marketplace.
2. **Standardized Measurement Unit:**
   - All wholesale mandi prices and produce asking prices are standardized in **PKR per 40 kg (1 maund)**. All quantities are represented in **maunds**.
3. **Deterministic Seed Generation:**
   - The PRNG (`mulberry32`) ensures repeatable test data across runs while guaranteeing consecutive dates up to the execution timestamp.
4. **Availability Date Validation on Edit:**
   - The "not in past" rule is enforced strictly for newly created listings and only when the availability date is changed during an edit. Editing other fields on an existing listing whose date has lapsed is not blocked.

---

## 🎬 3-Minute Demonstration Script (for Judges)

1. **First Launch & Role Onboarding:**
   - Open `http://localhost:5173`.
   - On the onboarding screen, click **"Continue as existing demo user"** and choose **Ali Raza Memon (Farmer, Hyderabad)**.
   - Note the 4 bottom/top tabs: *Prices*, *Marketplace*, *Alerts (with triggered badge)*, and *My Listings*.

2. **Price Discovery & Mandi Comparison:**
   - Switch between **Hyderabad**, **Sukkur**, and **Mirpurkhas** mandi chips.
   - Search for *"Onion"* and toggle the *"Vegetables"* category chip. Notice the live green $\blacktriangle$ and red $\blacktriangledown$ daily changes.
   - Tap **Onion** to view the **14-day Price Trend Chart**, stats row (Min, Max, Avg), and the **Mandi Price Comparison** highlighting the highest paying market with the **"🏆 Best place to sell today"** badge.

3. **Price Threshold Alerts:**
   - Tap the **Alerts** tab (notice the badge count).
   - Review triggered alerts highlighted at the top. Toggle an active alert to paused (note the toast notification).
   - Tap **+ Create Alert**, set a target price, and save.

4. **Produce Listings & Direct Contact:**
   - Tap **My Listings** and view active produce lots.
   - Tap **Marketplace** to view listings from other farmers. Observe the **Below market**, **At market**, and **Above market** labels.
   - Tap a listing to view **Listing Detail**: test the **Call** (`tel:`) and **WhatsApp** (`wa.me`) integration.

5. **Buyer Role Restriction:**
   - Click the user profile icon in the header and select **Switch User**.
   - Pick **Aslam Khan (Buyer, Karachi)**.
   - Notice that the navigation immediately switches to **only 2 tabs** (*Prices* and *Marketplace*).
   - Attempting to visit `/calculator` or `/alerts` immediately redirects the buyer back to `/prices`.

6. **Interactive Profit Calculator:**
   - Switch back to farmer Ali Raza Memon and navigate to **Profit Calculator** (from the Prices header or Crop Detail).
   - Enter Quantity = `100` maunds, Cost = `Rs 3,000` / maund.
   - Slide the What-If slider to `+20%` and `-20%`: watch Revenue, Expenses, Net Profit/Loss, and Margin $\%$ adjust live.
   - Review the **Market Scenario Comparison** table comparing Bear, Benchmark, and Bull cases.
