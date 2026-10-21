# KisanMandi — Crop Prices & Produce Marketplace
### Complete build brief for Google Antigravity (agent-first IDE)

> **How to use this file:** Open an empty folder in Antigravity, drop this file in as `SPEC.md`, and give the agent this prompt:
> *"Read SPEC.md fully. Follow the Build Plan phase by phase. After each phase, run the Verification checklist for that phase, fix anything failing, then continue. Do not skip milestones. Ask me nothing unless blocked; make sensible decisions and note them in NOTES.md."*

---

## 0. Role & Operating Rules for the Agent

You are a senior full-stack engineer in a **5 h 30 min hackathon**. Priorities in order:
1. **Every milestone rule is implemented exactly** (judges check rules, not polish).
2. **All data reads/writes go through the HTTP mock API** — no hard-coded data in the UI, no localStorage as a data source (localStorage is allowed ONLY to remember the current logged-in user id).
3. App must run with **two commands** (`npm run seed` / `npm run dev`) and be demo-ready.
4. Mobile-first UI (works at 360–430 px width), also usable on desktop.
5. Keep code simple, typed, and organised. No over-engineering.

Rules:
- Work in small phases; run the app and test after each.
- Keep a `NOTES.md` with assumptions made.
- Use **only fictional** names, phone numbers, and prices.
- Never put secrets in the repo. No auth backend is needed (role/profile is chosen at onboarding).

---

## 1. Product Summary

**Goal:** A mobile-first web app (PWA-style) for Sindh farmers to track wholesale crop prices, compare markets, set price alerts, estimate profit, and list produce for direct sale to buyers.

**Scenario:** Farmers negotiate without up-to-date mandi prices. KisanMandi gives price visibility and a simple farmer↔buyer connection.

**Roles**
| Role | Tabs |
|---|---|
| Farmer | **Prices**, **Marketplace**, **Alerts**, **My Listings** (+ Profit Calculator reachable from Prices/crop detail and a menu) |
| Buyer | **Prices**, **Marketplace** only |

---

## 2. Tech Stack (use exactly this unless blocked)

- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (mobile-first), lucide-react icons
- **Routing:** react-router-dom v6
- **Data fetching/cache:** @tanstack/react-query (refetch on pull-to-refresh)
- **Charts:** recharts (14-day line chart)
- **Forms/validation:** react-hook-form + zod
- **Dates:** date-fns
- **Mock API:** `json-server@0.17.4` (custom backend; REST on `http://localhost:3001`) with a **seed script** that generates `db.json`
- **Concurrency:** `concurrently` so `npm run dev` starts API + web
- Optional deploy: json-server on Render/Railway + frontend on Vercel/Netlify (set `VITE_API_URL`). Optionally import the same JSON into MockAPI.io.

> Why json-server: MockAPI.io free tier limits the number of resources/records; json-server supports all 6 collections, relational filters, sorting, and full CRUD with zero limits.

### Project structure
```
kisanmandi/
├─ SPEC.md
├─ NOTES.md
├─ package.json
├─ .env                     # VITE_API_URL=http://localhost:3001
├─ server/
│  ├─ seed.js               # generates db.json deterministically
│  └─ db.json               # generated
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ api/
│  │  ├─ client.ts          # fetch wrapper (base URL, JSON, error handling)
│  │  ├─ endpoints.ts       # users, crops, markets, prices, listings, alerts
│  │  └─ hooks.ts           # react-query hooks
│  ├─ types/index.ts
│  ├─ context/UserContext.tsx   # current user (id in localStorage only)
│  ├─ lib/
│  │  ├─ priceMath.ts       # latest/prev price, change, %, stats, market avg
│  │  ├─ alertEval.ts       # alert evaluation
│  │  ├─ marketLabel.ts     # Below/At/Above market
│  │  ├─ validators.ts      # zod schemas, phone helpers
│  │  └─ format.ts          # PKR formatting, dates
│  ├─ components/           # BottomTabs, PullToRefresh, PriceCard, Chip, EmptyState, Spinner, ErrorBanner, ConfirmDialog, Badge...
│  └─ pages/
│     ├─ Onboarding.tsx
│     ├─ Prices.tsx
│     ├─ CropDetail.tsx      # chart + stats + market comparison
│     ├─ Marketplace.tsx
│     ├─ ListingDetail.tsx
│     ├─ ListingForm.tsx     # create / edit
│     ├─ MyListings.tsx
│     ├─ Alerts.tsx
│     ├─ AlertForm.tsx
│     └─ ProfitCalculator.tsx
```

