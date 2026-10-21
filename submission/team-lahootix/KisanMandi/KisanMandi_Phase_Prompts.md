# KisanMandi — Phase-by-Phase Prompts for Antigravity

**Setup once:** Put `SPEC.md` (the full spec) in the project root. Open the folder in Antigravity. Paste prompts **one at a time, in order**. Wait until the agent finishes, test in the browser, then move on. Each prompt is self-contained and refers to `SPEC.md` for details.

**Tips**
- Use one agent conversation per phase (or one for the whole project). If the agent loses context, paste the *Context Reset Prompt* at the end.
- Don't paste the next phase until the current phase's "Done when" list passes.
- If something breaks, use the *Bug-Fix Prompt* at the end.

**Suggested time budget (5h30m):** P0 15m · P1 30m · P2 45m · P3 35m · P4 35m · P5 40m · P6 35m · P7 20m · P8 40m · P9 20m (optional) · buffer 15m

---

## PHASE 0 — Project Setup

```
Read SPEC.md completely before doing anything.

PHASE 0: Project setup only. Do NOT build features yet.

Tasks:
1. Scaffold a Vite + React 18 + TypeScript app in the current folder.
2. Install: tailwindcss (+ postcss, autoprefixer) and configure it; react-router-dom@6; @tanstack/react-query; recharts; react-hook-form; zod; @hookform/resolvers; date-fns; lucide-react; json-server@0.17.4; concurrently; vitest.
3. Create the folder structure from SPEC.md section 2 (server/, src/api, src/types, src/context, src/lib, src/components, src/pages) with empty/placeholder files where needed.
4. Add package.json scripts exactly as in SPEC.md ("seed", "api", "web", "dev", "dev:noseed", "build", "test").
5. Create .env with VITE_API_URL=http://localhost:3001 and .env.example.
6. Configure Tailwind theme with primary green #2E7D32, accent amber #F9A825, background #F6F8F4, font Inter/system.
7. Set up App.tsx with BrowserRouter, QueryClientProvider, and a placeholder route per page listed in the SPEC (Onboarding, Prices, CropDetail, Marketplace, ListingDetail, ListingForm, MyListings, Alerts, AlertForm, ProfitCalculator).
8. Create NOTES.md (empty with a heading "Assumptions") and .gitignore.

Done when: `npm run web` starts with no errors and shows a placeholder page; Tailwind classes work; `npm run build` passes.
Stop after this phase and summarize what you created.
```

---

## PHASE 1 — Mock API & Seed Data (Milestone 6)

```
Continue from the existing project. Re-read SPEC.md sections 3, 4 and 10.

PHASE 1: Build the mock API and seed data. No UI work in this phase.

Write server/seed.js (Node, ES modules or CommonJS — match package.json) that generates server/db.json deterministically (use a seeded PRNG such as mulberry32) with EXACTLY:
- crops: 8 crops across 4 categories (Grains, Cash Crops, Vegetables, Fruits) using the crop list and base prices in SPEC.md section 4.
- markets: 3 markets in different districts (Hyderabad, Sukkur, Mirpurkhas).
- prices: 14 CONSECUTIVE days ending today (seed run date) for EVERY crop–market pair = 336 records. Fields: id, crop_id, market_id, date (YYYY-MM-DD), price. Use a market factor (0.95–1.06) and a bounded random walk (daily −3%..+3%, clamped to ±15% of base), rounded to nearest 10. Guarantee today's price != yesterday's for every pair, mixed ups and downs, and that the best market differs across crops.
- users: 6 fictional users (3-4 farmers, 2 buyers) with the names/phones/districts from SPEC.md.
- listings: 12 (10 Active, 2 Sold), at least 5 different crops, grades A/B/C mixed, at least 4 different farmers, available_from >= today for Active ones, created_at spread over the last 5 days, and asking prices deliberately mixed so that Below (< -5%), At (within ±5%) and Above (> +5%) market all appear (compute from the seeded average of today's prices across markets).
- alerts: 5 belonging to farmers, mix of Above/Below, 4 active and 1 inactive, with targets computed relative to today's seeded price so that at least 2 active alerts are currently triggered and at least 1 active alert is not triggered.

Then:
1. Add a json-server config (CORS enabled by default; run on port 3001, host 0.0.0.0).
2. Run `npm run seed` and `npm run api`.
3. Verify with curl and report the output counts: /crops=8, /markets=3, /prices=336, /users=6, /listings=12, /alerts=5.
4. Write a small verification script (server/verify.js) that checks: every crop–market pair has exactly 14 consecutive dates; counts are right; no duplicate ids; at least 2 triggered alerts. Run it and show the result.
5. Document in NOTES.md that listings have an extra `created_at` field and that all prices are PKR per maund (40 kg).

Done when: verify.js passes and curl shows the correct counts. Stop and summarize.
```

