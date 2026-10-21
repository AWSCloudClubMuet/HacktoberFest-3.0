# KisanMandi API

Express REST API backed by Supabase/Postgres. It implements the endpoints in `04-API-Contract.md` and keeps the Supabase service key exclusively on the server.

## Setup

1. Create a Supabase project.
2. Run `sql/schema.sql`, then `sql/seed.sql`, in the Supabase SQL editor.
3. Copy `.env.example` to `.env` and enter the Supabase URL and backend secret key.
4. Run `npm install`, then `npm run dev`.

The development base URL is `http://localhost:5000/api`. `GET /api/health` can be used as a deployment health check.

Protected routes require `x-user-id`. Listing mutations and every alert route also enforce the Farmer role and record ownership where applicable.

## Commands

- `npm run dev` — start with file watching
- `npm start` — start normally
- `npm run check` — syntax and validation tests
- `npm run seed` — seed through Supabase JS (an alternative to `sql/seed.sql`)

`CLIENT_ORIGIN` accepts one origin or a comma-separated list of origins.