### package.json scripts
```json
{
  "scripts": {
    "seed": "node server/seed.js",
    "api": "json-server --watch server/db.json --port 3001 --host 0.0.0.0",
    "web": "vite --host",
    "dev": "npm run seed && concurrently -k \"npm:api\" \"npm:web\"",
    "build": "tsc && vite build"
  }
}
```
Note: `dev` re-seeds so “today” is always the latest of the 14 days. Provide also `dev:noseed` that skips seeding to preserve edits.

---

## 3. Data Model (Mock API Collections)

All IDs are **strings or numbers consistently** (use numbers, auto-increment by json-server). Foreign keys use `_id` suffix. Dates are ISO `YYYY-MM-DD`.

| Collection | Fields |
|---|---|
| `users` | `id, name, phone, district, role` (`"Farmer"` \| `"Buyer"`) |
| `crops` | `id, name, category` |
| `markets` | `id, name, district` |
| `prices` | `id, crop_id, market_id, date, price` (PKR per 40 kg unless crop unit differs — see Unit rule) |
| `listings` | `id, user_id, crop_id, quantity, asking_price, district, grade` (`A`\|`B`\|`C`), `available_from, status` (`"Active"`\|`"Sold"`), `created_at` |
| `alerts` | `id, user_id, crop_id, market_id, condition` (`"Above"`\|`"Below"`), `target_price, active_status` (boolean) |

> `created_at` on listings is an **extra helper field** (ISO datetime) needed for “sort newest”. Document in NOTES.md.

**Unit rule:** To keep it simple, ALL prices and asking prices are **PKR per 40 kg (1 maund)**, and quantity is in **maunds**. Show the unit label everywhere (`Rs 4,200 / maund`).

---

## 4. Seed Data (Milestone 6) — `server/seed.js`

Generate `server/db.json` with these exact counts. Use a **seeded pseudo-random generator** (e.g., mulberry32) so output is deterministic.

### Crops — 8 crops, 4 categories
| id | name | category | base price (PKR/maund) |
|---|---|---|---|
| 1 | Wheat | Grains | 4,000 |
| 2 | Rice (IRRI-6) | Grains | 5,200 |
| 3 | Cotton (Phutti) | Cash Crops | 8,300 |
| 4 | Onion | Vegetables | 3,000 |
| 5 | Tomato | Vegetables | 2,600 |
| 6 | Potato | Vegetables | 2,200 |
| 7 | Sindhri Mango | Fruits | 6,500 |
| 8 | Banana | Fruits | 3,800 |

### Markets — 3 markets in different districts
| id | name | district |
|---|---|---|
| 1 | Hyderabad Sabzi Mandi | Hyderabad |
| 2 | Sukkur Wholesale Mandi | Sukkur |
| 3 | Mirpurkhas Fruit & Grain Mandi | Mirpurkhas |

### Prices — 14 consecutive days × 8 crops × 3 markets = **336 records**
- Dates: the 14 days ending **today** (seed run date), consecutive with no gaps.
- For each crop–market pair: `market_factor` in 0.95–1.06 (different per market), then a random walk: daily change −3%…+3% around the base, clamped within ±15% of base. Round to nearest 10 PKR.
- **Guarantee variety:** ensure today’s price differs from yesterday’s for every pair (so change % is never 0 everywhere), with a mix of up and down moves, and that the best market for each crop varies across crops.
- Ensure at least **2 crops** have price today ≥ some seeded alert targets so triggered alerts are visible in the demo (see Alerts below).

