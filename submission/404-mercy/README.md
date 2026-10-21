<<<<<<< HEAD
# 404 MERCY — KisanMandi Hackathon Submission

This directory contains the final production upgrade for **KisanMandi: Real-Time Agricultural Marketplace & Crop Prices** by **Team 404 MERCY**.

The complete project source code, PostgreSQL schema migrations, SQL seed generator, automated test suite, and configuration reside in [`kisanmandi/`](./kisanmandi).

## Key Upgrades
1. **Supabase Authentication**: Real multi-user sign in, registration, role management (Farmer vs. Buyer), session persistence, and secure logout.
2. **PostgreSQL Database & Row Level Security (RLS)**: Six normalized entities with strict RLS policies, foreign keys, and indexes.
3. **Supabase Realtime Marketplace**: Live WebSocket subscriptions for instant produce listing updates across multiple connected devices.
4. **Dual-Backend Support**: Seamless production integration with Supabase, with transparent fallback to local JSON Server for offline development.
5. **Agricultural Decision Support**: Retains 14-day Recharts price trend charts, Sindh market comparisons, automated price alerts, and interactive profit calculator.

## Quick Run

```bash
cd kisanmandi
npm install
npm run seed
npm run api     # Starts local fallback mock on http://localhost:3001
npm run dev     # Starts Frontend on http://localhost:5173
```

To run the comprehensive 48-check automated verification suite:
```bash
cd kisanmandi
node verify.js
```

Refer to [`kisanmandi/README.md`](./kisanmandi/README.md) for full project documentation, database migrations, and deployment instructions.
=======
# 🚀 404 MERCY — Hackathon Projects

<p align="center">
  <strong>💻 Building Ideas. Solving Problems. Creating Impact.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Team-404%20MERCY-6C63FF?style=for-the-badge" alt="Team 404 MERCY" />
  <img src="https://img.shields.io/badge/Projects-3-00A67D?style=for-the-badge" alt="Three Projects" />
  <img src="https://img.shields.io/badge/Focus-Innovation%20%26%20DSA-FF9F43?style=for-the-badge" alt="Innovation and DSA" />
</p>

Welcome to the official GitHub repository of **404 MERCY**! 🎉

This repository contains our team's hackathon projects, combining web application development, problem-solving, and Data Structures and Algorithms (DSA).

Our goal is simple: **build functional, well-structured, and demonstrable solutions while keeping our code clean and maintainable.**

---

## 📌 Table of Contents

