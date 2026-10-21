# KisanMandi: Real-Time Agricultural Marketplace & Crop Prices
**Team 404 MERCY | Hackathon Master Upgrade**

> A full-stack, mobile-first agricultural web application for farmers in Sindh, Pakistan. Enables wholesale crop price discovery, market trend analysis, automated price alerts, what-if profit calculations, and a real-time produce marketplace with genuine multi-user authentication, PostgreSQL persistence, Row Level Security (RLS), and live WebSocket subscriptions.

> ⚠️ **Notice**: Fictional sample data — not live mandi prices.

---

## 🌟 Upgraded Highlights & Architecture

### 1. Real User Authentication (Supabase Auth)
- **Email & Password Authentication**: Full Sign In and Registration workflows with secure password hashing handled directly by Supabase Auth (`auth.users`).
- **Persistent Profile Store**: User profile metadata (`full_name`, `phone`, `district`, `role`) linked to `auth.users(id)` in a dedicated `public.profiles` PostgreSQL table.
- **Server-Side Profile Trigger**: An atomic PostgreSQL trigger (`handle_new_user()`) automatically initializes profile records upon user registration.
- **Persistent Sessions**: Refreshing the browser or switching tabs maintains authenticated state via Supabase's auto-refreshing JWT session storage.
- **User Account View**: In-app modal displaying user profile details, district, contact, assigned role (**Farmer** or **Buyer**), and secure logout.
- **Role-Based Access Control**:
  - **Farmer**: Full access to Prices, Real-Time Marketplace, Price Alerts, My Listings manager, and Profit Calculator.
  - **Buyer**: Streamlined access to Prices and Marketplace. Farmer management tools are hidden.

### 2. Multi-User Realtime Marketplace (Supabase Realtime)
- **Live WebSocket Channels**: Built with Supabase Realtime (`postgres_changes` on `public.listings`).
- **Instant Produce Broadcasting**: When Farmer A posts or edits produce, connected buyers and farmers see the new listing appear immediately without refreshing.
- **Dynamic Status Updates**: When a seller marks a listing as **Sold** or deletes it, connected clients remove it from their active view in real time.
- **Clean Unmounts**: React subscriptions cleanly unsubscribe via `supabase.removeChannel()` on component unmount, preventing memory leaks and duplicate handlers.

### 3. PostgreSQL Database with Row Level Security (RLS)
- **Six Core Entities**: `profiles`, `crops`, `markets`, `prices`, `listings`, and `alerts`.
- **Database-Enforced Integrity**:
  - Foreign keys with `ON DELETE CASCADE` / `RESTRICT`.
  - Check constraints for valid roles (`farmer`, `buyer`), grades (`A`, `B`, `C`), conditions (`above`, `below`), and positive numbers (`quantity > 0`, `price > 0`, `target_price > 0`).
  - Performance indexes on frequently filtered columns (`(crop_id, market_id, date DESC)`, `status`, `seller_id`, `user_id`).
- **Row Level Security (RLS) Policies**:
  - `listings`: Public/authenticated can view active listings; only authenticated sellers can insert, modify, or delete their own listings.
  - `alerts`: Strictly scoped to the authenticated user (`user_id = auth.uid()`).
  - `profiles`: Publicly readable; updateable only by the account owner.
  - `crops`, `markets`, `prices`: Publicly readable by all users.

### 4. Dual-Backend Architecture
- **Production Mode**: Automatically activates when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided.
- **Local Fallback Mode**: Gracefully operates with the built-in JSON Server HTTP mock at `http://localhost:3001` if cloud credentials are not yet supplied, guaranteeing offline development and testing never fail.