### Users — 6 fictional users (mix of roles)
| id | name | phone | district | role |
|---|---|---|---|---|
| 1 | Ali Raza Memon | 03001230001 | Hyderabad | Farmer |
| 2 | Sanam Bheel | 03001230002 | Mirpurkhas | Farmer |
| 3 | Ghulam Hussain Soomro | 03001230003 | Sukkur | Farmer |
| 4 | Noor Fatima Shaikh | 03001230004 | Hyderabad | Buyer |
| 5 | Imran Chandio | 03001230005 | Larkana | Buyer |
| 6 | Zainab Khaskheli | 03001230006 | Jamshoro | Farmer |

(Phones are fictional placeholder numbers.)

### Listings — 12 (spread across ≥ 5 crops, grades A/B/C, ≥ 4 farmers, 10 Active + 2 Sold)
- Asking prices should be a **mix**: some ≥5% below market average, some within ±5%, some ≥5% above — so all three labels appear.
- `available_from` ≥ today (seed date) for Active ones; `created_at` spread across last 5 days.
- Districts should match the farmer’s district or a nearby Sindh district.

### Alerts — 5 (belong to farmers; mix of Above/Below; 4 active, 1 inactive)
- At least **2 are currently triggered** (given seeded prices) and at least 1 active-not-triggered, so the Alerts-tab badge shows a number on first load.
- Compute targets in seed script relative to today’s seeded price so that outcome is guaranteed.

---

## 5. Milestone 1 — User Roles & Price Discovery

### 5.1 Onboarding (first launch)
- If no `currentUserId` in localStorage (or user not found via `GET /users/:id`), show **Onboarding**.
- Fields (all required, validated with zod):
  - **Name** (2–60 chars)
  - **Phone** — Pakistani mobile: accepts `03XXXXXXXXX` or `+923XXXXXXXXX`; normalise and store as `03XXXXXXXXX`.
  - **District** — dropdown of Sindh districts: Hyderabad, Karachi, Sukkur, Larkana, Mirpurkhas, Jamshoro, Thatta, Badin, Nawabshah (Shaheed Benazirabad), Khairpur, Dadu, Ghotki, Umerkot, Tharparkar, Sanghar, Tando Allahyar, Tando Muhammad Khan, Matiari, Kashmore, Shikarpur, Jacobabad, Naushahro Feroze.
  - **Role** — segmented control: **Farmer / Buyer**.
- Submit → `POST /users`, store returned `id` in localStorage (`currentUserId`), go to Prices.
- Add a secondary link **“Continue as existing demo user”** that lists seeded users (`GET /users`) for quick demo switching. Add **Switch user / Log out** in a header menu (clears `currentUserId`).

### 5.2 Role-based navigation
- Bottom tab bar (mobile) / top or side bar (≥ md).
- **Farmer:** Prices, Marketplace, Alerts (with badge), My Listings.
- **Buyer:** Prices, Marketplace.
- Route guards: Buyer visiting `/alerts`, `/my-listings`, `/listings/new`, `/calculator` is redirected to `/prices`.

### 5.3 Prices screen
- **Market selector** (dropdown/chips from `GET /markets`), default first market (remember last choice in component state/URL param).
- **Search** box (filters by crop name, case-insensitive, debounced).
- **Category filter chips**: All + categories derived from `crops`.
- Each crop card shows: name, category chip, **today’s price** (latest date available for that market), and **daily change**:
  - `change = today − yesterday` (PKR, signed) and `pct = change / yesterday × 100` (1 decimal).
  - Green ▲ for positive, red ▼ for negative, grey “–” for zero.
- **Pull-to-refresh**: touch-based gesture (drag down at scroll top) that refetches `prices` (and alerts); also a visible **Refresh button** for desktop. Show spinner and “Updated hh:mm”.
- Tap a card → `/crops/:cropId?market=:marketId` (Milestone 2).
- Loading skeletons, empty state (“No crops match”), error banner with Retry.

