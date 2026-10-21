# CampusLoop — Premium Campus Gig & SkillSwap Portal

> **AWS Cloud Club MUET HacktoberFest-3.0 Hackathon** — GitHub Issue #12  
> *Skills connect. Opportunities grow.*

---

## 🎓 Overview

**CampusLoop** is a university marketplace and peer skill-sharing platform. It allows verified university students to post opportunities, swap specialized skills with zero cash exchanged, collaborate on paid campus gigs, exchange mutual reviews, and build a verified academic reputation.

Built with genuine **mobile-first responsiveness** (320px to 1920px+ displays), a **custom dual theme engine** (Light & Dark mode with accessible contrast tokens), and a **persistent SQLite + Express backend** enforcing all hackathon milestone requirements.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Tailwind CSS v3, Lucide React icons, Vite 8 |
| **Backend** | Node.js (v24), Express 5, CORS, Dotenv |
| **Database** | SQLite via `better-sqlite3` with Write-Ahead Logging (`WAL`) & Foreign Keys |
| **Testing** | Node.js native test runner & assertion suite (`test/api.test.js`) |
| **Build & Tooling** | Vite, PostCSS, Oxlint, Concurrently |

---

## 🏗️ Backend & Database Architecture

The SQLite database resides at `server/campusloop.db` and enforces relational integrity via foreign key cascades and atomic transactions.

### Database Tables

1. **`users`**: 12 diverse campus students across Computer Science, Design, Journalism, Mathematics, IT, and Business. Tracks `gigs_posted`, `gigs_completed`, `rating`, `reviews_count`, and skills.
2. **`gigs`**: 26 campus opportunities spanning Programming, Design, Writing, and Tutoring. Supports `Offering` & `Requesting`, with `Paid`, `Skill Swap`, and `Free` payment types.
3. **`applications`**: 20 student proposals with status progression (`Pending`, `Accepted`, `Rejected`).
4. **`reviews`**: 10 reciprocal reviews with ratings (1–5 stars) and detailed comments between project collaborators.
5. **`conversations` & `messages`**: Persistent 1-on-1 direct messaging between students.
6. **`notifications`**: Real-time event notifications for proposals, status changes, and received reviews.
7. **`bookmarks`**: Per-user saved opportunities.

### Core Business Logic Enforced by the Backend

- **Milestone 1 (Student Profiles & Demo Switching):** Live calculated reputation, star breakdowns, and semester profiles. Protected profile editing via `x-user-id` header validation.
- **Milestone 2 (Gig Management & Search):** Input validation on title, description, category, payment type, positive budget, and deadline. Multi-parameter filtering, sorting, and automatic deadline expiration.
- **Milestone 3 (Atomic Work Flow & Competing Applications):**
  - Own-gig application prevention (`400`).
  - Duplicate application prevention (`400`).
  - **Atomic applicant acceptance:** When a gig poster accepts an applicant, the target proposal is marked `Accepted`, the gig status transitions to `In Progress` with assigned collaborator, and all other competing pending applications for that gig are atomically marked `Rejected`.
  - Authorized completion: Only project participants can advance status from `In Progress` to `Completed`.
- **Milestone 4 (Mutual Reviews & Calculated Reputation):**
  - Reviews permitted only for `Completed` gigs.
  - Allowed exclusively between the two project participants.
  - Re-reviews prevented.
  - Average student rating and review count are dynamically recalculated in the database from stored reviews.
- **Milestone 5 (AI Campus Assistant):** Connected to actual database records via `/api/ai/query` for real gig searches and contextual campus suggestions.

---

## 🚀 Quick Start & Local Execution

### 1. Prerequisites
- Node.js v18+ (tested on Node v24.21.0)
- npm v10+

### 2. Environment Configuration
Environment variables are configured in `.env` (refer to `.env.example` for defaults):
```env
PORT=5000
DATABASE_PATH=./server/campusloop.db
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000
```

### 3. Database Seeding
The database automatically initializes and seeds on first launch. To force a clean reseed:
```bash
npm run seed
```
This populates the required dataset: **12 students, 26 gigs, 20 applications, 10 reviews, and notifications**.

### 4. Running the Application Locally

