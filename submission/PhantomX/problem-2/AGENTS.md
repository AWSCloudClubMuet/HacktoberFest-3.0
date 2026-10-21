# Campus Gig & SkillSwap Portal

Reference for all work in this folder. Read this before changing code.

## Summary

Campus marketplace where students post or apply to short gigs (Paid, Skill Swap, or Free), get accepted by the gig owner, complete the work, and review each other. Reputation is the average of stored reviews.

A student is a Poster on gigs they create and an Applicant on gigs they apply to. There is no separate role field.

## Location and branch

- Repo: `AWS-Hackathon`. All code, config, seed data, this file, and README stay inside `submission/PhantomX/problem-2/`.
- Do not create or modify files outside that folder.
- Work only on git branch `team-phantomx`. Never commit to `main` or any other branch.
- Commit small and often after each working step.

## Tech stack and run commands

- API: Node.js 18+ and Express. In-memory store loaded from `data/db.json`. No database.
- UI: Vite, React, and Tailwind in `client/`. One student switcher; no real auth.
- Acting user: `client/src/api.js` sends `x-user-id` on every request. `VITE_API_URL` defaults to `http://localhost:3001`.

From `submission/PhantomX/problem-2/`:

```bash
npm install
npm run seed       # rewrite data/db.json
npm run dev        # API http://localhost:3001 and client http://localhost:5173
npm start          # API only
npm run client     # client only
npm run test:api   # rule checks against a temporary database
```

`npm run seed` resets the file. A running server reloads it on the next request.

## Data model

**Users:** `id`, `name`, `major`, `semester`, `bio`, `skills` (string array).

Computed on read, never stored or patched:

- `gigs_posted` — gigs where `user_id` is this user
- `gigs_completed` — `Completed` gigs where this user is the owner or `accepted_applicant_id`
- `average_rating` — mean of reviews where `reviewee_id` is this user (one decimal). `null` if none

**Gigs:** `id`, `user_id`, `title`, `description`, `type` (`Offering` | `Requesting`), `category` (`Programming` | `Design` | `Writing` | `Tutoring`), `payment_type` (`Paid` | `SkillSwap` | `Free`), `budget` (number or `null`), `deadline` (ISO date), `status` (`Open` | `In Progress` | `Completed` | `Expired` | `Cancelled`), `accepted_applicant_id` (nullable), `created_at`.

**Applications:** `id`, `gig_id`, `applicant_id`, `message`, `status` (`Pending` | `Accepted` | `Rejected`), `created_at`.

**Reviews:** `id`, `gig_id`, `reviewer_id`, `reviewee_id`, `rating` (integer 1–5), `comment`.

## Gig status workflow

Effective status: if stored `status` is `Open` and `deadline` is before now, the gig is `Expired`. List, detail, filters, and rules use effective status. Do not let clients set `Expired` directly.

Allowed transitions:

- `Open` + owner accepts one `Pending` application → `In Progress`, set `accepted_applicant_id`, reject every other `Pending` application, refuse new applications.
- `In Progress` → `Completed` (owner only, via `PATCH /gigs/:id`).
- `Open` or `In Progress` → `Cancelled` (owner only). Reject remaining `Pending` applications. A stored `Open` gig past its deadline can still be cancelled. Keep `accepted_applicant_id` when cancelling `In Progress`.
- Completion is allowed only from `In Progress`.
- `In Progress` is set only by accepting an applicant, not by patching status.
- No reopen. No complete from `Open`, `Expired`, `Cancelled`, or `Completed`.

## Business rules (enforced in the API)

Gig create (`POST /gigs`):

- `x-user-id` must match an existing user. Missing header is `400`. Unknown user is `404`.
- `title` and `description` required, non-empty, trimmed.
- `type`, `category`, `payment_type` must be one of the enums above.
- `Paid`: `budget` required, number, greater than 0. `SkillSwap` and `Free`: `budget` must be `null`.
- `deadline` required, valid date, in the future.
- New gigs start `Open` with `accepted_applicant_id` `null`. Server sets `id` and `created_at`.