**Efficient fetching:** `GET /prices?market_id=X&_sort=date&_order=desc` or fetch `GET /prices?date_gte=<today-1>` — do NOT fetch records one-by-one per crop. Group client-side.

**Definition of “today”:** the **latest date present** in `prices` for the selected market/crop (not the device clock) — so the app works even if seed was run yesterday.

**Deliverable:** Role-based navigation + live-from-API price listings.

---

## 6. Milestone 2 — Crop Trends & Market Comparison

**Crop detail page** `/crops/:cropId?market=:marketId`

1. Header: crop name, category, selected market (switchable), today’s price + change.
2. **14-day line chart** (recharts `LineChart`): x = date (`dd MMM`), y = price in PKR, tooltip with date + price, responsive width. Data from `GET /prices?crop_id=X&market_id=Y&_sort=date&_order=asc` (14 points).
3. **Stats row** over the 14-day period: **Minimum**, **Maximum**, **Average** (rounded to nearest PKR). Optionally mark min/max points on the chart.
4. **Market comparison list**: for this crop, latest price in **every** market, **sorted by best price (highest first** — farmers want to sell high), showing market name, district, price, and difference vs best. **Highlight the best place to sell today** with a “🏆 Best place to sell today” badge/green border on the top item.
5. Action buttons: **Set alert for this crop** (farmers only → prefilled AlertForm), **Calculate profit** (farmers only → prefilled calculator).

---

## 7. Milestone 3 — Price Alerts (Farmers only)

**Alerts tab**
- List the current farmer’s alerts: `GET /alerts?user_id=<me>`.
- Each alert row: crop, market, condition (Above/Below), target price, **latest price** now, status chip **Triggered** / **Waiting** / **Inactive**, **Active toggle** (`PATCH /alerts/:id {active_status}`), **Edit**, **Delete** (with confirm → `DELETE /alerts/:id`).
- **Create/Edit form**: crop (select), market (select), condition (segmented Above/Below), target price (number > 0), active toggle. Validated. `POST /alerts` / `PUT /alerts/:id`.
- **Evaluation rules** (`alertEval.ts`):
  - `latest price` = most recent price for that crop + market.
  - **Above** triggers when `latest ≥ target`.
  - **Below** triggers when `latest ≤ target`.
  - Only alerts with `active_status === true` can be triggered.
- **Re-evaluate on every refresh** (every time prices refetch — pull-to-refresh, tab focus, manual refresh, and initial load) and recompute the **triggered count**.
- **Badge** on the Alerts tab = number of triggered active alerts for the current user (hide badge if 0). The badge must update live after toggle/edit/delete/create.
- In-app only (no push needed). Optionally show a small toast “1 alert triggered” on refresh when the count increases.
- Triggered alerts are visually highlighted (amber/green card) and sorted to the top.

---

## 8. Milestone 4 — Produce Listings & Marketplace

### 8.1 Create / Edit listing form (Farmers only) — validation rules
| Field | Rule |
|---|---|
| Crop | required, from crops |
| Quantity | number **> 0** (maunds) |
| Asking price | number **> 0** (PKR per maund) |
| District | required, Sindh district list (default farmer’s district) |
| Grade | **A / B / C** segmented |
| Available from | date, **must not be in the past** (today or later) — use `min` attr + zod check |
| Contact phone | valid PK mobile (default from profile) |
- Show inline errors; disable submit while invalid/submitting. Create → `POST /listings` with `user_id = me`, `status = "Active"`, `created_at = now`. Edit → `PUT/PATCH /listings/:id`.
- When editing an existing listing, the “not in past” rule applies only if the date was changed (don’t block editing other fields of a listing whose original date is now past) — note this in NOTES.md.

### 8.2 Marketplace (all roles)
- Shows **Active** listings only (`GET /listings?status=Active`), joined client-side with crops and users (seller name).
- **Search** (crop name / seller name), **filters**: crop, district, grade (A/B/C). Filters are combinable. “Clear filters” button.
- **Sort**: **Newest** (by `created_at` desc) or **Price ascending** (`asking_price` asc).
- Listing card: crop, quantity, asking price, grade chip, district, available from, seller, and a **market-position label**.