- 👥 [Team Overview](#-team-overview)
- 📁 [Repository Structure](#-repository-structure)
- 🛠️ [Projects](#️-projects)
- ⚙️ [Prerequisites](#️-prerequisites)
- 🚀 [Getting Started](#-getting-started)
- 🎓 [Campus Gig & SkillSwap](#-project-1-campus-gig--skillswap)
- 🌾 [KisaanMandi](#-project-2-kisaanmandi)
- 🎵 [TuneWave Music Player](#-project-3-tunewave-music-player)
- 🧪 [Testing and Verification](#-testing-and-verification)
- 🤝 [Git Workflow and Collaboration](#-git-workflow-and-collaboration)
- 🔐 [Security Guidelines](#-security-guidelines)
- 🛠️ [Troubleshooting](#️-troubleshooting)
- ✅ [Submission Checklist](#-submission-checklist)

---

## 👥 Team Overview

**Team 404 MERCY** is working collaboratively on multiple independent hackathon projects.

### 🎯 Our priorities

- ✅ Correctness and reliable functionality
- 🧠 Meaningful use of Data Structures and Algorithms
- 🧹 Clean, readable, and maintainable code
- 🧪 Testing and verification
- 📚 Clear documentation
- 🤝 Smooth collaboration and integration

---

## 📁 Repository Structure

Our projects are organized into separate folders to keep each application's code and dependencies independent.

```text
404-mercy/
├── 📄 README.md
└── 📂 submission/
    └── 📂 404-mercy/
        ├── 📂 campus-gig-skillswap/
        │   ├── 📂 src/
        │   ├── 📂 public/
        │   ├── 📄 package.json
        │   └── ...
        ├── 📂 KisaanMandi/
        │   └── ...
        └── 📂 [TuneWave project folder]/
            └── ...
```

> 📌 **Note:** The actual filenames and directories may vary. Keep each project inside its designated submission directory.

| 📂 Project directory | 📝 Purpose |
|---|---|
| `campus-gig-skillswap/` | 🎓 Campus gigs and skill exchange |
| `KisaanMandi/` | 🌾 Agricultural marketplace |
| TuneWave project folder | 🎵 Java music-player logic and DSA |

---

## 🛠️ Projects

### 🎓 1. Campus Gig & SkillSwap

<p>
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/JSON%20Server-Mock%20API-333333?style=flat-square" alt="JSON Server" />
</p>

A student-focused platform designed to connect students through campus gigs, opportunities, and skill exchange.

**✨ Key features**

- 🔍 Browse and filter available gigs.
- 📝 Post gigs and opportunities.
- 🙋 Apply for gigs.
- 📋 View personal gigs and applications.
- 👤 Manage a student profile.
- 🔄 Track gig status and completion.
- ⭐ Review eligible completed gigs.

**⚠️ Development note:** The application uses a demo-profile workflow rather than a complete production authentication system. JSON Server is used as a local mock API for development and demonstration.

#### 🚀 Run locally

**Step 1 — Navigate to the project**

```bash
cd submission/404-mercy/campus-gig-skillswap
```

**Step 2 — Install dependencies**

```bash
npm install
```

**Step 3 — Start the application and API**

```bash
npm run dev:all
```

On Windows PowerShell, if required:

```powershell
npm.cmd run dev:all
```

**🌐 Local addresses**

| Service | Address |
|---|---|
| Frontend | `http://localhost:5173/` |
| JSON Server API | `http://localhost:3001/` |

#### 🏗️ Build verification

```bash
npm run build
```

On Windows PowerShell, use `npm.cmd run build` if necessary.

A successful build verifies the frontend compilation; it does not guarantee that every feature or backend operation works.

---

### 🌾 2. KisaanMandi

**An agricultural marketplace application built by a member of Team 404 MERCY.**

KisaanMandi is maintained independently within the shared repository.

**📌 Before submission, document and verify:**

- 🧰 Technology stack and prerequisites.
- 📦 Dependency installation.
- ▶️ Local startup instructions.
- 🧪 Testing and build commands.
- 🔑 Required environment variables, without exposing secrets.
- ✅ Core application functionality.

#### 🚀 Run locally

Navigate to the project:

```bash
cd submission/404-mercy/KisaanMandi
```

Follow the project's own README for dependency installation and startup commands.

> 📝 **To complete this section:** Add the verified commands for KisaanMandi's actual framework and tooling. Do not assume it uses the same stack as Campus Gig & SkillSwap.

---

### 🎵 3. TuneWave Music Player

**A Java-based music-player logic project focused on Data Structures and Algorithms.**

The objective is to demonstrate the correct implementation and behavior of essential data structures through a clear, interactive console application.

#### 🧠 Core DSA components

| Data structure | 🎯 Purpose |
|---|---|
| 🔗 Doubly Linked List | Maintain playlist order and support next/previous navigation |
| 🗺️ HashMap | Efficient song lookup by unique song ID |
| 📥 Queue | Manage Up Next playback in FIFO order |
| 📚 Stack | Replay previously played songs using history |
| 🌳 Binary Search Tree | Search songs by title and perform prefix searches |
| 🕸️ Undirected Graph | Model artist relationships and recommend related artists |

#### ⚡ Expected functionality

- ➕ Add and remove playlist songs.
- ⏭️ Navigate songs and toggle repeat.
- 🎶 Queue upcoming songs.
- ⏮️ Replay songs from playback history.
- 🔎 Search songs by title or prefix.
- 🤝 Add relationships between artists.
- 💡 Recommend artists exactly two links away.
- 🧪 Verify behavior with automated tests.
- ⏱️ Document the time complexity of major operations.

#### 🚀 Run locally

Navigate to the actual TuneWave project folder and follow its Java setup instructions.

For a simple Java source layout, the commands may resemble:

```bash
javac -d out src/*.java
java -cp out Main
```

> ⚠️ These example commands apply only if the project uses this source layout and `Main` as its entry-point class. Use the actual commands for the project's package structure or build tool.

**🏆 DSA goal:** Prioritize correctness, edge-case handling, testability, and a clear demonstration of each required data structure over unnecessary graphical features.

---

## ⚙️ Prerequisites

Install the tools required for the specific project you want to run.

| Tool | Used for |
|---|---|
| 🧰 Git | Version control and collaboration |
| 📝 VS Code or another editor | Code editing |
| 🟢 Node.js and npm | Campus Gig & SkillSwap |
| ☕ Java Development Kit (JDK) | TuneWave Music Player |
| 📦 Project-specific dependencies | KisaanMandi |

### 🔎 Verify installations

```bash
git --version
node --version
npm --version
java -version
javac -version
```

You don't need every tool installed to work on an individual project.

---

## 🚀 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/JamshedAli01/404-mercy.git
cd 404-mercy
```

### 2️⃣ Check available branches

```bash
git fetch origin
git branch -a
```

### 3️⃣ Switch to the team's working branch

```bash
git switch 404-mercy
git pull origin 404-mercy
```

> ⚠️ Before switching branches or pulling changes, preserve any uncommitted work. Coordinate with the team if someone else is editing the shared branch.

### 4️⃣ Open the project you want

For example:

```bash
cd submission/404-mercy/campus-gig-skillswap
```

Follow the corresponding project's setup instructions.

---

## 🧪 Testing and Verification

Before declaring a project ready, verify its main features instead of relying only on whether it starts.

### 🎓 Campus Gig & SkillSwap

- [ ] Frontend starts successfully.
- [ ] JSON Server is reachable.
- [ ] Gig browsing and filtering work.
- [ ] Posting a gig and applying for one work.
- [ ] Gig status changes and completion work.
- [ ] Reviews follow the intended rules.
- [ ] Data behavior after refresh is understood.

### 🌾 KisaanMandi

- [ ] Dependencies install successfully.
- [ ] The application starts using documented commands.
- [ ] Main user workflows work.
- [ ] Required backend services are available.
- [ ] Build and test commands have been verified.

### 🎵 TuneWave Music Player

- [ ] Custom doubly linked list works correctly.
- [ ] HashMap lookups and ID uniqueness are maintained.
- [ ] Repeat and navigation boundary cases work.
- [ ] Queue playback follows FIFO order.
- [ ] History maintains the required capacity and stack behavior.
- [ ] BST lookup and alphabetical prefix search work.
- [ ] Graph recommendations return artists exactly two links away.
- [ ] Empty inputs and invalid IDs are handled safely.
- [ ] Automated tests run successfully.
- [ ] Time complexity is documented.

> ✅ **Testing rule:** Report tests as passed only after actually running them.

---

## 🤝 Git Workflow and Collaboration

Teamwork is essential when multiple projects share one repository. Follow these steps to avoid overwriting another contributor's work.

### 🔍 Check your branch and changes

```bash
git branch --show-current
git status
```

### 🔄 Update the shared branch

When you are working directly on `404-mercy`:

```bash
git fetch origin
git pull origin 404-mercy
```

If you're working on a feature branch, update it using the agreed merge or rebase workflow.

### 📂 Stage only your project's files

Example for KisaanMandi:

```bash
git add submission/404-mercy/KisaanMandi
git status
```

Review the staged files before committing.

### 💾 Commit your changes

```bash
git commit -m "Update KisaanMandi application"
```

Choose a message that accurately describes your changes.

### ☁️ Push to GitHub

If the team permits direct pushes to the shared branch:

```bash
git push origin 404-mercy
```

Otherwise, push a feature branch and create a pull request targeting `404-mercy`.

### 🤝 Collaboration rules

- 🚫 Never overwrite another contributor's work.
- 🚫 Avoid force-pushing to the shared branch.
- 📂 Keep projects inside their assigned folders.
- 🔍 Review changes before committing.
- 🧩 Resolve merge conflicts carefully.
- 💬 Coordinate changes to shared files.
- ✅ Follow the hackathon's required merge and submission process.

---

## 🔐 Security Guidelines

Protect the team's code and credentials.

**Never commit:**

- 🔑 API keys, passwords, access tokens, or private keys.
- 📄 `.env` files containing secrets.
- 👤 Sensitive personal information.
- 📦 Generated dependency folders such as `node_modules/`.
- 🗂️ Unnecessary build artifacts and caches.

If environment variables are required, provide a safe `.env.example` with variable names and placeholder values.

> ⚠️ `.gitignore` does not automatically remove files that are already tracked by Git. If a secret has been exposed, revoke or rotate it immediately.

---

## 🛠️ Troubleshooting

### ❌ npm commands fail in PowerShell

Try:

```powershell
npm.cmd install
npm.cmd run dev:all
```

### 🔌 The frontend works, but API requests fail

Check that the API server is running and that the frontend uses the correct API address.

### 💻 The application works on one computer but not another

Check for missing dependencies, hardcoded localhost addresses, missing environment variables, and services that only run on the original computer.

### 🔀 Git reports merge conflicts

Inspect the affected files, preserve the intended changes, resolve conflicts, and rerun the relevant tests. Don't discard work simply to make Git commands succeed.

### ☕ Java compilation fails

Verify the JDK installation, source paths, package declarations, class names, and documented build command.

### 🧪 The build succeeds, but a feature fails

A successful build does not prove that every feature works. Reproduce the failing workflow and run the relevant tests.

---

## ✅ Final Submission Checklist

Before submitting the team's work, confirm the following:

- [ ] 📂 Every project is in the correct directory.
- [ ] 📚 Each project has accurate setup instructions.
- [ ] ⚙️ Dependencies and environment requirements are documented.
- [ ] ▶️ Each project has been run locally.
- [ ] 🧪 Core functionality and relevant tests have been checked.
- [ ] 🏗️ Build or compilation verification has been performed where applicable.
- [ ] 🔐 No secrets or unnecessary generated files are committed.
- [ ] 🤝 Contributions are committed and pushed to the intended branch.
- [ ] 🔍 The final changes have been reviewed.
- [ ] 🏁 All hackathon-specific submission requirements are satisfied.

---

<p align="center">
  <strong>💙 Built with teamwork, curiosity, and code by Team 404 MERCY.</strong>
</p>

<p align="center">
  🚀 <em>Think clearly. Build responsibly. Test thoroughly.</em>
</p>
>>>>>>> dae5d55db4fde3a479c8d258858f71ea08cd4263
