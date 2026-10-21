# 🌱 saa-wak | ساوڪ

<div align="center">

![Frontend](https://img.shields.io/badge/Project-Frontend%20Demo-607d52?style=for-the-badge&labelColor=344b35)
![Sample prices](https://img.shields.io/badge/Sample%20Prices-336%20Fictional%20Records-9aab7f?style=for-the-badge&labelColor=344b35)
![Markets](https://img.shields.io/badge/Markets-3%20Sindh%20Districts-c0a577?style=for-the-badge&labelColor=344b35)

### Know the market. Grow with confidence.

**A crop-price discovery and produce marketplace frontend for farmers and buyers in Sindh, Pakistan.**

Explore fictional crop prices, compare markets, follow 14-day trends, create demo alerts, share produce listings, and estimate a potential sale with the profit calculator.

**🌾 Crop Prices · 📈 Market Insights · 🔔 Price Alerts · 🧺 Produce Marketplace · 🧮 Profit Calculator**

## 🌐 Open the local demo

### [http://localhost:5173/](http://localhost:5173/)

Start the app with the instructions below before opening this address. This is a local development link; no public deployment is claimed.

**Built for farmers and buyers across Sindh**  
Hyderabad · Sukkur · Mirpur Khas

</div>

---

## 📑 Table of Contents

- [1. Overview](#-1-overview)
- [2. Product Experience](#-2-product-experience)
- [3. Key Features](#-3-key-features)
- [4. Demo Data](#-4-demo-data)
- [5. System Architecture](#-5-system-architecture)
- [6. Technology Stack](#-6-technology-stack)
- [7. Business Rules](#-7-business-rules)
- [8. Local Setup](#-8-local-setup)
- [9. Project Structure](#-9-project-structure)
- [10. Demo Data and Limitations](#-10-demo-data-and-limitations)
- [11. Future Backend Integration](#-11-future-backend-integration)

---

## 🌍 1. Overview

**saa-wak (ساوڪ)** brings practical crop-market information and produce discovery into one calm, mobile-friendly experience. It is designed around everyday decisions: what a crop is priced at in a selected market, how that price has moved, where comparable sample prices are higher, and how a farmer can present available produce to buyers.

### 🎯 Purpose

Help farmers and produce buyers explore market information and listings in one accessible place, with a clear distinction between sample data and real market quotations.

### 🌿 Product principles

- **Clear:** prices always include their comparison unit.
- **Local:** sample markets represent different Sindh districts.
- **Honest:** demo prices are fictional and are never presented as live market data.
- **Practical:** price trends, alerts, listings, and estimates support straightforward workflows.
- **Approachable:** a soft, off-white interface with restrained agricultural accents and touch-friendly controls.

---

## 🧭 2. Product Experience

Choose a demo role to enter the application:

### 👩‍🌾 Farmer

Explore prices and trends, compare markets, create and manage sample price alerts, estimate potential sale outcomes, and manage demo produce listings.

### 🧺 Buyer

Explore crop prices and compare markets, then browse, search, filter, sort, and inspect available demo produce listings.

Role selection is a way to explore the interface. It is not account authentication or a security boundary.

---

## ✨ 3. Key Features

| Feature | Description |
|---|---|
| 🌾 Crop Prices | Browse sample crop prices by market, search by crop, filter by category, and see movement from the previous day. |
| 📈 Market Comparison | View a 14-day crop-price chart with low, average, high, and period-change summaries. Compare the same crop and unit across three markets. |
| 🔔 Price Alerts | Create Above or Below sample thresholds, pause or resume alerts, and remove rules. Evaluation is demo-only and occurs when sample data is refreshed. |
| 🧺 Produce Marketplace | Search and filter listings by crop, district, and grade. Sort by newest or price and inspect listing details. |
| 📝 My Listings | Create, edit, mark sold, and delete listings associated with the demo farmer profile. |
| 🧮 Profit Calculator | Estimate revenue, production cost, profit or loss, and margin while adjusting the sample price from −20% to +20%. |
| 📱 Responsive Navigation | Use the full sidebar on wider screens and a touch-friendly navigation drawer on smaller screens. |
| 🌱 Demo Onboarding | Enter as a farmer or buyer and set a display name and district without creating a real account. |

---

## 📊 4. Demo Data

The frontend uses a coherent fictional dataset generated in `src/data.ts`.

| Collection | Included records |
|---|---:|
| Crops | 8 across Grains, Cash crops, Vegetables, and Fruits |
| Markets | 3 across Hyderabad, Sukkur, and Mirpur Khas |
| Prices | 336 — 14 consecutive dates for every crop-market pair |
| Demo profiles | 6 fictional profiles |
| Produce listings | 12 fictional listings |
| Price alerts | 5 sample alert rules |

**All prices and people are fictional.** The persistent in-app disclosure reads: **“Sample demo prices — not live market data.”**

---

## 🏗️ 5. System Architecture

This phase is a frontend demo. The interface reads its initial records from a local typed data module; demo profile, listing, and alert changes are saved in the current browser’s `localStorage`.

```text
┌────────────────────────────────────────────┐
│              saa-wak Frontend               │
│                                            │
│ Overview · Crop Prices · Insights           │
│ Alerts · Marketplace · Calculator           │
└─────────────────────┬──────────────────────┘
                      │
            Frontend data-access boundary
                      │
┌─────────────────────▼──────────────────────┐
│           Local fictional demo data         │
│                                            │
│ 6 domain collections · 336 sample prices   │
│ Browser localStorage for demo mutations    │
└────────────────────────────────────────────┘

Future integration: Frontend → REST API → Backend → Database
```

There is no backend, database, live market feed, production authentication, or server-side authorization in this frontend phase.

---

## 🧰 6. Technology Stack

- **React** — interactive application screens and reusable UI.
- **TypeScript** — typed domain data and UI code.
- **Vite** — local development server and frontend build tooling.
- **Lucide React** — interface icons.
- **SVG and CSS** — responsive 14-day price chart and visual system.
- **Browser localStorage** — demo-only persistence for selected profile, listings, and alerts.

---

## 📐 7. Business Rules

- Daily movement is calculated from the latest and previous sample price for the same crop and market.
- Market comparisons use the same crop and its standardized unit across markets.
- The highest displayed price is not a guarantee of the best net return; transport and other costs may change the result.
- Listing price labels compare the asking price with the mean sample price for the same crop across the three markets. The range within ±5% is labelled **Near market**.
- **Above** alerts trigger when the sample price is greater than or equal to the target. **Below** alerts trigger when the sample price is less than or equal to the target.
- The calculator applies the chosen percentage adjustment to the sample price and separates gross revenue from estimated profit.
- Calculator results do not include transport, commission, storage, or other costs unless entered.

---

## 🚀 8. Local Setup

### Requirements

- Node.js and npm installed on your computer.
- A terminal opened in the `saa-wak` project directory.

### Install dependencies

```bash
npm install
```

### Start the local application

```bash
npm run dev
```

Open the local demo at **[http://localhost:5173/](http://localhost:5173/)**.

### Create a production frontend build

```bash
npm run build
```

### Preview the generated build locally

```bash
npm run preview
```

Vite’s preview server is intended for local build review, not production hosting. Refer to the [Vite getting-started guide](https://vite.dev/guide/) and [static deployment guide](https://vite.dev/guide/static-deploy.html).

---

## 🗂️ 9. Project Structure

```text
saa-wak/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── src/
    ├── App.tsx       # Screens, navigation, and demo interactions
    ├── data.ts       # Domain types and fictional seed records
    ├── main.tsx      # React application entry point
    └── styles.css    # Design system and responsive layouts
```

---

## ⚠️ 10. Demo Data and Limitations

- Sample prices are **not live, official, verified, or guaranteed** market quotations.
- Alert evaluation happens in the demo when data is refreshed or loaded; there is no background monitoring, SMS, email, or push delivery.
- Profile, listing, and alert changes are stored only in the browser’s local storage. Clearing site data resets those changes.
- Demo identities and contact information are fictional. The listing detail view does not place real calls or send messages.
- Browser-side role and ownership controls are only interface behavior and do not provide security.
- Calculator outputs are estimates, not guaranteed earnings.
- This README describes the local frontend demo; it does not claim that the application has been deployed.

---

## 🔌 11. Future Backend Integration

The demo is organized around the six product collections:

`users` · `crops` · `markets` · `prices` · `listings` · `alerts`

A backend integration can replace the local data source with API operations while preserving the product screens. The server should validate all writes and enforce authentication, farmer role permissions, and ownership for listing and alert changes. Database credentials and privileged secrets must remain on the server and out of the frontend bundle.

---

<div align="center">

**saa-wak — ساوڪ**  
**Know the market. Grow with confidence.**

*Sample demo prices — not live market data.*

</div>
