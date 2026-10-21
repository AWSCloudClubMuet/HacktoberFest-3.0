# Campus Gig & SkillSwap Portal

A web platform where students offer skills or request short-term help (paid, skill exchange or free),
apply to gigs, get selected by the gig owner, and build a reputation through mutual reviews after
the work is done.

The project is a custom mock REST API (Node.js + Express) that also serves a single-page frontend
written in plain HTML, CSS and JavaScript. All data is fetched from and changed through the API.

---

## 1. Quick start

**Requirements:** Node.js 18 or newer and npm.

```bash
cd campus-gig
npm run setup      # install server dependencies (run once)
npm start          # start the API and the web app
```

Then open **http://localhost:4000**.

Equivalent manual steps: `cd campus-gig/server && npm install && npm start`.

| Command (run in `campus-gig/`) | What it does |
|---|---|
| `npm run setup` | Installs the server dependencies (`express`, `cors`) |
| `npm start` | Starts the server on port 4000 |
| `npm run dev` | Starts the server with automatic restart on file changes |
| `npm run reset` | Deletes the saved data file; the seed data is loaded again on the next start |

The port (4000) is set in `server/index.js`.

---

## 2. Technology

- **Backend:** Node.js, Express 4, CORS. ES modules.
- **Frontend:** one file, `server/public/index.html` (no framework, no build step).
- **Data store:** an in-memory object that is saved to `server/data/db.json` after every successful
  change, so data survives a restart.

---

## 3. Using the application

There is no password login. Use the **Signed in as** dropdown in the header to act as any of the
seeded students. The browser remembers your choice. Because every student can both post gigs and
apply to other students' gigs, the same account acts as Poster or Applicant depending on the gig.

### Pages

| Page | Address | Purpose |
|---|---|---|
| Browse | `#/` | Campus summary, filters, sorting and a table of all gigs |
| Dashboard | `#/dashboard` | Your gigs with pending-application counts, your applications, and completed gigs waiting for your review |
| Post a Gig | `#/create` | Create an Offering or Requesting gig |
| My Applications | `#/apps` | Your applications and their statuses; withdraw pending ones |
| Gig detail | `#/gig/:id` | Details, status timeline, apply form, applicant management (owner), reviews |
| Edit gig | `#/edit/:id` | Owner edits an Open gig |
| Profile | `#/profile/:id` | Name, major, semester, bio, skills, gigs posted, gigs completed, average rating, reviews |

### Interface features

- Filter by keyword, category, type, payment type, status and budget range; sort by newest, budget or deadline.
- Removable filter tags and a "N gigs found" count.
- Colour-coded status and payment tags; Expired and Cancelled rows are faded.
- Deadline notes: "Due in N days" (amber at 3 days or fewer) and "Expired" / "Overdue" (red).
- Confirmation dialogs for accepting an applicant (it explains that all other pending applications are rejected), cancelling, completing, deleting, withdrawing and resetting data.
- Clickable 1 to 5 star rating when leaving a review.
- Average rating and review count next to poster and applicant names.
- Profile tags: Top Rated (average 4.5 or higher with at least 3 reviews), Well Reviewed (average 4 or higher with at least 1 review), Reliable (5 or more completed gigs), Active Poster (3 or more gigs posted).
- A "Matches your skills" line on a gig when one of your profile skills appears in its title, description or category.
- A status timeline on each gig: Open, In Progress, Completed.
- Light and dark theme, remembered by the browser; the filter sidebar collapses on narrow screens.

---

## 4. Data model

| Entity | Fields |
|---|---|
| **User** | `id, name, major, semester, bio, skills (string array)` |
| **Gig** | `id, user_id, title, description, type (Offering/Requesting), category (Programming/Design/Writing/Tutoring), payment_type (Paid/SkillSwap/Free), budget (nullable), deadline, status (Open/In Progress/Completed/Expired/Cancelled), accepted_applicant_id (nullable), created_at` |
| **Application** | `id, gig_id, applicant_id, message, status (Pending/Accepted/Rejected), created_at` |
| **Review** | `id, gig_id, reviewer_id, reviewee_id, rating (1-5), comment` |

