# 🚀 Hackathon Submissions — Team ClaudeBuster

**Team Name:** ClaudeBuster  
**Branch:** `ClaudeBuster`  
**Repository:** `https://github.com/MariamAzeem/ClaudeBuster.git`  

Welcome to the hackathon project submission workspace for **Team ClaudeBuster**. Each challenge / issue is organized in its own dedicated subfolder below:

---

## 📁 Project Directory

| Folder | Problem / Challenge | Tech Stack | Status |
| :--- | :--- | :--- | :--- |
| **[DSA](./DSA)** | 🎵 **TuneWave Music Player** (DLL, HashMap, Queue, Stack, BST, Graph) | Java 21+ | ✅ Completed (19/19 tests) |
| **[CampusGig](./CampusGig)** | 🎓 **Campus Gig & SkillSwap Portal** (Full Web App, Roles, Lifecycle, Mutual Reviews, Mock API) | HTML5, Vanilla CSS, JS, Node.js | ✅ Completed (16/16 tests) |
| **Problem 3** | *(Next challenge)* | TBD | ⏳ Pending |

---

## 🎵 Subfolder: `DSA/` — TuneWave Music Player
- **Milestone 1 — Playlist:** Doubly Linked List for bidirectional playback + Custom Hash Map for O(1) duplicate prevention and node removal. Repeat mode wrapping / stopping.
- **Milestone 2 — Up Next & History:** FIFO Queue for prioritized track queuing (playlist position preserved) + Bounded History Stack of 10 tracks (dropping oldest) with `back()` replay.
- **Milestone 3 — Search & Artist Recommendations:** Binary Search Tree with alphabetical prefix search & subtree pruning + Undirected Graph for 2-hop artist recommendations (excluding direct relations and self).

👉 **Details:** See [DSA/README.md](./DSA/README.md).
```powershell
cd submission/ClaudeBuster/DSA
.\build.bat && .\test.bat
```

---

## 🎓 Subfolder: `CampusGig/` — Campus Gig & SkillSwap Portal
- **Milestone 1 — Profiles & Gig Creation:** Role-flexible student profiles, computed stats, validated gig creation (Programming, Design, Writing, Tutoring; Paid, SkillSwap, Free).
- **Milestone 2 — Discovery & Applications:** Search & multi-filtering, short message proposals, self-application prevention, duplicate application rejection, auto-expiration on passed deadlines.
- **Milestone 3 — Applicant Selection & Status:** Owner review, 1-click applicant acceptance (sets In Progress, auto-rejects other pending applicants), strict lifecycle (Completed allowed only from In Progress).
- **Milestone 4 — Mutual Reviews & Calculated Reputation:** Two-way 1-5 star reviews & comments between owner and accepted applicant, single review rule, dynamic average rating calculation from reviews.
- **Milestone 5 — Mock API & Seed Data:** 12 users, 25 gigs, 21 applications, 10 mutual reviews, full mock REST endpoints and persistence.

👉 **Details:** See [CampusGig/README.md](./CampusGig/README.md).
```powershell
cd submission/ClaudeBuster/CampusGig
.\start.bat     # Launches web app at http://localhost:3000
.\test.bat      # Runs automated verification tests
```