---

## PHASE 2 — API Layer, User Context, Onboarding, Role-based Navigation

```
Continue. Re-read SPEC.md sections 2, 3, 5.1, 5.2 and 10.

PHASE 2: Build the data layer and app shell. (Prices screen comes in the next phase.)

Tasks:
1. src/types/index.ts: TypeScript types for User, Crop, Market, Price, Listing, Alert exactly matching the data model (role "Farmer"|"Buyer", grade "A"|"B"|"C", status "Active"|"Sold", condition "Above"|"Below").
2. src/api/client.ts: fetch wrapper using import.meta.env.VITE_API_URL, JSON headers, 8s timeout via AbortController, throws a typed ApiError with status/message.
3. src/api/endpoints.ts: functions for all 6 collections (get/list/create/update(PATCH)/delete) using json-server query params.
4. src/api/hooks.ts: react-query hooks (useCrops, useMarkets, usePrices, useListings, useAlerts, useUsers, plus mutation hooks that invalidate the right query keys).
5. src/context/UserContext.tsx: stores ONLY currentUserId in localStorage; loads the user via GET /users/:id; exposes currentUser, login(id), logout(), isFarmer, isBuyer, loading.
6. src/lib/validators.ts: zod schemas + helpers: normalizePhone (accepts 03XXXXXXXXX or +923XXXXXXXXX, returns 03XXXXXXXXX or null), toWhatsAppNumber, isDateNotPast (compare YYYY-MM-DD strings), SINDH_DISTRICTS list from SPEC.md. Add Vitest tests for them.
7. src/pages/Onboarding.tsx: form with name (2–60), phone (validated), district (dropdown), role (Farmer/Buyer segmented). On submit POST /users, store id, redirect to /prices. Add "Continue as existing demo user" that lists GET /users and logs in as the chosen one. Inline validation errors, loading state, error banner.
8. App layout: sticky header "🌾 KisanMandi" with user menu (name, role, Switch user/Log out); bottom tab bar on mobile and top/side nav on md+. Farmer tabs: Prices, Marketplace, Alerts, My Listings. Buyer tabs: Prices, Marketplace. Alerts tab has a badge slot (wired up in Phase 5).
9. Route guards: if no user → /onboarding. Buyer visiting /alerts, /alerts/*, /my-listings, /listings/new, /listings/:id/edit, /calculator is redirected to /prices.
10. Shared components: Spinner/Skeleton, ErrorBanner with Retry, EmptyState, Chip, Toast system, ConfirmDialog.

Done when: first launch shows onboarding; creating a user adds it to the API (check /users); farmer sees 4 tabs and buyer sees 2; buyer is redirected from farmer-only URLs; refresh keeps the user logged in; logout works; Vitest tests pass.
Stop and summarize.
```

---

## PHASE 3 — Prices Screen (Milestone 1)

