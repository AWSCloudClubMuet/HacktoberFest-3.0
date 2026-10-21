# Campus Gig & SkillSwap Portal

Mock API for a campus marketplace. Students post gigs, apply, get accepted, complete the work, and review each other. This folder currently contains the backend only.

## Run

From `submission/PhantomX/problem-2/` (Node.js 18 or newer):

```bash
npm install
npm run seed
npm start
```

The API listens on `http://localhost:3001`. Send the acting student as the `x-user-id` header (for example `u01`).

`npm run seed` rewrites `data/db.json`. A running server reloads that file on the next request.

## Test

```bash
npm run test:api
```

The script starts a temporary server and checks duplicate apply, applying to your own gig, the accept cascade, completing a gig from Open, and a duplicate review.
