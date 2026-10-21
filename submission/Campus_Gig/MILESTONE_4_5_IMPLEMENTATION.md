# Milestones 4–5 implementation notes

This update was applied to the uploaded Campus_Gig project without replacing the existing Milestones 1–3 workflows.

## Milestone 4: Mutual reviews and reputation

### New backend file
- `backend/routers/reviews.py`
  - `POST /reviews`: submit a review after completion.
  - `GET /reviews/gig/{gig_id}`: list reviews for a gig.
  - `GET /reviews/user/{user_id}`: list reviews received by a user.

### Updated backend files
- `backend/schemas.py`: validates ratings (1–5) and non-empty comments.
- `backend/main.py`: registers the reviews router.
- `backend/routers/__init__.py`: proper package initializer.
- `backend/README.md`: endpoint and run instructions.

The existing `Review` model already had a database uniqueness constraint on `(gig_id, reviewer_id)` and a database rating check. The new endpoint checks the gig is completed, checks that the requester is the owner or accepted applicant, selects the other participant as the reviewee, and handles duplicate-review conflicts. The existing user-profile API already calculates `average_rating` and `review_count` from stored review rows, so these values update automatically after a review is saved.

### New/updated frontend files
- `frontend/vite-project/src/components/ReviewSection.jsx`: shows reviews and the eligible participant's review form on completed gigs.
- `frontend/vite-project/src/pages/GigDetailPage.jsx`: displays the review section for completed gigs.
- `frontend/vite-project/src/pages/ProfilePage.jsx`: displays reviews received on the profile.
- `frontend/vite-project/src/api.jsx`: adds review API functions.
- `frontend/vite-project/src/styles/index.css`: review styling.

## Milestone 5: Mock API and seed data

- Existing database-backed endpoints already cover gig search/filtering, gig creation/status updates, application creation/status updates, and profile operations.
- `backend/seed_data.py` is new. Run it from the backend folder with `uv run python seed_data.py`.
- The included `backend/campus_gig.db` has been seeded to minimum totals: 12 users, 25 gigs, 20 applications, and 8 reviews.
- Seed data spans Programming, Design, Writing, Tutoring; Offering and Requesting; Paid, SkillSwap, Free; and Open, In Progress, Completed, Expired, Cancelled statuses.
- The seed script is additive and safe to rerun for this database; it does not clear existing records.

## Validation performed
- Python compile check passed.
- FastAPI TestClient smoke checks passed for home, health, gig list/search filters, user profile, and review-list endpoints.
- Review API checks passed for both participants submitting a review, duplicate review rejection (409), nonparticipant rejection (403), incomplete-gig rejection (409), invalid rating rejection (422), and profile average calculation.
- Seed script rerun retained the expected totals (12 users, 25 gigs, 20 applications, 8 reviews).
- All frontend JavaScript/JSX files passed a TypeScript transpilation syntax parse. A full Vite production build was not run because frontend npm dependencies were not available in this environment.

## Demo-authentication limitation
The existing app uses `X-User-Id` as a demo user switch. This matches the existing project architecture, but is not production authentication. Replace it with real authentication before deploying publicly.