```
Continue. Re-read SPEC.md section 5.3.

PHASE 3: Build the Prices screen with live API data.

Tasks:
1. src/lib/priceMath.ts: getLatestPrice, getPreviousPrice (second most recent date), getDailyChange (amount = today − yesterday; pct = amount / yesterday × 100 to 1 decimal; guard yesterday = 0 or missing → null), group helpers. "Today" = the latest date present in the data for that pair (NOT the device clock). Add Vitest tests.
2. src/lib/format.ts: PKR formatter (e.g. "Rs 4,200"), signed change formatter, date formatter.
3. src/pages/Prices.tsx:
   - Market selector (chips or dropdown from /markets), default first market, keep selection in URL query param (?market=ID).
   - Crop search input (case-insensitive, debounced ~250ms).
   - Category filter chips: "All" + categories derived from crops.
   - Search and category filter work together.
   - Crop cards: name, category chip, today's price with "/ maund", daily change amount AND percentage; green ▲ when positive, red ▼ when negative, grey "–" when zero/unavailable.
   - Fetch prices efficiently (one request for the market, e.g. GET /prices?market_id=X&_sort=date&_order=desc or date_gte filter) — NOT one request per crop. Group client-side.
   - Pull-to-refresh: custom touch gesture component (drag down at scroll-top, threshold ~70px, spinner), refetches prices (and alerts). Also a visible Refresh icon button for desktop. Show "Updated hh:mm".
   - Loading skeletons, empty state ("No crops match your search"), error banner with Retry.
   - Tapping a card navigates to /crops/:cropId?market=:marketId (page built next phase; a placeholder is fine now).
4. Responsive: test at 375px and 1024px widths.

Done when: prices come from the API; changing market updates values; search + category filter combine correctly; change amount/percentage are correct for 3 spot-checked crops against /prices data; pull-to-refresh (use browser device emulation) triggers a refetch.
Stop and summarize.
```

---

## PHASE 4 — Crop Trends & Market Comparison (Milestone 2)

```
Continue. Re-read SPEC.md section 6.

PHASE 4: Build the Crop Detail page at /crops/:cropId?market=:marketId.

Tasks:
1. Header: crop name, category chip, market switcher (changes ?market), today's price and daily change (reuse priceMath).
2. 14-day line chart with recharts LineChart in ResponsiveContainer: x-axis dates formatted "dd MMM", y-axis PKR, tooltip showing date + price, green line, dots on points. Data: GET /prices?crop_id=X&market_id=Y&_sort=date&_order=asc (14 points). Highlight min and max points if easy.
3. getStats(series) in priceMath.ts → min, max, average (rounded to nearest PKR). Show three stat cards: Minimum, Maximum, Average over the period. Add Vitest tests.
4. Market comparison list: for this crop get the latest price in EVERY market, sort by best price (highest first, since farmers want to sell high), show market name, district, price, and difference vs best price. Highlight the top item with a "🏆 Best place to sell today" badge and green border. If a market has no data, show "No data" and exclude it from sorting.
5. Action buttons (render for farmers only): "Set alert" → /alerts/new?crop=X&market=Y and "Calculate profit" → /calculator?crop=X&market=Y (these pages are built later; links can lead to placeholders now).
6. Back button, loading skeletons, error + retry, 404 state for invalid crop id.

Done when: chart shows exactly 14 points; min/max/avg match a manual calculation from /prices; comparison list is sorted best-first with the best market highlighted; changing the market updates chart and stats; buyers don't see the farmer-only buttons.
Stop and summarize.
```

---

## PHASE 5 — Price Alerts (Milestone 3)