#### Option A: Run Both Services Concurrently (Recommended)
```bash
npm start
```
Starts both the Express API backend (`http://localhost:5000`) and the Vite frontend with API proxying (`http://localhost:5173`).

#### Option B: Run in Separate Terminals
**Terminal 1 (Backend API):**
```bash
npm run server
```

**Terminal 2 (Frontend Dev Server):**
```bash
npm run dev
```

### 5. Local URLs
- **Frontend Application:** [http://localhost:5173/](http://localhost:5173/)
- **Backend API Base:** [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Automated Test Suite

A comprehensive 25-point automated verification test suite tests all backend endpoints, validation rules, authorization barriers, and atomic transitions:

```bash
npm test
```

### Tested Scenarios:
1. `GET /api/health` — API availability and healthy status.
2. Seed dataset count validation (`>= 12 users`, `>= 25 gigs`, `>= 20 applications`, `>= 8 reviews`).
3. User profile fetching and live dynamic rating calculation.
4. Profile edit authorization (`403` on caller mismatch, `200` for owner).
5. Gig filtering by category, payment type, search keyword, and sorting.
6. Gig creation validation (missing required fields, negative budgets).
7. Own-gig proposal prevention (`400`).
8. Proposal submission and duplicate prevention (`400`).
9. **Atomic applicant acceptance & competing proposal rejection** (Milestone 3).
10. Application prevention on non-open/expired gigs.
11. Work status transition authorization (`In Progress` -> `Completed`).
12. **Mutual review verification, duplicate prevention, and DB rating recalculation** (Milestone 4).
13. Conversation messaging persistence.
14. Notification fetching and read status persistence.
15. Saved opportunity bookmark toggling.
16. Dynamic platform summary statistics.
17. AI Campus Assistant querying against live database records.
18. Gig owner authorization on application rejection (`403` for non-owner, `200` for owner).
19. Demo account switching and user-specific notification isolation.
20. Conversation access control (non-participant message rejection with `403`).
21. Appropriate `404` error responses for invalid gig/user IDs.
22. Production build verification (`npm run build`).

---

## 📦 Production Build & Deployment Guide

### Building the Frontend
```bash
npm run build
```
Creates an optimized production bundle inside `dist/`.

### Deployment Architecture Options

#### 1. Unified Node.js Deployment (Single Service)
- Platforms: **Render, Railway, Fly.io, AWS Elastic Beanstalk, EC2**
- Deploy the Express server and serve the Vite `dist/` directory as static assets.
- **Persistent Storage Note for SQLite:** Ensure a persistent volume is mounted to the directory containing `DATABASE_PATH` (e.g., `/var/data/campusloop.db`), because ephemeral containers discard changes on redeploy.

#### 2. Split Deployment (Frontend on Static CDN + Backend API)
- **Frontend (Vercel, Netlify, Cloudflare Pages, AWS Amplify):**
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variable: `VITE_API_URL=https://api.yourdomain.com/api`
- **Backend (Render, Railway, AWS ECS/App Runner):**
  - Start command: `node server/index.js`
  - Environment variables:
    - `PORT=5000`
    - `DATABASE_PATH=/mnt/data/campusloop.db`
    - `ALLOWED_ORIGINS=https://your-frontend.vercel.app`
    - `NODE_ENV=production`

#### 3. Managed Database Alternative (Scale-Ready)
For large-scale public deployments requiring multi-region concurrency, the SQLite queries in `server/db.js` use standard SQL and can be migrated to **PostgreSQL** (e.g. AWS RDS / Supabase / Neon) by swapping the driver with `pg` or `prisma`.

---

## 🛡️ Security & Quality Standards

- **Parametric SQL Queries:** All SQL queries use parameterized prepared statements to eliminate SQL injection vulnerabilities.
- **Authorization & Ownership:** All state-modifying actions (profile edits, application decisions, gig completions, reviews) verify ownership and participants.
- **Error Boundaries:** UI wraps all screens in React `ErrorBoundary` with graceful fallbacks.
- **Responsive Layout:** Audited across 320px, 375px, 768px, 1024px, 1280px, 1440px, and 1920px viewports without horizontal clipping.
