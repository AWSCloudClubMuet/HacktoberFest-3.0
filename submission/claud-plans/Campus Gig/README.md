# 🎓 Campus Gig & SkillSwap Portal

A full-stack student micro-gig and peer skill-swapping platform built with **Node.js**, **Express**, and **MongoDB** (with resilient in-memory dual store fallback), paired with a modern **Lovable-grade SaaS design system**.

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
# Navigate to the Campus Gig folder
cd "submission/claud-plans/Campus Gig"

# Install dependencies
npm install
```

### 2. Run Server
```bash
# Start production server
npm start

# Or with nodemon for live reload
npm run dev
```
The application will launch on: **`http://localhost:5000`**

### 3. Run Automated 18-Point Test Suite
```bash
npm test
```

---

## 👥 User Switching ("Acting as...")
**No traditional login is required.**  
In the top-right navbar of every page, a role switcher dropdown (**"Acting as:"**) allows instant switching between **12 Pakistani-campus university students** (Ali Khan, Fatima Ahmed, Bilal Hassan, etc.).  
- The selected user's ID is stored in `localStorage` and dispatched automatically as the `x-user-id` header on every API request.
- The UI dynamically tailors owner controls, apply forms, and review dialogs based on the active user.

---

## 📊 Exact Seed Data Distribution (Block B Compliant)

| Entity | Target | Actual | Notes |
| :--- | :---: | :---: | :--- |
| **Users** | 12 | **12** | Pakistani-campus students (CSE, SE, EE, BBA, Design; semesters 1–8; 2–4 skills each) |
| **Gigs** | 25 | **25** | 8 Open (future deadline), 3 Open (past deadline showing as Expired), 1 Stored Expired, 4 In Progress, 7 Completed, 2 Cancelled |
| **Categories** | 4 | **4** | Programming (6), Design (6), Writing (6), Tutoring (7) |
| **Applications** | 24 | **24** | 11 Accepted, 7 Rejected, 6 Pending on Open gigs |
| **Reviews** | 8 | **8** | 4 Completed gigs × 2 peer reviews (owner ↔ applicant, ratings 3–5) |

---

## 📡 REST API Endpoint Reference

| Method | Route | Auth / Role | Description & Business Rules |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | System status, uptime, and MongoDB connection status. |
| `GET` | `/debug/counts` | Public | Verification checkpoint returning `{ users: 12, gigs: 25, applications: 24, reviews: 8 }`. |
| `POST` | `/debug/reset` | Public | Resets the dataset back to original seed counts. |
| `GET` | `/gigs` | Public | List gigs with computed `effectiveStatus`. Filters: `category`, `type`, `payment_type`, `minBudget`, `maxBudget`, `q`, `status`. |
| `GET` | `/gigs/:id` | Public | Full gig details, creator profile, accepted applicant, and received applications. |
| `POST` | `/gigs` | Authenticated | Create gig. Validation: category, type, future deadline; budget required only if `Paid` (forced `null` for `SkillSwap`/`Free`). |
| `PATCH` | `/gigs/:id` | Owner Only | Status transitions: `In Progress` → `Completed`, `Open` → `Cancelled`. Blocks `Completed` unless `In Progress`. |
| `POST` | `/applications` | Applicant | Submit application. Rules: gig must be `Open`, applicant cannot be gig owner, no duplicates (409), message required. |
| `PATCH` | `/applications/:id` | Owner Only | Accept / Reject. **On Accepted**: application = `Accepted`, gig = `In Progress`, all other pending applications = `Rejected`. |
| `GET` | `/applications` | Authenticated | List current user's submitted proposals with gig details & status. |
| `POST` | `/reviews` | Owner / Applicant | Submit 1–5 star peer review. Gig must be `Completed`, reviewer must be a participant, max 1 review per reviewer (409). |
| `GET` | `/reviews` | Public | Fetch reviews by `user_id` or `gig_id`. |
| `GET` | `/users` | Public | List all students with dynamically computed `gigsPosted`, `gigsCompleted`, and `averageRating`. |
| `GET` | `/users/:id` | Public | Single user profile with computed reputation statistics and review counts. |

---

## 🎨 Lovable SaaS Frontend Pages

The frontend is served directly by Express (`/public` directory) with a **Lovable-grade SaaS aesthetic**:
1. **Browse Marketplace (`index.html`)**: Real-time keyword search (`q`), category pill tabs, type & compensation selects, budget range filters, and responsive cards grid with high-contrast red `Expired` badges.
2. **Gig Details & Collaboration (`gig.html`)**: Opportunity details, creator card, application form with validation, owner application review panel (Accept/Reject cascade), Mark Completed button, and peer review form.
3. **Post an Opportunity (`create.html`)**: Dynamic form showing budget field only when `Paid` is selected, with client and server-side error banners.
4. **My Applications (`applications.html`)**: Proposal tracking table with live status badges (`Pending`, `Accepted`, `Rejected`) and links to gigs.
5. **Student Profile (`profile.html`)**: Full student profile, university major, semester, skills badges, and computed reputation metrics.

---

## 🧪 18-Point Business-Rule Checklist Results

Running `node test-checklist.js` verifies all 18 rules:
```
======================================================
🧪 RUNNING 18-POINT BUSINESS-RULE TEST CHECKLIST
======================================================
📡 GET /health: status 200 (ok)
📊 Seed counts: users=12, gigs=25, apps=24, reviews=8
✅ [#0] PASS: Seed Counts Check (12 users, 25 gigs, 24 apps, 8 reviews)
✅ [#1] PASS: Create Paid gig without budget returns 400
✅ [#2] PASS: Create gig with past deadline returns 400
✅ [#3] PASS: Create Free gig with budget forces budget to null
✅ [#4] PASS: Filter category=Design + type=Offering returns only matching gigs
✅ [#5] PASS: Search q=python matches in title or description
✅ [#6] PASS: Open gig with past deadline shown as Expired and blocks application
✅ [#7] PASS: Apply to your own gig is rejected
✅ [#8] PASS: Apply twice to the same gig returns 409 Conflict
✅ [#9] PASS: Non-owner tries to accept an applicant returns 403 Forbidden
✅ [#10] PASS: Owner accepts applicant: Gig In Progress, A Accepted, others Rejected
✅ [#11] PASS: Apply to gig after acceptance returns 400
✅ [#12] PASS: Complete a gig that is Open returns 400
✅ [#13] PASS: Owner completes In Progress gig -> status Completed
✅ [#14] PASS: Review on a gig that is not Completed returns 400
✅ [#15] PASS: Review by someone not involved returns 403
✅ [#16] PASS: Second review by the same reviewer returns 409
✅ [#17] PASS: Rating of 0 or 6 returns 400 error
✅ [#18] PASS: Valid review submitted and profile average updates
======================================================
📊 TEST RESULTS: 19 PASSED | 0 FAILED
======================================================
🎉 ALL 18 BUSINESS RULES PASSED WITH 100% SUCCESS!
```