```
Continue. Re-read SPEC.md section 7.

PHASE 5: Build alerts (farmer-only).

Tasks:
1. src/lib/alertEval.ts: isTriggered(alert, latestPrice) → alert.active_status && (condition === "Above" ? latest >= target : latest <= target). Add Vitest tests including equality cases (latest == target must trigger for both Above and Below) and inactive alerts never triggering.
2. A hook useAlertStatus() that, for the current user, loads alerts + latest prices and returns each alert with latestPrice and triggered boolean, plus triggeredCount. It must RE-EVALUATE every time prices are refetched (pull-to-refresh, manual refresh, window focus, initial load, and after any alert mutation).
3. src/pages/Alerts.tsx: list the current user's alerts (GET /alerts?user_id=ME). Each row: crop, market, condition, target price, latest price, status chip (Triggered / Waiting / Inactive), Active toggle (PATCH active_status), Edit button, Delete button (ConfirmDialog → DELETE). Triggered alerts highlighted and sorted to the top. Empty state with "Create your first alert". Pull-to-refresh + refresh button here too.
4. src/pages/AlertForm.tsx (create at /alerts/new, edit at /alerts/:id/edit): crop select, market select, condition segmented Above/Below, target price (number > 0), active toggle. Validated with zod + react-hook-form. Prefill from query params ?crop=&market=. POST for create, PATCH/PUT for edit. Ownership check: editing an alert whose user_id != current user shows "Not allowed" and redirects.
5. Wire the badge on the Alerts tab (both mobile bottom tab and desktop nav) = triggeredCount, hidden when 0, updates live after toggle/edit/create/delete and after refresh.
6. Optional toast "N alert(s) triggered" when the count increases after a refresh.

Done when: logged in as a seeded farmer who has triggered alerts, the badge shows the correct number on load; toggling an alert off decreases the badge; creating an alert whose target is already met increases it; the equality case triggers; delete and edit persist in db.json; Vitest passes.
Stop and summarize.
```

---

## PHASE 6A — Listing Form, Marketplace & Market Labels (Milestone 4, part 1)

```
Continue. Re-read SPEC.md sections 8.1, 8.2, 8.3.

PHASE 6A: Build the listing form, the marketplace, and the Below/At/Above market label.

Tasks:
1. src/lib/marketLabel.ts: getMarketLabel(asking, marketAvg) → { label: "Below"|"At"|"Above", pct }. marketAvg = average of the LATEST price of that crop across all markets (add getMarketAverage(prices, cropId) to priceMath.ts). diffPct = (asking − marketAvg)/marketAvg×100. At market when −5 ≤ diffPct ≤ +5 inclusive; Below when < −5; Above when > +5. Vitest tests for boundaries: exactly −5, exactly +5, −5.01, +5.01.
2. src/pages/ListingForm.tsx (create /listings/new, edit /listings/:id/edit; farmers only): crop select, quantity (> 0, maunds), asking price (> 0, PKR per maund), district (Sindh list, default farmer's district), grade (A/B/C segmented), available-from date (cannot be in the past; set min attr to today AND validate with isDateNotPast; when editing, only enforce this if the date was changed), contact phone (valid PK mobile, default from profile, normalized). Inline errors, submit disabled while invalid/pending. Create → POST /listings with user_id = current user, status "Active", created_at = new Date().toISOString(). Show the live market average and the Below/At/Above label under the price field as a hint.
3. src/pages/Marketplace.tsx (all roles): GET /listings?status=Active, joined client-side with crops and users (seller name). Search box (crop name or seller name), filters: crop, district, grade — all combinable, with "Clear filters". Sort: Newest (created_at desc) or Price ascending (asking_price asc). Listing cards show crop, quantity (maunds), asking price, grade chip, district, available-from date, seller name, and the market label chip with percentage (Below=green, At=blue/grey, Above=orange/red). A floating "+ Post listing" button for farmers only. Loading skeletons, empty state, error + retry, pull-to-refresh.

Done when: form rejects quantity ≤ 0, price ≤ 0, past date, invalid phone and missing fields; a valid listing appears in the marketplace and in db.json; filters and search combine; both sort options work; all three market labels appear on seeded data; Vitest boundary tests pass.
Stop and summarize.
```

---

## PHASE 6B — Listing Detail, Contact Actions & My Listings with Ownership Safeguards (Milestone 4, part 2)

