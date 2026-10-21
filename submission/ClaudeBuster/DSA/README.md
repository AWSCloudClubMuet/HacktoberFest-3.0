# 🎵 TuneWave Music Player — Core Streaming Engine

**Team Name:** ClaudeBuster  
**Branch:** `ClaudeBuster`  
**Submission Folder:** `submission/ClaudeBuster`  
**Project:** TuneWave Music Streaming Core Architecture  
**Language & Runtime:** Java (JDK 21+)  

---

## 🎯 Overview

TuneWave is a robust, production-grade music player core engineered from first principles using fundamental computer science data structures. It fulfills all three hackathon milestones with exact adherence to algorithmic constraints and playback rules.

---

## 🏗️ Architecture & Data Structures

```
                                  ┌────────────────────────┐
                                  │     TuneWavePlayer     │
                                  └───────────┬────────────┘
                                              │
         ┌───────────────────┬────────────────┼────────────────┬───────────────────┐
         │                   │                │                │                   │
         ▼                   ▼                ▼                ▼                   ▼
┌──────────────────┐ ┌──────────────┐ ┌───────────────┐ ┌─────────────┐ ┌────────────────────┐
│ DoublyLinkedList │ │CustomHashMap │ │  CustomQueue  │ │HistoryStack │ │ BinarySearchTree   │
│ (Bidirectional   │ │(O(1) Song ID │ │  (FIFO Up-    │ │(Bounded LIFO│ │ (Prefix search with│
│  Playlist)       │ │  Lookup)     │ │   Next Queue) │ │ Max 10, drop│ │  subtree pruning)  │
└──────────────────┘ └──────────────┘ └───────────────┘ │   oldest)   │ └────────────────────┘
                                                        └─────────────┘          │
                                                                                 ▼
                                                                        ┌────────────────────┐
                                                                        │    ArtistGraph     │
                                                                        │ (Undirected 2-Hop  │
                                                                        │  Recommendations)  │
                                                                        └────────────────────┘
```

---

## 📍 Milestones & Features Implemented

### 🧩 Milestone 1 — Playlist (Doubly Linked List + Hash Map)
- **Doubly Linked List (`DoublyLinkedList<T>`):** Allows seamless bidirectional playback navigation (`next()` and `previous()`), and instant $O(1)$ unlinking of any node.
- **Hash Map (`CustomHashMap<K, V>`):** Maintains a mapping from `songId` to `Node<Song>`, guaranteeing in $O(1)$ that songs cannot appear more than once in the playlist and enabling instant removal without linear traversal.
- **Repeat Logic:**
  - When repeat is **OFF**, `next()` at the end of the playlist stays on the final song and returns `"end"`.
  - When repeat is **ON**, `next()` wraps around to the playlist's head.
- **Duplicate IDs:** `addSong` checks the hash map *first*. A rejected duplicate is not added to the playlist, the catalog or the search tree, so it can never show up in `findSong` / `prefixSearch`.
- **Operations:**
  - `addSong(song)`
  - `removeSong(songId)`
  - `next()`
  - `previous()`
  - `toggleRepeat()`

### 🧩 Milestone 2 — Up Next and History (Queue + Stack)
- **Up Next Queue (`CustomQueue<T>`):** FIFO queue ensuring songs manually queued are played with priority before resuming the playlist.
- **Playlist Position Invariant:** Playing songs from Up Next or replaying from History **never moves** the underlying playlist's current pointer.
- **Play History Stack (`HistoryStack<T>`):**
  - Bounded LIFO stack with a capacity of **10 songs**.
  - Automatically drops the oldest song from the bottom when full.
- **Back Navigation:** `back()` replays the most recently played song, pops it from history, and leaves the playlist position untouched.
- **Unknown IDs:** `addToUpNext` returns `false` for an ID that does not exist; it never invents a placeholder track.
- **Operations:**
  - `addToUpNext(songId)`
  - `playNext()`
  - `back()`

### 🧩 Milestone 3 — Song Search and Related Artists (BST + Graph)
- **Binary Search Tree (`BinarySearchTree`):**
  - Songs are indexed lexicographically by title.
  - `findSong(title)` provides exact search in $O(\log N)$ average time.
  - `prefixSearch(prefix)` returns matching titles in **alphabetical order**.
  - **Subtree Pruning:** Prunes and skips subtrees whose key ranges cannot match the requested prefix.
- **Artist Recommendation Graph (`ArtistGraph`):**
  - Undirected graph with adjacency lists representing artist relation links.
  - `addRelation(artistA, artistB)` establishes reciprocal edges.
  - `recommendArtists(artist)` traverses exactly **2 links away** to recommend artists who are **not directly related** and **not the artist themselves**, returning results in strict **alphabetical order**.
- **Operations:**
  - `addSong(title, songId)`
  - `findSong(title)`
  - `prefixSearch(prefix)`
  - `addRelation(artistA, artistB)`
  - `recommendArtists(artist)`

---

## 📂 Project Structure

