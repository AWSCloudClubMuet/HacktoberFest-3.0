# 🎵 TuneWave Music Player (GitHub Issue #13)

A pure Java 17 core music streaming player built with **zero external dependencies** (no Maven, Gradle, or external testing frameworks). Powered by foundational Data Structures & Algorithms (DSA): Doubly Linked List, Hash Map, FIFO Queue, Bounded LIFO Stack, Binary Search Tree (BST) with branch pruning, and an Undirected Graph.

---

## 🖥️ Interactive Terminal Demo

![TuneWave Interactive Terminal Demo](./docs/demo.png)

The player includes an interactive command-line interface (`com.tunewave.Main`) preloaded with sample music tracks and artist connections, allowing full manual control of playlist navigation, queuing, history replay, BST search, and artist recommendations.

---

## 🏗️ Data Structures & Complexity

| Component | Data Structure | Operations & Complexity | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Playlist Tracks** | Custom Doubly Linked List (`SongNode`) | `next()`, `previous()`: $O(1)$ | Stores `prev` and `next` pointers to enable bidirectional traversal and constant-time unlinking without shifting elements. |
| **Playlist Index** | `HashMap<String, SongNode>` | `addSong()`, `removeSong()`: $O(1)$ | Enables instant duplicate ID detection on insertion and direct node reference lookup for removal without scanning the list. |
| **Up Next Queue** | `ArrayDeque<Song>` (FIFO) | `addToUpNext()`, `pollFirst()`: $O(1)$ | Enforces First-In, First-Out priority for queued songs before the playlist resumes. |
| **Playback History** | `ArrayDeque<Song>` (Bounded Stack) | `pushHistory()`, `back()`: $O(1)$ | Maintains exactly the last 10 songs played in LIFO order. When the 11th song arrives, the oldest is discarded in $O(1)$. |
| **Song Search** | Custom Binary Search Tree (`SongBST`) | `findSong()`: $O(\log n)$<br>`prefixSearch()`: $O(k + m)$ | Keyed by title. Uses in-order traversal for strictly alphabetical results. Prunes impossible subtrees based on lexicographical ordering. Supports duplicate titles via an ID list at the node. |
| **Artist Network** | Undirected Graph (`ArtistGraph`) | `addRelation()`: $O(1)$<br>`recommendArtists()`: $O(V + E)$ | Models mutual artist collaborations using adjacency lists. Recommends artists exactly 2 edges away, excluding the artist themselves and any direct neighbors, sorted alphabetically. |

---

## 📍 Milestones & Features

### 🧩 Milestone 1 — Playlist (Doubly Linked List + Hash Map)
- **$O(1)$ Bidirectional Navigation**: Move forward with `next()` and backward with `previous()`.
- **Zero-Scan Lookups & Deduplication**: Songs can only appear once in a playlist. A `HashMap<String, SongNode>` rejects duplicate IDs on insertion and enables direct pointer unlinking on removal in $O(1)$ time.
- **Repeat Boundary Rules**:
  - **Repeat ON**: Calling `next()` on the last song wraps around to the first song (`head`). Calling `previous()` on the first song wraps to the last song (`tail`).
  - **Repeat OFF**: Calling `next()` on the last song stays on the last song and returns the string `"end"`.
- **Safe Cursor Management**: Removing the currently playing song cleanly advances the cursor to the adjacent track (`node.next`, or falls back to `node.prev` if the tail was removed).

### 🧩 Milestone 2 — Up Next and History (Queue + Stack)
- **VIP Queue Priority**: `playNext()` always checks the Up Next queue first. Queued songs play before the playlist continues.
- **The "Freeze Cursor" Rule**: Playing from Up Next or replaying from history **never moves the playlist cursor**. When queued songs finish, the playlist resumes from the exact position where it was paused.
- **Bounded 10-Item History Stack**: Keeps strictly the last 10 songs played. Older tracks automatically drop off the bottom in $O(1)$ time.
- **History Back Navigation**: `back()` pops the most recently played song and replays it, without pushing the replaced track back into history to prevent oscillation loops.

