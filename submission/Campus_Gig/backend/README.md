# Campus Gig & SkillSwap Portal — Backend

## Run the API

From this `backend` directory:

```powershell
uv sync
uv run uvicorn main:app --reload
```

Open `http://127.0.0.1:8000/docs` to test the API.

## Seed milestone demo data

Run:

```powershell
uv run python seed_data.py
```

The script is additive and safe to rerun. It preserves existing records and ensures the database has at least 12 users, 25 gigs, 20 applications, and 8 reviews. The demo gigs cover Programming, Design, Writing, and Tutoring; Offering and Requesting; Paid, SkillSwap, and Free; and Open, In Progress, Completed, Expired, and Cancelled statuses.

## Milestone 4 review rules

- Reviews can be submitted only after a gig is `Completed`.
- Only the gig owner and accepted applicant can review each other.
- The owner reviews the accepted applicant; the accepted applicant reviews the owner.
- Ratings must be integers from 1 through 5, and comments cannot be blank.
- The database enforces one review per reviewer per gig.
- Profile average ratings and review counts are calculated from stored `reviews` rows.

Review endpoints:

- `POST /reviews`
- `GET /reviews/gig/{gig_id}`
- `GET /reviews/user/{user_id}` (reviews received by that user)

Example request for `POST /reviews` (include the `X-User-Id` header):

```json
{
  "gig_id": 1,
  "rating": 5,
  "comment": "Great communication and excellent work."
}
```

## Important demo-authentication note

This project currently uses the `X-User-Id` header as a local demo user switch, not real authentication. Do not deploy it as a public marketplace without replacing this mechanism with proper authentication and authorization.