Values calculated by the API and never stored:

- On users: `gigs_posted`, `gigs_completed`, `average_rating` (null when there are no reviews) and `review_count`. The average is always computed from the stored reviews and cannot be edited.
- On gigs: `owner` (id, name, major) and `application_count`.
- **Expired:** an Open gig whose deadline has passed is reported with status `Expired`. This is computed at request time, not saved.

---

## 5. API reference

Base URL: `http://localhost:4000`. Requests and responses use JSON.

**Identifying the user:** send the header `x-user-id: <user id>`. Endpoints marked "user required"
return `401` without it. This is a demo mechanism, not real authentication.

Errors are returned as `{ "error": "message" }` with status 400 (validation or rule violation),
401 (no user), 403 (not allowed), 404 (not found) or 409 (duplicate).

### Users

| Method and path | Access | Description |
|---|---|---|
| `GET /users` | public | All users with computed stats |
| `GET /users/:id` | public | One user with stats, received reviews and posted gigs |
| `PATCH /users/:id` | user required, own profile only | Update `name, major, semester, bio, skills`. The average rating is not editable |

### Gigs

| Method and path | Access | Description |
|---|---|---|
| `GET /gigs` | public | List gigs. Query parameters: `category`, `type`, `payment_type`, `status`, `user_id`, `min_budget`, `max_budget`, `q` (keyword search across title and description). Example: `/gigs?category=Design&type=Requesting&q=poster` |
| `GET /gigs/:id` | public | One gig |
| `POST /gigs` | user required | Create a gig (status starts as Open) |
| `PATCH /gigs/:id` | owner only | Change status and/or edit fields (see rules below) |
| `DELETE /gigs/:id` | owner only | Delete a gig that is not In Progress or Completed; its applications are deleted too |

Notes: when `min_budget` or `max_budget` is used, gigs without a budget (Free and Skill Swap) are
excluded. Results are sorted newest first.

### Applications

| Method and path | Access | Description |
|---|---|---|
| `GET /applications?applicant_id=<own id>` | user required | Your own applications |
| `GET /applications?gig_id=<id>` | owner of that gig only | All applications for the gig |
| `POST /applications` | user required | Apply with `{ gig_id, message }` |
| `PATCH /applications/:id` | gig owner only | `{ "status": "Accepted" }` or `{ "status": "Rejected" }` |
| `DELETE /applications/:id` | applicant only | Withdraw your own Pending application |

### Reviews

| Method and path | Access | Description |
|---|---|---|
| `GET /reviews` | public | List reviews; optional `gig_id` and `reviewee_id` filters |
| `POST /reviews` | user required | `{ gig_id, rating, comment }`. The reviewee is set automatically to the other party |

### Other

| Method and path | Description |
|---|---|
| `POST /reset` | Restore the original seed data and save it |

---

## 6. Business rules

### Milestone 1: Profiles and gig creation
- A gig needs a title of at least 5 characters, a description of at least 10, a type (Offering or Requesting), a category, a payment type and a valid deadline that is not in the past.
- Paid gigs require a budget greater than 0. Skill Swap and Free gigs always store `budget: null`, even if a budget is sent.
- Only the owner can edit a gig, and only while it is Open.

### Milestone 2: Discovery and applications
- An application needs a message of at least 5 characters.
- Applying to your own gig is rejected (400). Applying twice to the same gig is rejected (409).
- Only Open gigs accept applications; Expired, In Progress, Completed and Cancelled gigs do not.
- You can only list your own applications.

