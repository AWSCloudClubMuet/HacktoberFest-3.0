# Campus Gig & SkillSwap Portal

## Team Member # 2

A modern, student-centric marketplace web application where university students offer specialized skills, request short-term assistance for payment or reciprocal skill exchange, and earn verified peer reputation through completed campus gigs.

---

## 👥 Team Information

- **Team Name:** Outliers
- **Branch:** `team-outliers`

---

## 🎯 Problem Statement Fulfillment

The project fully satisfies all specifications in `problemStatement.md`:

### 🧩 Milestone 1 — Profiles & Gig Creation

- ✅ **Role-Flexible Personas:** Any student can act as a **Poster** or **Applicant** dynamically depending on the gig.
- ✅ **Rich Student Profiles:** Displays name, major, semester, bio, peer-endorsed skills, gigs posted count, gigs completed count, and dynamic average rating.
- ✅ **Validated Gig Creation:** Full support for **Offering** and **Requesting** gigs across **Programming**, **Design**, **Writing**, and **Tutoring** categories.
- ✅ **Flexible Compensation:** Supports **Paid** (with configurable USD budget), **SkillSwap** (skill barter), and **Free** (volunteer/campus contribution).

### 🧩 Milestone 2 — Discovery & Applications

- ✅ **Bento Grid Marketplace:** Asymmetric, modular grid cards designed for fast scanning and visual appeal.
- ✅ **Multi-Facet Filtering:** Filter in real-time by category, Offering/Requesting type, payment type, budget range, and status.
- ✅ **Keyword Search:** Real-time search across gig titles and descriptions.
- ✅ **Validated Application Submission:** Submit customized pitches to gig owners.
- ✅ **Business Rule Enforcement:** Prevents duplicate applications and blocks self-applications to a user's own gig.
- ✅ **Automated Expiry:** Gigs past their deadline date while still Open automatically appear as **Expired**.

### 🧩 Milestone 3 — Applicant Selection & Status

- ✅ **Owner-Only Governance:** Only the student who posted the gig can review and accept applicants or advance statuses.
- ✅ **Automated Acceptance Cascade:** Accepting one applicant automatically changes the gig status to **In Progress**, auto-rejects all remaining pending applications, and locks the gig from receiving new submissions.
- ✅ **Strict State Machine:** Strictly enforces `Open → In Progress → Completed`. A gig can only transition to `Completed` from `In Progress`.

### 🧩 Milestone 4 — Mutual Reviews & Reputation

- ✅ **Bidirectional Feedback:** Once a gig is marked Completed, both the owner and the accepted applicant can rate each other (1 to 5 stars) and leave comments.
- ✅ **One-Review Guarantee:** Enforces exactly one review per reviewer per completed gig.
- ✅ **Dynamic Reputation Engine:** Profile average star ratings are calculated mathematically from stored peer reviews rather than manual entry.

### 🧩 Milestone 5 — Mock API & Seed Data

- ✅ **RESTful Mock API Endpoints:**
  - `GET /api/gigs?category=...&type=...&q=...`
  - `POST /api/gigs`
  - `GET /api/gigs/:id`
  - `PATCH /api/gigs/:id`
  - `GET /api/applications?gig_id=...&applicant_id=...`
  - `POST /api/applications`
  - `PATCH /api/applications/:id` (actions: `accept`, `reject`)
  - `GET /api/reviews?gig_id=...&user_id=...`
  - `POST /api/reviews`
- ✅ **Pre-populated Seed Data:**
  - **12+ Student Profiles** with varied majors, avatars, bios, and skills
  - **26+ Gigs** spanning Programming, Design, Writing, Tutoring, both types, and all statuses
  - **21+ Applications** (Pending, Accepted, Rejected)
  - **8+ Mutual Reviews** with ratings and comments

---

## 🎨 Visual Identity & Bento Grid Direction

- **Base Surface:** Warm off-white / cream (`#fbf9f5`) to foster a welcoming campus atmosphere.
- **Typography:**
  - **Headings:** Montserrat ExtraBold (weight 800) for a confident, structured hierarchy.
  - **Body Content:** Merriweather serif for comfortable reading of detailed pitches and reviews.
- **Palette System:**
  - **Primary Brand:** Warm Amber/Gold (`#d97706`)
  - **Programming:** Trust Blue
  - **Design:** Creative Rose
  - **Writing:** Growth Emerald
  - **Tutoring:** Academic Purple
- **Bento Grid Composition:** Asymmetric card layouts with varied spans (e.g. 3-col hero, 1-col metric pulse, category tiles) responsive across desktop, laptop, tablet, and mobile.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4 with warm design tokens
- **Component Primitives:** shadcn/ui inspired accessible components (Button, Badge, Card, Dialog, Tabs, Input, Textarea, Select, Avatar, BentoGrid)
- **Runtime Environment:** Node.js v22 LTS

---

## 🚀 Setup & Running Instructions

### 1. Prerequisites

- Node.js (v20+ or v22 LTS recommended)
- npm (v10+)

### 2. Navigate to Project Directory

```bash
cd "submission/team-outliers/Campus Gig & SkillSwap Portal"
```

### 3. Run the Production Server

```bash
# Build the application
npm run build   # Or: node ./node_modules/next/dist/bin/next build

# Start the server (runs on port 3001)
node ./node_modules/next/dist/bin/next start -p 3001
```

### 4. Or Run Development Server

```bash
node ./node_modules/next/dist/bin/next dev -p 3001
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🔄 Persona Switcher (Mock Authentication)

To test both sides of the marketplace (posting vs applying and mutual reviewing):

1. Click the **"Switch Role"** button in the top navigation bar.
2. Select any of the 12 student personas (e.g. Aiden Vance, Maya Lin, Carlos Mendez, Sarah Jenkins).
3. The interface immediately reflects the active user's permissions, posted gigs, and applications!
