# TuneWave Music Player

TuneWave is the core of a music streaming app, built for a hackathon. It uses a doubly linked list, hash map, queue, stack, binary search tree (BST) and graph to power a playlist, an Up Next queue, play history, song search and artist recommendations. A small web UI is included to demonstrate everything.

##  Getting Started

Requirements: [Node.js](https://nodejs.org/) 16 or newer. There are no external dependencies.

```bash
# Run the automated tests
npm test

# Start the app, then open http://localhost:3000
npm start
```

##  Project Structure

```
├── server.js          # HTTP server, playback state and timer, REST API
├── playlist.js        # Milestone 1: doubly linked list + hash map
├── musicPlayer.js     # Milestone 2: Up Next queue + history stack
├── songSearch.js      # Milestone 3: BST for title search
├── artistGraph.js     # Milestone 3: graph for artist recommendations
├── index.js           # Small console demo
├── test.js            # Automated tests for all milestones
└── public/            # Web UI (index.html, app.js, style.css)
```

##  Milestones and Data Structures

### Milestone 1: Playlist (Doubly Linked List + Hash Map)

- Songs are stored in a **doubly linked list**, so moving forward and back is O(1).
- A **hash map** (`songId → node`) rejects duplicates and finds songs without scanning.
- `next()` on the last song wraps to the first when repeat is on. With repeat off, it stays on the last song and returns `"end"`.

| Operation | Time |
|---|---|
| `addSong(song)` | O(1) |
| `removeSong(songId)` | O(1) |
| `next()` / `previous()` | O(1) |
| `toggleRepeat()` | O(1) |

### Milestone 2: Up Next and History (Queue + Stack)

- **Up Next** is a FIFO **queue** of song IDs. Queued songs play before the playlist continues.
- **History** is a **stack** that keeps the last 10 songs played and drops the oldest.
- `back()` replays the top song of history and removes it from the stack.
- Playing from Up Next or history **does not move the playlist position**.
- Songs removed from the playlist after being queued are skipped.

| Operation | Time |
|---|---|
| `addToUpNext(songId)` | O(1) |
| `playNext()` | O(1) typical* |
| `back()` | O(1) |
| `saveToHistory(song)` | O(1)* |

\* The queue and stack are backed by JavaScript arrays. `shift()` is O(n) in theory, but the history is capped at 10 items and the queue is small, so the cost is effectively constant. A linked-list queue would make it strictly O(1).

### Milestone 3: Song Search and Related Artists (BST + Graph)

- Songs are stored in a **BST keyed by title** (case-insensitive).
- `prefixSearch` returns matching titles in alphabetical order (in-order traversal) and **skips subtrees that cannot match**.
- Artists form an **undirected graph** (adjacency list) of "related" links.
- `recommendArtists` returns artists **exactly two links away** who are **not already directly related**, in alphabetical order.

| Operation | Time |
|---|---|
| `addSong(title, songId)` | O(h) |
| `findSong(title)` | O(h) |
| `prefixSearch(prefix)` | O(h + k) |
| `addRelation(a, b)` | O(1) |
| `recommendArtists(artist)` | O(d² + k log k) |

`h` is the tree height (about log n on average, n in the worst case for an unbalanced tree), `k` is the number of results, and `d` is the number of direct connections.

##  API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/state` | Current playback state, playlist, queue, history and recommendations |
| GET | `/api/search?q=ye` | BST prefix search (returns title and song ID) |
| POST | `/api/action` | Body: `{ "action": "...", "id": ... }` |

Supported actions: `play`, `toggle`, `next`, `previous`, `queue`, `repeat`, `seek`, `back`.

##  Demo Walkthrough

1. Click a song to play it, then click **+ Queue** on another song.
2. Press **next**. The queued song plays first, and the playlist position does not move.
3. Press **next** again. The playlist continues from where it was.
4. Press **⟲** to replay the last song from history (the stack).
5. Turn on **↻ repeat** and let the last song finish. The playlist wraps to the first song.
6. Type `ye` in search to see BST prefix results in alphabetical order.
7. Play a song to see **Artist connections**, which are artists two links away.

##  Tests

`npm test` checks:

- No duplicate songs, and `next()` behavior with repeat on and off
- Removing the head, middle and tail of the playlist
- Up Next order (FIFO) and playlist position staying unchanged
- History limit of 10 and `back()` behavior
- BST `findSong` and alphabetical `prefixSearch`, including no matches
- Graph recommendations that are exactly two links away, exclude direct relations, and are sorted

##  Team

Team DevNova
