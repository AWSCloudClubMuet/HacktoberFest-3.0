# TuneWave Music Player (Issue #13)

Core data structures and algorithms powering the TuneWave music streaming player. Built in standard Java 17 with zero external dependencies.

## Data Structures Used

1. **Playlist (Doubly Linked List + HashMap)**
   - Custom `SongNode` links songs bidirectionally (`next()`, `previous()`).
   - `HashMap<String, SongNode>` enables O(1) song lookup by ID, preventing duplicate songs and allowing direct node removal without scanning.
   - Cursor tracks the current song. When repeat is OFF at the end, `next()` stays at the last song and returns `"end"`. When repeat is ON, it wraps between head and tail.

2. **Up Next & Playback History (Queue + Stack)**
   - `ArrayDeque<Song>` as a FIFO queue for Up Next songs.
   - `ArrayDeque<Song>` as a bounded LIFO stack (max 10 songs) for playback history.
   - Playing from Up Next or history never moves the playlist cursor.
   - `back()` replays the top song from history and removes it without pushing the replaced song back.

3. **Song Search & Related Artists (BST + Graph)**
   - Custom Binary Search Tree (`SongBST`) keyed by song title. Supports duplicate titles by storing lists of song IDs per title.
   - `prefixSearch(prefix)` performs in-order traversal (alphabetical) and prunes irrelevant subtrees based on BST ordering.
   - Undirected graph (`ArtistGraph`) using adjacency lists to model artist relationships.
   - `recommendArtists(artist)` suggests artists exactly 2 edges away, excluding the artist themselves and any direct neighbors, sorted alphabetically.

## How to Build and Run

No Maven or Gradle required. Compile and run directly with standard Java:

### Compile
```bash
mkdir -p bin
javac -d bin src/main/java/com/tunewave/*.java src/test/java/com/tunewave/*.java
```

### Run Tests
```bash
java -cp bin com.tunewave.TestRunner
```

### Run Demo
```bash
java -cp bin com.tunewave.Main
```

## Handled Edge Cases
- **Duplicate ID rejection**: Rejects duplicate IDs in O(1) before touching playlist pointers.
- **Current song removal**: When removing the active track, cursor advances to `next` (or falls back to `prev` if removing the tail, or `null` if playlist becomes empty).
- **Subtree pruning**: Subtrees are pruned based on lexicographical order, without prematurely discarding matching subtrees.
- **Artist graph cycles & diamonds**: Graph recommendations avoid cycles, duplicate recommendations from multiple paths, and triangle shortcuts.
