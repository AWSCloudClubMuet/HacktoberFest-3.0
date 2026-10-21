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

- `DATABASE_URL` set in `server/.env` → uses that PostgreSQL database (this project runs on a Neon database named `campus_gig`).
- `DATABASE_URL` unset → uses an embedded PostgreSQL (PGlite) persisted under `server/.data/`, so the full stack runs with zero setup. Same SQL either way. (Better Auth requires the real `DATABASE_URL` mode.)

Tables are created automatically and seeded on first boot with **12 users, 25 gigs, 20 applications, 8 reviews** (deadlines are relative to the seed date, so Open/Expired states are always realistic).

### Auth (Better Auth)

Authentication is handled by **Better Auth**, hosted by the Express API at `/api/auth/*` with its own tables (`user`, `session`, `account`, `verification`) in the same database. The domain profile lives in `users` and is linked to the auth account by email.

- **Roles are contextual, not account types:** a signed-in user is the *Poster* on gigs they own and the *Applicant* on gigs they applied to. The API derives the acting user from the session for every mutation — unauthenticated writes return `401`.
- **Demo accounts:** all 12 seeded users can sign in with the password `campus1234` (e.g. `emma@campusloop.edu`). The login page has one-tap demo sign-in.
- **New accounts:** sign up at `/signup` (name, email, password), then the profile step creates the domain profile (`POST /api/profile`, session required).
- First-time setup against a fresh database: `npm --prefix server run migrate:auth` once to create Better Auth's tables, then start the API (it seeds demo accounts automatically).

`server/.env` (gitignored) holds `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`.

## Run it

```bash
pnpm install
npm --prefix server install
pnpm dev        # starts API (:4000) and web (:3000) together
```

Open http://localhost:3000 — you'll be redirected to `/login`; use a demo account or create your own.

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
