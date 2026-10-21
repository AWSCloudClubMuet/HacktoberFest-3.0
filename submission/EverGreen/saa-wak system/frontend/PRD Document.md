# KisanMandi — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Hackathon-ready specification  
**Product:** KisanMandi — Crop Prices & Produce Marketplace  
**Target users:** Farmers and buyers in Sindh, Pakistan  
**Hackathon timebox:** 5 hours 30 minutes  
**Data status:** All seeded prices and people are fictional demo data

## 1. Product summary

KisanMandi is a responsive, mobile-first web app that helps farmers compare indicative crop prices across markets, view 14-day price trends, configure price-threshold alerts, estimate profit, and list produce for buyers. Buyers can explore prices and browse available listings.

The hackathon version demonstrates the workflow using a mock REST API. It must not imply that demo prices are official, verified, or live market quotations.

## 2. Problem statement

Farmers and buyers can lack a simple, comparable view of crop prices, market differences, and available produce. KisanMandi brings those workflows together in one clear interface so users can make more informed decisions.

## 3. Goals

1. Offer role-aware onboarding for Farmer and Buyer.
2. Show today's price, unit, market, and day-over-day movement.
3. Show 14 consecutive days of prices and compare markets for the same crop.
4. Let farmers create, view, activate/deactivate, and delete their own price alerts.
5. Let farmers create, view, edit, and delete their own produce listings.
6. Calculate revenue, cost, profit/loss, margin, and price-change scenarios.
7. Use HTTP requests against mock API collections for application data.
8. Deploy the app and verify the deployed app can reach its configured API.

## 4. Non-goals

- Official or real-time mandi data integration.
- Real payment processing, escrow, shipping, or order fulfilment.
- Production-grade authentication, identity verification, or authorization.
- SMS, WhatsApp, push-notification delivery, or background alert processing.
- A full admin portal or advanced moderation system.
- Claims that demo listings or seller identities are verified.

## 5. User roles

### Farmer
Can explore prices, compare markets, use the profit calculator, manage their own alerts, and manage their own listings.

### Buyer
Can explore prices, compare markets, use the calculator, and browse/filter produce listings. Buyers cannot edit another user's listing or manage another user's alerts.

### Demo identity
The hackathon may use a role-selection screen and seeded demo users. This is a demonstration mechanism, not secure authentication. Do not collect real passwords or sensitive personal data.

## 6. Core user journeys

1. **First visit:** choose Farmer or Buyer → choose a seeded demo profile or enter the demo experience → arrive at Prices.
2. **Check a price:** choose crop and market → see today's price and daily movement → inspect 14-day chart → compare other markets.
3. **Create an alert:** Farmer opens Alerts → chooses crop, market, condition (above/below), and target price → saves → alert appears in list.
4. **List produce:** Farmer opens Marketplace → adds crop, quantity, unit, grade, asking price, district/market, description, and contact method → saves → listing appears in marketplace.
5. **Manage a listing:** Farmer opens their listing → edits or deletes it → UI updates from API response.
6. **Estimate profit:** choose crop, quantity, expected selling price, and cost per unit → see revenue, cost, profit/loss, margin, and ±20% scenario range.
7. **Buyer discovery:** Buyer filters marketplace by crop, district/market, price, and availability → opens a listing → uses displayed demo contact details.

## 7. Functional requirements

### FR-01: Role-aware onboarding
- Present Farmer and Buyer choices.
- Display a clear demo-mode notice.
- Role controls available actions and navigation affordances.
- Do not describe the role selector as secure login.

### FR-02: Crop prices
- Show today's price in PKR with unit (for example, PKR per 40 kg or PKR per kg); each crop must use a consistent unit across markets and dates.
- Show yesterday's price, absolute change, and percentage change where data exists.
- Use green/up and red/down indicators with text labels/icons, not color alone.
- Support crop and market selection.
- Include loading, empty, API-error, and retry states.
- Label the data “Sample demo prices — not live market data.”

### FR-03: Price history and market comparison
- Show a line chart for the latest 14 consecutive dates.
- Allow a crop to be compared across at least three seeded markets.
- Show a summary such as latest price, 14-day minimum/maximum, and change over the period.
- Never compare different crops or units in the same price comparison.
- Charts must have readable axes, tooltips, legends, and responsive sizing.

### FR-04: Price alerts
- Farmers can create alerts for a crop and market with condition `above` or `below` and a positive target price.
- Farmers can view and delete their own alerts and toggle enabled status.
- On price refresh or page load, evaluate enabled alerts against the latest available matching price.
- Avoid repeatedly showing the same alert event while the condition remains unchanged.
- The hackathon may show in-app alert status only; no SMS/push delivery is required.
- Explain that evaluation occurs when data is refreshed/opened, not through a guaranteed background service.

