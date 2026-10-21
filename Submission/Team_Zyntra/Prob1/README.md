# 🎵 TuneWave Music Player — Core Streaming Engine
**Hacktoberfest Hackathon 2026 | Team Zyntra | Problem 1**

---

## 🎯 Overview & Scenario
TuneWave is a next-generation music streaming application. This repository contains the complete, production-grade core implementation of TuneWave's playback, discovery, and recommendation engine, designed using classical, high-performance data structures:
- **Doubly Linked List (DLL)**
- **Hash Map (Dictionary)**
- **FIFO Queue**
- **Bounded LIFO Stack (Capacity = 10)**
- **Binary Search Tree (BST)**
- **Undirected Graph (Adjacency List)**

---

## 📦 Deliverables Structure

Every milestone includes both a dedicated **Theoretical Analysis document (`.md`)** and a fully executed **Jupyter Notebook (`.ipynb`)** containing documented code, edge-case demonstrations, and automated test suites:

```
Submission/Team_Zyntra/Prob1/
│
├── 📜 Milestone 1: Playlist Management
│   ├── Milestone1_Theory.md                 # Theoretical design, O(1) proofs & architecture
│   ├── Milestone1_Playlist.ipynb            # Fully executed notebook with interactive demos & tests
│   └── milestone1.py                        # Standalone Python module for Milestone 1
│
├── 📜 Milestone 2: Up Next & Play History
│   ├── Milestone2_Theory.md                 # Queue priority, bounded stack eviction & invariants
│   ├── Milestone2_Queue_History.ipynb       # Fully executed notebook with interactive demos & tests
│   └── milestone2.py                        # Standalone Python module for Milestone 2
│
├── 📜 Milestone 3: Song Search & Artist Recommendations
│   ├── Milestone3_Theory.md                 # BST subtree pruning proofs & 2-hop graph theory
│   ├── Milestone3_Search_Recommendations.ipynb # Fully executed notebook with interactive demos & tests
│   └── milestone3.py                        # Standalone Python module for Milestone 3
│
├── 🌟 Integrated Complete System
│   ├── TuneWave_Integrated_Showcase.ipynb   # Master notebook demonstrating all milestones end-to-end
│   ├── tunewave_player.py                   # Unified TuneWave music player engine
│   └── README.md                            # Comprehensive project guide & scorecard
```

---

## 🧩 Milestones Breakdown

### 📍 Milestone 1 — Playlist (`Milestone1_Theory.md` & `Milestone1_Playlist.ipynb`)
- **Data Structures:** Doubly Linked List (DLL) + Hash Map.
- **Rules & Invariants:**
  1. *Uniqueness:* A song can appear only once in a playlist; hash map from song ID to node checks this and finds songs in $O(1)$ without scanning.
  2. *Repeat Mode:* With repeat ON, `next()` on the last song wraps to the first song. With repeat OFF, `next()` stays on the last song and returns `"end"`.
  3. *Dynamic Deletion:* Arbitrary nodes (head, tail, middle, or currently playing) unlinked in $O(1)$ time.
- **Operations:**
  - `addSong(song)`
  - `removeSong(songId)`
  - `next()`
  - `previous()`
  - `toggleRepeat()`

---

### 📍 Milestone 2 — Up Next and History (`Milestone2_Theory.md` & `Milestone2_Queue_History.ipynb`)
- **Data Structures:** FIFO Queue (`collections.deque`) + Bounded LIFO Stack (Max capacity = 10).
- **Rules & Invariants:**
  1. *Up Next Priority:* Songs in the Up Next queue play strictly **before** the playlist continues.
  2. *Playlist Position Invariant:* Playing from Up Next or history **does not move the playlist position**.
  3. *Bounded History (10 songs):* History retains the last 10 songs played and automatically drops the oldest in $O(1)$ time.
  4. *Back Navigation:* `back()` replays the top song and removes it from history without altering playlist position.