### 8.3 Market-position label (Below / At / Above market)
- `marketAvg` = **average of the latest price of that crop across all markets**.
- `diffPct = (asking_price − marketAvg) / marketAvg × 100`.
- **At market** if `−5 ≤ diffPct ≤ +5` (inclusive); **Below market** if `diffPct < −5`; **Above market** if `diffPct > +5`.
- Colors: Below = green (good for buyer), At = blue/grey, Above = orange/red. Show the `%` too (e.g., “Above market +8.2%”).
- Unit-test `marketLabel.ts` for the boundary values (−5, +5, −5.01, +5.01).

### 8.4 Listing detail
- Full details, market avg for comparison, label, seller info.
- **Call** button → `tel:<phone>`.
- **WhatsApp** button → `https://wa.me/92XXXXXXXXXX?text=<prefilled message>` (convert `03XXXXXXXXX` → `92 3XXXXXXXXX`, no `+`/spaces). Prefilled message e.g. “Assalam o Alaikum, I saw your listing for {qty} maunds of {crop} on KisanMandi.”
- If the listing is Sold, show a “Sold” banner and disable contact actions.

### 8.5 My Listings (Farmers only) — ownership safeguards
- `GET /listings?user_id=<me>` — all statuses; tabs/filters: Active / Sold.
- Actions per listing: **Edit**, **Mark Sold** (`PATCH {status:"Sold"}`), **Delete** (confirm → `DELETE`).
- **Ownership safeguards (enforce in UI AND logic layer):**
  - Edit/Mark Sold/Delete controls render **only** when `listing.user_id === currentUser.id`.
  - Direct URL access to `/listings/:id/edit` for someone else’s listing → fetch it, detect mismatch, show “Not allowed” and redirect.
  - API helper functions for update/delete re-fetch the listing and refuse if `user_id !== currentUser.id` before sending the request.
  - Buyers never see these controls.

---

## 9. Milestone 5 — Profit Calculator (Farmers only)

`/calculator` (also `/calculator?crop=&market=`)
- Inputs: **Crop**, **Market** (selects), **Quantity** (maunds, > 0), **Cost of production per unit** (PKR/maund, ≥ 0).
- Selling price = latest price for chosen crop + market (shown, with change indicator).
- **What-if control:** slider from **−20% to +20%** (step 1, default 0) plus quick buttons (−20, −10, 0, +10, +20). `adjustedPrice = price × (1 + shift/100)`.
- Outputs (update live):
  - **Revenue** = `quantity × adjustedPrice`
  - **Total cost** = `quantity × costPerUnit`
  - **Profit / Loss** = `revenue − totalCost` (green when ≥ 0 labelled “Profit”, red labelled “Loss”)
  - **Margin %** = `profit / revenue × 100` (guard divide-by-zero; show “–” if revenue = 0)
- Show a small comparison table of the three what-if cases (−20 / 0 / +20) if time permits.
- Format as `Rs 1,25,000` or `Rs 125,000` consistently (pick one; en-PK locale).

---

## 10. Milestone 6 — Mock API Rules (Hard Requirements)

- The app **reads and writes exclusively via HTTP** to the mock API collections: `users, crops, markets, prices, listings, alerts`.
- No JSON imports of seed data inside the frontend. No localStorage for domain data (only `currentUserId`).
- API base URL from `import.meta.env.VITE_API_URL`.
- Central `client.ts` wrapper: JSON headers, error → typed `ApiError`, 8 s timeout, used by all hooks.
- All mutations use react-query `useMutation` and invalidate related queries (`listings`, `alerts`, `prices`).
- Useful json-server query patterns: `?crop_id=1&market_id=2&_sort=date&_order=asc`, `?status=Active`, `?user_id=3`, `?_embed`/`_expand` optional.
- Seed counts: **8 crops (4+ categories), 3 markets (different districts), 336 prices (14 days × 24 pairs), 6 users, 12 listings, 5 alerts.**

---

## 11. UX / UI Guidelines