```
Continue. Re-read SPEC.md sections 8.4 and 8.5.

PHASE 6B: Listing details, Call/WhatsApp actions, and My Listings with strict ownership safeguards.

Tasks:
1. src/pages/ListingDetail.tsx (/listings/:id, all roles): full details, seller info, market average for the crop, the market label with %, available-from date, status. 
   - "Call" button → tel:<phone>.
   - "WhatsApp" button → https://wa.me/<92XXXXXXXXXX>?text=<URL-encoded message> using toWhatsAppNumber (03XXXXXXXXX → 923XXXXXXXXX, no +, no spaces). Message: "Assalam o Alaikum, I saw your listing for {qty} maunds of {crop} on KisanMandi."
   - If status is Sold: show a "Sold" banner and disable Call/WhatsApp.
   - Show Edit / Mark Sold / Delete controls ONLY if listing.user_id === currentUser.id.
2. src/pages/MyListings.tsx (farmers only): GET /listings?user_id=ME with Active/Sold tabs. Each listing has Edit, Mark Sold (PATCH status "Sold"), Delete (ConfirmDialog → DELETE). Empty state with a "Post your first listing" CTA. Pull-to-refresh.
3. OWNERSHIP SAFEGUARDS (enforce in three places):
   a) UI: owner-only controls render only when listing.user_id === currentUser.id (never for buyers).
   b) Route level: visiting /listings/:id/edit for someone else's listing fetches it, detects the mismatch, shows "Not allowed" and redirects.
   c) Logic layer: updateListing / markSold / deleteListing helpers re-fetch the listing and refuse (throw) if user_id !== currentUser.id BEFORE sending the request. Show an error toast if blocked.
4. After any mutation invalidate listings queries so Marketplace and My Listings refresh; Sold listings must disappear from Marketplace.

Done when: Call and WhatsApp links are correct (test with a seeded phone → wa.me/923001230001); marking Sold removes the listing from Marketplace but keeps it in My Listings (Sold tab); logging in as another farmer and opening an edit URL for a listing they don't own is blocked; buyers never see edit controls; delete works and persists.
Stop and summarize.
```

---

## PHASE 7 — Profit Calculator (Milestone 5)

```
Continue. Re-read SPEC.md section 9.

PHASE 7: Build the interactive Profit Calculator (/calculator, farmers only). Prefill crop/market from ?crop=&market=.

Tasks:
1. src/lib/profitMath.ts: calculateProfit({ quantity, price, costPerUnit, shiftPct }) → { adjustedPrice, revenue, totalCost, profit, marginPct }. adjustedPrice = price × (1 + shiftPct/100); revenue = quantity × adjustedPrice; totalCost = quantity × costPerUnit; profit = revenue − totalCost; marginPct = revenue > 0 ? profit / revenue × 100 : null. Never return NaN or Infinity. Vitest tests incl. zero quantity, zero revenue, negative profit.
2. src/pages/ProfitCalculator.tsx:
   - Inputs: crop select, market select, quantity (maunds, > 0), cost of production per unit (PKR/maund, ≥ 0).
   - Selling price = latest price for the chosen crop + market (shown with today's change).
   - What-if control: slider from −20% to +20% (step 1, default 0) plus quick buttons −20 / −10 / 0 / +10 / +20; show the adjusted price.
   - Outputs update live: Revenue, Total cost, Profit/Loss (green + "Profit" when ≥ 0, red + "Loss" when < 0), Margin %. Show "–" for margin when revenue is 0.
   - Small comparison table of −20% / 0% / +20% scenarios.
   - Input validation messages; no NaN in the UI for empty inputs.
3. Add a "Profit Calculator" entry for farmers (menu or quick link on the Prices page) in addition to the button on Crop Detail.

Done when: a hand calculation matches the outputs (e.g. quantity 100, price 4,000, cost 3,000: revenue 400,000, cost 300,000, profit 100,000, margin 25%); the slider shifts the price by exactly ±20%; empty/zero inputs never show NaN; buyers are redirected away.
Stop and summarize.
```

---

## PHASE 8 — Polish, QA & README

