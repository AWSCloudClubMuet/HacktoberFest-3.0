# CampusSwap: Campus Gig & SkillSwap Portal

## Problem
 
Students with skills in programming, design, writing, editing and tutoring have no trusted place on campus to find collaborators, offer services, apply to gigs and review the finished work. CampusSwap gives them one marketplace where every user can be both a Poster and an Applicant.

## Tech stack

Technology Stack
1. Markup — HTML5

- Defines the structure and content of web pages.

2. Styling — CSS3
- Custom properties: Store reusable values such as colors and fonts.
- Grid and Flexbox: Create organized page layouts.
- Keyframe animations: Add animations and visual effects.
- Media queries: Adapt the layout to different screen sizes.
- Automatic dark mode: Supports dark themes based on system preferences.
- Reduced motion: Minimizes animations for users who prefer less movement.
3. Logic — Vanilla JavaScript (ES6+)
- Adds interactivity without frameworks or libraries.
- Async/await: Handles asynchronous operations.
- Fetch API: Sends requests to the backend and retrieves data.
4. Mock Backend — JSON Server 0.17.4 and Node.js
- JSON Server provides REST API endpoints.
- Node.js runs the backend development environment.
- Supports operations such as retrieving, creating, updating, and deleting data.
5. Data Storage — db.json
- Stores application data in JSON format.
- Contains four collections.
- Acts as the data source for the mock backend.
6. Graphics — Inline SVG

- Creates scalable graphics, including the website logo, directly within HTML.

7. Typography — System Fonts
- Georgia: Used for an elegant, serif-style appearance.
- Trebuchet MS: Used for a clean, readable sans-serif appearance.
8. Development Tools
- VS Code: Code editor for writing and managing project files.
- Live Server: Runs and previews the frontend locally with automatic browser refresh.
- npm: Manages Node.js packages and project scripts.

## Features by milestone

**Milestone 1: Profiles and gig creation**
- Sign up and log in; any user can post gigs and apply to others.
- Profile shows name, major, semester, skills, gigs posted, gigs completed and average rating.
- Gig form: Offering or Requesting, title, description, category, payment type (Paid, SkillSwap, Free), budget (Paid only) and deadline, all validated.

**Milestone 2: Discovery and applications**
- Browse and filter by category, Offering/Requesting, payment type and budget range.
- Keyword search across title and description.
- Apply with a short message; "My application statuses" shows Pending, Accepted or Rejected.
- Applying to your own gig or applying twice to the same gig is rejected.
- Open gigs past their deadline appear as Expired.

**Milestone 3: Applicant selection and status**
- Only the gig owner can accept or reject applicants or change gig status.
- Accepting one applicant moves the gig to In Progress, rejects all other Pending applications and closes the gig to new applications.
- Workflow is Open, then In Progress, then Completed. Completion is allowed only from In Progress. Owners can also cancel.

**Milestone 4: Mutual reviews and reputation**
- After completion, the owner and the accepted applicant can each rate the other 1 to 5 with a comment.
- One review per reviewer per gig.
- Average rating is calculated from stored reviews and never edited by hand.

**Milestone 5: Mock API and seed data**
- Seed data: 12 users, 25 gigs, 28 applications, 9 reviews.
- Gigs cover Programming, Design, Writing and Tutoring, both types and every status.

## API endpoints

REST API Endpoints
1. List and Filter Gigs — GET /gigs?category=&type=&payment_type=&q=
- Retrieves available gigs.
- Filters gigs by category, type, payment type, and keyword.
- Budget range filtering and additional keyword refinement are handled in api.js.
2. Create a Gig — POST /gigs

- Creates and stores a new gig.

3. Update Gig Status — PATCH /gigs/:id
- Updates the status of a specific gig.
- Only the gig owner is permitted to perform this action in the application logic.
4. Apply to a Gig — POST /applications

- Submits an application for a gig.

5. Accept or Reject an Application — PATCH /applications/:id
- Updates an applicant's status to accepted or rejected.
- Only the gig owner is permitted to perform this action in the application logic.
6. Leave a Review — POST /reviews

- Submits a review for a user or completed gig, depending on the application's implementation.

7. Read Collections
- GET /users — Retrieves user records.
- GET /applications — Retrieves application records.
- GET /reviews — Retrieves review records.
8. Sign Up — POST /users

- Creates a new user record.

## Data model

- **users**: id, name, email, password, major, semester, bio, skills (string array)
- **gigs**: id, user_id, title, description, type, category, payment_type, budget (nullable), deadline, status, accepted_applicant_id (nullable), created_at
- **applications**: id, gig_id, applicant_id, message, status, created_at
- **reviews**: id, gig_id, reviewer_id, reviewee_id, rating, comment

## Project structure

```
campusswap/
├── db.json          database (seed data)
├── package.json     npm script to start JSON Server
├── index.html       page shell
├── css/style.css    pink and purple theme, animations, responsive layout
└── js/
    ├── api.js       API layer: fetch calls and business rules
    └── app.js       screens: login, Discover, Post, Activity, Profile
```

## How it works

JSON Server exposes `db.json` as REST endpoints on `http://localhost:3000`. JSON Server has no custom validation, so `js/api.js` enforces every rule before it writes: ownership checks, duplicate applications, status transitions, one review per reviewer and field validation. `js/app.js` renders the interface and calls `api()` for every read and change. Every change is saved into `db.json`.

"Expired" is computed when gigs are read (Open and past deadline), not stored.

## Design

Pink and purple gradient theme taken from the logo (two people with swap arrows). Mobile uses a bottom tab bar with a raised Post button. Laptop uses a side menu, a card grid and a split login screen. Animations include card entrance and hover lift, modal pop, the rotating logo and floating background shapes. Animations switch off for users who prefer reduced motion.

## Run locally

1. Install Node.js (LTS).
2. In the project folder run:
   ```
   npm install
   npm start
   ```
   The database is live when `http://localhost:3000/gigs` shows data.
3. Open `index.html` with the Live Server extension.
4. Log in with `alex@campus.edu` / `demo`. Every seeded user uses the password `demo` and their first name as the email, for example `sarah@campus.edu`.


