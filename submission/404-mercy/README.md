# 🚀 404 MERCY — Hackathon Projects

<p align="center">
  <strong>💻 Building Ideas. Solving Problems. Creating Impact.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Team-404%20MERCY-6C63FF?style=for-the-badge" alt="Team 404 MERCY" />
  <img src="https://img.shields.io/badge/Projects-3-00A67D?style=for-the-badge" alt="Three Projects" />
  <img src="https://img.shields.io/badge/Focus-Innovation%20%26%20DSA-FF9F43?style=for-the-badge" alt="Innovation and DSA" />
</p>

Welcome to the official GitHub repository of **404 MERCY**. This repository contains three independent hackathon projects covering campus collaboration, agricultural marketplace tools, and Data Structures and Algorithms (DSA).

This README combines the previous KisanMandi submission documentation with the team's multi-project overview. The merge-conflict markers have been removed, and the commands below match the project folders and scripts on the `404-mercy` branch.

## 📁 Repository Structure

```text
404-mercy/
└── submission/
    └── 404-mercy/
        ├── campus-gig-skillswap/  # React/Vite campus marketplace
        ├── kisanmandi/            # React/Vite agricultural marketplace
        └── TuneWave/              # Java/Maven music player and DSA project
```

| Project | Directory | Main technology |
|---|---|---|
| Campus Gig & SkillSwap | `submission/404-mercy/campus-gig-skillswap/` | React 18, Vite 5, JSON Server |
| KisanMandi | `submission/404-mercy/kisanmandi/` | React, Vite, Supabase, JSON Server fallback |
| TuneWave Music Player | `submission/404-mercy/TuneWave/` | Java 17+, JavaFX, Maven |

## ⚙️ Prerequisites

Install the tools required by the project you want to run:

- Git
- Node.js 18 or later and npm 9 or later for the JavaScript projects
- JDK 17 or later for TuneWave
- Apache Maven 3.6 or later for TuneWave
- A Supabase project only if KisanMandi is being run with cloud authentication and realtime data

Verify the installations:

```bash
git --version
node --version
npm --version
java -version
mvn -version
```

## 🚀 Getting Started from the `404-mercy` Branch

```bash
git clone https://github.com/JamshedAli01/404-mercy.git
cd 404-mercy
git fetch origin
git switch 404-mercy
git pull origin 404-mercy
```

Each project has its own dependencies. Run `npm install` or Maven commands from that project's directory rather than from the repository root.

---

## 🎓 1. Campus Gig & SkillSwap

A demo-first campus marketplace where students can post gigs, offer skills, exchange services, apply for opportunities, and review collaborators.

### Features

- Demo student persona switching across seeded student profiles.
- Gig search and filtering by category, type, and payment method.
- Gig creation with validation and deadline checks.
- Application tracking, acceptance/rejection flow, and completion status.
- Student profiles and reviews.
- JSON Server mock backend with seeded users, gigs, applications, and reviews.

### Run locally

From the repository root:

```bash
cd submission/404-mercy/campus-gig-skillswap
npm install
npm run dev:all
```

This starts both services through the `dev:all` script:

- Frontend: http://localhost:5173
- JSON Server API: http://localhost:3001

To run the services separately, use two terminals:

```bash
# Terminal 1
npm run api

# Terminal 2
npm run dev
```

On Windows PowerShell, use the `.cmd` form if npm scripts are restricted:

```powershell
npm.cmd install
npm.cmd run dev:all
```

### Production build

```bash
npm run build
npm run preview
```

The project scripts are defined in `submission/404-mercy/campus-gig-skillswap/package.json`.

---

## 🌾 2. KisanMandi

**KisanMandi** is a mobile-first agricultural marketplace and crop-price application for farmers and buyers in Sindh, Pakistan. It includes price trends, market comparisons, alerts, a profit calculator, authentication, and a realtime marketplace.

> The repository contains fictional sample data for demonstration; it is not a source of live mandi prices.

### Key capabilities

