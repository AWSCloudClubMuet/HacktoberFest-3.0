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

Proposed stack (confirm before implementation):

- API: Node.js + Express. In-memory store seeded on startup. No database.
- UI: Vite + React (JavaScript). One user switcher; no real auth.
- Acting user: every mutating request, and profile-scoped reads, send header `X-User-Id`.

From `submission/PhantomX/problem-2/`:

```bash
npm install
npm run dev      # API http://localhost:3001  client http://localhost:5173
npm run start    # API only
```

Client calls the API with `VITE_API_URL=http://localhost:3001`.

## Data model

**Users:** `id`, `name`, `major`, `semester`, `bio`, `skills` (string array).

Computed on read, never stored or patched:

- `gigsPosted` — gigs where `user_id` is this user
- `gigsCompleted` — `Completed` gigs where this user is the owner or `accepted_applicant_id`
- `averageRating` — mean of reviews where `reviewee_id` is this user (one decimal). `null` if none
- `reviewCount`

**Gigs:** `id`, `user_id`, `title`, `description`, `type` (`Offering` | `Requesting`), `category` (`Programming` | `Design` | `Writing` | `Tutoring`), `payment_type` (`Paid` | `SkillSwap` | `Free`), `budget` (number or `null`), `deadline` (ISO date), `status` (`Open` | `In Progress` | `Completed` | `Expired` | `Cancelled`), `accepted_applicant_id` (nullable), `created_at`.

**Applications:** `id`, `gig_id`, `applicant_id`, `message`, `status` (`Pending` | `Accepted` | `Rejected`), `created_at`.

**Reviews:** `id`, `gig_id`, `reviewer_id`, `reviewee_id`, `rating` (integer 1–5), `comment`.

## Gig status workflow

Effective status: if stored `status` is `Open` and `deadline` is before now, the gig is `Expired`. List, detail, filters, and rules use effective status. Do not let clients set `Expired` directly.

Allowed transitions:

- `Open` + owner accepts one `Pending` application → `In Progress`, set `accepted_applicant_id`, reject every other `Pending` application, refuse new applications.
- `In Progress` → `Completed` (owner only, via `PATCH /gigs/:id`).
- `Open` → `Cancelled` (owner only). Reject remaining `Pending` applications.
- Completion is allowed only from `In Progress`.
- `In Progress` is set only by accepting an applicant, not by patching status.
- No reopen. No complete from `Open`, `Expired`, `Cancelled`, or `Completed`.

## Business rules (enforced in the API)

Gig create (`POST /gigs`):

- `X-User-Id` must match an existing user.
- `title` and `description` required, non-empty, trimmed.
- `type`, `category`, `payment_type` must be one of the enums above.
- `Paid`: `budget` required, number, greater than 0. `SkillSwap` and `Free`: `budget` must be `null`.
- `deadline` required, valid date, in the future.
- New gigs start `Open` with `accepted_applicant_id` `null`. Server sets `id` and `created_at`.

Discovery (`GET /gigs`):

- Filters: `category`, `type`, `payment_type`, `status` (effective), `budget_min`, `budget_max`, `q`.
- `q` matches title or description, case-insensitive.
- If either budget bound is set, return only `Paid` gigs whose budget is inside the inclusive range.

Applications:

- Applicant is `X-User-Id`. `message` required, 1–500 characters.
- Reject apply to your own gig, a second application to the same gig (any status), or a gig that is not effectively `Open`.
- New applications start `Pending`.
- Only the gig owner may `PATCH` an application.
- Accept only a `Pending` application on an effectively `Open` gig. Then run the accept transition above.
- Reject only a `Pending` application. Gig status stays unchanged.
- Owner cannot accept or reject an application that is already `Accepted` or `Rejected`.

Reviews:

- Gig must be `Completed`.
- Reviewer is `X-User-Id` and must be the owner or the accepted applicant.
- `reviewee_id` must be the other participant.
- One review per reviewer per gig.
- `rating` integer 1–5. `comment` required, non-empty, max 500 characters.
- Profile averages come from these rows. No endpoint edits `averageRating`.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/users` | List users (for the switcher) |
| GET | `/users/:id` | Profile plus computed stats |
| GET | `/gigs` | Search and filter. Query: `category`, `type`, `payment_type`, `status`, `budget_min`, `budget_max`, `q` |
| GET | `/gigs/:id` | Gig detail, effective status |
| POST | `/gigs` | Create gig as `X-User-Id` |
| PATCH | `/gigs/:id` | Owner sets `Completed` or `Cancelled` |
| GET | `/applications` | Query: `gig_id`, `applicant_id` |
| POST | `/applications` | Apply to a gig |
| PATCH | `/applications/:id` | Owner sets `Accepted` or `Rejected` |
| GET | `/reviews` | Query: `gig_id`, `reviewee_id` |
| POST | `/reviews` | Review the other party |

Errors: `400` validation, `401` missing or unknown `X-User-Id`, `403` not the owner or not a party, `404` missing record, `409` duplicate application or duplicate review. JSON body `{ "error": "..." }`.

## Seed data

Loaded on API startup. Counts are minimums; relationships must already satisfy the rules above.

- At least 12 users with names, majors, semesters, bios, and skills.
- At least 25 gigs across Programming, Design, Writing, and Tutoring; both `Offering` and `Requesting`; all three payment types; all five effective statuses.
- Some stored-`Open` gigs have a past deadline so they surface as `Expired`.
- Each `In Progress` and `Completed` gig has `accepted_applicant_id` and exactly one `Accepted` application. Other applications on that gig are `Rejected`.
- At least 20 applications mixed across `Pending`, `Accepted`, and `Rejected`.
- At least 8 reviews, only on `Completed` gigs, each from owner or accepted applicant to the other, one per reviewer per gig, ratings 1–5.

## Coding conventions

- Small, focused changes. Edit existing files instead of rewriting them.
- Do not add dependencies beyond Express, Vite, React, and the Vite React plugin unless asked.
- Keep business rules in the API. The UI may hide invalid actions; it is not the source of truth.
- IDs are strings. Dates are ISO-8601.

## Milestones

- [ ] M1 Profiles show name, major, skills, gigs posted, gigs completed, average rating. Create Offering or Requesting gigs with validation.
- [ ] M2 Browse and filter by category, type, payment type, and budget. Search title and description. Apply with a message. See my application statuses. Block own-gig and duplicate applies. Past-deadline Open gigs show as Expired.
- [ ] M3 Owner reviews applicants, accepts one, rejects the rest. Accept moves the gig to In Progress and closes new applications. Complete only from In Progress.
- [ ] M4 After completion, owner and accepted applicant each leave one 1–5 review. Averages are computed from reviews.
- [ ] M5 Seeded Express API covers the endpoints above with at least 12 users, 25 gigs, 20 applications, and 8 reviews.
