# HacktoberFest 3.0: Team Default Avenger Submission

**Team Name:** Default Avenger  
**Target Branch:** submission  
**Repository:** AWSCloudClubMuet / HacktoberFest-3.0  

---

## 1. Project Overview
This repository contains our team's project submission for HacktoberFest 3.0. Following the event guidelines, our team selected and solved three distinct problems across Machine Learning, Data Structures, and Web Development:

- **Problem 1:** Noisy Labels in HelpDeskNet-50K (Issue #9)
- **Problem 2:** TuneWave Console Music Player (Java DSA)
- **Problem 3:** ReliefHub Flood Relief Dashboard (Web Development)

---

## 2. Summary of Solved Problems

### Problem 1: Noisy Labels in HelpDeskNet-50K (Issue #9)
- **Track:** Machine Learning & Data Science
- **Technologies:** Python, NumPy, Pandas, SciPy, Matplotlib
- **Folder:** `HelpDeskNet-50K #9/`

### Problem 2: TuneWave Music Player
- **Track:** Data Structures & Algorithms
- **Technologies:** Java, Doubly Linked List, Binary Search Tree, Graph
- **Folder:** `TuneWave/`

### Problem 3: ReliefHub Flood Relief Dashboard
- **Track:** Full-Stack Web Development
- **Technologies:** HTML, CSS, JavaScript, Node.js, JSON Server
- **Folder:** `ReliefHub/`

---

## 3. Directory Layout

- `submission/default-avenger/`
  - `README.md` (Main team submission report)
  - `HelpDeskNet-50K #9/`
    - `analysis.py` (Statistical analysis script)
    - `chart.png` (Error distribution visualization)
    - `milestone 1 - results.png` (Milestone 1 execution output)
    - `Milestone 2-results.png` (Milestone 2 execution output)
    - `milestone 3 result.png` (Milestone 3 execution output)
    - `milestone 4 output.png` (Milestone 4 execution output)
    - `milestone 5 output.png` (Milestone 5 execution output)
    - `README.md` (Comprehensive documentation for Issue #9)
  - `TuneWave/`
    - `Main.java` (Application entry point and menus)
    - `Song.java`, `Node.java`, `Playlist.java` (Playlist logic using Doubly Linked List)
    - `SongSearchTree.java` (Binary Search Tree for song lookup)
    - `ArtistGraph.java` (Graph for artist recommendations)
    - `README.md` (Execution guide and class documentation)
  - `ReliefHub/`
    - `index.html`, `app.js`, `styles.css` (Web dashboard frontend)
    - `db.json` (Camp and supply database)
    - `README.md` (Project overview and architecture)

---

## 4. Problem 1 Details: HelpDeskNet-50K (Issue #9)

- **Goal:** Analyze why the customer support ticket classification model plateaus at 82% validation accuracy, and design a data quality recovery strategy.
- **Key Findings:**
  - **Noise Rate:** Analyzed 400 audited tickets and found an overall crowd noise rate of 15.0% (95% Confidence Interval: 11.50% to 18.50%).
  - **Worker Disparity:** Conducted a Two-Proportion Z-Test confirming that Tier B workers had a statistically significant 3.3x higher error rate than Tier A (21.82% vs 6.67%, p < 0.0001).
  - **Systematic Confusion:** Showed that 68.3% of all mistakes occurred between two overlapping categories: Billing vs. Refund (43.3%) and Technical vs. Account Access (25.0%).
  - **Accuracy Ceiling:** Calculated that true underlying model accuracy is roughly 96.3% under uniform noise, but realistically between 88% and 91% due to class-conditional clustering.
  - **2,000 Review Plan:** Allocated 80% of expert relabeling to Tier B tickets and low-confidence prediction margins.
  - **Mitigation Strategy:** Proposed Confident Learning (Cleanlab) and Symmetric Cross-Entropy, while using the 5,000 in-house expert tickets as the clean evaluation benchmark.
- **Full Report:** See `HelpDeskNet-50K #9/README.md`.

---

## 5. Problem 2 Details: TuneWave Music Player

- **Goal:** Implement an interactive console music player demonstrating real-world applications of fundamental data structures in Java.
- **Data Structures Implemented:**
  - **Doubly Linked List (`Playlist.java`):** Supports forward and backward song navigation with repeat mode and playback history.
  - **Binary Search Tree (`SongSearchTree.java`):** Implements exact song lookup and prefix matching for autocomplete in alphabetical order.
  - **Undirected Graph (`ArtistGraph.java`):** Models artist connections and implements a 2-hop search to recommend related artists who are two links away.
- **Execution:**
  1. `cd TuneWave`
  2. `javac *.java`
  3. `java Main`
- **Full Report:** See `TuneWave/README.md`.

---

## 6. Problem 3 Details: ReliefHub Flood Relief Dashboard

- **Goal:** Provide a centralized coordination platform to manage flood relief camps, emergency inventory, dispatches, and volunteers in Sindh, Pakistan.
- **Key Capabilities:**
  - **Camp Management:** Real-time monitoring of camp capacities, family counts, and operational status.
  - **Inventory and Shortages:** Tracking critical supplies and warehouse inventory fulfillment.
  - **Dispatch Coordination:** Preventing over-allocation and managing delivery dispatches.
  - **Volunteers and Donations:** Skill-based volunteer deployment and donation tracking.
  - **API Architecture:** REST API powered by Node.js and JSON Server (`db.json`), with foundational structures for Express and PostgreSQL.
- **Full Report:** See `ReliefHub/README.md`.

---

## 7. Submission Checklist

- [x] All solutions and documentation are organized inside `/submission/default-avenger/`.
- [x] All three chosen problems are fully solved with source code and documentation.
- [x] Team branch (`default-avenger`) corresponds to team identity.
- [x] Step-by-step commit history pushed to GitHub.