### 🧩 Milestone 3 — Song Search and Related Artists (BST + Graph)
- **Custom BST with Title Indexing**: Case-insensitive binary search tree. Multiple songs sharing the same title (e.g. covers or different artists) are supported by storing a list of song IDs at that title's node.
- **Alphabetical Prefix Search with Subtree Pruning**:
  - Traverses in-order (`left -> node -> right`) to guarantee results return in alphabetical order.
  - Skips subtrees that cannot match based on lexicographical order.
- **Undirected Artist Graph & 2-Hop Recommendations**:
  - Connects artists symmetrically (`A <-> B`).
  - `recommendArtists(artist)` collects collaborators of collaborators (exactly 2 edges away).
  - Automatically excludes the original artist (0 hops) and direct collaborators (1 hop).
  - Deduplicates candidates reachable through multiple paths and returns recommendations sorted alphabetically.

---

## 🚀 How to Build and Run

This project requires standard **JDK 17 or higher** and zero external build tools.

### 1. Compile the Project
From this directory:
```bash
mkdir -p bin
javac -d bin src/main/java/com/tunewave/*.java src/test/java/com/tunewave/*.java
```

### 2. Launch the Interactive Player
```bash
java -cp bin com.tunewave.Main
```

### 3. Run the Automated Test Suite (49 Tests)
```bash
java -cp bin com.tunewave.TestRunner
```

---

## 🎮 Interactive Console Controls

When running `com.tunewave.Main`, you can type commands or numbers directly:

| Command | Shortcut | Description | Example |
| :--- | :---: | :--- | :--- |
| `play` | `1` | Play next song (Up Next queue first, then playlist) | `play` |
| `back` | `2` | Replay previous song from the 10-item history stack | `back` |
| `next` | `3` | Move forward to next playlist song | `next` |
| `prev` | `4` | Move backward to previous playlist song | `prev` |
| `queue` | `5` | Add a song to Up Next by ID | `queue S99` |
| `search` | `6` | Search exact song title in the BST | `search Borderline` |
| `prefix` | `7` | Find all titles starting with prefix (alphabetical) | `prefix Bo` |
| `rec` | `8` | Recommend artists 2 hops away in the graph | `rec The Weeknd` |
| `add` | `9` | Add a new song to the playlist and catalog | `add` |
| `repeat` | `10` | Toggle repeat mode ON / OFF | `repeat` |
| `status` | `11` | View active song, playlist cursor, queue, and history | `status` |
| `demo` | `12` | Run a quick automated walkthrough demo | `demo` |
| `exit` | `0` | Exit the player | `exit` |

---

## 🛡️ Edge Cases Handled

1. **Duplicate Song ID Rejection**: `PlaylistManager` checks the hash map in $O(1)$ before touching any pointers, preventing duplicate entries or pointer corruption.
2. **Current Track Removal**: If the song being removed is the active cursor, the cursor smoothly advances to `node.next`. If removing the tail, it falls back to `node.prev`. If the playlist becomes empty, cursor safely resets to `null`.
3. **Repeat Boundary Wrapping**:
   - `next()` on tail with repeat ON wraps to `head`.
   - `next()` on tail with repeat OFF stays at `tail` and returns `"end"`.
   - `previous()` on head with repeat ON wraps to `tail`.
4. **Queue & Cursor Isolation**: Queued songs and `back()` replaying never advance the playlist cursor.
5. **Subtree Pruning Integrity**: Pruning relies on lexicographical comparisons. A node named `"Apple"` does not discard a right child named `"Banana"` when searching for prefix `"Ba"`.
6. **Graph Loops & Triangle Shortcuts**: The recommendation algorithm properly ignores self-relations, prevents cycles, deduplicates multi-path candidates (e.g. Diamond graphs), and excludes direct 1-hop neighbors even if reachable via a triangle shortcut in 2 hops.
7. **Comprehensive Test Coverage**: All 49 automated unit and integration tests run through `TestRunner.java` with a 100% pass rate.
