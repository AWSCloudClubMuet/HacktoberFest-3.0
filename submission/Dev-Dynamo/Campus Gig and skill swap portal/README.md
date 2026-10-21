# Campus Gig & SkillSwap Portal

A small marketplace for students. You can post a gig offering something you're good at (logo design, DSA tutoring, proofreading) or ask for help with something, and pay for it, swap skills, or do it for free. Once a gig is done, both people review each other, and that builds up your rating on your profile.

We built this for the HacktoberFest 3.0 hackathon (Web/App Task 7) in about five and a half hours.

## Running it

You need Node.js (we used v22, anything recent should be fine).

cd Server
npm install
npm run seed
npm start


Then open http://localhost:5000.

The Express server also serves the React app, so there is only one thing to start. We did it this way because the client build is already sitting in `Server/public`, which means you don't have to install the client's dependencies just to try the project.

`npm run seed` rewrites `db.json` from scratch. Run it any time you want the demo data back.

## Trying it out

There's no login. The "Acting as" dropdown in the navbar lets you pick which student you are, and the page reloads as that person. That's the easiest way to see both sides of a gig.

A quick run through:

1. Pick **Maryam Noor**, open "Proofread my thesis" and apply.
2. Switch to **Hira Malik**, who posted it. You'll see Maryam's application on the gig page. Accept it.
3. The gig moves to In Progress. Hit "Mark as completed".
4. Leave a review as Hira, switch back to Maryam and review Hira.
5. Open either profile. The average rating comes from the reviews.

Also worth poking at: applying to your own gig, applying twice, and the filters on the home page.

## How it's put together

```
Server/
  server.js    API, plus serves the built client
  seed.js      builds db.json
  db.json      the "database"
  public/      built React app
client/
  src/
    api/api.js        every fetch call lives here
    context/          current user ("Acting as")
    components/       Navbar, Badge, Avatar
    pages/            Home, CreateGig, GigDetail, MyApplications, Profile
```

React with Vite on the front, Express on the back. The task asked for a mock API, so the data is just a JSON file that the server reads into memory and writes back on every change. It's fine for a demo, but it wouldn't hold up with real traffic.

## Rules the server enforces

The checks are on the server, not just in the UI, so they hold even if you call the API directly.

- Only the gig owner can accept or reject applications or change the gig status.
- You can't apply to your own gig or apply to the same gig twice.
- Accepting an applicant sets the gig to In Progress and rejects every other pending application. After that, nobody else can apply.
- Status goes Open, then In Progress, then Completed. Completing is only possible from In Progress. An Open or In Progress gig can also be cancelled.
- An Open gig past its deadline is shown as Expired. We work this out when the gig is read instead of storing it.
- Reviews only work on completed gigs, only between the owner and the accepted applicant, and only once per person per gig. Ratings are 1 to 5.
- Average rating is calculated from the stored reviews each time. Nothing stores it.
- A Paid gig needs a budget above zero. Title needs 5+ characters, description 10+, deadline can't be in the past.

## API

All on `localhost:5000`, JSON in and out. Errors come back as `{ "error": "..." }`.

```
GET   /gigs?category=&type=&payment_type=&min_budget=&max_budget=&q=&status=&user_id=
GET   /gigs/:id
POST  /gigs                 user_id, title, description, type, category, payment_type, budget, deadline
PATCH /gigs/:id             actor_id, status

GET   /applications?gig_id=&applicant_id=
POST  /applications         gig_id, applicant_id, message
PATCH /applications/:id     actor_id, status (Accepted or Rejected)

GET   /reviews?gig_id=&reviewee_id=
POST  /reviews              gig_id, reviewer_id, rating, comment

GET   /users
GET   /users/:id            includes gigs_posted, gigs_completed, average_rating
```

Example: `GET /gigs?category=Design&type=Offering&q=logo`

## Seed data

12 users, 25 gigs, 20 applications and 8 reviews. The gigs cover all four categories, both types, all three payment types and every status. Two of the Open gigs are past their deadline on purpose so you can see the Expired state.

## Changing the frontend

If you want to edit the React code:

```
cd client
npm install
npm run dev
```

That gives you the Vite dev server on port 5173 talking to the API on 5000, so keep the server running. When you're done, run `npm run build` and copy `client/dist` into `Server/public`, otherwise port 5000 will keep serving the old build.

## Things that went wrong for us

- `Cannot find module 'express'`: you're missing `npm install` inside `Server`.
- `Cannot GET /`: `Server/public` is missing or empty.
- The UI hasn't changed after you replaced the build: hard refresh (Ctrl+Shift+R) and make sure you're on port 5000, not 5173.
- npm complaining about `package.json`: you're in the wrong folder.

## What's not done

- No real authentication. "Acting as" is just a picker, and the server trusts whoever it says you are.
- Storage is a JSON file, so two people hitting it at the same moment could overwrite each other.
- No editing or deleting gigs, and no profile editing in the UI.
- No notifications when your application is accepted. You have to check "My applications".