- Supabase email/password authentication with Farmer and Buyer roles.
- PostgreSQL schema, foreign keys, indexes, triggers, and Row Level Security policies.
- Supabase Realtime listing updates.
- Automatic local JSON Server fallback when Supabase credentials are not configured.
- 14-day Recharts price trends and Sindh market comparisons.
- Price alerts and interactive profit calculations.

### Run locally with the JSON Server fallback

From the repository root:

```bash
cd submission/404-mercy/kisanmandi
npm install
npm run seed
```

Start the fallback API in one terminal:

```bash
npm run api
```

Start the Vite frontend in a second terminal:

```bash
npm run dev
```

Open http://localhost:5173 in a browser. The fallback API runs at http://localhost:3001.

The two processes can also be started using the package scripts individually:

```bash
npm run start:api
npm run start:dev
```

### Configure Supabase mode

Create a local environment file from the safe template:

```bash
cp .env.example .env
```

Then set the project values in `.env`:

```ini
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
VITE_API_URL=http://localhost:3001
```

In the Supabase SQL Editor, run these files in order when setting up a new project:

1. `supabase/migrations/20261021_init_schema.sql`
2. `supabase/seed.sql`

Do not commit real credentials or a populated `.env` file.

### Verify and build

```bash
# Run the 48-check verification script
node verify.js

# Create a production build
npm run build

# Preview the production build locally
npm run preview
```

See [`kisanmandi/README.md`](./kisanmandi/README.md) for the complete architecture, database, deployment, and verification details.

---

## 🎵 3. TuneWave Music Player

TuneWave is a Java desktop music player and DSA demonstration using a custom doubly linked list, HashMap lookup, FIFO queue, LIFO history stack, Binary Search Tree, and artist graph. It supports a JavaFX GUI, a console simulation, and local WAV/MP3/AIFF/AU playback through the configured dependencies.

### Run tests and build the application

From the repository root:

```bash
cd submission/404-mercy/TuneWave
mvn clean test
mvn package -DskipTests
```

The Maven project targets Java 17 and produces a shaded executable JAR in `target/`.

### Launch the GUI

```bash
java -jar target/TuneWave-1.0.0.jar --gui
```

### Launch the console demo

```bash
java -jar target/TuneWave-1.0.0.jar
```

The project README documents the DSA implementation, audio engine, project architecture, and test suites in more detail: [`TuneWave/README.md`](./TuneWave/README.md).

---

## 🧪 Testing and Verification

Run the checks relevant to the project you changed:

| Project | Verification command |
|---|---|
| Campus Gig & SkillSwap | `npm run build` |
| KisanMandi | `node verify.js` and `npm run build` |
| TuneWave | `mvn clean test` |

A successful build confirms compilation, but it does not by itself prove that every workflow works. Before submission, manually check the main user journeys and confirm that backend services are running.

## 🔐 Security Guidelines

Never commit:

- API keys, passwords, access tokens, or private keys.
- Populated `.env` files containing secrets.
- Sensitive personal information.
- `node_modules/`, unnecessary build artifacts, or local caches.

Use `.env.example` files with placeholder values when environment variables are required. If a secret is exposed, revoke or rotate it immediately.

## 🤝 Git Workflow

Before editing or pushing changes on the shared branch:

```bash
git switch 404-mercy
git pull origin 404-mercy
git status
```

Stage only the files related to your work, review the diff, and avoid force-pushing to the shared branch:

```bash
git add submission/404-mercy/<project-path>
git diff --cached
git commit -m "Update project documentation"
git push origin 404-mercy
```

When resolving conflicts, preserve useful documentation from both versions, remove all `<<<<<<<`, `=======`, and `>>>>>>>` markers, and rerun the relevant project checks before committing.

## ✅ Submission Checklist

- [ ] All three projects remain in their assigned directories.
- [ ] The README contains no unresolved merge-conflict markers.
- [ ] Each project's install, run, test, and build commands have been documented.
- [ ] Required environment variables are documented without exposing secrets.
- [ ] The relevant frontend, API, Java, and Maven checks have been run.
- [ ] Generated dependencies and sensitive files are not committed.
- [ ] Changes have been reviewed on branch `404-mercy`.

<p align="center">
  <strong>💙 Built with teamwork, curiosity, and code by Team 404 MERCY.</strong>
</p>