### FR-05: Produce marketplace
- Display listing cards with crop, quantity, unit, grade, asking price, district/market, seller display name, posted date, availability, and contact action.
- Search and filter by crop, district/market, and price range; include a clear-filters action.
- Farmers can create, edit, and delete their own listings.
- Validate required fields and positive quantity/price.
- Show a price-position badge relative to the mean of available same-crop market prices for today:
  - **Below market:** asking price is more than 5% below the mean.
  - **Near market:** asking price is within ±5% of the mean.
  - **Above market:** asking price is more than 5% above the mean.
- If a comparable market price is unavailable, show “Market comparison unavailable.”
- UI-level ownership checks are for the demo only; they are not a security boundary.

### FR-06: Profit calculator
- Inputs: crop, quantity, expected selling price per unit, and production cost per unit.
- Outputs: estimated revenue, total cost, profit/loss, and profit margin.
- Include price scenarios from -20% to +20% of the base selling price using a slider.
- Clearly state that results are estimates and do not include unentered transport, commission, storage, or other costs.

### FR-07: Refresh and API behaviour
- Provide a refresh action for prices.
- Fetch data from the mock API rather than hardcoding the visible dashboard as the only source.
- Display loading/error states and preserve usable navigation when one request fails.
- Do not expose secret credentials in client-side code. If the mock API requires a secret API key, treat that key as public in a browser app and use a backend proxy or a non-secret demo endpoint where necessary.

## 8. Data and seed requirements

Minimum seeded content:
- 8 crops across at least 4 categories.
- 3 markets in different Sindh districts.
- 14 consecutive days for every crop-market pair: **8 × 3 × 14 = 336 price records**.
- 6 demo users.
- 12 marketplace listings.
- 5 price alerts.

Suggested crop set: wheat, rice, cotton, sugarcane, onion, tomato, mango, banana. Suggested markets: Hyderabad, Sukkur, Mirpur Khas. Verify district/market labels are consistent. All sample values must be fictional and clearly identified as such.

## 9. Non-functional requirements

- Mobile-first layout works at 360 px width and scales to tablet/desktop.
- Primary navigation and key actions are keyboard-accessible.
- Use semantic labels, visible focus states, sufficient contrast, and text labels in addition to color.
- API failures must produce understandable messages and retry paths.
- Use reusable components and centralize API base URL/configuration.
- Avoid claiming security, uptime, live-data accuracy, or testing that has not been verified.

## 10. Success criteria / acceptance tests

- [ ] Role selection opens the correct experience.
- [ ] Prices page renders from API data and clearly labels demo data.
- [ ] Daily absolute and percentage change match the selected crop/market records.
- [ ] 14-day chart contains exactly 14 ordered daily points for the selected series.
- [ ] Market comparison uses the same crop and unit across markets.
- [ ] Farmer can create and delete an alert; invalid target values are rejected.
- [ ] Alert condition evaluation works for above/below thresholds on refresh.
- [ ] Farmer can create, edit, and delete their own listing.
- [ ] Buyer can filter listings but cannot see edit/delete controls for farmer-owned listings.
- [ ] Price-position badge uses the defined ±5% rule and handles missing comparisons.
- [ ] Profit calculations and scenario values are mathematically correct.
- [ ] API loading, empty, error, and retry states are present.
- [ ] Production deployment loads without console-breaking errors and API requests succeed.

## 11. Demo script (2–3 minutes)

1. Enter as Farmer and view the prices dashboard.
2. Select a crop and market; show today's demo price, daily change, and 14-day trend.
3. Compare that crop across three markets.
4. Create an above/below alert and show it in the alert list.
5. Create a produce listing and show its market-position badge.
6. Use the profit calculator and adjust the price scenario slider.
7. Switch to Buyer and filter the marketplace.
8. Close by stating that all prices are fictional seed data and live market integration is future work.

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Mock API has request limits or setup friction | Configure one collection early; test CRUD before polishing UI; keep a clearly marked local fallback only if needed |
| Demo data looks real | Persistent demo-data banner and fictional seed values |
| Client-side role checks are bypassable | State clearly that this is a hackathon demo; do not store sensitive data |
| Timebox is too short | Deliver prices → marketplace CRUD → calculator → chart/alerts → polish |
| Deployment API key exposure | Do not place privileged secrets in frontend; use public demo resources or a server-side proxy |
| Missing dates/records break charts | Validate all 336 crop-market-day combinations before UI integration |

## 13. Future scope

Official data sources, verified seller accounts, secure authentication/authorization, notifications, transaction workflows, moderation, multilingual Sindhi/Urdu support, and offline-friendly caching.
