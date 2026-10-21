# Campus Gig & SkillSwap Portal

Students post short gigs, apply, get accepted, finish the work, and review each other. Reputation is the average of stored reviews. The browser only reads and writes through the Express API.

## Setup

From `submission/PhantomX/problem-2/`, with Node.js 18 or newer:

```bash
npm install
npm run seed
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:3001

`npm start` runs the API alone. `npm run client` runs the Vite app alone. `npm run seed` rewrites `data/db.json`. A running API reloads that file on the next request.

There is no login. The header dropdown is the current student, and every request sends that id as `x-user-id`.

## Test the API

```bash
npm run test:api
```

The script uses a temporary database. It checks duplicate apply, applying to your own gig, the accept cascade, completing a gig from Open, and a duplicate review.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/users` | Students for the switcher, with computed stats |
| GET | `/users/:id` | Profile: `gigs_posted`, `gigs_completed`, `average_rating` |
| GET | `/gigs` | Filters combine with AND: `category`, `type`, `payment_type`, `min`, `max`, `q` |
| GET | `/gigs/:id` | Gig detail. An Open gig past its deadline is returned as `Expired` |
| POST | `/gigs` | Create a gig for `x-user-id` |
| PATCH | `/gigs/:id` | Owner sets `Completed` or `Cancelled` |
| GET | `/applications` | Filter with `gig_id` and/or `applicant_id` |
| POST | `/applications` | Apply with `{ gig_id, message }` |
| PATCH | `/applications/:id` | Owner sets `Accepted` or `Rejected` |
| GET | `/reviews` | Filter with `reviewee_id`, or omit it for every review |
| POST | `/reviews` | `{ gig_id, reviewee_id, rating, comment }` |

Errors are `{ "error": "..." }`. `400` is a validation problem or a missing `x-user-id`. `403` means the caller is not allowed. `404` is a missing record. `409` is a duplicate or an illegal status change.

## Design choices

Business rules live in the API. The UI hides actions that cannot succeed, and it still shows the API's error when a request is rejected.

An Open gig past its deadline is shown as Expired when it is read. That status is not stored, and clients cannot set it.

Accepting an applicant is the only way a gig becomes In Progress. The same request rejects the other pending applications. Completion is allowed only from In Progress. Profile averages and completed-gig counts are calculated from reviews and gig rows, not edited by hand.

The client is React, Vite, and Tailwind, with a small in-app router. No extra UI library. The seed is 12 students and a mix of categories, payment types, and statuses so the screens are usable before anyone posts.
