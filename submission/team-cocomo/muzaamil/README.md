# ReliefHub

Flood-relief coordination for Sindh: camps report needs, coordinators dispatch supplies from a central warehouse, field volunteers confirm deliveries.

## Stack

- **Frontend** — React 19, Vite, Tailwind CSS v4, React Router, MapLibre (map), Recharts, three.js (3D map), cmdk (command palette), motion
- **Backend** — Convex (queries, mutations, actions, HTTP routes), Convex Auth (email/password)
- **AI** — `@typesafe-ai/sdk` (Jev) powers Quick log intent classification via `TYPESAFE_API_KEY`

## Develop

```sh
npm install
npm run dev:backend   # convex dev
npm run seed          # demo data (skips if seeded)
npm run dev           # vite
```

Set `VITE_CONVEX_URL` / `VITE_CONVEX_SITE_URL` in `.env.local`. Checks: `npm test`, `npm run build`, `npm run typecheck`.

## Roles

- **Coordinator** — full access: dashboard, camps, needs, warehouse, dispatches, donations, volunteers.
- **Field volunteer** — sees only their own profile and assigned camp (needs, deliveries, team); can mark in-transit deliveries delivered.

Enforced in every backend function (`requireCoordinator` / own-camp checks) and by route guards in `src/App.tsx`. Signup always creates a volunteer; grant coordinator access with `npx convex run users:setRole '{"email":"…","role":"coordinator"}'`. Demo quick-login buttons are off unless `RELIEFHUB_DEMO_MODE=true` is set in the Convex env.

## Functions

All in `convex/`. Coordinator-only unless noted.

| Module | Functions |
| --- | --- |
| `dashboard` | `overview` (KPIs, charts, map data), `nav` (sidebar counts) |
| `camps` | `list`, `get`, `create`, `update`, `remove` |
| `needs` | `list`, `create`, `update`, `remove` |
| `inventory` | `list`, `create`, `update`, `restock`, `remove` |
| `dispatches` | `list`, `limits`, `create` (reserves stock), `markInTransit`, `markDelivered` (also volunteers, own camp only), `cancel` (restores stock) |
| `donations` | `list`, `create` |
| `volunteers` | `list`, `create`, `assign`, `unassign`, `remove` |
| `me` (any signed-in user) | `profile`, `saveProfile` (own name/skill/phone), `assignment` (own camp, needs, deliveries, team) |
| `users` | `viewer` (current user), `demoMode`; internal: `setRole`, `assertCoordinator` |
| `intent` | `classify` — action; turns a Quick log sentence into a structured intent (offline keyword fallback) |
| `seed` | `run` — internal; demo dataset |
| `http` | `GET <site>/api/<collection>` — JSON export of `camps`, `inventory`, `needs`, `dispatches`, `donations`, `volunteers`; requires a coordinator bearer token |

## Data model

`users` (Convex Auth + role) · `camps` (capacity, families, status, lat/lng) · `inventory` (stock, reorder level) · `needs` (camp × item, required/fulfilled) · `dispatches` (need, qty, status) · `donations` (cash/in-kind) · `volunteers` (name, skill, camp, linked `user_id`)
