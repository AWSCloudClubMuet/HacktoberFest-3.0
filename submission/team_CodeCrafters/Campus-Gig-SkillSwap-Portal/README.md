# CampusLoop — Campus Gig & SkillSwap Portal

> **Skills connect. Opportunities grow.**  
> Built by **Team CodeCrafters** for **HacktoberFest-Hackathon 2026** (GitHub Issue #12)  
> **Project Location:** `submission/team_CodeCrafters/Campus-Gig-SkillSwap-Portal/`

---

## 1. Project Overview & Problem Statement

### The Problem
University students frequently need specialized assistance with academic projects, software engineering tasks, UI/UX designs, research papers, and STEM coursework. However:
- Commercial freelancing platforms charge high commissions and cater to enterprise budgets, making them inaccessible for campus students.
- Informal student communication channels (WhatsApp groups, Discord servers, notice boards) are scattered, noisy, and lack trust verification or milestone tracking.
- Students possess complementary skills (e.g., a Computer Science major needing a design logo; a Design major needing a portfolio website) but have no structured channel to trade their talents without money.

### The Solution: CampusLoop
**CampusLoop** is a university marketplace and peer skill-sharing platform. It bridges the gap between campus talent and student needs by offering:
1. **Paid Micro-Gigs:** Budget-friendly student opportunities with transparent campus pricing.
2. **Skill Swaps (Zero-Cash Barter):** Direct exchange of complementary services (e.g., React development for Figma brand identity) without financial barriers.
3. **Verified Academic Reputation:** Closed-loop peer reviews and live dynamic ratings that help students build an authentic campus portfolio.

---

## 2. Key Goals & Features

### Core Hackathon Milestones Implemented
- **Milestone 1 — Student Profiles & Demo Switching:**
  - 12 verified student personas spanning Computer Science, Design, Journalism, Mathematics, Engineering, and Business.
  - Profile customization (majors, semester, bio, and skills list) with ownership protection.
  - Safe one-click demo account switcher for judging and evaluation without passwords.
- **Milestone 2 — Gig Discovery & Management:**
  - Explore opportunities across 4 core campus categories: **Programming**, **Design**, **Writing**, and **Tutoring**.
  - Multi-parameter search and filtering by keyword, category, payment type (`Paid`, `Skill Swap`, `Free`), and budget range.
  - Multi-criteria sorting (newest, deadline, budget high-to-low, budget low-to-high, poster rating).
  - Automated deadline tracking with real-time expiration handling.
  - Comprehensive gig creation form with client and server-side validation.
- **Milestone 3 — Proposal Management & Atomic Work Workflow:**
  - Proposal submissions with personalized application pitches.
  - Business rules: Own-gig application prevention (`400`) and duplicate proposal prevention (`400`).
  - **Atomic Applicant Selection:** When a gig poster accepts an applicant, the database executes an atomic transaction that moves the gig to `In Progress`, assigns the collaborator, marks the chosen application `Accepted`, and rejects all competing pending applications.
  - Work lifecycle transitions: `Open → In Progress → Completed`.
  - Authorized completion check: Only project participants can advance an in-progress gig to `Completed`.
- **Milestone 4 — Mutual Reviews & Calculated Reputation:**
  - Reciprocal peer reviews available exclusively after a gig is `Completed`.
  - Reviewer/reviewee relationship validation (participants only; duplicate reviews blocked).
  - Ratings (1–5 stars) with mandatory review comments.
  - Dynamic reputation engine: Student average ratings and review counts are recalculated in the database from stored reviews.
- **Milestone 5 — Campus AI Assistant:**
  - Rule-based intelligent assistant connected directly to live SQLite database records via `/api/ai/query`.
  - Answers natural language questions, surfaces matching open opportunities, and guides students through the platform workflow.

### Additional Platform Enhancements
- **Dual Theme System:** Light mode (`#F5F7FA`) and Dark mode (`#0B1020` / `#121A2B`) built with accessible color tokens and persisted via `localStorage`.
- **Responsive Layout:** Responsive full-width application shell tested across 320px to 1920px+ viewports without horizontal clipping.
- **Persistent Messaging:** 1-on-1 direct student chat persisted in the database.
- **Notification Feed:** Stored notifications tracking proposals, acceptance alerts, and review submissions.
- **Global Error Boundary:** Safe React error boundary component with instant recovery fallbacks.

---

## 3. Technology Stack

Based strictly on the verified project codebase:

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19 (`^19.3.1`), Vite 8 (`^8.3.4`) |
| **Styling & Design** | Tailwind CSS v3 (`^3.4.19`), PostCSS (`^8.5.31`), Autoprefixer (`^10.6.1`) |
| **Icons & Typography** | Lucide React (`^1.60.0`), Inter font family |
| **Backend Runtime** | Node.js (v24), Express 5 (`^5.3.0`) |
| **Database Engine** | SQLite via `better-sqlite3` (`^13.0.3`) with Write-Ahead Logging (`WAL`) & Foreign Keys |
| **Configuration** | Dotenv (`^18.0.8`), CORS (`^2.8.6`) |
| **Process Orchestration** | Concurrently (`^10.0.6`) |
| **Testing** | Node.js native assert test runner (`test/api.test.js`) |
| **Code Quality** | Oxlint (`^1.88.0`) |

---

## 4. Architecture & Directory Structure

```text
submission/team_CodeCrafters/Campus-Gig-SkillSwap-Portal/
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules (protects DB & secrets)
├── .oxlintrc.json                # Linter configuration
├── index.html                    # HTML shell
├── package.json                  # NPM scripts and dependencies
├── postcss.config.js             # PostCSS configuration
├── tailwind.config.js            # Tailwind theme tokens & dark mode
├── vite.config.js                # Vite build & dev proxy configuration
├── public/                       # Static public assets
│   ├── favicon.svg               # Application icon
│   └── icons.svg                 # SVG sprite sheet
├── server/                       # Backend API & Database
│   ├── campusloop.db             # SQLite database file (auto-seeded)
│   ├── db.js                     # SQLite schema, connection & seeder
│   ├── index.js                  # Express 5 server & middleware
│   ├── seedData.js               # Seed dataset (12 users, 26 gigs, 20 apps)
│   └── routes/                   # REST API Route Handlers
│       ├── ai.js                 # AI Assistant DB search
│       ├── applications.js       # Proposal management & atomic acceptance
│       ├── bookmarks.js          # Saved gigs toggle
│       ├── conversations.js      # Persistent chat
│       ├── gigs.js               # Gig CRUD, filters & status lifecycle
│       ├── notifications.js      # User notification alerts
│       ├── reviews.js            # Mutual reviews & rating calculations
│       ├── stats.js              # Platform summary statistics
│       └── users.js              # Student profiles & live reputation
├── src/                          # React Frontend
│   ├── App.jsx                   # Main shell, screen router & ErrorBoundary
│   ├── index.css                 # Theme CSS custom properties & Tailwind
│   ├── main.jsx                  # Application entry point
│   ├── assets/                   # Visual assets (hero.png, vite.svg, react.svg)
│   ├── components/               # UI Components
│   │   ├── cards/                # GigCard.jsx
│   │   ├── common/               # Modals, Badges, ErrorBoundary, RatingStars
│   │   ├── layout/               # Navbar, Sidebar, MobileNav, Footer
│   │   └── screens/              # 10 Application Screen Views
│   ├── context/
│   │   └── AppContext.jsx        # Global reactive state & API synchronizer
│   └── services/
│       └── api.js                # Configurable HTTP API client service
└── test/
    └── api.test.js               # 25-point automated verification test suite
```

---

## 5. Prerequisites

- **Node.js:** v18.0.0 or higher (tested on Node v24.21.0)
- **npm:** v10.0.0 or higher
- **Operating System:** Windows, macOS, or Linux

---

## 6. Installation & Local Development

### Step 1: Navigate to the Project Folder
From the repository root:
```bash
cd submission/team_CodeCrafters/Campus-Gig-SkillSwap-Portal
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to create `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

### Step 4: Seed the Database
Initialize tables and populate demo data:
```bash
npm run seed
```

### Step 5: Start the Application

#### Recommended: Start Frontend and Backend Concurrently
```bash
npm start
```
This runs both:
- **Express Backend:** `http://localhost:5000`
- **Vite Frontend (with API proxy):** `http://localhost:5173`

#### Alternative: Run in Separate Terminals
**Terminal 1 (Backend API):**
```bash
npm run server
```

**Terminal 2 (Frontend Dev Server):**
```bash
npm run dev
```

### Step 6: Open CampusLoop
Visit **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 7. Environment Variables

The project uses `.env` for local configuration. Placeholders are documented in `.env.example`:

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | Port for the Express backend server |
| `DATABASE_PATH` | `./server/campusloop.db` | Local file path for the SQLite database |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5000` | Permitted CORS origins for API requests |
| `VITE_API_URL` | *(empty)* | Optional: Base URL for split frontend deployments (defaults to relative `/api`) |

---

## 8. Database Architecture & Seed Dataset

CampusLoop uses a persistent SQLite database managed by `better-sqlite3` with Write-Ahead Logging (`WAL`) mode enabled for high concurrency.

### Tables (8)
1. `users` — Student profiles, semester info, bio, skills, gigs posted/completed, rating, and review count.
2. `gigs` — Campus opportunities with type (`Offering`/`Requesting`), category, payment type, budget, deadline, and status (`Open`, `In Progress`, `Completed`, `Expired`).
3. `applications` — Student proposals with status (`Pending`, `Accepted`, `Rejected`) and message text.
4. `reviews` — Mutual reviews with 1–5 star ratings, feedback comments, and timestamps.
5. `conversations` — 1-on-1 student message threads.
6. `messages` — Individual messages linked to conversations.
7. `notifications` — Event-driven student alerts.
8. `bookmarks` — Saved opportunities per student.

### Seed Dataset
The database includes an idempotent seed script (`npm run seed`) that populates:
- **12 Verified Students** across 6 academic disciplines.
- **26 Gigs** (13 Offering, 13 Requesting) spanning Paid, Skill Swap, and Free opportunities.
- **20 Applications** demonstrating various lifecycle states.
- **10 Mutual Reviews** between collaborators.
- Conversations, messages, notifications, and bookmarks.

---

## 9. API Endpoints

The Express server exposes RESTful endpoints at `/api`:

### System & Health
- `GET /api/health` — Service health check.
- `GET /api/stats` — Dynamic platform counts and average satisfaction ratings.
- `POST /api/ai/query` — Rule-based AI assistant database search.

### Students & Profiles
- `GET /api/users` — List all student accounts.
- `GET /api/users/:id` — Get student profile with live calculated ratings and 5-star distribution.
- `PATCH /api/users/:id` — Update student profile (requires `x-user-id` header matching `:id`).

### Gigs & Opportunities
- `GET /api/gigs` — List gigs with filtering (`search`, `category`, `type`, `payment_type`, `min_budget`, `max_budget`, `status`, `sort`).
- `GET /api/gigs/:id` — Get single gig details with poster info and application count.
- `POST /api/gigs` — Create new gig (requires `x-user-id` header; validates positive budget for Paid gigs).
- `PATCH /api/gigs/:id` — Update gig details or status (`In Progress → Completed`; enforces participant checks).
- `DELETE /api/gigs/:id` — Delete gig (owner-only).

### Applications & Proposals
- `GET /api/applications` — List applications (filterable by `gig_id`, `applicant_id`, `status`).
- `POST /api/applications` — Submit application (enforces own-gig block, duplicate block, and deadline check).
- `PATCH /api/applications/:id/accept` — **Atomic acceptance:** accepts proposal, marks gig `In Progress`, assigns collaborator, and rejects competing pending proposals (owner-only).
- `PATCH /api/applications/:id/reject` — Reject proposal (owner-only).

### Mutual Reviews
- `GET /api/reviews` — List reviews (filterable by `gig_id`, `reviewee_id`, `reviewer_id`).
- `POST /api/reviews` — Submit mutual review (enforces Completed gig status, participant check, 1-5 rating, and duplicate review block; recalculates reviewee rating in DB).

### Messages, Notifications & Bookmarks
- `GET /api/conversations` — List conversations for authenticated user (`x-user-id`).
- `POST /api/conversations/:id/messages` — Send message (participant-only).
- `GET /api/notifications` — List notifications for user (`x-user-id`).
- `PATCH /api/notifications/read-all` — Mark all notifications as read.
- `PATCH /api/notifications/:id/read` — Mark single notification as read.
- `GET /api/bookmarks` — List bookmarked gig IDs.
- `POST /api/bookmarks/:gigId` — Toggle saved gig bookmark.

---

## 10. Verified Demo Accounts

To simplify hackathon evaluation without password friction, CampusLoop features a **Demo Account Switcher** modal in the navigation bar. You can switch personas instantly:

| ID | Name | Faculty / Major | Semester | Primary Focus |
|---|---|---|---|---|
| `usr_1` | **Aarav Sharma** | Computer Science | 6th Sem | Full-Stack Web Development, React, Node.js |
| `usr_2` | **Rohan Kumar** | Computer Engineering | 8th Sem | Backend Architecture, Cloud & DSA |
| `usr_3` | **Sneha Patel** | Digital Media & Design | 4th Sem | UI/UX Design, Figma, Brand Identity |
| `usr_4` | **Priya Verma** | English & Journalism | 6th Sem | Academic Writing, SOPs, Essay Editing |
| `usr_5` | **Karan Singh** | Mathematics & Computing | 5th Sem | Calculus, Linear Algebra, Tutoring |
| `usr_6` | **Neha Gupta** | Information Technology | 3rd Sem | Web Fundamentals, Frontend Mentorship |
| `usr_7` | **Vikram Mehta** | Electrical Engineering | 7th Sem | Arduino, Embedded Systems, Robotics |
| `usr_8` | **Ananya Roy** | Business Administration | 5th Sem | Financial Modeling, Pitch Decks |
| `usr_9` | **Devendra Rao** | Mechanical Engineering | 6th Sem | CAD, SolidWorks, 3D Modeling |
| `usr_10` | **Simran Kaur** | Applied Physics | 4th Sem | Physics Tutoring, Thermodynamics |
| `usr_11` | **Tanmay Deshmukh** | Computer Science | 2nd Sem | Python Tutoring, Open Source Basics |
| `usr_12` | **Zoya Akhtar** | Film & Animation | 5th Sem | Video Editing, Motion Graphics, Reels |

---

## 11. Automated Test Suite & Verified Results

A 25-point automated test suite verifies all backend API operations, validation constraints, authorization barriers, and atomic transitions.

### Run Tests
```bash
npm test
```

### Verified Test Results (25 Passed, 0 Failed)
```text
========================================
🧪 Starting CampusLoop Backend Test Suite
========================================
  ✅ PASS: GET /api/health returns healthy status
  ✅ PASS: Seeded database meets all minimum hackathon requirements
  ✅ PASS: GET /api/users/:id returns user profile with live calculated rating
  ✅ PASS: PATCH /api/users/:id rejects unauthorized edit (x-user-id mismatch)
  ✅ PASS: PATCH /api/users/:id permits owner edit
  ✅ PASS: GET /api/gigs filters by category, payment type, and search keyword
  ✅ PASS: POST /api/gigs rejects missing required fields and negative budget
  ✅ PASS: POST /api/gigs creates valid gig and updates poster posted count
  ✅ PASS: POST /api/applications prevents user from applying to own gig
  ✅ PASS: POST /api/applications accepts valid proposal from eligible student
  ✅ PASS: POST /api/applications prevents duplicate application from same student
  ✅ PASS: Add competing applicant usr_4 for atomic testing
  ✅ PASS: PATCH /api/applications/:id/accept executes atomic acceptance and rejects competing applicants
  ✅ PASS: POST /api/applications rejects application on non-open gig
  ✅ PASS: PATCH /api/gigs/:id to Completed enforces participant authorization
  ✅ PASS: POST /api/reviews enforces mutual review rules and recalculates rating in DB
  ✅ PASS: GET & POST /api/conversations persists conversation messages
  ✅ PASS: GET & PATCH /api/notifications returns and updates read status
  ✅ PASS: GET & POST /api/bookmarks toggles gig bookmarks
  ✅ PASS: GET /api/stats returns accurate dynamic platform figures
  ✅ PASS: POST /api/ai/query returns real database gigs and answers
  ✅ PASS: PATCH /api/applications/:id/reject enforces gig owner authorization
  ✅ PASS: User switching isolates notifications and conversations to current student
  ✅ PASS: POST /api/conversations/:id/messages rejects unauthorized non-participants
  ✅ PASS: API returns appropriate 404s for invalid IDs

----------------------------------------
Results: 25 passed, 0 failed
----------------------------------------
```

### Production Build Verification
```bash
npm run build
```
- **Result:** 1,955 modules transformed, production assets compiled cleanly into `dist/` in under 4 seconds with zero build errors.

---

## 12. Visual Assets & Screenshots

Visual assets and icons available within the repository:
- **Hero Composition Asset:** `src/assets/hero.png`
- **Application Favicon:** `public/favicon.svg`
- **SVG Icon Sprite:** `public/icons.svg`
- **Vite & React Brand Assets:** `src/assets/vite.svg`, `src/assets/react.svg`

---

## 13. Security Considerations & Known Limitations

### Security Features
- **SQL Injection Prevention:** All SQLite queries in `server/db.js` and route handlers use parameterized prepared statements.
- **Authorization & Ownership:** All state-modifying endpoints (profile edits, application decisions, gig completions, reviews) verify the caller's identity via `x-user-id`.
- **CORS Whitelisting:** Permitted origins are configurable via `ALLOWED_ORIGINS` to prevent unauthorized cross-origin requests.
- **Input Validation:** Required field, positive budget, enum category, and date checks are enforced on the server.
- **Crash Protection:** Frontend includes a global React `ErrorBoundary` with reload and home navigation fallbacks.

### Known Limitations
- **Demo Authentication:** For hackathon judging ease, authentication is simulated via the active user switcher and `x-user-id` header. Production multi-tenant deployment would require JWT tokens or OAuth (e.g., Auth0 / Supabase Auth).
- **Persistent Storage on Ephemeral Hosting:** SQLite stores data in a local file (`server/campusloop.db`). When deploying to ephemeral containers (e.g., standard Render/Heroku instances without persistent disks), the database file will reset on redeployment unless mounted to a persistent volume or migrated to managed PostgreSQL.
- **Polling vs WebSockets:** Direct messaging operates via resilient HTTP API endpoints rather than persistent WebSocket connections.

---

## 14. Project Credits & Submission Details

- **Project Name:** CampusLoop — Campus Gig & SkillSwap Portal
- **Team Name:** **Team CodeCrafters**
- **Hackathon:** **HacktoberFest-Hackathon 2026**
- **GitHub Issue:** **#12: Campus Gig & SkillSwap Portal**
- **Repository Location:** `submission/team_CodeCrafters/Campus-Gig-SkillSwap-Portal/`
- **Tagline:** *Skills connect. Opportunities grow.*
