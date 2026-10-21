# 🎵 TuneWave Music Player

## 🎯 Goal

Build the core of a music player app using a **linked list, hash map, queue, stack, binary search tree (BST), and graph** under simple playback rules.

## 🏢 Scenario: TuneWave Music Streaming

You are on the engineering team at TuneWave, a new music streaming app. The player needs a playlist, an Up Next queue, a play history, a song search, and artist recommendations.

---

## 📦 What is in this project

| File | Purpose |
|---|---|
| `PlaylistManager.java` | **Milestone 1** on its own: playlist with `addSong`, `removeSong`, `next`, `previous`, `toggleRepeat` |
| `PlaybackManager.java` | **Milestones 1 + 2** together: playlist, Up Next queue and history, with `addToUpNext`, `playNext`, `back` |
| `DiscoveryEngine.java` | **Milestone 3**: song search (BST) and artist recommendations (graph) |
| `TuneWaveApp.java` | Desktop (Swing) app that combines all three milestones in one window |
| `web/index.html` | Browser version of the player with a modern, mobile-friendly UI and a different generated sound for every song |

The `.class` files in the folder are compiled copies of the `.java` files.

---

## 📍 Milestones and how each is solved

### 🧩 Milestone 1: Playlist (Doubly Linked List + Hash Map)

**Problem:** Users move forward and back through a playlist and add or remove songs while it plays.

**Rules**
- A song can appear only once in a playlist. A hash map from song ID to node checks this and finds songs without scanning.
- With repeat on, `next()` on the last song wraps to the first. With repeat off, it stays on the last song and returns `"end"`.

**Implementation:** each song is a node with `prev` and `next` pointers. A `HashMap<String, SongNode>` maps song ID to its node, so duplicate checks and removals do not scan the list.

| Operation | Method | Behavior |
|---|---|---|
| `addSong(song)` | `addSong(Song)` | Adds at the end. Returns `false` for a duplicate ID. |
| `removeSong(songId)` | `removeSong(String)` | Unlinks the node using the hash map. Returns `false` if the ID is unknown. |
| `next()` | `PlaylistManager.next()` | Moves forward. Wraps to the first song if repeat is on, otherwise returns `"end"` and stays on the last song. |
| `previous()` | `PlaylistManager.previous()` | Moves back. Wraps to the last song if repeat is on, otherwise returns `"end"`. |
| `toggleRepeat()` | `toggleRepeat()` | Flips repeat on or off. |

### 🧩 Milestone 2: Up Next and History (Queue + Stack)

**Problem:** Users queue songs to play next and go back to songs they just heard.

**Rules**
- Songs in the Up Next queue play before the playlist continues.
- Playing from Up Next or history does not move the playlist position.
- History keeps the last 10 songs played and drops the oldest.
- `back()` replays the top song and removes it from history.

**Implementation (in `PlaybackManager`)**
- **Up Next:** a first-in, first-out queue of song IDs, stored in an array that doubles when full.
- **History:** a last-in, first-out stack stored as a ring buffer of 10 slots. When it is full, a new push overwrites the oldest entry.
- The playlist pointer (`playlistCurrent`) is kept separate from the song that is playing (`activeTrack`), so queue and history plays never move the playlist position.

| Operation | Method | Behavior |
|---|---|---|
| `addToUpNext(songId)` | `addToUpNext(String)` | Adds to the back of the queue. Returns `false` if the song does not exist. |
| `playNext()` | `playNext()` | Pushes the current song to history. Plays the front of the queue if there is one, otherwise continues the playlist. Returns `"end"` at the end with repeat off. |
| `back()` | `back()` | Pops the top song from history and plays it. The playlist pointer does not move. |

### 🧩 Milestone 3: Song Search and Related Artists (BST + Graph)

**Problem:** Users search songs by title, and the app suggests artists they have not yet linked to.

