# Hacktoberfest 2026 — Team Zyntra Submission
**Problem 1: TuneWave Music Player**

---

## 👋 Hey everyone!
This is our team submission for **Problem 1 (TuneWave Music Streaming Player)**. We broke down the problem into the three assigned milestones, covering all the required data structures (Doubly Linked List, Hash Map, Queue, Stack, BST, and Undirected Graph).

For each milestone, we've provided:
- A **Jupyter Notebook (`.ipynb`)** with the working code, interactive demos, and test assertions.
- A **Markdown file (`.md`)** detailing the theory, complexity analysis, and edge cases we handled.

---

## 📂 Project Structure & Files

All files for Problem 1 are located in [`Submission/Team_Zyntra/Prob1/`](./Team_Zyntra/Prob1/):

```
Submission/
├── README.md                                  # <-- You are here! Main submission overview
└── Team_Zyntra/
    └── Prob1/
        ├── Milestone1_Playlist.ipynb          # Milestone 1 Code & Demos (DLL + Hash Map)
        ├── Milestone1_Theory.md               # Milestone 1 Theory & Complexity
        ├── Milestone2_Queue_History.ipynb     # Milestone 2 Code & Demos (Queue + Stack)
        ├── Milestone2_Theory.md               # Milestone 2 Theory & Invariants
        ├── Milestone3_Search_Recommendations.ipynb # Milestone 3 Code & Demos (BST + Graph)
        └── Milestone3_Theory.md               # Milestone 3 Theory & Graph Logic
```

---

## 🧩 Milestones Overview

### 1. Milestone 1 — Playlist (Doubly Linked List + Hash Map)
- **Goal:** Manage a dynamic playlist with forward/backward playback and fast track additions/removals.
- **Approach:**
  - We used a **Doubly Linked List (DLL)** for $O(1)$ bidirectional stepping (`next()` and `previous()`).
  - Paired with a **Hash Map (`dict`)** mapping `songId -> SongNode` for $O(1)$ duplicate prevention and instant node lookups when removing tracks.
  - Handled the repeat mode rule: with repeat ON, `next()` on the last song wraps around to the first song; with repeat OFF, it stays on the last song and returns `"end"`.
- **Files:** [`Milestone1_Playlist.ipynb`](./Team_Zyntra/Prob1/Milestone1_Playlist.ipynb) & [`Milestone1_Theory.md`](./Team_Zyntra/Prob1/Milestone1_Theory.md)

### 2. Milestone 2 — Up Next & History (Queue + Stack)
- **Goal:** Let users queue songs on the fly and backtrack through songs they just played.
- **Approach:**
  - **FIFO Queue (`collections.deque`):** Songs queued in *Up Next* play before the playlist continues.
  - **Bounded LIFO Stack (`collections.deque(maxlen=10)`):** Retains the last 10 songs played and automatically drops the oldest in $O(1)$ time. `back()` replays the top song and removes it from history.
  - **Key Invariant:** Playing from Up Next or history **does not move the playlist position**! The playlist cursor stays completely frozen until Up Next is empty.
- **Files:** [`Milestone2_Queue_History.ipynb`](./Team_Zyntra/Prob1/Milestone2_Queue_History.ipynb) & [`Milestone2_Theory.md`](./Team_Zyntra/Prob1/Milestone2_Theory.md)

### 3. Milestone 3 — Song Search & Related Artists (BST + Undirected Graph)
- **Goal:** Fast song search by title and 2-hop artist recommendations.
- **Approach:**
  - **Binary Search Tree (BST):** Indexes songs by title. We implemented `prefixSearch` with subtree pruning to skip branches that cannot match, returning titles in alphabetical order directly from an in-order traversal.
  - **Undirected Graph:** Represents mutual artist relationships. `recommendArtists` finds all artists reachable in exactly 2 links, filters out any artists already directly related (handling triangle shortcuts), and returns the results in alphabetical order.
- **Files:** [`Milestone3_Search_Recommendations.ipynb`](./Team_Zyntra/Prob1/Milestone3_Search_Recommendations.ipynb) & [`Milestone3_Theory.md`](./Team_Zyntra/Prob1/Milestone3_Theory.md)

---

## 🚀 How to Run & Test
Every notebook is completely self-contained and pre-executed with outputs:
1. Open any `.ipynb` file in VS Code or Jupyter Notebook.
2. Run all cells to see the interactive demos and assertion tests.
3. Every notebook has a built-in test block at the end that verifies all required rules and edge cases.

Thanks for reviewing our work! — *Team Zyntra*
