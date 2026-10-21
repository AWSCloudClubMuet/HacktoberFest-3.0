# 🎓 Campus Gig & SkillSwap Portal

A full-stack campus marketplace where students can post gigs, offer skills, exchange services, and review collaborators. Built as a **demo-first hackathon project** for team **404 MERCY**.

---

## 📋 Project Overview

The **Campus Gig & SkillSwap Portal** connects university students who want to hire peers or exchange skills without complex overhead. The application operates in a streamlined **Demo Mode** featuring pre-seeded campus student personas, enabling instant testing of multi-user workflows without registration friction or third-party service dependencies.

### Key Capabilities
- **Demo Student Persona Selector**: Seamlessly switch between 12 seeded students (CS, Design, Writing, Economics, etc.) directly in the navbar to test different roles.
- **Explore Gigs**: Keyword search across titles/descriptions with faceted filters for Category (Programming, Design, Writing, Tutoring), Gig Type (Offering / Requesting), Payment Type (Paid, Skill Swap, Free), and Budget ranges.
- **Interactive Gig Details**: Full modal preview with deadline countdown, budget status, owner information, and direct application submission.
- **Post a Gig**: Form with client validation, budget rules for paid gigs, future-deadline enforcement, and automatic attribution to the active demo student.
- **My Gigs (Owner Dashboard)**: Review applicant messages, accept a collaborator (which automatically transitions the gig to *In Progress* and marks others as *Rejected*), mark gigs as *Completed*, and submit 1–5 star reviews with comments.
- **My Applications (Applicant Tracker)**: Track real-time status of submitted applications, view deadlines, and leave reviews for gig owners upon project completion.
- **Student Profile**: Dynamic portfolio displaying avatar, major, year, skills, live counts of gigs posted/completed, and reputation ratings computed directly from stored reviews.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite 5 (Plain JavaScript, no TypeScript) |
| **Styling** | Plain CSS with responsive design, CSS custom properties, and indigo/violet palette |
| **State & Context** | React Context (`UserContext`) for centralized demo identity |
| **Mock Backend** | JSON Server (`db.json` on port 3001) |
| **HTTP Client** | Native Fetch API via reusable client (`src/api/client.js`) |
| **Dev Tooling** | Concurrently, Vite HMR |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18 or later ([nodejs.org](https://nodejs.org))
- **npm** v9 or later

### 2. Installation
```powershell
cd "D:\Hackathon Project\404-mercy\submission\404-mercy\campus-gig-skillswap"
npm.cmd install
```

### 3. Run Development Servers
To run both the Vite frontend (`http://localhost:5173`) and the mock REST API (`http://localhost:3001`) simultaneously:

```powershell
npm.cmd run dev:all
```

*(Alternatively, run them in separate terminal windows: `npm.cmd run api` and `npm.cmd run dev`)*.

### 4. Build for Production
```powershell
npm.cmd run build
```

---

## 🎭 Demo Mode & Persona Switching

The application operates in **Demo Mode**:
- At the top right of the navigation bar, use the **Demo Student** dropdown to switch between any of the 12 seeded student profiles.
- Changing the active student instantly re-scopes:
  - **Post a Gig**: Auto-assigns the gig owner to the selected student.
  - **My Gigs**: Displays gigs posted by that specific student.
  - **My Applications**: Displays applications submitted by that specific student.
  - **Student Profile**: Shows their major, skills, computed stats, and received reviews.
  - **Explore Gigs**: Prevents self-applications and identifies already-applied gigs.

---

## 📡 REST API Collections & Seed Data

The JSON Server database is located at `api/db.json` and exposes standard RESTful endpoints:

| Endpoint | Method | Description | Seed Count |
|---|---|---|---|
| `/users` | `GET`, `POST`, `PATCH` | Student profile records | **12** |
| `/gigs` | `GET`, `POST`, `PATCH`, `DELETE` | Gigs (Open, In Progress, Completed) | **25** |
| `/applications` | `GET`, `POST`, `PATCH` | Gig applications (Pending, Accepted, Rejected) | **20** |
| `/reviews` | `GET`, `POST` | Ratings (1–5 stars) & comments | **8** |

### Verified Business Rules
1. **Application Rules**: Only `Open` and unexpired gigs accept applications. Students cannot apply to their own gigs or submit duplicate applications.
2. **Acceptance Flow**: An owner accepting an applicant sets that application to `Accepted`, sets all other pending applicants for that gig to `Rejected`, and updates the gig status to `In Progress`.
3. **Completion & Reviews**: Gigs can only be marked `Completed` from `In Progress`. Once completed, both the owner and the accepted applicant can each leave a single 1–5 star review with feedback.
4. **Deadline Derivation**: An `Open` gig whose deadline has passed is visually labeled `Expired`. `In Progress` or `Completed` gigs remain unaffected by past deadlines.

---

## 📁 Project Structure

```
campus-gig-skillswap/
├── api/
│   └── db.json               # Seed database (12 users, 25 gigs, 20 apps, 8 reviews)
├── public/
│   └── vite.svg              # App icon
├── src/
│   ├── api/
│   │   └── client.js         # Centralized Fetch API client for all collections
│   ├── components/
│   │   └── ReviewForm.jsx    # Reusable 1-5 star review & feedback component
│   ├── pages/
│   │   ├── ExploreGigs.jsx   # Search, filters, gig cards & application modal
│   │   ├── ExploreGigs.css   # Filter bar and card grid styling
│   │   ├── PostGig.jsx       # Validated gig creation form
│   │   ├── MyGigs.jsx        # Owner dashboard (applicants, accept/reject, complete, review)
│   │   ├── MyApplications.jsx# Application tracker & applicant reviews
│   │   ├── StudentProfile.jsx# Dynamic profile with live derived rating metrics
│   │   └── Pages.css         # Shared page and card styling
│   ├── App.jsx               # Main layout and view router
│   ├── App.css               # Application layout container
│   ├── Navbar.jsx            # Top navbar with integrated Demo Student dropdown
│   ├── Navbar.css            # Responsive navigation styling
│   ├── UserContext.jsx       # Centralized demo student state provider
│   ├── utils.jsx             # Shared badges, date formatters, and status helpers
│   ├── index.css             # Design tokens & base CSS variables
│   └── main.jsx              # Vite React entrypoint
├── .env                      # VITE_API_BASE_URL=http://localhost:3001
├── package.json
└── vite.config.js
```