### 5. Preserved Core Agricultural Tools
- **14-Day Price Charts**: Interactive line charts rendered with [Recharts](https://recharts.org), showing min, max, and arithmetic average prices.
- **Sindh Market Comparison**: Compares the latest mandi rates across Hyderabad, Sukkur, and Larkana, highlighting the highest-priced market.
- **Dynamic Price Classification**: Categorizes asking prices dynamically as **Below Market** (`< -5%`), **At Market** (`-5%` to `+5%` inclusive), or **Above Market** (`> +5%`).
- **Interactive Profit Calculator**: Features an interactive `-20%` to `+20%` price adjustment slider with live recalculation of revenue, costs, net profit/loss, and profit margin.

---

## 📁 Upgraded Project Structure

```
kisanmandi/
├── .env                              # Local environment variables
├── .env.example                      # Safe template with Supabase & API keys
├── .gitignore                        # Ignores node_modules, dist, .env
├── db.json                           # Local JSON Server fallback database (6 collections)
├── index.html                        # Application HTML root
├── package.json                      # Scripts & dependencies (@supabase/supabase-js, recharts, react)
├── seed.js                           # Seed generator for local database (370 records)
├── verify.js                         # 48-check automated end-to-end verification suite
├── vite.config.js                    # Vite configuration (output: dist)
├── supabase/
│   ├── migrations/
│   │   └── 20261021_init_schema.sql  # Complete PostgreSQL schema, constraints, RLS, triggers & realtime
│   └── seed.sql                      # SQL seed data for crops, markets, and 336 price records
└── src/
    ├── main.jsx                      # React entrypoint
    ├── App.jsx                       # Root session listener & auth router
    ├── index.css                     # Premium agricultural design system & responsive layout
    ├── services/
    │   ├── api.js                    # Dual-backend data layer (Supabase with JSON Server fallback)
    │   ├── supabase.js               # Supabase Auth client & Realtime manager
    │   └── alertService.js           # Price alert evaluation & HTTP persistence
    └── components/
        ├── AuthScreen.jsx            # Sign In & Account Registration with role selection
        ├── AccountModal.jsx          # Profile details, role badge & secure sign out
        ├── AppShell.jsx              # Navigation shell, top bar, role tabs, alert badges
        ├── PricesScreen.jsx          # Mandi prices, search, category filters, refresh
        ├── TrendsPanel.jsx           # 14-day Recharts trend, statistics & market comparison
        ├── MarketplaceScreen.jsx     # Real-time produce offers, filters, sorting, call/WhatsApp
        ├── AlertsScreen.jsx          # Price alert rules, toggle activation & trigger notifications
        ├── MyListingsScreen.jsx      # Farmer produce manager (active vs sold)
        └── ProfitCalculator.jsx      # Production cost & what-if slider profit calculator
```

---

## ⚡ Quickstart & Local Setup

### 1. Install Dependencies
```bash
cd submission/404-mercy/kisanmandi
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
For production Supabase integration, update `.env`:
```ini
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
VITE_API_URL=http://localhost:3001
```

### 3. Setup Supabase Database (Cloud)
In your Supabase project dashboard:
1. Navigate to the **SQL Editor**.
2. Run [`supabase/migrations/20261021_init_schema.sql`](supabase/migrations/20261021_init_schema.sql) to create the tables, RLS policies, indexes, and triggers.
3. Run [`supabase/seed.sql`](supabase/seed.sql) to populate crops, markets, and initial 14-day wholesale price history.

### 4. Start Local Development
- Start local JSON Server fallback API (port 3001):
  ```bash
  npm run api
  ```
- Start Vite frontend (port 5173):
  ```bash
  npm run dev
  ```
- Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Run Verification Suite
Execute the comprehensive 48-check verification test suite:
```bash
node verify.js
```

### 6. Production Build
```bash
npm run build
```
Generates production-optimized static assets in `dist/`.

---

## 🧪 Verification Results

Automated test suite ([verify.js](verify.js)) results:
- **48 of 48 checks passed (100% success rate)**
- ✅ Database collections and seed record counts verified (`users`, `crops`, `markets`, `prices`, `listings`, `alerts`).
- ✅ 14 consecutive calendar days of price records verified across all crop-market combinations.
- ✅ Inclusive alert thresholds (`>=` and `<=`) and HTTP persistence verified.
- ✅ Daily price change calculations (positive, negative, zero, missing previous day).
- ✅ Dynamic market price labels (`-5.0%` At Market, `+5.0%` At Market, `<-5%` Below, `>+5%` Above).
- ✅ Profit calculator logic, net loss handling, and zero revenue edge cases.
- ✅ Supabase migration schema, RLS policies, triggers, and Realtime publications verified.

---

## 🚀 Deployment Instructions

### Frontend (Vercel / Netlify)
1. Link your repository.
2. Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Project Anon Public Key.

### Backend (Supabase)
- Hosted serverless PostgreSQL with built-in GoTrue Authentication and Realtime WebSocket replication.
- Zero server maintenance required; scalable and production-ready.
