# 404 MERCY — KisanMandi Hackathon Submission

This directory contains the final production upgrade for **KisanMandi: Real-Time Agricultural Marketplace & Crop Prices** by **Team 404 MERCY**.

The complete project source code, PostgreSQL schema migrations, SQL seed generator, automated test suite, and configuration reside in [`kisanmandi/`](./kisanmandi).

## Key Upgrades
1. **Supabase Authentication**: Real multi-user sign in, registration, role management (Farmer vs. Buyer), session persistence, and secure logout.
2. **PostgreSQL Database & Row Level Security (RLS)**: Six normalized entities with strict RLS policies, foreign keys, and indexes.
3. **Supabase Realtime Marketplace**: Live WebSocket subscriptions for instant produce listing updates across multiple connected devices.
4. **Dual-Backend Support**: Seamless production integration with Supabase, with transparent fallback to local JSON Server for offline development.
5. **Agricultural Decision Support**: Retains 14-day Recharts price trend charts, Sindh market comparisons, automated price alerts, and interactive profit calculator.

## Quick Run

```bash
cd kisanmandi
npm install
npm run seed
npm run api     # Starts local fallback mock on http://localhost:3001
npm run dev     # Starts Frontend on http://localhost:5173
```

To run the comprehensive 48-check automated verification suite:
```bash
cd kisanmandi
node verify.js
```

Refer to [`kisanmandi/README.md`](./kisanmandi/README.md) for full project documentation, database migrations, and deployment instructions.