- **Theme:** agricultural — primary green `#2E7D32`, accent amber `#F9A825`, soft background `#F6F8F4`, cards with rounded-2xl and subtle shadow. Support dark mode only if time remains.
- Large tap targets (≥ 44 px), readable fonts (Inter / system), sticky header with app name “🌾 KisanMandi” and user menu.
- States everywhere: **loading skeleton, empty, error + retry**.
- Toasts for success/failure of mutations.
- Confirm dialogs for destructive actions.
- Accessible: labels on inputs, aria-labels on icon buttons, sufficient contrast.
- Optional bilingual toggle (English / اردو) only if everything else is done — not required.

---

## 12. Build Plan for the Agent (follow in order)

**Phase 0 — Setup (≈15 min)**
- Scaffold Vite React-TS, install deps, configure Tailwind, router, react-query, scripts, `.env`.

**Phase 1 — Mock API & Seed (≈30 min)** *(do this early; everything depends on it)*
- Write `server/seed.js`, generate `db.json`, run json-server, verify counts with curl:
  `GET /crops` (8), `/markets` (3), `/prices` (336), `/users` (6), `/listings` (12), `/alerts` (5).
- Verify each crop–market pair has 14 consecutive dates.

**Phase 2 — Core app shell + Milestone 1 (≈45 min)**
- Types, API client, hooks, UserContext, Onboarding, role-based tabs/guards, Prices screen with search, category filter, change calc, pull-to-refresh.

**Phase 3 — Milestone 2 (≈40 min)**
- Crop detail, 14-day chart, min/max/avg, market comparison + best-place highlight.

**Phase 4 — Milestone 3 (≈40 min)**
- Alerts CRUD, toggle, evaluation, badge, re-evaluate on refresh.

**Phase 5 — Milestone 4 (≈60 min)**
- Listing form w/ validation, marketplace filters/sort, market label, detail with Call/WhatsApp, My Listings with ownership safeguards.

**Phase 6 — Milestone 5 (≈20 min)**
- Profit calculator with what-if slider.

**Phase 7 — Polish & QA (≈45 min)**
- Loading/empty/error states, toasts, responsive check, run full Verification checklist, fix bugs, write README with run instructions + screenshots.

**Phase 8 — Deploy (optional, ≈20 min)**
- Frontend to Vercel/Netlify, API to Render; set `VITE_API_URL`.

Reserve ≈ 15 min buffer at the end.

---

## 13. Verification Checklist (Acceptance Criteria)

### M1
- [ ] First launch shows onboarding collecting name, phone, district, role; validation works.
- [ ] Farmer sees 4 tabs (Prices, Marketplace, Alerts, My Listings); Buyer sees 2.
- [ ] Buyer cannot open farmer-only routes (redirects).
- [ ] Prices for selected market load from API; search + category filter work together.
- [ ] Daily change shows amount AND percentage, correct sign/colors.
- [ ] Pull-to-refresh refetches data.

### M2
- [ ] 14 data points in chart for selected crop+market.
- [ ] Min, max, avg correct (spot check manually).
- [ ] Market comparison sorted best price first; best market highlighted.

### M3
- [ ] Create/edit/delete alerts; active toggle persists via API.
- [ ] Above uses `≥`, Below uses `≤` (test equality case).
- [ ] Badge count equals triggered active alerts and updates on refresh.

### M4
- [ ] Form rejects quantity ≤ 0, price ≤ 0, past date, invalid phone, missing fields.
- [ ] Marketplace shows only Active; filters (crop, district, grade) + search combine; sort newest / price asc work.
- [ ] Below/At/Above label correct; exactly ±5% counts as At market.
- [ ] Call (`tel:`) and WhatsApp (`wa.me`) links correct.
- [ ] Only the owner sees Edit / Mark Sold / Delete; direct URL by non-owner blocked.

### M5
- [ ] Revenue, total cost, profit/loss, margin% correct; what-if ±20% shifts price.
- [ ] No NaN/Infinity for empty or zero inputs.

