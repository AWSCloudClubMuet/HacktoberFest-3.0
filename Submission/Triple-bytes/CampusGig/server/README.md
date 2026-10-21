# Campus Gig & SkillSwap API

Express/Supabase backend implementing the finalized API contract.

## Setup

1. Create a Supabase project.
2. Run your supplied `01_schema.sql` in the Supabase SQL editor. The checked-in
   `src/db/schema.sql` mirrors the schema and `accept_applicant` RPC expected by
   this backend.
3. Copy `.env.example` to `.env` and provide the project URL and service-role key.
4. Install packages with `pnpm install`.
5. Run `pnpm seed`.
6. Start the API with `pnpm dev`.

The local API listens on `http://localhost:5000` by default. Protected requests require:

```text
X-User-Id: <seeded-user-uuid>
```

## Commands

```text
pnpm dev     Start with file watching
pnpm start   Start normally
pnpm seed    Replace data with the documented demo dataset
pnpm test    Run domain and validation tests
```

## API surface

```text
GET    /users
GET    /users/:id
GET    /gigs
GET    /gigs/:id
POST   /gigs
PATCH  /gigs/:id
GET    /gigs/:id/applications
POST   /applications
GET    /applications
PATCH  /applications/:id
POST   /reviews
GET    /reviews
```

