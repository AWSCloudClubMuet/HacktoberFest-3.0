# 🎵 TuneWave Music Player

### Team: 3-Braincells  
**Hackathon:** HacktoberFest-Hackathon 2026  
**Submission Folder:** `/submission/team_3-braincells/`  
**Branch:** `3Braincells`

---

## 👥 Team Members & Roles
- **Filza & Team:** Architecture, Algorithm Design, Data Structure Implementation, Test Engineering.

---

## 🎯 Project Overview
**TuneWave Music Player** is a modular, high-performance music streaming core engine built from the ground up using custom fundamental computer science data structures.

TuneWave solves the five classic music player challenges:
1. **Dynamic Playlist Navigation & Random-Access Editing:** Implemented via a **Custom Doubly Linked List (DLL)** synchronized with a **Hash Map (`dict: song_id -> SongNode`)** for $O(1)$ bidirectional step navigation, $O(1)$ random-access deletion, and $O(1)$ duplicate prevention.
2. **Up Next Queue:** Implemented via a **Custom Singly Linked FIFO Queue** giving queued tracks strict priority over playlist advancement while keeping the playlist cursor isolated.
3. **Playback History:** Implemented via a **Custom Doubly Linked LIFO Stack** capped at 10 items. Enables `back()` navigation without replay loops, evicting the oldest entry in $O(1)$ when full.
4. **Song Search Engine:** Implemented via a **Custom Binary Search Tree (BST)** ordered alphabetically by normalized song title. Uses mathematical branch pruning during prefix search to skip irrelevant subtrees, supporting duplicate song titles without data loss.
5. **Related-Artist Discovery:** Implemented via a **Custom Undirected Graph** with an adjacency-list representation (`Dict[str, Set[str]]`). Uses a 2-hop BFS traversal to recommend related artists exactly two edges away, strictly excluding direct neighbors and self-relations.

---

## 🛠️ Technologies Used
- **Language:** Python 3.13 (Standard Library: `dataclasses`, `typing`, `sys`, `collections`)
- **Testing Framework:** `pytest 9.1.1` (52 automated tests covering all milestones and edge cases)
- **External Dependencies:** Zero external runtime dependencies (100% pure custom DSA).

---

## 📂 Project Structure
```
submission/team_3-braincells/
├── readme.md                           # Team documentation
└── TuneWave Music Player/
    ├── .gitignore                      # Excludes cache and pyc files
    ├── main.py                         # Interactive & automated CLI demo
    ├── src/
    │   ├── __init__.py                 # Unified package exports
    │   ├── models.py                   # Song and normalization domain models
    │   ├── playlist.py                 # Doubly Linked List + Hash Map (Milestone 1)
    │   ├── playback.py                 # FIFO Queue + Bounded LIFO Stack + Player (Milestone 2)
    │   ├── player.py                   # Convenience player re-exports
    │   ├── search_tree.py              # BST Search Engine with Subtree Pruning (Milestone 3A)
    │   ├── search.py                   # Convenience search re-exports
    │   ├── graph.py                    # Undirected Graph & 2-Hop Recommender (Milestone 3B)
    │   └── recommendations.py          # Convenience graph re-exports
    └── tests/
        ├── __init__.py
        ├── test_playlist.py            # 16 unit tests for Playlist DLL + Hash Map
        ├── test_playback.py            # 14 unit tests for Up Next Queue & History Stack
        ├── test_search_tree.py         # 11 unit tests for BST Search & Subtree Pruning
        └── test_graph.py               # 11 unit tests for Undirected Graph Traversal
```

---

## 🚀 Setup & Execution Instructions

### Prerequisites
- Python 3.10+ (tested on Python 3.13.15)
- Pytest (optional, for running tests: `pip install pytest`)

### 1. Run the Automated Test Suite (52 Tests)
Navigate to the project folder and run:
```powershell
cd "submission/team_3-braincells/TuneWave Music Player"
python -m pytest -v
```
*Expected: 52 passed in ~0.20s.*

### 2. Run the Interactive CLI Demonstration
```powershell
python main.py
```
*Features a numbered menu to browse the catalog, control playback, manage playlists, test the Up Next queue, view history, search via BST, and explore artist recommendations.*

### 3. Run the Automated Demo Script
```powershell
python main.py --demo
```
*Executes an end-to-end presentation verifying all 4 milestones without requiring manual input.*

---

## 🧩 Data Structure & Complexity Summary

| Milestone | Component | Data Structure | Key Operations | Time Complexity | Space Complexity |
|---|---|---|---|:---:|:---:|
| **1** | Playlist Sequencing | Doubly Linked List | `next()`, `previous()` | $O(1)$ | $O(n)$ |
| **1** | Playlist Lookup & Removal | Hash Map | `addSong()`, `removeSong()` | $O(1)$ | $O(n)$ |
| **2** | Up Next Buffer | FIFO Queue | `addToUpNext()`, `dequeue()` | $O(1)$ | $O(k)$ |
| **2** | Playback History | Bounded LIFO Stack | `push()`, `back()` | $O(1)$ (capped at 10) | $O(1)$ |
| **3A** | Song Search Index | Binary Search Tree | `findSong()`, `prefixSearch()` | $O(\log n)$ avg (pruned) | $O(n)$ |
| **3B** | Related Artists | Undirected Graph | `addRelation()`, `recommendArtists()` | $O(V + E)$ (2-hop BFS) | $O(V + E)$ |

---

## 🏆 Hackathon PR Checklist
- [x] All code contained within `/submission/team_3-braincells/`.
- [x] Committed to dedicated team branch `3Braincells`.
- [x] Zero API keys, secrets, or sensitive credentials committed.
- [x] 52/52 automated unit tests passing.
- [x] Clean commit history ready for Pull Request to upstream `submission` branch.