```
submission/ClaudeBuster/
├── build.bat                              # Build script for Windows
├── run.bat                                # CLI launcher script
├── test.bat                               # Automated test runner script
├── README.md                              # Project documentation
└── src/
    └── tunewave/
        ├── model/
        │   └── Song.java                  # Song entity (ID, title, artist, duration)
        ├── datastructures/
        │   ├── DoublyLinkedList.java      # Doubly linked list for playlist
        │   ├── CustomHashMap.java         # Separate-chaining hash map
        │   ├── CustomQueue.java           # Linked FIFO queue for Up Next
        │   ├── HistoryStack.java          # Bounded 10-item stack with oldest dropping
        │   ├── BinarySearchTree.java      # BST with prefix search & pruning
        │   └── ArtistGraph.java           # Undirected graph for 2-hop recommendations
        ├── player/
        │   └── TuneWavePlayer.java        # Central player engine orchestrating all milestones
        ├── demo/
        │   └── TuneWaveDemo.java          # Interactive visual dashboard & CLI
        └── test/
            └── TuneWaveTest.java          # Full automated test suite (21 test cases)
```

---

## 🖥️ Using the Interactive Console

Start it with `.\run.bat` (or `java -cp bin tunewave.demo.TuneWaveDemo`). You see, in order:

1. a welcome banner,
2. **NOW PLAYING** - the current song and whether repeat is on,
3. the **PLAYLIST** - numbered, with each song's ID (a `>` marks the song that is playing),
4. the list of **COMMANDS**,
5. the `tunewave>` prompt.

Type a command and press Enter. After every action the console prints the song that is playing and what is queued. Type `dashboard` any time to see the playlist, Up Next queue and history together.

| Command | What it does |
|---|---|
| `next` / `prev` | Move forward / backward in the playlist |
| `playnext` | Play the next song (Up Next queue first, then the playlist) |
| `back` | Replay the most recent song from history |
| `repeat` | Turn repeat on / off |
| `add <title> \| <artist> \| <id>` | Add a song, e.g. `add Hello \| Adele \| S9` |
| `remove <id>` | Remove a song from the playlist, e.g. `remove S3` |
| `queue <id>` | Put a song in Up Next, e.g. `queue S7` |
| `find <title>` | Exact title search |
| `search <start of title>` | Prefix search, A-Z, e.g. `search Be` |
| `relate <artist> \| <artist>` | Link two artists, e.g. `relate Adele \| Coldplay` |
| `recommend <artist>` | Artists exactly 2 links away |
| `dashboard`, `help`, `demo`, `exit` | Show everything, show commands, automatic tour, quit |

A short session to try:

```
next
queue S7
playnext        # plays Despacito; the playlist position does not move
back            # replays the song you heard before
search Be
relate Adele | Coldplay
recommend Ed Sheeran
```

> **Note:** the `java -cp bin ...` line is typed in the normal terminal to *start* the program. Once you see `tunewave>`, only the short commands above work there. Type `exit` to leave.

---

## 🚀 Setup & Execution Instructions

### Prerequisites
- Java JDK 17+ (JDK 21 or higher recommended, tested on Java 26)

### 1. Compile the Project
From the repository root or `submission/ClaudeBuster`:
```powershell
cd submission/ClaudeBuster
.\build.bat
```
Or manually using `javac`:
```powershell
javac -d bin src/tunewave/model/*.java src/tunewave/datastructures/*.java src/tunewave/player/*.java src/tunewave/demo/*.java src/tunewave/test/*.java
```

### 2. Run the Automated Test Suite
```powershell
.\test.bat
```
Or manually:
```powershell
java -cp bin tunewave.test.TuneWaveTest
```

### 3. Run the Interactive Console
```powershell
.\run.bat
```
> `run.bat` only builds if `bin\` is missing. After changing any `.java` file, run `.\build.bat` again.

For the automatic non-interactive tour:
```powershell
java -cp bin tunewave.demo.TuneWaveDemo --automated
```

---

## 🧪 Test Suite Results

All 21 test cases validate each milestone constraint and edge case:

```
=================================================
     TUNEWAVE CORE VERIFICATION TEST SUITE   
=================================================
 [PASS] M1: Add song and prevent duplicates via Hash Map
 [PASS] M1: Rejected duplicate ID does not leak into search
 [PASS] M1: Playlist forward navigation via next()
 [PASS] M1: next() with repeat OFF stays on last song and returns 'end'
 [PASS] M1: next() with repeat ON wraps to first song
 [PASS] M1: previous() navigation through doubly linked list
 [PASS] M1: removeSong removes node in O(1) and updates pointers
 [PASS] M1: removeSong adjusts current pointer when playing song removed
 [PASS] M1: toggleRepeat toggles state correctly
 [PASS] M2: Up Next queue plays BEFORE playlist continues
 [PASS] M2: addToUpNext rejects unknown song IDs
 [PASS] M2: Playing from Up Next does NOT move playlist position
 [PASS] M2: History keeps last 10 songs played and drops oldest
 [PASS] M2: back() replays top song and removes from history
 [PASS] M2: back() does NOT move playlist position
 [PASS] M3: BST insert and findSong by title
 [PASS] M3: prefixSearch returns matches in alphabetical order with subtree pruning
 [PASS] M3: Undirected artist graph relation addition
 [PASS] M3: recommendArtists returns artists exactly 2 links away
 [PASS] M3: recommendArtists excludes direct relations and self
 [PASS] M3: recommendArtists returns in alphabetical order
=================================================
TOTAL TESTS: 21 | PASSED: 21 | FAILED: 0
=================================================
```

---

## 👥 Team ClaudeBuster
- **Team Lead & Core Engineering:** Team ClaudeBuster
- **Repository:** `https://github.com/MariamAzeem/ClaudeBuster.git`