**Rules**
- Store songs in a BST keyed by title.
- `prefixSearch` returns matching titles in alphabetical order and skips subtrees that cannot match.
- Artists form an undirected graph of "related" links.
- `recommendArtists` returns artists exactly two links away who are not already directly related, in alphabetical order.

**Implementation (in `DiscoveryEngine`)**
- **BST:** each node holds a title and a song ID. `prefixSearch` walks the tree. When a node does not match the prefix, it goes into only the one subtree that can contain matches. When a node does match, it searches both sides. The results are sorted alphabetically.
- **Graph:** a `Map<String, Set<String>>` adjacency list. `addRelation` adds the link in both directions.
- **Recommendations:** collect the neighbors of the artist's neighbors, remove the artist and anyone already directly related, then sort.

| Operation | Method | Behavior |
|---|---|---|
| `addSong(title, songId)` | `addSong(String, String)` | Inserts into the BST by title. |
| `findSong(title)` | `findSong(String)` | Exact lookup. Returns the song ID, or `null` if not found. |
| `prefixSearch(prefix)` | `prefixSearch(String)` | Returns matching titles in alphabetical order. An empty prefix returns an empty list. |
| `addRelation(artistA, artistB)` | `addRelation(String, String)` | Links the two artists both ways. Ignores null values and self-links. |
| `recommendArtists(artist)` | `recommendArtists(String)` | Artists exactly two links away who are not direct neighbors, sorted. Returns an empty list for an unknown artist. |

---

## ▶️ How to run

You need a JDK (Java Development Kit), version 8 or newer. Check with `java -version` and `javac -version`.

**1. Compile** (in the project folder):

```
javac *.java
```

If you see `UnsupportedClassVersionError`, the included `.class` files were built with a newer Java than yours. Running the command above rebuilds them for your version.

**2. Run a milestone demo** (each class has its own test `main`):

```
java PlaylistManager      # Milestone 1
java PlaybackManager      # Milestones 1 + 2
java DiscoveryEngine      # Milestone 3
```

**3. Run the desktop app:**

```
java TuneWaveApp
```

**4. Run the web player:** open `web/index.html` in a browser and press play. To try it on a phone, run `python -m http.server 8000` in the project folder and open `http://<your-computer-ip>:8000/web/` on the phone (same Wi-Fi).

### Example: `PlaybackManager` demo

The test adds Song A, Song B and Song C, then queues Song C. Following the code, the output shows:

| Step | Result |
|---|---|
| Start | Song A is playing |
| `addToUpNext("3")` then `playNext()` | Song C plays from the queue. The playlist pointer stays at Song A. |
| `playNext()` | Song B plays (the playlist continues) |
| `back()` | Song C plays again (taken from history) |
| `playNext()` | Song C plays (the playlist pointer was at Song B) |
| `playNext()` | `"end"` (last song, repeat off) |

This table is traced from the source code and its comments. Run the demo on your machine to see the real output.

---

## ⏱️ Complexity

| Operation | Time |
|---|---|
| Playlist `addSong`, `removeSong`, `next`, `previous`, `toggleRepeat` | O(1) |
| `addToUpNext` | O(1), occasionally O(n) when the array doubles |
| `playNext` from the queue | O(q) because the array shifts left, where q is the queue size |
| `playNext` from the playlist, `back` | O(1) |
| BST `addSong`, `findSong` | O(h), where h is the tree height (O(log n) when balanced) |
| `prefixSearch` | O(h + m log m), where m is the number of matches |
| `addRelation` | O(1) |
| `recommendArtists` | O(d²), where d is the number of neighbors |

---

## 📝 Notes

- Removing a song also removes it from history, and queued IDs of removed songs are skipped when they come up.
- Title search in the Java `DiscoveryEngine` is **case-sensitive** (`"Mid"` matches `"Midnight"` but `"mid"` does not). The web version lowercases titles so searches are not case-sensitive.
- The audio in the web player is a generated 30-second preview for each song. It is not real streaming.

## ✅ Expected deliverable

A working TuneWave music-player core that demonstrates all three milestones with their stated operations and rules.