### Milestone 3: Applicant selection and status
- Only the gig owner can accept or reject applications and change the gig status.
- Accepting an applicant: the application becomes Accepted, the gig moves to **In Progress**, `accepted_applicant_id` is set, every other Pending application is set to Rejected, and the gig stops accepting applications. An Expired gig cannot have an applicant accepted.
- Only Pending applications can be accepted or rejected.
- Status flow: **Open, then In Progress, then Completed.** Setting Completed is allowed only from In Progress. In Progress can only be reached by accepting an applicant, not by setting it directly.
- An owner can cancel an Open or In Progress gig. Cancelling rejects Pending and Accepted applications and clears `accepted_applicant_id`.

### Milestone 4: Mutual reviews and reputation
- Reviews are allowed only after the gig is Completed.
- Only the owner and the accepted applicant can review, and each reviews the other.
- The rating must be a whole number from 1 to 5. The comment is optional text.
- Each reviewer can review a gig only once (409 on a second attempt).
- Average ratings are calculated from stored reviews every time they are requested.

---

## 7. Seed data

On first start the server loads the following (the specification asked for at least 12 users, 25 gigs, 20 applications and 8 reviews):

| Entity | Count | Breakdown |
|---|---|---|
| Users | 14 | Different majors, semesters, bios and skill lists |
| Gigs | 28 | Categories: Programming 8, Design 7, Writing 7, Tutoring 6. Types: Offering 12, Requesting 16. Payment: Paid 19, Skill Swap 4, Free 5 |
| Gig statuses | | Open 12, In Progress 3, Completed 9, Expired 2, Cancelled 2 |
| Applications | 23 | Accepted 12, Rejected 3, Pending 8 |
| Reviews | 10 | Covering completed gigs, including two-way reviews |

Seed deadlines are set relative to the day the seed data is created. Because the data is then saved,
gigs that were Open can later appear as Expired as time passes. Use `POST /reset` (or the
**Reset data** link in the header) to generate fresh dates.

---

## 8. Data persistence and reset

- Every successful `POST`, `PATCH` or `DELETE` is written to `server/data/db.json`. The file is created automatically.
- To return to the seed data, either click **Reset data** in the app, call `POST /reset`, or run `npm run reset` and restart the server.
- Delete `server/data/` at any time; it is rebuilt from the seed data on the next start. It is excluded in `.gitignore`.

---

## 9. Project structure

```
Task2/
  README.md
  campus-gig/
    package.json            root scripts: setup, start, dev, reset
    .gitignore
    server/
      package.json          dependencies: express, cors
      index.js              app setup, routes, saves data after changes, port 4000
      db.js                 data store, file saving, computed fields (stats, Expired)
      seed.js               seed users, gigs, applications, reviews
      middleware.js         reads the x-user-id header
      routes/
        users.js
        gigs.js
        applications.js
        reviews.js
      public/
        index.html          the entire frontend (HTML, CSS, JavaScript)
      data/                 created at runtime (db.json), not committed
```

---

## 10. Quick API test (optional)

With the server running:

```bash
# Browse and filter (no user needed)
curl "http://localhost:4000/gigs?category=Design&type=Requesting&q=poster"

# Create a gig as user 1
curl -X POST http://localhost:4000/gigs -H "Content-Type: application/json" -H "x-user-id: 1" \
  -d '{"title":"Need slides reviewed","description":"Review a ten-slide deck","type":"Requesting","category":"Design","payment_type":"Free","deadline":"2030-01-01"}'

# Apply to gig 24 as user 2
curl -X POST http://localhost:4000/applications -H "Content-Type: application/json" -H "x-user-id: 2" \
  -d '{"gig_id":24,"message":"I can help with this."}'
```

---

## 11. Limitations

- No real authentication: the `x-user-id` header is trusted. This is intended for demonstration only.
- The data store is a single JSON file for one server process; it is not suitable for many concurrent users.
- No pagination: all matching gigs are returned in one response.
- The date a gig was accepted or completed is not stored (the data model has no field for it), so the timeline shows the posted date, the assigned applicant and the deadline.
- The port is fixed at 4000 in `server/index.js`.
