# ReliefHub — Flood Relief Coordination Dashboard

Team Lead: Nabeel Shahid ( didn't worked on this project )

Members : 

Ahmed Khan -> Backend 

Saif Sangrasi -> Frontend 

ReliefHub is a web-based coordination dashboard for managing flood-relief operations. It brings camp capacity, relief needs, warehouse inventory, dispatches, donations, and volunteers together so coordinators can monitor activity and prioritize urgent gaps.

## Live Demo

[Open ReliefHub](https://reliefhub-floodrelief-coordinationdashboard-3404.ai.studio/)

## Features

- **Operations dashboard:** View key metrics, category fulfilment, critical needs, smart recommendations, and delayed dispatch alerts.
- **Camp management:** Track camps by district, capacity, current families, and operational status.
- **Needs tracking:** Record camp requirements, priority, fulfilment, and quantities already reserved by active dispatches.
- **Inventory management:** Organize relief supplies by category and identify stock at or below its reorder level.
- **Dispatch coordination:** Create and track dispatches through Pending, In Transit, Delivered, and Cancelled states.
- **Donation records:** Record cash and in-kind donations, including in-kind inventory contributions.
- **Volunteer coordination:** Maintain volunteer skills and assign volunteers to camps.
- **Persistent demo data:** The backend stores application data in `data/reliefhub-db.json` and includes seed data for trying the dashboard.

## Tech Stack

- React 19 and TypeScript
- Vite
- Express
- JSON-file data store with serialized writes
- Recharts, Tailwind CSS, and Lucide icons

## Run Locally

**Prerequisite:** Node.js and npm.

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) Configure environment values by copying `.env.example` to `.env` and setting `GEMINI_API_KEY` if you use Gemini-powered features. In AI Studio, configure the key through the app's Secrets panel.

3. Start the application:

   ```bash
   npm run dev
   ```

   The Express server and Vite development app are served at [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the application in development mode. |
| `npm start` | Start the application server. |
| `npm run build` | Build the frontend for production. |
| `npm run preview` | Preview the Vite production build. |
| `npm run lint` | Run the TypeScript check. |
| `npm test` | Run backend and exhaustive API tests. |

## API Overview

The REST API is served under `/api`. Main resource routes include:

- `/api/camps`
- `/api/inventory`
- `/api/needs`
- `/api/dispatches`
- `/api/donations`
- `/api/volunteers`

Dashboard endpoints are available at `/api/dashboard/summary`, `/api/dashboard/category-fulfilment`, `/api/dashboard/critical-gaps`, `/api/dashboard/recommendations`, and `/api/dashboard/dispatch-delays`. Use `/api/health` for a health check. Most resource routes support `GET` for listing and individual records; supported write operations use `POST`, `PATCH`, or `DELETE` as appropriate.

## Project Structure

```text
src/                 React application, pages, components, and API client
server/              Express API routes, data store, seed data, and business logic
tests/               Backend and end-to-end API tests
data/                Local JSON database
server.ts            Application server entry point
```

## Data Note

The local JSON database is suitable for development and demonstration. For production deployments with concurrent users or stronger durability requirements, use a managed database and configure access control for the deployment environment.