Discovery (`GET /gigs`):

- Filters combine with AND: `category`, `type`, `payment_type`, `min`, `max`, `q`.
- `q` matches title or description, case-insensitive.
- `min` and `max` are an inclusive budget range. Gigs with a null budget drop out when either bound is set.
- There is no status query. Expired is only the computed `status` on the gig.

Applications:

- Applicant is `x-user-id`. `message` required, 1–500 characters.
- Reject apply to your own gig, a second application to the same gig (any status), or a gig that is not effectively `Open`.
- New applications start `Pending`.
- Only the gig owner may `PATCH` an application.
- Accept only a `Pending` application on an effectively `Open` gig. Then run the accept transition above.
- Reject only a `Pending` application. Gig status stays unchanged.
- Owner cannot accept or reject an application that is already `Accepted` or `Rejected`.

Reviews:

- Gig must be `Completed`.
- Reviewer is `x-user-id` and must be the owner or the accepted applicant.
- `reviewee_id` must be the other participant.
- One review per reviewer per gig.
- `rating` integer 1–5. `comment` required, non-empty, max 500 characters.
- Profile averages come from these rows. No endpoint edits `average_rating`.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/users` | List users (for the switcher) |
| GET | `/users/:id` | Profile plus computed stats |
| GET | `/gigs` | Search and filter. Query: `category`, `type`, `payment_type`, `min`, `max`, `q` |
| GET | `/gigs/:id` | Gig detail, effective status |
| POST | `/gigs` | Create gig as `X-User-Id` |
| PATCH | `/gigs/:id` | Owner sets `Completed` or `Cancelled` |
| GET | `/applications` | Query: `gig_id`, `applicant_id` |
| POST | `/applications` | Apply to a gig |
| PATCH | `/applications/:id` | Owner sets `Accepted` or `Rejected` |
| GET | `/reviews` | Query: `reviewee_id`. Omit it to return every review |
| POST | `/reviews` | Review the other party |

Errors use `{ "error": "..." }`. `400` validation or a missing `x-user-id`. `403` not the owner, applying to your own gig, or reviewing when you are not a participant. `404` unknown user, gig, or application. `409` duplicate application, duplicate review, or an illegal status change.

## Seed data

`npm run seed` writes `data/db.json`. Counts are minimums; relationships must already satisfy the rules above. The current seed is 12 users, 27 gigs, 33 applications, and 9 reviews.

- At least 12 users with names, majors, semesters, bios, and skills.
- At least 25 gigs across Programming, Design, Writing, and Tutoring; both `Offering` and `Requesting`; all three payment types; all five effective statuses.
- Some stored-`Open` gigs have a past deadline so they surface as `Expired`.
- Each `In Progress` and `Completed` gig has `accepted_applicant_id` and exactly one `Accepted` application. Other applications on that gig are `Rejected`.
- At least 20 applications mixed across `Pending`, `Accepted`, and `Rejected`.
- At least 8 reviews, only on `Completed` gigs, each from owner or accepted applicant to the other, one per reviewer per gig, ratings 1–5.

## Coding conventions

- Small, focused changes. Edit existing files instead of rewriting them.
- Do not add dependencies beyond Express, Vite, React, the Vite React plugin, and Tailwind unless asked.
- Keep business rules in the API. The UI may hide invalid actions; it is not the source of truth.
- IDs are strings. Dates are ISO-8601.

## Progress

- [x] Stage 1 — Express API, seed file, business rules, and `npm run test:api`
- [x] Stage 2 — Browse, profiles, create gig, apply, and my applications
- [ ] Stage 3 — Applicant management and reviews UI

## Milestones

- [x] M1 Profiles and validated gig creation.
- [x] M2 Search, filters, applications, and expired gigs.
- [ ] M3 Applicant selection and status changes. API done; UI not started.
- [ ] M4 Two-way reviews and computed reputation. API done; UI not started.
- [x] M5 Seeded Express API covers the endpoints above with at least 12 users, 25 gigs, 20 applications, and 8 reviews.
