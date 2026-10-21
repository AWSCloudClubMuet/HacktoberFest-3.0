# CampusConnect – Campus Gig & SkillSwap Portal

**Team:** TripleStack · HacktoberFest 3.0 · Challenge #12 (Campus Gig & SkillSwap Portal)

CampusConnect is a campus marketplace where students offer skills or request help. Gigs can be **Paid**, a **Skill Swap**, or **Free**. Students apply, the poster accepts one applicant, the work is tracked to completion, and both sides review each other to build their reputation.

## Tech stack
- **Frontend:** React 18 + Vite. All data is fetched from and changed through the API.
- **Backend:** Node.js + Express mock API, persisted to a JSON file (`server/data/db.json`).
- **Shared rules:** `shared/` holds the validation and business rules used by both the API and the UI.
- **Tests:** Node's built-in test runner (`node --test`), 101 tests.

## Run it
Requires Node.js 20 or newer.
```bash
npm install
npm run dev        # starts the API (http://localhost:4000) and the web app (http://localhost:5180)
```
Other scripts: `npm run api`, `npm run web`, `npm test`, `npm run build`, `npm run preview`, `npm run reset-db` (restores the demo data).

Configuration: `VITE_API_URL` (frontend, default `http://localhost:4000`), `PORT` and `DB_FILE` (API). See `.env.example`.

The database is created from the seed on first start. Seed dates are relative to that moment, so open gigs stay open and expired gigs stay expired.

## Features (all 5 milestones)
1. **Profiles & gigs:** each profile shows name, major, semester, bio, skills, gigs posted, gigs completed and a calculated average rating. Anyone can post Offering or Requesting gigs (Programming, Design, Writing, Tutoring). Gigs are validated: Paid gigs need a budget (Rs 100–500,000), Skill Swap and Free gigs can't have one, and the deadline must be in the future.
2. **Discovery & applications:** search titles and descriptions, and filter by category, type, payment type, budget range and status. Apply with a message and see your applications' statuses. You can't apply to your own gig or apply twice. Open gigs past their deadline show as **Expired** and can't be applied to.
3. **Applicant selection:** only the owner can accept or reject applicants or change the status. Accepting one applicant atomically sets the gig to **In Progress**, rejects all other pending applicants and closes the gig. Allowed transitions are Open → In Progress → Completed, plus Cancelled from Open, Expired or In Progress. Completed and Cancelled are final.
4. **Reviews:** after completion, the owner and the accepted applicant each rate the other (whole number 1–5 plus a comment), once per gig. Average ratings are always computed from stored reviews and can't be set by hand.
5. **Mock API & seed:** 12 users, 28 gigs, 43 applications and 11 reviews, covering every category, type, payment type and status, and internally consistent.

**Demo sign-in:** the "Acting as" selector sends an `X-User-Id` header, and the server enforces every permission against it. A real app would use sessions or tokens, with the same checks.

## API
All errors are JSON: `{ "error": { "code", "message", "fields?" } }`. Status codes: 400 validation, 401 no or unknown user, 403 not allowed, 404 not found, 409 rule conflict.

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/users?q=&sort=rating\|name` | users with calculated rating and gig counts |
| GET | `/users/:id` | profile, posted gigs, gigs worked on, reviews received |
| PATCH | `/users/:id` | edit your own profile (rating fields rejected) |
| GET | `/gigs?q=&category=&type=&payment_type=&min_budget=&max_budget=&status=&user_id=&sort=` | search and filter |
| GET | `/gigs/:id` | details; applications visible to the owner (all) or the applicant (their own); `viewer` lists allowed actions |
| POST | `/gigs` | create (acting user becomes the owner) |
| PATCH | `/gigs/:id` | owner only: `{ "status": "Completed" \| "Cancelled" }` or edit details while Open |
| GET | `/applications?applicant_id=&gig_id=&status=` | only your applications and those to your gigs |
| POST | `/applications` | `{ gig_id, message }` |
| PATCH | `/applications/:id` | owner only: `{ "status": "Accepted" \| "Rejected" }` |
| GET | `/reviews?user_id=&reviewer_id=&gig_id=` | |
| POST | `/reviews` | `{ gig_id, rating, comment }` (reviewee is set automatically) |
| GET | `/dashboard` | summary for the acting user |

Example: `curl -X PATCH localhost:4000/applications/a2 -H "X-User-Id: u1" -H "Content-Type: application/json" -d '{"status":"Accepted"}'`

## Reliability
- Every write runs as a synchronous transaction on a copy of the data, then saves with write-then-rename. It either fully succeeds or changes nothing, and two simultaneous "accept" requests can't both succeed (this is tested).
- Expired is computed when gigs are read, so no background job is needed.
- The API refuses to start on a corrupted data file instead of silently overwriting it.

## Tests
`npm test` runs 101 tests. They cover gig validation, search and filters, own-gig and duplicate application blocking, deadline expiry, owner-only checks, accept-one/reject-the-rest (including concurrent requests), status transitions, completion rules, review eligibility and duplicates, rating calculation, seed consistency, persistence across restarts, and API error handling. Each test uses its own temporary database, never `db.json`.

## Demo flow (2 minutes)
1. Acting as **Ayesha (u1)**, browse gigs: search "react", filter Payment = Paid, set a budget range, and filter Status = Expired.
2. Open **"Help building a Flask API…"** (Bilal's gig): it shows that Ayesha already applied. Open her own gig **"Logo and brand kit…"**: she sees 3 applicants.
3. **Accept Mariam** and confirm. The gig moves to In Progress and the other 2 applicants are rejected automatically.
4. Open **"Product demo video for StudySync"** and choose **Mark Completed**. Leave a 5★ review for Usman.
5. Switch to **Usman (u6)**, open the same gig and review Ayesha. Her average rating is recalculated.
6. Try applying to an Expired or In Progress gig: the app explains why it's blocked.

## Limitations
- Demo sign-in only (no passwords). No real payments, chat or notifications.
- The JSON file store suits a demo. A real deployment would use a database.
