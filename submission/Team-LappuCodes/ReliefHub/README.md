# ReliefHub – Sindh Flood Relief Command Platform

**Team Name:** Team LappuCodes  
**Project Title:** ReliefHub – Real-Time Flood Logistics & Resource Management  
**Domain:** Sindh Flood Relief & Operations Telemetry  

---

## 📌 Project Overview
**ReliefHub** is an intelligent disaster relief management platform designed to streamline flood logistics across affected districts in Sindh (Dadu, Sukkur, Guddu, Kotri, etc.). It addresses critical bottleneck challenges in emergency response by synchronizing real-time river hydro telemetry, automated stock allocation, and shelter capacity tracking.

---

## 🚀 Key Features

* **Live Sindh Hydro Telemetry Ticker:** Displays real-time water levels and flood alert states for major barrages and embankment zones.
* **1-Click Intelligent Dispatch Auto-Matcher:** Automatically calculates the optimal dispatch quantity ($\min(\text{Stock}, \text{Required} - \text{Fulfilled})$) and pre-fills shipment orders to critical shelter gaps.
* **Dynamic Shelter Capacity Rings:** SVG-based interactive heat rings that visually warn coordinators when camps hit maximum shelter capacity.
* **Role-Based Access Control:** Dual modes for **Central Command Coordinators** (full inventory, camp creation, dispatch approval) and **Field Volunteers** (kiosk donation entry, simplified status view).
* **Automated In-Kind Inventory Sync:** Recording an in-kind resource donation dynamically increments central warehouse inventory.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, Lucide Icons
* **Backend / API Mock:** JSON Server, Custom Node.js Telemetry Seeder
* **State & Communication:** React Hooks, Async REST API

---

## 👥 Team Members

* **Shiza Shah** (Team Lead) – Architecture, Integration & UI/UX Design

---

## 📦 Local Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/](https://github.com/)<your-username>/<repository-name>.git
   cd <repository-name>
   git checkout team-LappuCodes