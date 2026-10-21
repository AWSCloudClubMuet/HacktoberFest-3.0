# 🌾 KisanMandi — Crop Prices & Produce Marketplace

A mobile-responsive web app for **farmers and buyers in Sindh, Pakistan**. Farmers can track live mandi prices, set price alerts, post produce for sale and calculate their profit. Buyers can compare markets and browse listings.

Built for the Dev-Dynamo hackathon by Abdul Saboor.

---

## Run it (2 commands, no installs)

Requires only **Python 3**. No Node.js, no npm, no dependencies.

```bash
cd kisanmandi
python3 server.py
```

Open **http://127.0.0.1:8000/** in your browser.

To reset the demo data at any time:

```bash
python3 seed.py     # then restart server.py
```

---

## Features

| Area | What it does |
|---|---|
| **Profile setup** | First launch asks for name, phone, district and Farmer/Buyer role. Validated, saved through the API. Existing users can be picked with one tap. |
| **Role-based navigation** | Farmers see Prices, Marketplace, Calculator, Alerts, Profile. Buyers don't see the farmer-only Calculator or listing-creation tools. |
| **Crop prices** | Latest price per crop per market, daily change (▲/▼ and %), search, category filter, market selector and a Refresh button. Dashboard cards show top gainer and faller. |
| **14-day trends** | Tap a crop for a 14-day line chart with min / average / max statistics. |
| **Market comparison** | Side-by-side latest, min, avg and max across all 3 markets, with "Best to sell" and "Cheapest" tags. |
| **Price alerts** | Above/Below rules, active toggle, delete, automatic evaluation against the latest price, and a count of how many times each alert has triggered. |
| **Produce listings** | Create, edit, mark Sold and delete (owners only). Form validation, search, district / crop / grade filters, sorting, a market-price comparison label on every listing, and Call / WhatsApp contact buttons. |
| **Profit calculator** | Revenue, six cost categories, profit or loss, margin, break-even price and a ±20% price adjustment slider with a comparison table. |

---

## How it works

```
Browser (HTML + CSS + JS)  ──HTTP/JSON──▶  server.py (Python)  ──▶  data/db.json
```

- **Backend:** `server.py` uses only the Python standard library. It serves the static frontend and a REST API at `/api/<collection>` with `GET`, `POST`, `PATCH`, `PUT` and `DELETE`, plus query filtering (`?cropId=crop-wheat`).
- **Database:** `data/db.json`, written atomically on every change.
- **Frontend:** plain HTML, CSS and JavaScript. No framework, no build step. Charts are drawn as inline SVG.

### The six API collections

| Route | Records | Contents |
|---|---|---|
| `/api/users` | 6 | name, phone, district, role |
| `/api/crops` | 8 | 5 categories: Grains, Cash Crops, Vegetables, Fruits, Pulses |
| `/api/markets` | 3 | Hyderabad, Sukkur, Karachi |
| `/api/prices` | 336 | 8 crops × 3 markets × 14 days |
| `/api/listings` | 12 | produce for sale |
| `/api/alerts` | 5 | price alert rules |

All data is fictional. **Every read and write in the app goes through these HTTP routes.** There are no hardcoded arrays in the frontend.

---

## Project structure

```
kisanmandi/
├── server.py        API + static file server (Python stdlib only)
├── seed.py          Generates the fictional data in data/db.json
├── data/db.json     The database
├── index.html       Page structure and dialogs
├── css/style.css    Responsive styling
└── js/app.js        API calls, rendering, charts, alerts, calculator
```

---

## How I solved it

**1. Started from what already existed.** I already had a working Python mock API and seed script, so I kept them instead of adding Node.js and json-server, which would have cost time I didn't have. I inspected `server.py` first to read the real routes, the ID format (string IDs like `crop-wheat`) and which HTTP methods it supported, then wrote the frontend against exactly that.

**2. Kept the stack small.** Python standard library on the backend, vanilla JavaScript on the frontend. The whole project runs with one command and has zero dependencies, which makes it easy to demo and hard to break.

**3. Built the data layer first.** The app loads all six collections once, groups the 336 prices by crop and market, and sorts each series by date. Everything else (cards, charts, statistics, comparisons, alert checks and the calculator's default price) is calculated from that one structure.

**4. Added features in priority order.** Dashboard and prices, then market comparison and charts, then the marketplace, the calculator and alerts, then polish.

**5. Tested against the real server.** I ran the server and checked every collection over HTTP, then ran a scripted browser test that exercised 21 user actions: profile selection, search and filters, opening a chart, listing validation, creating, marking sold and deleting a listing, adding, toggling and deleting alerts, and the calculator maths. I also checked each change by reading the data back from the API, so I knew it was saved and not just drawn on screen.

### Problems I hit and how I fixed them

- **`/crops` returned 404.** The API lives under `/api/`, so the correct route is `/api/crops`. I found this by reading the routing code in `server.py` instead of guessing.
- **Misleading units.** The old seed priced wheat at Rs 3,200 per kg. Pakistani mandis quote per *maund* (40 kg), so I changed the seed so the prices make sense to a real farmer.
- **A hidden button still showed.** My `.btn` style overrode the HTML `hidden` attribute. Adding `[hidden]{display:none!important}` fixed it.
- **Alerts fired every time the page loaded.** I now only record a trigger when an alert changes from not-triggered to triggered, so the trigger count stays accurate.
- **Unsafe text in the page.** All user-entered text (names, listing details) is escaped before it is rendered, so it can't inject HTML.

---

## Notes and limitations

- This is a demo. There is no login: choosing a profile on the device identifies the user, and the choice is remembered in the browser.
- Prices are generated sample data, not live mandi rates.
- The API has no authentication, so it should only be run locally.
- Alerts are checked when the app loads, when you press **Refresh** or **Evaluate now**, and when an alert is added or toggled. They do not run in the background.