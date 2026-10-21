# Campus Gig & SkillSwap Portal

A campus marketplace where students offer skills or request short-term help — for payment, skill swap, or free — and earn reputation through completed gigs.

Built for [HacktoberFest 3.0 issue #12](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/12).

## Stack (PERN)

- **P**ostgreSQL — schema in `server/db.js` (`users`, `gigs`, `applications`, `reviews`)
- **E**xpress — REST API in `server/` (port 4000)
- **R**eact — Next.js frontend (port 3000), UI built with shadcn components
- **N**ode.js — runtime for both tiers

The frontend calls `/api/*`, which Next rewrites to the Express server (`API_URL`, default `http://localhost:4000`).

### Database modes

- `DATABASE_URL` set → uses that PostgreSQL database (e.g. Neon/Supabase/local Postgres).
- `DATABASE_URL` unset → uses an embedded PostgreSQL (PGlite) persisted under `server/.data/`, so the full stack runs with zero setup. Same SQL either way.

Tables are created automatically and seeded on first boot with **12 users, 25 gigs, 20 applications, 8 reviews** (deadlines are relative to the seed date, so Open/Expired states are always realistic).

## Run it

```bash
pnpm install
npm --prefix server install
pnpm dev        # starts API (:4000) and web (:3000) together
```

Open http://localhost:3000. Use the **"Acting as"** switcher in the top bar to demo both sides of a gig (poster and applicant) — there is no auth in this hackathon build; the acting user's id is sent with each request and all ownership rules are enforced by the API.

## Features (by milestone)

1. **Profiles & gig creation** — role-flexible profiles (name, major, semester, bio, skills, gigs posted/completed, computed average rating); validated gig posting: title, description, Offering/Requesting, category, payment type (Paid/SkillSwap/Free), budget required for Paid, future deadline.
2. **Discovery & applications** — server-side search across title/description plus filters for category, type, payment type, and budget range; apply with a short message; application statuses in *My activity*; own-gig and duplicate applications rejected by the API; Open gigs past their deadline appear as **Expired**.
3. **Applicant selection & status** — only owners can review applications or change status; accepting an applicant moves the gig to **In Progress**, auto-rejects the remaining Pending applications, and closes it to new ones; completion is only allowed from In Progress (`Open → In Progress → Completed`, plus `Open → Cancelled`).
4. **Mutual reviews & reputation** — after completion, the owner and the accepted applicant can each leave one 1–5 star review with a comment; profile average ratings are computed from stored reviews.
5. **Mock API & seed data** — the Express API is the integrated backend for the whole app.

## API

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/gigs?category=&type=&payment_type=&q=&min_budget=&max_budget=&status=` | Search + filters; status is derived (Expired) |
| GET | `/api/gigs/:id` | Single gig with owner info |
| POST | `/api/gigs` | Validated creation |
| PATCH | `/api/gigs/:id` | Owner-only status transitions |
| GET | `/api/applications?applicant_id=&gig_id=` | Application lists/statuses |
| POST | `/api/applications` | Apply (own-gig, duplicate, closed/expired guards) |
| PATCH | `/api/applications/:id` | Owner-only accept/reject; accept cascades |
| GET | `/api/reviews?gig_id=&reviewee_id=` | Reviews |
| POST | `/api/reviews` | Completed gigs only, one per reviewer per gig |
| GET | `/api/users`, `/api/users/:id` | Profiles with computed reputation |
| GET | `/api/stats` | Open gigs, students, community rating |
