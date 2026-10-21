#Team Name: Web Whispers

# Member: Tayayaba, Bakhtawar, Maria
# Tasks : TuneWave Data Structure
# Task 2: KisanMandi
# Task 3: Campus Gig & SkillSwap Portal





//Task1
TuneWave:(Data Structures and Algorithms)
1. Overview
TuneWave is the engineering core of a new music streaming app. The player needs a playlist, an Up Next queue, a play history, song search and artist recommendations. This project builds that core in JavaScript, with each feature backed by the data structure that suits it. It is delivered in three milestones, each in its own file.

2. Problem Statement

A music player has to handle several jobs quickly while a song is playing: moving forward and back, adding and removing songs, queueing songs to play next, returning to recent songs, searching by title and suggesting new artists. Using the wrong data structure makes some of these slow or awkward, so each milestone is built around one that fits.

3. Milestones and Features

Milestone 1: Playlist (Doubly Linked List + Hash Map) in DSA1.js

Operations: addSong(song), removeSong(songId), next(), previous(), toggleRepeat().
A song can appear only once. The hash map from song ID to node checks this and finds songs without scanning the list.
With repeat on, next() on the last song wraps to the first. With repeat off, it stays on the last song and returns "end".

Milestone 2: Up Next and History (Queue + Stack) in DSA2.js

Operations: addToUpNext(songId), playNext(), back().
Songs in the Up Next queue play before the playlist continues.
Playing from Up Next or from history does not move the playlist position.
History keeps the last 10 songs played and drops the oldest.
back() replays the top song and removes it from history.

Milestone 3: Song Search and Related Artists (BST + Graph) in DSA3.js

Operations: addSong(title, songId), findSong(title), prefixSearch(prefix), addRelation(artistA, artistB), recommendArtists(artist).
Songs are stored in a binary search tree keyed by title.
prefixSearch returns matching titles in alphabetical order and skips subtrees that cannot match.
Artists form an undirected graph of “related” links.
recommendArtists returns artists exactly two links away who are not already directly related, in alphabetical order.
4. Technology
Language: JavaScript (ES6 classes, Map and Set).
Runtime: Node.js, run from the VS Code terminal with node DSA1.js, node DSA2.js and node DSA3.js.
Dependencies: none. Milestone 2 imports Milestone 1 with require("./DSA1"), and Milestone 3 stands alone.

5. Testing:

Each file has a built-in check that runs with node and prints results next to the expected values in comments. All three were run in Node and match. They cover duplicates, wrap-around, "end", removing the playing song, Up Next order, the 10-song history limit, back(), prefix search, exact lookup, and recommendations including the case where a candidate is already directly related. These are focused checks on the main cases, not exhaustive tests of every edge case.

6. File Structure:
DSA1.js: Milestone 1 (Playlist)
DSA2.js: Milestone 2 (Up Next and History), needs DSA1.js in the same folder
DSA3.js: Milestone 3 (Search and Artists)

// Task2

*KisanMandi*

KisanMandi is a web application that helps farmers in Sindh check crop prices, compare markets, create price alerts, calculate estimated profit, and list produce for buyers. Buyers can browse market prices and available produce listings.

Features

- Register as a Farmer or Buyer.
- Select a district during registration.
- View crop prices per 40 kg for a selected market.
- Search crops and filter prices by category.
- View recent price history and compare prices across markets.
- Create, edit, activate, deactivate, and delete price alerts.
- Calculate estimated revenue, production cost, profit or loss, and profit margin.
- Browse produce listings and filter by crop, district, grade, and sorting option.
- Contact sellers by phone or WhatsApp.
- Farmers can create, edit, mark as sold, and delete their own listings.
- Refresh prices and alerts manually or with pull-to-refresh on touch devices.

Project Files

- `index.html` — Contains the application layout and JavaScript for registration, navigation, price discovery, charts, alerts, marketplace listings, and the profit calculator.
- `style.css` — Contains the styles for the application layout, cards, forms, navigation, buttons, and responsive presentation.
- `db.json` — Stores the mock API data used by JSON Server, including crops, markets, prices, listings, alerts, and users.
- `seed.js` — Intended for preparing or resetting initial project data. Its exact functionality depends on its implementation.

Requirements

- Node.js and npm
- A modern web browser
- JSON Server version 0.17.4

 Setup

1. Place `index.html`, `style.css`, `db.json`, and `seed.js` in the project folder.
2. Open a terminal in that folder.
3. Start the mock API by running:

```
npx json-server@0.17.4 db.json --host 0.0.0.0
```

4. Open `index.html` in your browser.

The application expects the API to run at `http://localhost:3000` when the page is opened directly as a local file. When hosted on a web server, it uses the current origin by default.

API Resources

The frontend requests the following JSON Server resources:

- `/crops`
- `/markets`
- `/prices`
- `/listings`
- `/alerts`
- `/users`

The application uses:

- `GET` to retrieve data.
- `POST` to create users, alerts, and listings.
- `PATCH` to update alerts and listings.
- `DELETE` to remove alerts and listings.

 API Configuration

The API URL is selected in this order:

1. The `api` query parameter in the page URL.
2. The `kmApi` value saved in local storage.
3. The current website origin, or `http://localhost:3000` when opened using the `file:` protocol.

For a hosted mock API, use a URL like:

```
index.html?api=https://your-mockapi-url
```

Replace the example URL with your actual API URL.

 *User Roles*

Farmer

Farmers can access Prices, Marketplace, Alerts, and My Listings. They can also use the profit calculator, manage price alerts, and manage their own produce listings.

Buyer

Buyers can access Prices and Marketplace to check crop prices and browse available produce.


//Task3
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
