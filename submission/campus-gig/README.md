# 🎓 Campus Gig & SkillSwap Portal

> **Team Submission:** Team 3-Braincells  
> **Project Location:** `submission/campus-gig/`  
> **Local URL:** `http://localhost:3000`  
> **API Base URL:** `http://localhost:3000/api`

---

## 🌟 Project Overview

The **Campus Gig & SkillSwap Portal** connects university students to hire peer talent, offer services, or swap skills without monetary exchange. It solves common campus collaboration challenges with a transparent peer economy, verified student ratings, and a seamless gig lifecycle.

Students can post gigs across four major disciplines (**Programming**, **Design**, **Writing**, **Tutoring**) with flexible compensation (**Paid**, **Skill Swap**, or **Free**).

---

## 🚀 Key Features Implemented

1. **Student Profiles & Dynamic Ratings**
   - 14 rich campus student profiles across multiple majors and semesters.
   - Dynamic recalculation of average star ratings (1.0 - 5.0) and completed gigs counts computed directly from stored reviews and gig records.

2. **Gigs Creation & Taxonomy**
   - **Purposes:** Offering a Skill vs. Requesting Help.
   - **Categories:** Programming, Design, Writing, Tutoring.
   - **Payment Types:** Paid (with configurable budget), Skill Swap (skill trade), Free (peer volunteer).
   - Validation on title, description, category, and deadlines.

3. **Multi-Faceted Search & Filtering**
   - Real-time search across titles, descriptions, and tags.
   - Category filter pills, type dropdown, payment filter, and status filter (`Open`, `In Progress`, `Completed`).
   - Sorting by newest, highest budget, and lowest budget.

4. **Application Management & Strict Business Rules**
   - Students can apply with personalized proposals.
   - **Rule 1: Prevent duplicate applications** (returns HTTP 400).
   - **Rule 2: Prevent applying to own gig** (returns HTTP 400).
   - **Rule 3: Only open gigs accept applications** (returns HTTP 400).

5. **Gig Lifecycle & Automatic Applicant Rejection**
   - Gig owners review applicants and accept one candidate.
   - **Accepting an applicant transitions gig to `in_progress`**, links `acceptedApplicantId`, and **automatically marks all other pending applicants as `rejected`**.
   - Valid status progression: `open` ➔ `in_progress` ➔ `completed`.

6. **Two-Way Peer Reviews & Rating Updates**
   - Once a gig is `completed`, both the gig owner and the accepted applicant can review each other.
   - Rating from 1 to 5 stars + constructive comment.
   - **Rule 4: Only completed gig participants can review** (returns HTTP 403).
   - **Rule 5: Prevent duplicate reviews** (each party can review only once per gig).

7. **Role-Based Demo User Selector**
   - Instant switcher in the navigation bar allows testing both sides of transactions (Owner vs Applicant) without fake authentication walls.

8. **Personalized Dashboard**
   - "My Posted Gigs", "My Applications" (tracking pending, accepted, rejected), and "Active & Completed Collaborations".

9. **Interactive Demo Guide & Data Reset**
   - Built-in demonstration tab explaining workflows and an instant button to reset the database to clean seed state anytime.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** Plain HTML5, CSS3 (Modern custom styling with CSS variables, responsive design, modals, and toasts), and Vanilla JavaScript (ES6+ API client and reactive state store). Zero build step required.
- **Backend:** Node.js + Express REST API serving `/api` routes and static files on a single port.
- **Data Layer:** Seeded JSON database (`data/db.json`) initialized from `src/data/seedData.js` with atomic disk persistence.
- **Seed Data Counts:**
  - **14 Students** (Requirement: >= 12)
  - **28 Gigs** (Requirement: >= 25)
  - **24 Applications** (Requirement: >= 20)
  - **10 Reviews** (Requirement: >= 8)

---

## 🏁 Quick Start & Run Commands

### 1. Navigate to Project Directory
```bash
cd submission/campus-gig
```

### 2. Install Dependencies (if not already installed)
```bash
npm install
```

### 3. Run Automated Tests
```bash
npm test
```
*(Runs both unit/business rule verification and end-to-end integration tests: 22 passing tests).*

### 4. Start the Application
```bash
npm start
```

### 5. Open in Browser
Visit: **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Automated Test Suite Summary

The project includes two comprehensive test suites in `test/`:

| Test Suite | File | Tests | Coverage |
| :--- | :--- | :---: | :--- |
| **API & Business Logic** | `test/api.test.js` | 17 | Seed counts, CRUD endpoints, duplicate application prevention, self-application block, applicant acceptance & auto-rejection, completion transitions, review constraints, and rating updates. |
| **E2E & Integration** | `test/e2e_integration.test.js` | 5 | Static HTML/CSS/JS delivery, API health check, and a complete multi-user journey (Post ➔ Apply ➔ Accept ➔ Complete ➔ Two-Way Review ➔ Rating Recalculation). |

**Total:** 22 Automated Tests (All Passing).

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/users` | List all students with dynamically computed ratings and completed gigs count. |
| `GET` | `/api/users/:id` | Get student profile with received reviews and owned gigs. |
| `POST` | `/api/users` | Register a new student profile. |
| `PATCH` | `/api/users/:id` | Update student profile information. |
| `GET` | `/api/gigs` | Search & filter gigs (`q`, `category`, `type`, `paymentType`, `status`, `ownerId`). |
| `GET` | `/api/gigs/:id` | Get single gig with owner details, applications, and reviews. |
| `POST` | `/api/gigs` | Create a new gig (`Offering` or `Requesting`). |
| `PATCH` | `/api/gigs/:id` | Transition gig status (`open` ➔ `in_progress` ➔ `completed`). |
| `GET` | `/api/applications` | List applications with filters (`gigId`, `applicantId`, `status`). |
| `POST` | `/api/applications` | Apply for an open gig. *(Enforces self-apply and duplicate prevention).* |
| `PATCH` | `/api/applications/:id` | Accept/reject application. *(Accepting sets gig to `in_progress` and auto-rejects other applicants).* |
| `GET` | `/api/reviews` | List reviews with filters (`gigId`, `revieweeId`). |
| `POST` | `/api/reviews` | Submit 1–5 star rating & feedback. *(Restricted to completed gig participants, max 1 review per direction).* |
| `GET` | `/api/stats` | High-level metrics for dashboard and hero banner. |
| `POST` | `/api/stats/reset` | Reset database back to clean seed data. |

---

## 🎯 60-Second Demo Script for Judges

1. **Select Demo User:** In the top-right navbar, select **"David Kim"** (Physics major).
2. **Explore & Apply:** Open **Explore Gigs**, click *"View Details"* on *"Building Responsive Portfolio Websites"* (owned by Alex Rivera).
3. **Submit Application:** Fill in a short message and click *"Send Application"*.
4. **Switch Identity:** In the navbar, switch the user to **"Alex Rivera"**.
5. **Accept Applicant:** Open the same gig modal or go to **My Dashboard**; click *"Accept"* on David's application. Notice the gig status automatically transitions to **In Progress**!
6. **Complete Gig:** Click *"Mark Gig as Completed"*.
7. **Submit Reviews:**
   - Alex submits a 5-star review for David.
   - Switch user back to David Kim and submit a 5-star review for Alex.
8. **Verify Rating Update:** Open the **Students** tab: notice both Alex and David's star ratings and completed gig counters have updated dynamically!
