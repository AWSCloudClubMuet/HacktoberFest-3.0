# TuneWave Music Player (GitHub Issue #13)

A Java 17 music player core built without external dependencies (no Maven, Gradle, or external test runners). It implements playlist tracking, queueing, playback history, song search, and artist recommendations using custom data structures.

## Terminal Preview

![TuneWave Interactive Terminal Demo](./docs/demo.png)

The application includes an interactive console (`com.tunewave.Main`) preloaded with sample tracks and artist links for testing navigation, queuing, search, and recommendations.

## Data Structures and Complexity

| Component | Underlying Data Structure | Operations | Time Complexity | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Playlist Tracks | Custom Doubly Linked List (`SongNode`) | `next()`, `previous()` | $O(1)$ | Nodes store `prev` and `next` references for constant-time bidirectional movement and pointer unlinking. |
| Playlist Index | `HashMap<String, SongNode>` | `addSong()`, `removeSong()` | $O(1)$ average | Maps song IDs directly to linked list nodes, allowing $O(1)$ duplicate checks on insertion and direct unlinking on removal. |
| Up Next Queue | `ArrayDeque<Song>` | `addToUpNext()`, `playNext()` | $O(1)$ | FIFO queue. Songs in this queue play before the playlist resumes. |
| Playback History | `ArrayDeque<Song>` | `pushHistory()`, `back()` | $O(1)$ | Bounded LIFO stack (maximum 10 entries). Pushing an eleventh item drops the oldest entry in $O(1)$ time. |
| Song Search | Custom Binary Search Tree (`SongBST`) | `findSong()`, `prefixSearch()` | $O(\log n)$ average search, $O(k + m)$ prefix | Ordered by title. In-order traversal yields alphabetical results. Prefix searches skip subtrees that cannot match based on lexicographical bounds. Stores duplicate titles via a list of IDs per node. |
| Artist Network | Undirected Graph (`ArtistGraph`) | `addRelation()`, `recommendArtists()` | $O(1)$ add, $O(V + E)$ recommendations | Adjacency list modeling mutual artist collaborations. Recommends artists exactly two links away, excluding the artist and direct neighbors, sorted alphabetically. |

## Core Architecture and Rules

### Milestone 1: Playlist
- Each song can appear only once in the playlist. The hash map validates incoming IDs in $O(1)$ before touching linked list pointers.
- When repeat is off, calling `next()` at the end of the playlist stays on the last song and returns `"end"`.
- When repeat is on, calling `next()` on the tail wraps around to the head. Calling `previous()` on the head wraps to the tail.
- Removing the current song moves the cursor to `next`. If the tail was removed, the cursor falls back to `prev`. If the playlist becomes empty, the cursor resets to `null`.

### Milestone 2: Up Next and Playback History
- The Up Next queue has higher priority than the playlist. Calling `playNext()` polls the queue first until it is empty.
- Playing from the Up Next queue or pressing `back()` does not change the playlist position. When the queue finishes, the playlist continues from where it was paused.
- The history stack records up to 10 recently played songs. When history exceeds 10 entries, the oldest song is removed.
- `back()` pops the most recent song from history and replays it. It does not push the replaced song back into history.

### Milestone 3: Song Search and Related Artists
- Song titles are indexed in a custom binary search tree. Duplicate titles (such as covers or tracks with identical names by different artists) append their IDs to the existing node rather than overwriting it.
- `prefixSearch(prefix)` traverses the tree in-order to return matches alphabetically. If a node is lexicographically smaller or larger than the prefix, the search prunes the impossible subtree.
- Collaborations are stored as undirected edges in an adjacency list (`A <-> B`). Self-relations are rejected.
- `recommendArtists(artist)` collects artists two hops away. Direct neighbors (one hop) and the artist (zero hops) are excluded. Results are deduplicated and sorted alphabetically.

## Building and Running

The project runs on standard Java 17 or higher.

### 1. Compile
```bash
mkdir -p bin
javac -d bin src/main/java/com/tunewave/*.java src/test/java/com/tunewave/*.java
```

### 2. Run the Interactive Player
```bash
java -cp bin com.tunewave.Main
```

### 3. Run the Automated Tests (49 Tests)
```bash
java -cp bin com.tunewave.TestRunner
```

## Interactive Console Controls

When running `com.tunewave.Main`, you can type commands or numbers:

| Command | Shortcut | Description | Example |
| :--- | :---: | :--- | :--- |
| `play` | `1` | Play next song (queue first, then playlist) | `play` |
| `back` | `2` | Replay previous song from history | `back` |
| `next` | `3` | Move forward in playlist | `next` |
| `prev` | `4` | Move backward in playlist | `prev` |
| `queue` | `5` | Add song to Up Next by ID | `queue S99` |
| `search` | `6` | Search exact title in BST | `search Borderline` |
| `prefix` | `7` | Search titles by prefix alphabetically | `prefix Bo` |
| `rec` | `8` | Recommend artists two links away | `rec The Weeknd` |
| `add` | `9` | Add a new song to playlist and search tree | `add` |
| `repeat` | `10` | Toggle repeat mode on or off | `repeat` |
| `status` | `11` | Print current playback, cursor, queue, and history | `status` |
| `demo` | `12` | Run automated demo walkthrough | `demo` |
| `exit` | `0` | Quit the application | `exit` |

## Edge Cases Handled

- **Duplicate song IDs**: Rejected in $O(1)$ time via map lookup before modifying node pointers.
- **Current track deletion**: Safely advances the playlist cursor to `node.next`, or falls back to `node.prev` if deleting the tail.
- **Repeat boundary transitions**: Repeat off stays at the boundary and returns `"end"`; repeat on wraps between head and tail.
- **Queue and cursor independence**: Queue playback and history replays leave the playlist position untouched.
- **Subtree pruning boundaries**: Pruning uses prefix lexicographical checks. For instance, a root named `"Apple"` does not discard a right child named `"Banana"` when searching for prefix `"Ba"`.
- **Graph cycles and multi-path duplicates**: Diamond connections and shared secondary neighbors are deduplicated. Direct neighbors are excluded even if reachable through an alternate two-hop path.
- **Automated verification**: 49 tests in `TestRunner.java` verify every stated rule and operation.