- **Operations:**
  - `addToUpNext(songId)`
  - `playNext()`
  - `back()`

---

### 📍 Milestone 3 — Song Search & Related Artists (`Milestone3_Theory.md` & `Milestone3_Search_Recommendations.ipynb`)
- **Data Structures:** Binary Search Tree (BST) + Undirected Graph (Adjacency List).
- **Rules & Invariants:**
  1. *BST Title Indexing:* Songs stored in a BST keyed by `title` for $O(\log N)$ search.
  2. *Pruned Prefix Search:* `prefixSearch(prefix)` returns matching titles in **alphabetical order** and **skips subtrees that cannot match**.
  3. *Undirected Network:* Artists form an undirected graph of mutual related links.
  4. *2-Hop Recommendation Rule:* `recommendArtists(artist)` returns artists **exactly two links away** who are **not already directly related**, in **alphabetical order**.
- **Operations:**
  - `addSong(title, songId)`
  - `findSong(title)`
  - `prefixSearch(prefix)`
  - `addRelation(artistA, artistB)`
  - `recommendArtists(artist)`

---

## 📊 Comprehensive Big-O Complexity Scorecard

| Milestone | Component | Operation | Time Complexity | Space Complexity | Theoretical Justification |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **M1** | Playlist | `addSong(song)` | **$O(1)$** | $O(1)$ | Hash map membership check + DLL tail append |
| **M1** | Playlist | `removeSong(songId)` | **$O(1)$** | $O(1)$ | Hash map node pointer lookup + DLL pointer rewire |
| **M1** | Playlist | `next()` / `previous()`| **$O(1)$** | $O(1)$ | Direct pointer dereference (or wrap to head/tail) |
| **M1** | Playlist | `toggleRepeat()` | **$O(1)$** | $O(1)$ | Atomic boolean inversion |
| **M2** | Up Next | `addToUpNext(songId)`| **$O(1)$** | $O(1)$ | FIFO queue append at tail |
| **M2** | Playback | `playNext()` | **$O(1)$** | $O(1)$ | Up Next dequeue or DLL advance + bounded push |
| **M2** | History | `back()` | **$O(1)$** | $O(1)$ | Bounded LIFO stack pop from right boundary |
| **M2** | History | Evict Oldest | **$O(1)$** | $O(1)$ | Deque capacity automatic left eviction |
| **M3** | Search | `addSong(title, id)` | **$O(h)$** | $O(1)$ | BST insertion ($h \approx \log N$) |
| **M3** | Search | `findSong(title)` | **$O(h)$** | $O(1)$ | BST binary search descent |
| **M3** | Search | `prefixSearch(prefix)`| **$O(h + K)$**| $O(K)$ | In-order pruned traversal visiting only valid subtrees |
| **M3** | Graph | `addRelation(A, B)` | **$O(1)$** | $O(1)$ | Symmetric adjacency set insertions |
| **M3** | Recs | `recommendArtists(A)` | **$O(d_1 \cdot \bar{d})$** | $O(M)$ | 2-hop exploration + direct relation exclusion |

---

## 🚀 How to Run & Verify

### 1. Run Automated Unit Tests via Terminal
All milestones have built-in unit test verification:
```powershell
# Navigate to directory
cd "C:\Users\Area 7\Desktop\Fazeel\Hacktoberfest3.0\HacktoberFest-Zyntra\Submission\Team_Zyntra\Prob1"

# Run tests
python -c "import tunewave_player; print('TuneWave Core Loaded Successfully!')"
```

### 2. View / Execute Jupyter Notebooks
Open any of the provided notebooks in VS Code or JupyterLab:
- `Milestone1_Playlist.ipynb`
- `Milestone2_Queue_History.ipynb`
- `Milestone3_Search_Recommendations.ipynb`
- `TuneWave_Integrated_Showcase.ipynb`

All notebooks have already been pre-executed and contain full execution outputs, graphs, and assertion confirmations.
