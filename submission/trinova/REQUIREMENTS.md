# KisanMandi requirements checklist

Source of truth: official problem statement. Status: not started unless marked otherwise.

Priority: **M** = mandatory.

| ID | Expected behavior | Pri | Screen / component | Data / backend | Verify |
|---|---|---|---|---|---|
| M1-01 | First launch collects name, phone, district, Farmer/Buyer role | M | Onboarding | POST `users` | Launch with no saved session; form required; user created |
| M1-02 | Farmer tabs: Prices, Marketplace, Alerts, My Listings | M | Main shell | Current user role | Farmer session shows 4 tabs |
| M1-03 | Buyer tabs: Prices, Marketplace | M | Main shell | Current user role | Buyer session shows 2 tabs |
| M1-04 | Today's prices for selected market | M | Prices | GET `prices`, `crops`, `markets` | Changing market updates list |
| M1-05 | Crop search and category filter | M | Prices | `crops.category` | Search/filter hide non-matches |
| M1-06 | Daily change amount and % (today − yesterday) | M | Prices | Two dates per crop–market | Values match seed math |
| M1-07 | Pull-to-refresh reloads prices | M | Prices | GET `prices` | Refresh updates list |
| M2-01 | 14-day line chart for crop in selected market | M | Crop detail | 14 `prices` rows | Chart has 14 points |
| M2-02 | Min, max, average over that period | M | Crop detail | Same series | Stats match series |
| M2-03 | Compare markets sorted by best price today; highlight best sell market | M | Comparison | Today's prices all markets | Highest today first + highlight |
| M3-01 | Farmer creates alert: crop, market, Above/Below, target | M | Alerts | POST `alerts` | Alert appears after save |
| M3-02 | Above: latest ≥ target; Below: latest ≤ target | M | Alerts | Latest `prices` + `alerts` | Triggered state matches rule |
| M3-03 | Active toggle and delete | M | Alerts | PATCH/PUT + DELETE `alerts` | Toggle/delete persist via API |
| M3-04 | Re-evaluate on every refresh; badge count on Alerts tab | M | Shell + Alerts | Refresh path | Badge = triggered active alerts |
| M4-01 | Farmer listing: crop, qty>0, asking>0, district, grade A/B/C, available-from not past, contact phone | M | Listing form | POST `listings` | Invalid submit blocked |
| M4-02 | Browse active listings; search/filter crop, district, grade; sort newest or price asc | M | Marketplace | GET `listings` | Filters/sorts change list |
| M4-03 | Below/At/Above market vs average across markets; ±5% = At | M | Marketplace / detail | `prices` averages | Labels match formula |
| M4-04 | Detail has Call and WhatsApp | M | Listing detail | Listing contact phone | Actions open phone/WA |
| M4-05 | Farmer edit / Sold / delete only own listings | M | My Listings | `listings.user_id` | Other users cannot mutate |
| M5-01 | Select crop+market; enter qty and cost/unit | M | Profit calculator | Latest price | Inputs accepted |
| M5-02 | Revenue, total cost, profit/loss, margin % | M | Profit calculator | Computed | Numbers match formula |
| M5-03 | What-if price shift ±20% | M | Profit calculator | Computed | Slider/control updates results |
| M6-01 | All reads/writes via HTTP mock API collections: users, crops, markets, prices, listings, alerts | M | API client | Mock API | No local-only persistence for those entities |
| M6-02 | Seed 8 crops, ≥4 categories; 3 markets in different districts | M | Seed | `crops`, `markets` | Count/categories/districts |
| M6-03 | 14 consecutive days of prices for every crop–market pair | M | Seed | `prices` | 8×3×14 rows |
| M6-04 | Seed 6 users, 12 listings, 5 alerts | M | Seed | those collections | Counts |
| M6-05 | Fictional names, phones, prices only | M | Seed | all | No real PII |

## Ambiguities (not invented)

- Phone format and uniqueness not specified.
- Whether first-launch profile is stored only in `users` or also locally for session restore.
- Listing `contact phone`: reuse profile phone vs separate field (form asks for contact phone).
- Units for quantity and price not specified.
- Whether Sold listings stay visible in Marketplace (`active` browse implies no).
- Whether buyers may own alerts (buyers have no Alerts tab; treat farmer-only).
- “Best price” for selling assumed **highest** wholesale price.
- “Today” date source (device vs latest seed date) not specified.
- Mock host not specified (MockAPI.io vs JSON Server vs custom). **Needs your account if MockAPI.io.**

## Smallest MVP

Existing app at `submission/trinova/project2/`. No extra features beyond the table. HTTP mock API for all six collections. Local session only to remember the current user after first launch.