### M6
- [ ] All data via HTTP to the 6 collections; seed counts exact; 14 consecutive days for every crop–market pair; fictional data only.
- [ ] Fresh clone: `npm install && npm run dev` works end-to-end.

---

## 14. Edge Cases to Handle

- Market has no price for a crop yet → show “No data”, exclude from comparison.
- Only one day of price data → change shown as “–”.
- Yesterday price = 0 → avoid divide-by-zero in %.
- API down → friendly error + Retry; mutations show failure toast and don’t corrupt UI state.
- Deleting an alert/listing while viewing it → navigate back safely.
- Duplicate form submissions prevented (disable button while pending).
- Phone normalisation consistent between storage, tel:, and wa.me.
- Time zones: treat dates as local `YYYY-MM-DD` strings; compare strings, not Date objects, for “not in past”.

---

## 15. Utilities to Implement (with unit tests via Vitest)

```ts
// priceMath.ts
getLatestPrice(prices, cropId, marketId): Price | undefined
getDailyChange(prices, cropId, marketId): { amount: number; pct: number } | null
getStats(series: number[]): { min: number; max: number; avg: number }
getMarketAverage(prices, cropId): number        // avg of latest price across markets

// alertEval.ts
isTriggered(alert, latestPrice): boolean        // active && (Above ? latest >= target : latest <= target)

// marketLabel.ts
getMarketLabel(asking, marketAvg): { label: 'Below'|'At'|'Above'; pct: number }

// validators.ts
normalizePhone(input): string | null            // -> 03XXXXXXXXX
toWhatsAppNumber(phone): string                 // -> 923XXXXXXXXX
isDateNotPast(iso: string): boolean
```
Write quick Vitest tests for these (boundaries: ±5%, equality in alerts, zero divisions).

---

## 16. Demo Script (for judges, ~3 minutes)

1. Open app → onboard as **Farmer** (or pick seeded Ali Raza Memon).
2. **Prices:** switch market, search “Onion”, filter “Vegetables”, show ▲/▼ changes, pull-to-refresh.
3. Tap a crop → **14-day chart**, min/max/avg, **best market to sell today**.
4. **Alerts:** show triggered badge, create a new alert, toggle, delete.
5. **My Listings:** create a listing (show validation errors first), mark one Sold.
6. Switch to **Buyer** → Marketplace filters/sort, **Below/At/Above market** labels, tap **Call / WhatsApp**.
7. Back to Farmer → **Profit Calculator**, move what-if slider to −20% / +20%.
8. Show Network tab / API: all data coming from the mock API.

---

## 17. Deliverables

- Working app connected to the seeded mock API (local and/or deployed URLs).
- `README.md` with: setup (`npm install`, `npm run dev`), env vars, API collections, seed description, assumptions (`NOTES.md`), feature-to-milestone map.
- Clean, runnable repo with no console errors on main flows.

---

## 18. Ready-to-Paste Kickoff Prompt (for Antigravity Agent Manager)

```
You are building "KisanMandi" exactly as specified in SPEC.md. Read the entire file first.
Use React + Vite + TypeScript + Tailwind + react-router + @tanstack/react-query + recharts +
react-hook-form + zod + date-fns, and json-server@0.17.4 as the HTTP mock API with a
deterministic seed script (server/seed.js).

Execute the Build Plan phases in order. After each phase:
1) run the app, 2) walk through that phase's Verification checklist in a browser,
3) fix failures, 4) record assumptions in NOTES.md.

Hard rules: all data via HTTP to users/crops/markets/prices/listings/alerts; seed counts exactly
8 crops (4+ categories), 3 markets in different districts, 14 consecutive days of prices for every
crop–market pair, 6 users, 12 listings, 5 alerts; fictional data only; role-based tabs
(Farmer: Prices, Marketplace, Alerts, My Listings; Buyer: Prices, Marketplace); alert rules
Above >= target / Below <= target; market label At within ±5%; ownership safeguards on listings.
Finish with README.md and a final end-to-end browser test using the Demo Script in SPEC.md.
```
