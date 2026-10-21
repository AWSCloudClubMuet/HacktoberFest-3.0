# ReliefHub

Flood-relief coordination for Sindh. React/Vite frontend with a Convex backend; application reads and writes go through the backend.

## Development

```sh
npm install
npm run dev:backend
npm run seed
npm run dev
```

Configure the deployment with Convex and set `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` in `.env.local`. Seeding leaves an existing dataset intact unless explicitly reset.

## Roles and permissions

Relief Coordinators can view the organization dashboard and all camps, needs, warehouse inventory, dispatches, donations and volunteers. They manage these records, assign/unassign volunteers, and control dispatch creation, transit, cancellation and delivery. They can edit their own account name.

Field Volunteers can edit their own name, skill and phone, and see only their assigned active camp, its needs, deliveries and local team names/skills. They can mark an In Transit delivery Delivered only at that camp. Unassigned volunteers see their own profile and assignment waiting state. Volunteers cannot access global dashboard data, warehouse stock, donations, other camps, the full volunteer roster, or change their role/assignment. Team phone numbers and account IDs are not included in the assignment response.

Both page routes and backend functions enforce these restrictions. Collection exports at `GET <VITE_CONVEX_SITE_URL>/api/<collection>` require a Coordinator's Convex Auth bearer token; signed-out requests receive 401 and volunteers receive 403. The collections are `camps`, `inventory`, `needs`, `dispatches`, `donations`, and `volunteers`.

### Coordinator provisioning

Public signup always creates a Field Volunteer, regardless of any supplied `role`. To grant Coordinator access, create the person's account first, then use trusted deployment CLI access:

```sh
npx convex run users:setRole '{"email":"you@organisation.pk","role":"coordinator"}'
```

The same internal function accepts `"volunteer"` to revoke Coordinator access. It cannot be called by browser clients. Existing personal accounts retain their roles; review accounts created before this restriction if the app was shared publicly.

### Optional hackathon demo

Shared quick-test accounts are disabled by default, including existing sessions. For an isolated demo deployment, enable them explicitly:

```sh
npx convex env set RELIEFHUB_DEMO_MODE true
```

This displays the two quick sign-in buttons and permits the predefined demo Coordinator and Volunteer accounts. Demo Coordinator access includes full editing. Remove the setting to disable shared accounts again:

```sh
npx convex env remove RELIEFHUB_DEMO_MODE
```

## Checks

```sh
npm test
npm run build
npx tsc --noEmit -p convex/tsconfig.json
```
