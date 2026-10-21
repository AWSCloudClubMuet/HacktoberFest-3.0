# Campus Gig & SkillSwap Portal

### Problem 2 · Team PhantomX

**Learn. Offer. Earn.** A campus marketplace where students post short gigs, apply, get accepted, finish the work, and review each other. Reputation is the average of stored reviews — calculated on read, never edited by hand.

| | |
|---|---|
| **The problem** | Students need quick help with coding, design, writing, and tutoring — paid, skill-swap, or free — without a heavy freelance platform. |
| **The solution** | Dual browse modes (**Offer a service** / **Request a service**), validated applications, owner accept/reject, completion, two-way reviews, and chat with optional Jitsi video. |
| **Stack** | Node.js 18+ · Express · Vite · React · Tailwind CSS · JWT · bcrypt |
| **Data** | In-memory store from `data/db.json` (no external database) |
| **Proof** | Seeded demo · `npm run test:api` rule suite · milestones M1–M5 complete |

---

## Try it in two minutes

From this folder, with **Node.js 18+**:

```bash
cd submission/PhantomX/problem-2
npm install
npm run seed
npm run dev
```

| Service | URL |
| --- | --- |
| App | http://localhost:5173 |
| API | http://localhost:3001 |

Log in with a **Demo accounts** chip on the login page, or use any email below with password `Demo@1234`. Full walkthrough and judge logins: [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md).

| Name | Email | Good for |
| --- | --- | --- |
| Aisha Khan | `aisha.khan@campus.edu` | Poster with pending applicants + completed chat |
| Bilal Ahmed | `bilal.ahmed@campus.edu` | Applicant (Pending / Accepted / Rejected) |
| Sara Malik | `sara.malik@campus.edu` | Completed work and ratings |
| Hamza Raza | `hamza.raza@campus.edu` | In-progress gig + live chat |
| Zainab Tariq | `zainab.tariq@campus.edu` | Fresh account — create and apply from scratch |

`npm run seed` rewrites `data/db.json`. A running API reloads that file on the next request.

---

## What you can do

- **Browse by intent** — Offer a service shows *requests*; Request a service shows *offerings*. Your own gigs stay under **My gigs**.
- **Post a gig** — Offering or Requesting; Paid / Skill Swap / Free; categories Programming, Design, Writing, Tutoring.
- **Apply** — 3-step wizard (review → proposal → submit). Optional availability, portfolio link, and swap offer.
- **Owner actions** — Accept one applicant (others rejected), complete from In Progress, or cancel.
- **Reviews** — After completion, each participant rates the other once. Profile average updates automatically.
- **Chat & video** — Owner and accepted applicant get a polling chat; **Start video call** opens a Jitsi room; **Share call link** posts the URL.
- **Search & filters** — Category, payment type, budget range, text query, plus client-side status/sort/group.

---

## Milestone checklist for evaluators

| Milestone | Requirement | Status |
| --- | --- | --- |
| **M1** | Profiles and validated gig creation | Done |
| **M2** | Search, filters, applications, expired gigs | Done |
| **M3** | Applicant selection, In Progress, completion, cancel | Done |
| **M4** | Two-way reviews and computed reputation | Done |
| **M5** | Seeded Express API (12+ users, 25+ gigs, 20+ applications, 8+ reviews) | Done |

Current seed: **12 users**, **27 gigs**, **35 applications**, **9 reviews**, **10 messages**.

---

## Gig lifecycle

Effective status: if stored status is `Open` and the deadline is past, the gig reads as **Expired**. Clients never set `Expired` directly.

```
  Open ──accept applicant──► In Progress ──owner complete──► Completed
   │                              │
   └──────── cancel ──────────────┴──────── cancel ────────► Cancelled

  Open + past deadline ──► Expired (computed on read)
```

| Rule | Behavior |
| --- | --- |
| Accept | Only on effectively Open + Pending application → In Progress; other Pending apps rejected |
| Complete | Owner only, and only from In Progress |
| Cancel | Owner only from Open or In Progress |
| Apply | Not to your own gig, not twice, not unless effectively Open |
| Review | Only on Completed; one review per reviewer per gig; must be the other participant |

