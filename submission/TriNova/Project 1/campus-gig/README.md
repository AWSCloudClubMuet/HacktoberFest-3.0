# Campus Gig & SkillSwap Portal

A campus marketplace where students offer skills or request short-term help for payment, a skill swap or for free, and build a reputation through completed gigs and mutual reviews.

Built by Team TriNova for the hackathon brief "Campus Gig & SkillSwap Portal".

## Features

- **Role-flexible profiles:** a student can be a Poster on one gig and an Applicant on another. Profiles show name, major, skills, gigs posted, gigs completed and average rating.
- **Gig creation with validation:** Offering or Requesting gigs with title, description, category, payment type (Paid, Skill Swap, Free), budget (Paid gigs only) and deadline.
- **Discovery:** keyword search across title and description, with filters for category, Offering/Requesting type, payment type and budget range.
- **Applications:** apply to a gig with a short message and track your own application statuses on the My Applications page.
- **Applicant selection:** the gig owner reviews applications and accepts one. Accepting moves the gig to In Progress, rejects the other Pending applications and closes the gig to new applications.
- **Status workflow:** Open -> In Progress -> Completed. The owner can also cancel an Open or In Progress gig. A gig can be completed only from In Progress.
- **Expired gigs:** Open gigs past their deadline appear as Expired.
- **Mutual reviews:** after completion, the owner and the accepted applicant can each rate the other from 1 to 5 and leave a comment, once per gig.
- **Calculated reputation:** a profile's average rating is computed from stored reviews and is never edited by hand.

## Tech stack

- **Frontend:** React (Vite) with React Router
- **Backend:** mock REST API in the `server` folder, with seed data

## How to run

You need Node.js installed. Run the backend and the frontend in two separate terminals.

**Terminal 1: backend**

```bash
cd server
npm install
npm start
```

**Terminal 2: frontend**

```bash
cd client
npm install
npm run dev
```

Open the link that the frontend terminal prints (usually `http://localhost:5173`).

## How users work

There is no password login, to keep the demo simple. A user dropdown in the navbar lets you switch between the seeded students. The selected student is the current user, and the app sends that student's id with every action. The server uses it to check whether the action is allowed, for example whether this student owns the gig.

## Pages

- **Browse:** search, filter and explore all gigs.
- **Gig detail:** gig information and progress. The owner sees applications with Accept and Reject buttons. Other students see an apply form. Completed gigs show reviews and a review form.
- **Post Gig:** create an Offering or Requesting gig.
- **My Applications:** your applications and their statuses.
- **Profile:** name, major, skills, gigs posted, gigs completed, average rating and reviews received.

## Mock API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/gigs?category=&type=&q=` | Browse, filter and search gigs |
| POST | `/gigs` | Create a gig |
| PATCH | `/gigs/:id` | Change gig status (owner only) |
| POST | `/applications` | Apply to a gig |
| PATCH | `/applications/:id` | Accept or reject an application (owner only) |
| POST | `/reviews` | Submit a review |

Reading single gigs, applications, reviews and users is also supported, and the same filters work with payment type and budget range.

## Business rules enforced by the server

- Applying to your own gig is rejected.
- Applying twice to the same gig is rejected.
- Only the gig owner can accept or reject applicants or change gig status.
- Accepting an applicant sets the gig to In Progress, saves the accepted applicant and rejects the remaining Pending applications. The gig then no longer accepts applications.
- A gig can be marked Completed only from In Progress.
- Reviews are allowed only on Completed gigs, only for the owner and the accepted applicant, and only once per reviewer per gig. The rating must be between 1 and 5.
- Each reviewer rates the other person on the gig.
- Paid gigs need a budget. Skill Swap and Free gigs have no budget.
- Open gigs past their deadline are shown as Expired.

## Seed data

The mock backend starts with demo data that covers the hackathon requirements:

- at least 12 users
- at least 25 gigs across Programming, Design, Writing and Tutoring, both Offering and Requesting, in every status (Open, In Progress, Completed, Expired, Cancelled)
- at least 20 applications
- at least 8 reviews

## Demo walkthrough

1. Pick a student in the user dropdown and post a gig from **Post Gig**.
2. Switch to another student, open the gig and send an application. Check it under **My Applications**.
3. Apply again to the same gig. The server rejects the duplicate.
4. Switch back to the owner, open the gig and accept the applicant. The gig becomes In Progress and the other applicants are rejected.
5. Click **Mark as completed**.
6. Both students open the gig and leave a review.
7. Open either profile to see the updated average rating.

## Project structure

```
campus-gig/
├── client/              React frontend
│   └── src/
│       ├── pages/       Home, GigDetail, PostGig, MyApplications, Profile
│       ├── api.js       API helper functions
│       ├── UserContext.jsx
│       └── App.jsx
├── server/              mock API and seed data
└── README.md
```

## Team

Team TriNova. Built during the hackathon.