# CampusGig & SkillSwap

A campus gig board and skill exchange, submitted by **CTRL + ALT + G3** for [HacktoberFest issue #12](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/12).

This folder contains the **frontend and backend** from the supplied `skillswap-backend.zip`. The frontend uses HTML, CSS and plain JavaScript; the API uses Node.js, Express and a persisted JSON database.

## Run

Requires **Node.js 18+** and npm. Python 3 is used below to serve the static frontend. The supplied `backend/db/db.json` is ready to use.

**Terminal 1**, from `submission/ctrl-alt-g3/campusgig/backend`:

```bash
npm ci
npm start
```

The API starts at `http://localhost:4000`. Check `http://localhost:4000/health` for a JSON health response.

**Terminal 2**, from `submission/ctrl-alt-g3/campusgig` on Windows:

```powershell
py -3 -m http.server 5173 --directory frontend
```

Use `python3` instead of `py -3` on Linux/macOS. Open **http://localhost:5173** in your browser. Choose a demo user in the interface before creating gigs or applying.

The frontend API address is currently `http://localhost:4000` in `frontend/index.html`. The supporting module `frontend/js/api.js` also defines that address. Set the backend's `PORT` environment variable and update both addresses together if using another port.

## Features

- Browse and filter Offering/Requesting gigs across Programming, Design, Writing and Tutoring, with Paid, Free and SkillSwap payment types.
- Create gigs with validation of their budget and deadline. Expired status is computed from open gigs' deadlines.
- Apply to another user's gig; prevent duplicate and self applications.
- Let the gig owner accept/reject applicants, close the gig to new applications, complete work or cancel it according to the API's status rules.
- Allow eligible participants to review completed gigs, with ratings calculated from stored reviews.
- Persist users, gigs, applications and reviews in `backend/db/db.json`.

Demo identity is selected in the UI and sent as `x-user-id`. The API checks ownership for protected operations. This is the challenge's demo user model rather than password-based account authentication.

## Reset demo data

From `backend`, run:

```bash
npm run seed
```

This replaces the demo database with 12 users, 28 gigs, 23 applications and 9 reviews, with dates relative to the day the command runs. Restart a running backend after reseeding because it keeps the database in memory.

## Verify

With the API running, from `backend`:

```bash
npm run test:flow
```

The flow test creates additional demo records. It checks creation and validation, application ownership and duplicates, acceptance and automatic rejection, completion, review restrictions and calculated ratings.

Verified with Node.js **24.19.0**: all **25 flow checks passed** against an isolated copy of the uploaded database. Backend/frontend JavaScript syntax checks passed, and the frontend index and both JavaScript modules were successfully served over HTTP. A browser interaction walkthrough was not performed in this verification.

## Layout

- `frontend/index.html` — interface, styling and page interactions.
- `frontend/js` — reusable API and user-switcher helpers.
- `backend/server.js` — Express API entry point and route registration.
- `backend/routes`, `backend/services`, `backend/middleware` — HTTP handlers, rules and demo user checks.
- `backend/db` — JSON persistence and seed generator.
- `backend/scripts/smoke-test.js`, `backend/test.http` — runnable flow checks and HTTP examples.

Install dependencies with the committed package lock; `node_modules` is excluded from the submission source.