Business rules live in the **API**. The UI hides invalid actions but is not the source of truth.

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | API + Vite together |
| `npm start` | API only (`http://localhost:3001`) |
| `npm run client` | Vite only (`http://localhost:5173`) |
| `npm run seed` | Reset `data/db.json` |
| `npm run test:api` | Rule checks against a temporary database |
| `npm run build` | Production client build |

Optional env:

| Variable | Default | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | `campus-gig-dev-secret` | Token signing |
| `VITE_API_URL` | `http://localhost:3001` | Client → API base URL |

Auth: signup / login return a JWT. The client sends `Authorization: Bearer <token>` on every route except login and signup. No email verification, password reset, or OAuth.

---

## Project layout

```
problem-2/
├── client/                 # Vite + React + Tailwind UI
│   ├── public/             # favicon
│   └── src/
│       ├── pages/          # catalogue, detail, create, my gigs, applications, auth, profile
│       ├── flow.jsx        # apply wizard, chat, steppers, dialogs
│       ├── api.js          # fetch + bearer token
│       └── index.css       # design tokens
├── server/
│   ├── index.js            # Express routes + business rules
│   ├── seed.js             # writes data/db.json
│   ├── store.js            # load / save / effective status helpers
│   └── test-api.js         # automated rule suite
├── data/db.json            # in-memory store (seeded)
├── DEMO_ACCOUNTS.md        # judge logins and walkthrough
├── AGENTS.md               # full product / API reference for contributors
└── package.json
```

---

## API overview

Every route except `/auth/signup` and `/auth/login` requires a bearer token (`/auth/me` included).

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/signup` | Create account → `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` → `{ token, user }` or `401` |
| GET | `/auth/me` | Current user from token |
| GET | `/users` | List users (`password_hash` omitted) |
| GET | `/users/:id` | Profile + computed `gigs_posted`, `gigs_completed`, `average_rating` |
| GET | `/gigs` | Filters (AND): `category`, `type`, `payment_type`, `min`, `max`, `q` |
| GET | `/gigs/:id` | Detail with effective status |
| POST | `/gigs` | Create gig as the authenticated user |
| PATCH | `/gigs/:id` | Owner sets `Completed` or `Cancelled` |
| GET | `/applications` | Query: `gig_id`, `applicant_id` |
| POST | `/applications` | Apply to a gig |
| PATCH | `/applications/:id` | Owner sets `Accepted` or `Rejected` |
| GET | `/reviews` | Query: `reviewee_id` (omit for all) |
| POST | `/reviews` | Review the other participant |
| GET | `/gigs/:id/messages` | Chat for owner + accepted applicant |
| POST | `/gigs/:id/messages` | Send `{ text }` (read-only when Cancelled / Expired) |

Errors: `{ "error": "..." }`

| Code | Meaning |
| --- | --- |
| `400` | Validation |
| `401` | Missing/invalid token or wrong login |
| `403` | Not allowed (e.g. not owner, apply to own gig) |
| `404` | Unknown user, gig, or application |
| `409` | Duplicate or illegal status change |

---

## Design choices

- **API is the source of truth** — invalid status transitions, duplicate applies, and review rules are enforced server-side.
- **Expired is computed** — stored Open + past deadline → Expired on read; never patched in by clients.
- **In Progress only via accept** — you cannot patch a gig into In Progress.
- **Reputation is derived** — `average_rating` and `gigs_completed` are calculated from reviews and gigs, never stored as editable fields.
- **Sections mirror intent** — catalogue shows the opposite gig type so “Offer” surfaces requests and “Request” surfaces offerings.
- **Lightweight stack** — Express + Vite + React + Tailwind; no extra UI kit; small History API router.

Contributor-level detail (data model, filters, visual tokens): see [AGENTS.md](AGENTS.md).

---

## Suggested 5-minute demo

1. Log in as **Zainab** → browse Offer / Request → post a Paid offering.
2. Log in as **Bilal** → find it under Request a service → apply via the wizard.
3. Log in as **Zainab** → accept Bilal → gig becomes In Progress → mark Completed → leave a review.
4. Log in as **Bilal** → leave a reciprocal review → check both profiles for updated averages.
5. Log in as **Hamza** → open **Node API walkthrough** → use chat and **Start video call**.

More scenarios and edge cases: [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md).

---

## License / notes

Hackathon submission for **AWS-Hackathon** · team **PhantomX** · branch `team-phantomx`. Demo accounts are fictional; password `Demo@1234` is for judging only.
