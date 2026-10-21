# KisanMandi: Crop Prices & Produce Marketplace (Issue #11)

Mobile-first web app for Sindh farmers & buyers, backed by a JSON Server mock API.

## Run (1 command)
```
npm install
npm start
```
Open http://localhost:3000 (app + API on same port). Phone par same WiFi se `http://<PC-IP>:3000` khol lein.

## Features
- **M1:** First-launch profile (name, phone, district, Farmer/Buyer); role-based tabs; today's prices per market with search + category filter; daily change (Rs & %); pull-to-refresh + ⟳ button
- **M2:** 14-day line chart, min/max/avg, market comparison sorted by best price with "Best to sell" highlight
- **M3:** Price alerts (crop, market, Above/Below, target), active toggle, delete, re-evaluated on every refresh, badge count on Alerts tab
- **M4:** Validated listing form (qty>0, price>0, grade A/B/C, date not in past, phone), marketplace search/filter/sort, Below/At/Above market label (±5% of avg across markets), Call & WhatsApp, edit/sold/delete only own listings
- **M5:** Profit calculator: revenue, cost, profit/loss, margin, what-if slider ±20%
- **M6:** Mock API collections `users, crops, markets, prices, listings, alerts`; 8 crops (4 categories), 3 markets in 3 districts, 14 days of prices for all 24 pairs (336 rows), 6 users, 12 listings, 5 alerts. All data fictional.

## Tech
HTML/CSS/vanilla JS + Chart.js, JSON Server (`db.json`).
