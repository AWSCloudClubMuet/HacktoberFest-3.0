# Campus Gig & SkillSwap Portal

Campus marketplace where students post gigs, apply, and build a reputation from completed work. The UI reads and writes only through the Express API.

## Run

From `submission/PhantomX/problem-2/` (Node.js 18 or newer):

```bash
npm install
npm run seed
npm run dev
```

- API: `http://localhost:3001`
- App: `http://localhost:5173`

The header dropdown chooses the current student. Every request sends that id as `x-user-id`.

`npm start` runs the API alone. `npm run client` runs the Vite app alone. `npm run seed` rewrites `data/db.json`; a running API reloads it on the next request.

## Test the API

```bash
npm run test:api
```

The script uses a temporary database and checks duplicate apply, applying to your own gig, the accept cascade, completing a gig from Open, and a duplicate review.