```
Continue. Re-read SPEC.md sections 11, 13, 14 and 16.

PHASE 8: Quality pass. Do not add new features beyond what SPEC.md describes.

Tasks:
1. Walk through the ENTIRE Verification Checklist in SPEC.md section 13 in the browser (use the browser tool). For every unchecked/failing item, fix it. Report a table: item → pass/fail → fix.
2. Handle all edge cases in SPEC.md section 14 (no price data, single day of data, divide-by-zero, API down, deleting while viewing, double-submit prevention, phone normalization, date-string comparisons).
3. UX polish: consistent loading skeletons, empty states, error banners with Retry, success/failure toasts for every mutation, confirm dialogs for destructive actions, large tap targets (≥ 44px), aria-labels on icon buttons, visible focus states. Verify at 375px, 414px and 1024px widths. No horizontal scrolling on mobile.
4. Make sure there are NO console errors or React key warnings on the main flows.
5. Make sure no domain data is hard-coded or imported from JSON in src/, and localStorage only stores currentUserId (grep the codebase to prove it).
6. Run `npm run test` and `npm run build`; fix any failures.
7. Write README.md: project overview, tech stack, setup (`npm install`, `npm run dev`), environment variables, API collections and seed description, feature-to-milestone map, assumptions (from NOTES.md), and the 3-minute demo script.
8. Test a fresh start: delete db.json, run `npm run dev`, and confirm everything works end-to-end.

Done when: the checklist is fully green, tests + build pass, and README.md is complete.
Stop and give me a final report.
```

---

## PHASE 9 (Optional) — Deployment

```
Continue. Deploy the project so judges can open a live URL.

Tasks:
1. API: prepare server/ for deployment (e.g. Render/Railway): add a start script that runs the seed once if db.json is missing and then starts json-server on process.env.PORT (host 0.0.0.0). Document the steps.
2. Frontend: make sure VITE_API_URL is read from the environment; add a vercel.json or netlify.toml with an SPA fallback (all routes → index.html).
3. Add CORS-safe configuration and confirm the deployed frontend can read AND write to the deployed API (create a listing in production).
4. Add the live URLs to README.md.
Give me exact step-by-step deployment instructions for the platform I choose, since you cannot log into my accounts.
```

---

## Utility Prompts

### Context Reset Prompt (use if the agent seems lost)
```
Re-read SPEC.md and NOTES.md, then scan the repository to see what is already implemented. List: (1) which phases/milestones are complete, (2) what is missing or broken, (3) what you plan to do next. Do not change any code yet. Wait for my confirmation.
```

### Bug-Fix Prompt (template)
```
Bug: <describe what you see, which page, what you clicked>.
Expected (per SPEC.md section <X>): <expected behaviour>.
Steps to reproduce: <1, 2, 3>.
First reproduce it in the browser, find the root cause, fix it with the smallest change, add a test if it's logic, and re-run the related Verification checklist items. Do not refactor unrelated code.
```

### Rule-Audit Prompt (run before submission)
```
Audit the app strictly against SPEC.md and the original task rules: role-based tabs, daily change amount + %, pull-to-refresh, 14-day chart with min/max/avg, markets sorted by best price with the best highlighted, alert rules (Above >= / Below <=) with badge count re-evaluated on refresh, listing validation (quantity > 0, price > 0, available-from not in the past, phone), filters + sort, Below/At/Above with ±5% inclusive for At, Call + WhatsApp, owner-only edit/sold/delete, profit calculator with ±20% what-if, and seed counts (8 crops/4+ categories, 3 markets, 14 days × every pair, 6 users, 12 listings, 5 alerts, fictional data). Produce a pass/fail table and fix every failure.
```

### Demo-Day Prompt (final run-through)
```
Run the Demo Script from SPEC.md section 16 step by step in the browser. Report anything that looks unpolished, slow, or broken, and fix it. Then confirm that `npm install && npm run dev` works from a fresh clone.
```
