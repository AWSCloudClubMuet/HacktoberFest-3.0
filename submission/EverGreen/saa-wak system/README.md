# 🌱 saa-wak | ساوڪ

<div align="center">

![Agricultural Platform](https://img.shields.io/badge/Sindh-Agricultural%20Platform-607d52?style=for-the-badge&labelColor=344b35)
![Crop Price Records](https://img.shields.io/badge/Crop%20Price%20Records-336-9aab7f?style=for-the-badge&labelColor=344b35)
![Markets](https://img.shields.io/badge/Markets-3%20Sindh%20Districts-c0a577?style=for-the-badge&labelColor=344b35)

### Know the market. Grow with confidence.

**A crop-price intelligence and produce marketplace for farmers and buyers in Sindh, Pakistan.**

Track crop prices, compare markets, follow price trends, manage alerts and listings, and estimate potential sale outcomes in one accessible platform.

**🌾 Crop Prices · 📈 Market Insights · 🔔 Price Alerts · 🧺 Produce Marketplace · 🧮 Profit Calculator**

## 🌐 Open saa-wak

### [http://localhost:5173/](http://localhost:5173/)

Run the application locally using the setup instructions below, then open this address in your browser.

**Made for Sindh’s farming community**  
Hyderabad · Sukkur · Mirpur Khas

</div>

---

## 📑 Table of Contents

- [1. Overview](#-1-overview)
- [2. Platform Capabilities](#-2-platform-capabilities)
- [3. Crop and Market Coverage](#-3-crop-and-market-coverage)
- [4. System Architecture](#-4-system-architecture)
- [5. Technology Stack](#-5-technology-stack)
- [6. Price and Calculation Rules](#-6-price-and-calculation-rules)
- [7. Local Installation](#-7-local-installation)
- [8. Project Structure](#-8-project-structure)
- [9. Data and Service Status](#-9-data-and-service-status)
- [10. Backend Integration](#-10-backend-integration)

---

## 🌍 1. Overview

**saa-wak (ساوڪ)** is an agricultural marketplace and crop-price information platform designed around the needs of farmers and produce buyers in Sindh. It brings price discovery, market comparison, price alerts, produce listings, and sale estimates together in a clear, mobile-friendly interface.

### 🎯 Mission

Give farmers and buyers a more accessible way to understand crop-market information and connect around available produce.

### 🌿 Product principles

- **Clear information:** prices are paired with a consistent crop unit and market.
- **Useful comparisons:** trends and market prices are presented for the same crop and unit.
- **Farmer-focused workflows:** alerts, listing management, and sale estimates are easy to reach.
- **Accessible design:** restrained colors, readable type, responsive pages, and touch-friendly controls.
- **Honest price context:** the included records are clearly identified as fictional sample prices, not live quotations.

---

## ✨ 2. Platform Capabilities

| Capability | What it provides |
|---|---|
| 🌾 Crop Prices | Search crops, filter by category, choose a market, and review price movement from the previous record. |
| 📈 Price Trends | Explore 14 consecutive days of prices with minimum, average, maximum, and period-change summaries. |
| 🏬 Market Comparison | Compare the same crop and unit across Hyderabad, Sukkur, and Mirpur Khas. |
| 🔔 Price Alerts | Set Above or Below price thresholds, enable or pause alerts, and remove alert rules. |
| 🧺 Produce Marketplace | Search listings and filter by crop, district, and grade; sort by newest or price. |
| 📝 Listing Management | Create, edit, mark sold, and delete produce listings associated with the farmer profile. |
| 🧮 Profit Calculator | Estimate revenue, production cost, profit or loss, and margin; explore price changes from −20% to +20%. |
| 👩‍🌾 Role-Aware Navigation | Select Farmer or Buyer to see the relevant application sections and actions. |
| 📱 Responsive Interface | Use the platform on mobile, tablet, and desktop layouts. |

---

## 📊 3. Crop and Market Coverage

The current frontend includes a complete, internally consistent set of fictional seed records in `src/data.ts`.

| Data group | Coverage |
|---|---|
| Crops | 8 crops across Grains, Cash crops, Vegetables, and Fruits |
| Markets | Hyderabad, Sukkur, and Mirpur Khas |
| Price history | 14 consecutive dates for every crop-market pair: 336 records |
| User profiles | 6 fictional farmer and buyer profiles |
| Produce listings | 12 fictional listings |
| Price alerts | 5 sample alert rules |

### Crop catalogue

Wheat, rice, cotton, sugarcane, onion, tomato, mango, and banana.

> **Price data notice:** Sample prices are fictional and are not live market quotations. The application must not be used as a source of current mandi prices.

---

## 🏗️ 4. System Architecture

The current release provides the application interface and local seeded records. Data is separated from the main screen code to keep the future API connection straightforward.

```text
┌─────────────────────────────────────────────┐
│                 saa-wak UI                  │
│                                             │
│ Prices · Insights · Alerts · Marketplace    │
│ Listings · Profit Calculator · Profile      │
└──────────────────────┬──────────────────────┘
                       │
              Typed data boundary
                       │
┌──────────────────────▼──────────────────────┐
│             Frontend data services           │
│                                             │
│ Fictional seed records · Browser storage    │
└─────────────────────────────────────────────┘

Planned connected architecture:
React frontend → REST API → Application backend → Database
```

Profile preferences and listing and alert changes are stored in the browser’s `localStorage` in this release. They are local to that browser and do not synchronize between users or devices.

---

## 🧰 5. Technology Stack

- **React** — application interface and reusable screen components.
- **TypeScript** — typed domain records and frontend behavior.
- **Vite** — development server and static build tool.
- **Lucide React** — navigation and action icons.
- **SVG and CSS** — responsive price-history visualization and visual design system.
- **Browser localStorage** — local persistence for profile preferences, listings, and alerts.

---

## 📐 6. Price and Calculation Rules

- **Daily movement:** latest price minus the previous available record for the same crop and market. Percentage movement uses the previous price as the baseline.
- **14-day history:** each chart series follows one crop, one market, and one unit across 14 consecutive dates.
- **Market comparison:** market prices are compared for the same crop and standardized unit. The highest displayed price does not account for transport, commission, or handling costs.
- **Listing price position:** asking price is compared with the mean sample price across the three markets for that crop. Prices within ±5% are labelled Near market.
- **Price alerts:** Above triggers when the latest price is at least the target; Below triggers when the latest price is at most the target.
- **Profit estimate:** adjusted price = base price × (1 + adjustment / 100). Gross revenue and entered production costs are shown separately.
- **Margin:** calculated from estimated profit divided by gross revenue when revenue is greater than zero.

All outputs are estimates based on the included fictional records and user-entered values.

---

## 🚀 7. Local Installation

### Requirements

- Node.js and npm.
- A terminal opened in the `saa-wak` directory.

### Install packages

```bash
npm install
```

### Start the application

```bash
npm run dev
```

Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

### Build the frontend

```bash
npm run build
```

### Preview the built files locally

```bash
npm run preview
```

Vite documents these development, build, and preview workflows in its [Getting Started guide](https://vite.dev/guide/). The preview server is for local review rather than production hosting; see the [static deployment guide](https://vite.dev/guide/static-deploy.html).

---

## 🗂️ 8. Project Structure

```text
saa-wak/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── src/
    ├── App.tsx       # Screens, navigation, and user interactions
    ├── data.ts       # Types and fictional crop-market records
    ├── main.tsx      # React entry point
    └── styles.css    # Shared styles and responsive layouts
```

---

## 🔎 9. Data and Service Status

SAA-WAK currently provides a **frontend application with seeded fictional data**. The following services are not connected in this release:

- Live mandi price sources or external price APIs
- Server-side API or database
- Real user accounts or identity verification
- Background alert monitoring or SMS, email, and push notifications
- Real calls, messaging, payments, or transaction processing

The profile and role controls support local application navigation only. Browser-side ownership checks do not provide server security. Clearing browser site data resets locally stored changes.

---

## 🔌 10. Backend Integration

The product data model is organized around six collections:

`users` · `crops` · `markets` · `prices` · `listings` · `alerts`

The frontend data boundary can later be connected to REST endpoints for reading crop and market records, querying price history, and creating or managing listings and alerts. A future server should validate requests and enforce account roles and record ownership. Database credentials and privileged keys belong on the server and should never be bundled into the browser application.

---

<div align="center">

**saa-wak — ساوڪ**  
**Know the market. Grow with confidence.**

</div>
