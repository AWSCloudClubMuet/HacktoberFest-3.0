# Swapboard

A campus gig and skill-swap marketplace. Students post what they can do or what they need, apply, get picked, finish the work and review each other. Reputation is calculated from stored reviews.

No database to install and no `npm install` needed: the backend is plain Node.js with JSON-file storage, and the frontend is vanilla JavaScript served by the same process.

## Run it

You need [Node.js 18+](https://nodejs.org) (check with `node -v`).

```bash
npm start
```

Open **http://localhost:3000**. First run creates `data/db.json` from the seed data (12 users, 25 gigs, 22 applications, 8 reviews).

| Command | What it does |
| --- | --- |
| `npm start` | Start the app on port 3000 (`PORT=4000 npm start` to change it) |
| `npm run dev` | Same, but restarts when you edit server files |
| `npm run reset` | Rewrite `data/db.json` from the seed (or use "Reset demo data" in the footer) |

## How to demo it

There is no login. Use **Acting as** in the header to switch between students.

1. Switch to **Hamza Siddiqui** and open "Landing page in React" (Ayesha's gig). Send an application.
2. Try applying again, or apply to Hamza's own gig. The API rejects both.
3. Switch to **Ayesha Khan**, open her gig, accept one applicant. The gig turns In Progress and the others are rejected automatically.
4. Mark it completed, then both people can leave one review each. Check the profile: the average rating changes.
5. Expired gigs (past deadline, never accepted) show an Expired stamp.

## Project layout

```
server/index.js   REST API, all business rules, static file server
server/seed.js    Seed data and enums
public/           index.html, styles.css, app.js (no build step)
data/db.json      Created on first run (git-ignored)
```

## API

Base URL `http://localhost:3000/api` (the `/api` prefix is optional). Send `X-User-Id: <id>` on requests that act as a user.

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/gigs?category=&type=&payment_type=&status=&min_budget=&max_budget=&q=&sort=&user_id=` | `q` searches title and description. `sort`: newest, deadline, budget_high, budget_low. Open gigs past deadline come back as `Expired`. |
| GET | `/gigs/:id` | Includes owner, accepted applicant, application count |
| POST | `/gigs` | Validated: title, description, type, category, payment_type, budget (required if Paid), deadline |
| PATCH | `/gigs/:id` | Owner only. Status moves: Open to Cancelled, In Progress to Completed or Cancelled. Edit title, description, deadline, budget while Open. |
| POST | `/applications` | `{gig_id, message}`. Rejects own gig, duplicates, and gigs that are not Open. |
| GET | `/applications?gig_id=&applicant_id=` | Visible to the applicant and the gig owner only |
| PATCH | `/applications/:id` | Owner only, `{status: "Accepted" \| "Rejected"}`. Accepting sets the gig to In Progress, stores `accepted_applicant_id`, rejects all other Pending applications. |
| POST | `/reviews` | `{gig_id, rating 1-5, comment}`. Gig must be Completed, reviewer must be owner or accepted applicant, one review per reviewer per gig. |
| GET | `/reviews?user_id=&gig_id=&reviewer_id=` | `user_id` means reviews received |
| GET / POST / PATCH | `/users`, `/users/:id` | Profile stats and `avg_rating` are computed from reviews |
| POST | `/reset` | Restore seed data |

Errors look like `{ "error": "message", "details": { "field": "message" } }` with 401, 403, 404, 409 or 422 as appropriate.

```bash
curl "localhost:3000/api/gigs?category=Design&type=Offering&q=logo"
curl -X POST localhost:3000/api/applications -H "Content-Type: application/json" -H "X-User-Id: 2" \
  -d '{"gig_id":1,"message":"I can ship this by Friday."}'
```

## Team workflow with VS Code and GitHub

### One person: publish the repo (once)

1. Install [Git](https://git-scm.com/downloads), then tell it who you are:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
   ```
2. On github.com click **New repository**. Name it `swapboard`, leave it empty (no README, no .gitignore), create it.
3. Open the project folder in VS Code (**File > Open Folder**), open the terminal (**Ctrl+\`**) and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Swapboard"
   git branch -M main
   git remote add origin https://github.com/<your-username>/swapboard.git
   git push -u origin main
   ```
   VS Code will pop up a GitHub sign-in the first time. Approve it in the browser.
4. On GitHub go to **Settings > Collaborators > Add people** and invite every teammate.
5. Optional but wise: **Settings > Branches > Add rule** for `main`, require a pull request before merging.

### Everyone else: join

1. Accept the invite email from GitHub.
2. In VS Code press **Ctrl+Shift+P** (Cmd+Shift+P on Mac), type **Git: Clone**, paste the repo URL, choose a folder, click **Open** when asked.
3. Run `npm start` in the terminal. It works straight away.

### Daily loop (no merge headaches)

1. **Pull first.** Click the sync icon in the bottom-left status bar, or `git pull`.
2. **Branch per task.** Click the branch name in the status bar, **Create new branch**, e.g. `feature/profile-edit`. Never work directly on `main`.
3. **Commit small.** Source Control panel (Ctrl+Shift+G): review changes, type a message like `Add profile edit form`, click **Commit**.
4. **Push** the branch (**Publish Branch** button the first time).
5. On GitHub click **Compare & pull request**, ask a teammate to review, then **Merge**.
6. Back in VS Code switch to `main`, pull, and start the next branch.

### Avoiding conflicts

- Split work by file or area: one person on `server/`, one on `public/styles.css`, one on `public/app.js` views, one on README and the demo script.
- Pull before you start and before you push.
- If VS Code shows a conflict, open the file, use the **Accept Current / Accept Incoming / Accept Both** buttons above the conflict markers, save, stage the file, commit.
- `data/db.json` is git-ignored on purpose, so everyone's demo data stays local. Run `npm run reset` if yours gets messy.

### Handy extensions

Open the Extensions panel and accept the recommendations from `.vscode/extensions.json`: GitLens (see who changed a line), Prettier (consistent formatting), Live Share (pair-program in the same session).
