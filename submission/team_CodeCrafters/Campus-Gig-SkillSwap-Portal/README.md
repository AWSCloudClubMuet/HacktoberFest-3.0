# CampusLoop — Campus Gig & SkillSwap Portal

<div align="center">

> **“Skills connect. Opportunities grow.”**

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-campusloop--portal.vercel.app-008F72?style=for-the-badge&logo=vercel&logoColor=white)](https://campusloop-portal.vercel.app/)
[![Hackathon](https://img.shields.io/badge/Hackathon-HacktoberFest--3.0-5146D8?style=for-the-badge)](https://github.com/AWS-Cloud-Club-MUET/HacktoberFest-3.0)
[![Team](https://img.shields.io/badge/Team-CodeCrafters-172033?style=for-the-badge)](#)
[![Tests](https://img.shields.io/badge/Tests-25%20Passed%20%7C%200%20Failed-34D399?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#)

### 🌐 **[Launch Live Application → https://campusloop-portal.vercel.app/](https://campusloop-portal.vercel.app/)**

**Submission Path:** `submission/team_CodeCrafters/Campus-Gig-SkillSwap-Portal/`  
**GitHub Issue:** #12 — Campus Gig & SkillSwap Portal

</div>

---

## 📖 Overview

**CampusLoop** is a dedicated university micro-gig and peer skill-sharing portal built for collegiate ecosystems. It bridges the gap between student talent and campus needs by enabling:
- 💼 **Paid Micro-Gigs:** Affordable, student-friendly rates with milestone tracking.
- 🔄 **Skill Swaps (Zero-Cash Barter):** Direct exchange of complementary skills (e.g., React coding in exchange for Figma brand design).
- ⭐ **Verified Academic Reputation:** Closed-loop reciprocal reviews and live dynamic ratings.

---

## ✨ Key Features & Milestones

| Milestone | Capability | Status |
|---|---|:---:|
| **1. Student Profiles & Demo Switching** | 12 verified student accounts with major, semester, bio, and skills; one-click passwordless switcher | ✅ Complete |
| **2. Gig Discovery & Management** | Multi-parameter search across Programming, Design, Writing, and Tutoring with budget, category, and automatic deadline expiration | ✅ Complete |
| **3. Atomic Work Workflow** | Proposal pitches; own-gig apply block; **atomic applicant acceptance** that moves gigs to *In Progress* and auto-rejects competing proposals | ✅ Complete |
| **4. Mutual Reviews & Reputation** | Reciprocal 1–5 star reviews permitted only on *Completed* gigs; dynamically recalculates student average rating in SQLite | ✅ Complete |
| **5. AI Campus Assistant** | Rule-based intelligent assistant answering queries and finding gigs using live database records (`/api/ai/query`) | ✅ Complete |
| **Dual Theme Engine** | Fully theme-aware Light (`#F5F7FA`) and Dark (`#0B1020` / `#121A2B`) modes with accessible contrast tokens | ✅ Complete |
| **Mobile-First UX** | Fluid responsive shell verified from 320px mobile to 1920px+ desktop | ✅ Complete |
| **Persistent Messaging & Alerts** | Stored 1-on-1 direct chat and real-time notification feed | ✅ Complete |

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Tailwind CSS v3, Vite 8, Lucide React icons, PostCSS, Autoprefixer
- **Backend:** Node.js (v24), Express 5, CORS, Dotenv
- **Database:** SQLite via `better-sqlite3` with Write-Ahead Logging (`WAL`) & Foreign Keys
- **Reliability:** React `ErrorBoundary`, 25-point automated test suite (`test/api.test.js`)
- **Hosting:** Vercel (Frontend SPA) + Express / SQLite (Local & Production API)

---

## 🚀 Quick Start (Local Setup)

```bash
# 1. Clone repository and navigate to project folder
git clone https://github.com/zainab-abdul-qayoom/Team-CodeCrafters.git
cd Team-CodeCrafters/submission/team_CodeCrafters/Campus-Gig-SkillSwap-Portal

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Seed database (12 students, 26 gigs, 20 applications, 10 reviews)
npm run seed

# 5. Start both backend (port 5000) and frontend (port 5173) concurrently
npm start
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Automated Testing

Run the comprehensive 25-point automated verification test suite:

```bash
npm test
```

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

Results: 25 passed, 0 failed
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/health` | Health & availability check | No |
| `GET` | `/api/stats` | Live platform metrics (active gigs, swaps, ratings) | No |
| `POST` | `/api/ai/query` | AI campus assistant database query | Optional |
| `GET` | `/api/users` | List all verified student accounts | No |
| `GET` | `/api/users/:id` | Student profile with live calculated rating breakdown | No |
| `PATCH`| `/api/users/:id` | Update bio, major, semester, skills | Yes (`x-user-id`) |
| `GET` | `/api/gigs` | Filter gigs (category, type, budget, sort, search) | No |
| `POST` | `/api/gigs` | Publish opportunity with server validation | Yes (`x-user-id`) |
| `PATCH`| `/api/gigs/:id` | Update gig or mark `Completed` (participant-only) | Yes (`x-user-id`) |
| `POST` | `/api/applications` | Submit proposal (own-gig & duplicate blocked) | Yes (`x-user-id`) |
| `PATCH`| `/api/applications/:id/accept` | **Atomic accept** applicant & reject competitors | Yes (`x-user-id`) |
| `PATCH`| `/api/applications/:id/reject` | Reject application proposal | Yes (`x-user-id`) |
| `POST` | `/api/reviews` | Submit reciprocal review & recalculate user rating | Yes (`x-user-id`) |
| `GET` | `/api/conversations` | Get user message threads | Yes (`x-user-id`) |
| `POST` | `/api/conversations/:id/messages`| Send persistent message | Yes (`x-user-id`) |
| `GET` | `/api/notifications` | Get student alerts | Yes (`x-user-id`) |
| `POST` | `/api/bookmarks/:gigId` | Toggle saved opportunities | Yes (`x-user-id`) |

---

## 👥 Verified Demo Student Accounts

Switch personas instantly using the **Demo Account Switcher** button in the navbar:

| ID | Persona | Major | Semester | Core Focus |
|---|---|---|---|---|
| `usr_1` | **Aarav Sharma** | Computer Science | 6th Sem | Full-Stack Web Development, React, Node.js |
| `usr_2` | **Rohan Kumar** | Computer Engineering | 8th Sem | Backend Architecture, Cloud, Scalable APIs |
| `usr_3` | **Sneha Patel** | Digital Media & Design | 4th Sem | UI/UX Design, Figma, Brand Identity |
| `usr_4` | **Priya Verma** | English & Journalism | 6th Sem | Academic Writing, SOPs, Essay Editing |
| `usr_5` | **Karan Singh** | Mathematics & Computing | 5th Sem | Calculus, Linear Algebra, Math Tutoring |
| `usr_6` | **Neha Gupta** | Information Technology | 3rd Sem | Frontend Mentorship, HTML/CSS/JS |
| `usr_7` | **Vikram Mehta** | Electrical Engineering | 7th Sem | Arduino, Embedded Systems, Robotics |
| `usr_8` | **Ananya Roy** | Business Administration | 5th Sem | Pitch Decks, Financial Modeling |
| `usr_9` | **Devendra Rao** | Mechanical Engineering | 6th Sem | CAD, SolidWorks, 3D Modeling |
| `usr_10`| **Simran Kaur** | Applied Physics | 4th Sem | Physics Tutoring, Thermodynamics |
| `usr_11`| **Tanmay Deshmukh**| Computer Science | 2nd Sem | Python Tutoring, Git & Open-Source |
| `usr_12`| **Zoya Akhtar** | Film & Animation | 5th Sem | Video Editing, Motion Graphics, Reels |

---

## 🔒 Security & Data Integrity

- **SQL Injection Immunity:** 100% of database interactions in `server/db.js` use parameterized prepared statements.
- **Strict Authorization:** State changes (application acceptance, review submissions, completions) verify caller ownership via `x-user-id`.
- **CORS Configurable:** Permitted origins whitelist configured via `ALLOWED_ORIGINS` in `.env`.
- **Error Boundaries:** Client crashes are caught gracefully by React `ErrorBoundary` with instant recovery actions.

---

## 🏆 Hackathon Submission Info

- **Repository:** [AWS-Cloud-Club-MUET / HacktoberFest-3.0](https://github.com/AWS-Cloud-Club-MUET/HacktoberFest-3.0)
- **Branch:** `team_CodeCrafters`
- **Issue:** [#12: Campus Gig & SkillSwap Portal](https://github.com/AWS-Cloud-Club-MUET/HacktoberFest-3.0/issues/12)
- **Team Name:** **Team CodeCrafters**
- **Live Demo:** **[https://campusloop-portal.vercel.app/](https://campusloop-portal.vercel.app/)**
