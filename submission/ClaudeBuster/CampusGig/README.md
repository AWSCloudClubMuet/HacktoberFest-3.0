# 🎓 Campus Gig & SkillSwap Portal

**Team Name:** ClaudeBuster  
**Branch:** `ClaudeBuster`  
**Folder:** `submission/ClaudeBuster/CampusGig`  
**Platform:** Modern Web Application (HTML5, Vanilla Glassmorphism CSS, ES6 Modules, Node.js)  

---

## 🎯 Overview

The **Campus Gig & SkillSwap Portal** is a student peer marketplace enabling university students to exchange services, request academic or project assistance, and collaborate for payment, skill swap, or free peer volunteering. 

The application implements all 5 hackathon milestones, enforcing role flexibility, application rules, status transitions, mutual two-way reviews, and dynamic reputation calculation.

---

## 📍 Milestones & Features Implemented

### 🧩 Milestone 1 — Profiles & Gig Creation
- **Role-Flexible Profiles:** Any student can act as a **Poster** on their own gigs and an **Applicant** on peers' gigs.
- **Dynamic Stats:** User profiles display real-time computed stats:
  - Total Gigs Posted
  - Total Gigs Completed (as owner or accepted applicant)
  - Dynamically computed Average Rating & Review count from stored mutual reviews.
- **Validated Gig Creation:**
  - Create gigs with Title, Description, Category, Type, Payment Type, Budget, and Deadline.
  - Categories: **Programming**, **Design**, **Writing**, **Tutoring**.
  - Types: **Offering Service** or **Requesting Help**.
  - Payment: **Paid** (validates positive budget), **SkillSwap**, or **Free**.

### 🧩 Milestone 2 — Discovery & Applications
- **Multi-Factor Filtering:**
  - Category filter pills with counts (`All`, `Programming`, `Design`, `Writing`, `Tutoring`).
  - Type filter (`All`, `Offering`, `Requesting`).
  - Payment filter (`All`, `Paid`, `SkillSwap`, `Free`).
  - Status filter (`All`, `Open`, `In Progress`, `Completed`, `Expired`).
  - Budget range inputs (Min & Max).
- **Search:** Instant debounced keyword search across titles and descriptions.
- **Application System:**
  - Submit applications with a custom proposal message.
  - Track applications with status badges (`Pending`, `Accepted`, `Rejected`) in the "My Applications" view.
- **Business Rule Enforcement:**
  - ❌ **Cannot apply to user's own gig.**
  - ❌ **Cannot submit duplicate applications to the same gig.**
  - ⏰ **Gigs past their deadline automatically transition to `Expired`.**

### 🧩 Milestone 3 — Applicant Selection & Status Lifecycle
- **Ownership Permissions:** Only gig owners can review applications, accept candidates, or change gig status.
- **One-Click Acceptance Workflow:**
  - Accepting one applicant automatically changes the gig status to **`In Progress`**.
  - Automatically **rejects all other pending applications** for that gig.
  - Closes the gig to any new applications.
- **Strict Status Lifecycle:**
  - `Open` ➔ `In Progress` ➔ `Completed` (or `Cancelled` / `Expired`).
  - **Rule enforced:** Gigs can **only be marked `Completed` from `In Progress` status**.

### 🧩 Milestone 4 — Mutual Reviews & Calculated Reputation
- **Two-Way Mutual Reviews:**
  - Once a gig is marked `Completed`, the owner and the accepted applicant can each rate the other from 1 to 5 stars and leave a comment.
- **Strict Review Rules:**
  - Only participants (owner & accepted applicant) can review.
  - Only **one review per reviewer for that gig** (prevents duplicate reviews).
- **Dynamic Reputation:**
  - Profile ratings are computed dynamically (`sum(ratings) / count(reviews)`) directly from stored review records.

