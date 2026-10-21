# CampusLoop — Campus Gig & SkillSwap Portal

**Team:** Lahootix

**Team lead:** Naveed Narain

**Project:** Hacktoberfest issue #12

CampusLoop is a trusted campus marketplace where students can request help, offer their skills, exchange expertise, and build a reputation through completed work. A student can move freely between being a gig owner and an applicant—there are no fixed roles.

## What it includes

- Search and filter gigs by keyword, category, offering/requesting type, and payment type
- Secure sign-in, registration, logout, and persistent browser sessions
- Forgot-password flow with expiring, single-use reset codes
- Salted password hashing and session-derived API authorization
- Saved-gig shortlist and editable student profiles
- Validated paid, skill-swap, and free gig creation
- Personal gig management and application tracking
- Protected application flow that prevents self-applications and duplicates
- Owner-only applicant selection with automatic workflow updates
- Enforced `Open → In Progress → Completed` lifecycle
- Two-way, one-per-person reviews after completion
- Profile reputation calculated from stored reviews
- Responsive interface with accessible keyboard and focus behavior
- Custom mock REST API with persistent JSON seed data

## Seed data

The app ships with 12 users, 25 gigs, 20 applications, and 8 reviews. The data covers Programming, Design, Writing, and Tutoring; Offering and Requesting gigs; all three payment types; and all requested statuses.

## Technology

- React 18 and Vite
- Express mock REST API
- Lucide icons
- Plain CSS with a responsive, mobile-first layout

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The front end proxies API calls to the mock server at `http://localhost:3001`.

### Demo account

```text
Email: ayesha.khan@campus.edu
Password: campus123
```

Every seeded student uses `campus123`; their email follows the format `firstname.lastname@campus.edu`. You can also create a new account from the registration screen.

For this local mock project, the forgot-password screen displays the reset code that would normally be delivered by email. Codes expire after 15 minutes and can only be used once.

## Production build

```bash
npm run build
npm run server
```

The optimized front-end output is written to `dist/`.

## Main API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/gigs?category=...&type=...&payment_type=...&q=...` | Search and filter gigs |
| `POST` | `/api/auth/login` | Sign in and create a session |
| `POST` | `/api/auth/register` | Create a student account |
| `POST` | `/api/auth/forgot-password` | Request an expiring reset code |
| `POST` | `/api/auth/reset-password` | Set a new password |
| `GET` | `/api/auth/me` | Restore the authenticated session |
| `POST` | `/api/gigs` | Create a validated gig |
| `GET` | `/api/applications?applicant_id=...` | View personal applications |
| `POST` | `/api/applications` | Apply to an open gig |
| `PATCH` | `/api/applications/:id` | Accept or reject an applicant |
| `PATCH` | `/api/gigs/:id` | Change a gig's status |
| `POST` | `/api/reviews` | Add a post-completion review |

State-changing requests derive ownership from the authenticated bearer session. Client-provided user IDs are ignored, preventing users from impersonating another student in gig, application, status, and review workflows.
