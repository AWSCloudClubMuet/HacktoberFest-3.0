# Campus Gig & SkillSwap Portal (Issue #12)

Web platform where students offer skills or request help (Paid / Skill Swap / Free) and build reputation via two-way reviews. Backed by a JSON Server mock API.

## Run
```
npm install
npm start
```
Open http://localhost:3000. Use the user dropdown (top right) to switch between seeded students.

## Features
- **M1 Profiles & Gigs:** profile with major, semester, skills, gigs posted, gigs completed, average rating; any user can post (Poster) or apply (Applicant). Validated gig form: Offering/Requesting, title, description, category, payment type, budget (required for Paid), deadline.
- **M2 Discovery:** `GET /gigs?category=&type=&q=` plus payment type and budget range filters; keyword search on title + description; apply with message; My Applications status view; own-gig and duplicate applications blocked; Open gigs past deadline show **Expired**.
- **M3 Selection:** only owner manages applicants/status; accepting one applicant → gig In Progress, other Pending → Rejected, gig closed to new applications; Open → In Progress → Completed (complete only from In Progress); owner can cancel an Open gig.
- **M4 Reviews:** after completion, owner and accepted applicant rate each other 1–5 with comment; one review per reviewer per gig; profile rating computed from stored reviews only.
- **M5 Mock API:** `POST /gigs`, `POST /applications`, `PATCH /applications/:id`, `PATCH /gigs/:id`, `POST /reviews`, `PATCH /users/:id`. Seed: 12 users, 25 gigs (4 categories, both types, all 5 statuses), 33 applications, 9 reviews.

## Tech
HTML/CSS/vanilla JS + JSON Server (`db.json`).
