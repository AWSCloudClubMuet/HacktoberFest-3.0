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
- UI: Vite, React, and Tailwind in `client/`. Login and signup. No email verification, password reset, or OAuth.
- Acting user: a JWT from `POST /auth/login` or `POST /auth/signup`. `client/src/api.js` sends `Authorization: Bearer <token>`. The secret is `JWT_SECRET`, with dev default `campus-gig-dev-secret`. `VITE_API_URL` defaults to `http://localhost:3001`.
- Demo password for every seeded student is `Demo@1234`. The five judge accounts are in `DEMO_ACCOUNTS.md`.

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

**Users:** `id`, `name`, `email` (unique, stored lowercase), `password_hash` (bcrypt, never returned), `major`, `semester`, `bio`, `skills` (string array).

Computed on read, never stored or patched:

- `gigs_posted` — gigs where `user_id` is this user
- `gigs_completed` — `Completed` gigs where this user is the owner or `accepted_applicant_id`
- `average_rating` — mean of reviews where `reviewee_id` is this user (one decimal). `null` if none

**Gigs:** `id`, `user_id`, `title`, `description`, `type` (`Offering` | `Requesting`), `category` (`Programming` | `Design` | `Writing` | `Tutoring`), `payment_type` (`Paid` | `SkillSwap` | `Free`), `budget` (number or `null`), `deadline` (ISO date), `status` (`Open` | `In Progress` | `Completed` | `Expired` | `Cancelled`), `accepted_applicant_id` (nullable), `created_at`.

**Applications:** `id`, `gig_id`, `applicant_id`, `message`, `status` (`Pending` | `Accepted` | `Rejected`), `created_at`. Optional: `availability` (text, max 200), `portfolio_link` (http or https URL, max 500), `swap_offer` (text, max 300, only when the gig is SkillSwap), `rejection_note` (text, max 200, set by the owner when rejecting). Missing optionals are returned as `null`.

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

- A valid bearer token is required. A missing or invalid token is `401`.
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

- Applicant is the authenticated user. `message` required, 1–500 characters. The apply wizard asks for at least 20 characters; the API still accepts any non-empty message up to 500.
- `availability`, `portfolio_link`, and `swap_offer` are optional. A bad URL, an over-long value, or `swap_offer` on a gig that is not SkillSwap is `400`. `rejection_note` is optional on reject and is `400` past 200 characters.
- Reject apply to your own gig, a second application to the same gig (any status), or a gig that is not effectively `Open`.
- New applications start `Pending`.
- Only the gig owner may `PATCH` an application.
- Accept only a `Pending` application on an effectively `Open` gig. Then run the accept transition above.
- Reject only a `Pending` application. Gig status stays unchanged.
- Owner cannot accept or reject an application that is already `Accepted` or `Rejected`.

Reviews:

- Gig must be `Completed`.
- Reviewer is the authenticated user and must be the owner or the accepted applicant.
- `reviewee_id` must be the other participant.
- One review per reviewer per gig.
- `rating` integer 1–5. `comment` required, non-empty, max 500 characters.
- Profile averages come from these rows. No endpoint edits `average_rating`.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/signup` | Create an account. Returns `{ token, user }` |
| POST | `/auth/login` | `{ email, password }`. Returns `{ token, user }` or `401` |
| GET | `/auth/me` | Current user from the bearer token |
| GET | `/users` | List users. `password_hash` is omitted |
| GET | `/users/:id` | Profile plus computed stats |
| GET | `/gigs` | Search and filter. Query: `category`, `type`, `payment_type`, `min`, `max`, `q` |
| GET | `/gigs/:id` | Gig detail, effective status |
| POST | `/gigs` | Create gig as the authenticated user |
| PATCH | `/gigs/:id` | Owner sets `Completed` or `Cancelled` |
| GET | `/applications` | Query: `gig_id`, `applicant_id` |
| POST | `/applications` | Apply to a gig |
| PATCH | `/applications/:id` | Owner sets `Accepted` or `Rejected` |
| GET | `/reviews` | Query: `reviewee_id`. Omit it to return every review |
| POST | `/reviews` | Review the other party |

Errors use `{ "error": "..." }`. `400` validation. `401` missing or invalid token, or wrong login (`Invalid email or password`). `403` not the owner, applying to your own gig, or reviewing when you are not a participant. `404` unknown user, gig, or application. `409` duplicate email, duplicate application, duplicate review, or an illegal status change.

Every route except `/auth/*` requires a bearer token. `/auth/me` still requires one.

## Seed data

`npm run seed` writes `data/db.json`. Counts are minimums; relationships must already satisfy the rules above. The current seed is 12 users, 27 gigs, 35 applications, and 9 reviews. Every user has `firstname.lastname@campus.edu` and the bcrypt hash of `Demo@1234`. u01–u05 are Aisha Khan, Bilal Ahmed, Sara Malik, Hamza Raza, and Zainab Tariq. See `DEMO_ACCOUNTS.md`.

- At least 12 users with names, majors, semesters, bios, and skills.
- At least 25 gigs across Programming, Design, Writing, and Tutoring; both `Offering` and `Requesting`; all three payment types; all five effective statuses.
- Some stored-`Open` gigs have a past deadline so they surface as `Expired`.
- Each `In Progress` and `Completed` gig has `accepted_applicant_id` and exactly one `Accepted` application. Other applications on that gig are `Rejected`.
- At least 20 applications mixed across `Pending`, `Accepted`, and `Rejected`.
- At least 8 reviews, only on `Completed` gigs, each from owner or accepted applicant to the other, one per reviewer per gig, ratings 1–5.

## Coding conventions

- Small, focused changes. Edit existing files instead of rewriting them.
- Do not add dependencies beyond Express, Vite, React, the Vite React plugin, Tailwind, bcryptjs, jsonwebtoken, and lucide-react unless asked.
- Keep business rules in the API. The UI may hide invalid actions; it is not the source of truth.
- IDs are strings. Dates are ISO-8601.

## Progress

- [x] Stage 1 — Express API, seed file, business rules, and `npm run test:api`
- [x] Stage 2 — Browse, profiles, create gig, apply, and my applications
- [x] Stage 3 — Owner actions, My Gigs, reviews, and toasts
- [x] Auth — signup, login, bearer tokens, and demo accounts

## Milestones

- [x] M1 Profiles and validated gig creation.
- [x] M2 Search, filters, applications, and expired gigs.
- [x] M3 Applicant selection, In Progress, completion, and cancel.
- [x] M4 Two-way reviews and computed reputation.
- [x] M5 Seeded Express API covers the endpoints above with at least 12 users, 25 gigs, 20 applications, and 8 reviews.

## App sections

Logged-in browsing is two sections of the existing gig `type`. Login and signup stay outside them and do not show the switcher.

Each section is what the visitor wants to do, so the catalogue shows the opposite gig type. A student's own gigs are hidden from the catalogue and live under My gigs.

| Section | Path | Catalogue shows | Post button creates | Landing copy |
| --- | --- | --- | --- | --- |
| Offer a service | `/offer` | `Requesting` | `Offering` | "Requests from students". Cards say "Requested by". Apply button: "Offer your help". |
| Request a service | `/request` | `Offering` | `Requesting` | "Services offered by students". Cards say "Offered by". Apply button: "Request this service". |

- The switcher sits under the navbar on every logged-in page, including profile. It is a tablist (`role="tablist"`, arrow keys, `aria-selected`). Choosing a tab opens that section's catalogue.
- The last section is stored in `localStorage` as `campus-section`. After login, and when a logged-in user opens `/`, the app goes to that section. The default is `/offer`.
- A section catalogue, its search results, category chips, and See all rows show only that browse type, excluding the current user's gigs. Expired and Cancelled gigs stay out of the catalogue.
- My gigs lists everything the user posted, with sub-tabs "Offered by me" and "Requested by me". My applications lists every application, with counts for All, Under review, Accepted, and Rejected. Pending is shown as Under review.
- "Post a gig" inside Offer a service opens `/gigs/new?type=Offering`. Inside Request a service it opens `/gigs/new?type=Requesting`. The type control on the form stays editable. After a successful post the app opens the new gig and tells the student it is under My gigs.
- Applying is a 3-step dialog (`ApplyWizard`): review the gig, write a proposal, then review and submit. Shared pieces live in `client/src/flow.jsx`: `Stepper`, `StatusTracker`, `ApplyWizard`, `ApplicantCard`, `ConfirmDialog`, `Tabs`, and `GigStepper`.
- The navbar search opens a filter panel. API filters stay `category`, `payment_type`, `min`, `max`, and `q`, combined with the section's browse type. `status`, `sort`, and `group` (`unpaid` or `closing`) are applied in the browser because `GET /gigs` has no status or sort query. The panel writes those keys to the URL. Clearing them returns to the catalogue.

## Visual design

Colors live in `client/src/index.css` as Tailwind theme tokens. Components use those utilities instead of hard-coded hex values.

| Role | Hex |
| --- | --- |
| Canvas | `#F4F1EA` |
| Surface | `#FFFFFF` |
| Ink | `#1B2430` |
| Secondary / muted | `#3E4A55` / `#4A5560` |
| Line | `#E7E1D6` |
| Offer (primary) | `#0A6B5C` |
| Offer deep / bright / soft | `#075248` / `#12A58C` / `#E5F5F1` |
| Request | `#5B3DF5` |
| Request deep / soft | `#4328C9` / `#F0EBFF` |
| Coral accent | `#C2413A` |
| Coral bright / soft | `#E36A4F` / `#FFEDE8` |
| Success | `#146B45` |
| Warning (Paid) | `#8A4B08` |
| Danger | `#B42318` |
| In progress | `#1E4B86` |
| Star | `#B86E09` |

Offer uses the teal family for the active tab, hero, and buttons. Request uses violet for those same roles so white labels stay WCAG AA. Coral is the warm accent (deadline hints and the request hero wash). Payment and status badges use the success, warning, danger, progress, offer, and request tokens on tinted backgrounds.

Fonts: Outfit for headings, Plus Jakarta Sans for body and form text. Headings use `clamp()` and tight tracking. Body line height is 1.6. Inputs stay at 16px.

Breakpoints are mobile-first Tailwind defaults. Catalogue blocks scroll sideways inside the page. Gig cards are 1 column below 768px, 2 from `md` (768px), and 3 from `lg` (1024px). The navbar search is an icon below `md` and a bar from `md`. The navbar links collapse into a hamburger below `lg`. Page content stops at `max-w-6xl` (72rem). Gig detail is one column below `lg` and two columns from `lg`, with the action panel sticky on desktop. Checked at 320, 375, 768, 1024, and 1440px, plus a short landscape width, with no horizontal overflow.