### 🧩 Milestone 5 — Mock API & Seed Data
- **Mock REST API Endpoints:**
  - `GET /users`: List users with computed stats.
  - `GET /users/:id`: Single user profile with received reviews.
  - `GET /gigs?category=...&type=...&payment_type=...&q=...`: Filterable discovery.
  - `GET /gigs/:id`: Gig details with owner info and application list.
  - `POST /gigs`: Create gig with validation.
  - `PATCH /gigs/:id`: Status transitions (Completed only from In Progress).
  - `POST /applications`: Apply to gig (self-apply & duplicate checks).
  - `PATCH /applications/:id`: Accept applicant (sets In Progress, auto-rejects others).
  - `POST /reviews`: Two-way rating & review submission.
- **Rich Seed Data Included:**
  - **12 Users** across various majors (CS, SE, Design, EE, Business, Math).
  - **25 Gigs** spanning Programming, Design, Writing, and Tutoring, all payment types, and all statuses (`Open`, `In Progress`, `Completed`, `Expired`, `Cancelled`).
  - **21 Applications** covering Pending, Accepted, and Rejected statuses.
  - **10 Mutual Reviews** with ratings 1-5 and detailed feedback.
  - **Live Reset Button:** Restore database to default seeds at any time.

---

## 🗃️ Database Structure

```
Users:
├── id: string (e.g. "usr_1")
├── name: string
├── major: string
├── semester: string
├── bio: string
├── skills: string[]
└── avatar: string (URL)

Gigs:
├── id: string (e.g. "gig_1")
├── user_id: string (owner FK)
├── title: string
├── description: string
├── type: "Offering" | "Requesting"
├── category: "Programming" | "Design" | "Writing" | "Tutoring"
├── payment_type: "Paid" | "SkillSwap" | "Free"
├── budget: number | null
├── deadline: string (YYYY-MM-DD)
├── status: "Open" | "In Progress" | "Completed" | "Expired" | "Cancelled"
├── accepted_applicant_id: string | null
└── created_at: string

Applications:
├── id: string
├── gig_id: string (FK)
├── applicant_id: string (FK)
├── message: string
├── status: "Pending" | "Accepted" | "Rejected"
└── created_at: string

Reviews:
├── id: string
├── gig_id: string (FK)
├── reviewer_id: string (FK)
├── reviewee_id: string (FK)
├── rating: number (1 - 5)
└── comment: string
```

---

## 🚀 Quick Start Guide

### 1. Launch Web Application Locally
From `submission/ClaudeBuster/CampusGig`:
```powershell
.\start.bat
```
Or with Node.js directly:
```bash
node server.js
```
Then open: **`http://localhost:3000`** in your browser!

### 2. Run the Automated Test Suite
```powershell
.\test.bat
```
Or with Node.js directly:
```bash
node test/test-api.js
```

---

## 🧪 Test Suite Results

```
===============================================================
  🎓 CAMPUS GIG & SKILLSWAP PORTAL — AUTOMATED VERIFICATION   
===============================================================
 ✅ [PASS] M5: Seed data contains >= 12 users
 ✅ [PASS] M5: Seed data contains >= 25 gigs across required categories & statuses
 ✅ [PASS] M5: Seed data contains >= 20 applications with varied statuses
 ✅ [PASS] M5: Seed data contains >= 8 reviews with ratings 1-5 and comments
 ✅ [PASS] M1: Role flexibility (user acts as Poster on one gig, Applicant on another)
 ✅ [PASS] M1: Validated gig creation (Paid requires positive budget)
 ✅ [PASS] M2: Filter and search across title and description
 ✅ [PASS] M2: Reject application to user's own gig
 ✅ [PASS] M2: Reject duplicate application to same gig
 ✅ [PASS] M2: Gigs past deadline while still Open appear as Expired
 ✅ [PASS] M3: Only gig owner can accept applicant
 ✅ [PASS] M3: Accepting applicant transitions gig to In Progress and rejects other applicants
 ✅ [PASS] M3: Allow completion ONLY from In Progress status
 ✅ [PASS] M4: Two-way reviews permitted after completion
 ✅ [PASS] M4: Only one review per reviewer for that gig
 ✅ [PASS] M4: Dynamic average rating calculated from stored reviews
===============================================================
 TOTAL TESTS: 16 | PASSED: 16 | FAILED: 0
===============================================================
```