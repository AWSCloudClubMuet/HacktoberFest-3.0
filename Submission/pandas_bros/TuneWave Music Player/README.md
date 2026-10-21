# 🎵 TuneWave Music Player Core

The core data structures of **TuneWave**, a music streaming app: a playlist, an Up Next queue, a play history, song search, and artist recommendations. Each milestone is a standalone Python file with its own tests.

| Milestone | File | Data structures | Features |
| --- | --- | --- | --- |
| 1 | `Milestone_1.py` | Doubly linked list + hash map | Playlist with next/previous, repeat, add/remove |
| 2 | `Milestone_2.py` | Queue + stack | Up Next queue and play history |
| 3 | `Milestone_3.py` | Binary search tree + graph | Title search and related-artist recommendations |

## Requirements

- Python 3.7+ (Milestone 1 uses `dataclasses`)
- No third-party packages

## Running

Each file runs its own tests when executed directly:

```bash
python Milestone_1.py   # prints "All Milestone 1 tests passed."
python Milestone_2.py   # runs 12 unittest cases, then prints a step-by-step demo
python Milestone_3.py   # prints "All Milestone 3 tests passed."
```

To use a milestone in your own code, import the class from the file (for example `from Milestone_1 import Playlist, Song`).

---

## Milestone 1: Playlist (Doubly Linked List + Hash Map)

**Classes:** `Song(id, title, artist)`, `Playlist`

A doubly linked list keeps the playlist order, so moving forward and back is O(1). A hash map from `songId` to node enforces "a song appears only once" and finds songs without scanning.

| Operation | Behavior | Time |
| --- | --- | --- |
| `addSong(song)` | Appends to the end. Returns `False` if the song ID already exists. | O(1) |
| `removeSong(songId)` | Looks up the node in the hash map and unlinks it. Returns `False` if not found. | O(1) |
| `next()` | Moves forward. On the last song: wraps to the first if repeat is on, otherwise stays put and returns `"end"`. | O(1) |
| `previous()` | Moves back. On the first song: stays put and returns `"start"`. | O(1) |
| `toggleRepeat()` | Flips repeat on/off and returns the new value. | O(1) |

Helpers: `current`, `repeat`, `to_list()`, `len(playlist)`.

**Choices not fixed by the spec:**
- `previous()` on the first song returns `"start"`. The spec only defines the end behavior for `next()`.
- Removing the song that is currently playing moves to the next song, or to the previous one if it was last. The playlist has no current song once it is empty.

---

## Milestone 2: Up Next and History (Queue + Stack)

**Class:** `MusicPlayer(playlist, history_limit=10)`

| Operation | Behavior | Time |
| --- | --- | --- |
| `addToUpNext(songId)` | Adds a song to the back of the Up Next queue (FIFO). | O(1) |
| `playNext()` | Plays the front of Up Next if there is one, otherwise the next playlist song. Returns the song ID, or `None` if nothing is left. | O(1) |
| `back()` | Replays the most recent song in history and removes it from history. Returns `None` if history is empty. | O(1) |

**Rules and how they are met:**
- **Up Next plays first:** `playNext()` drains the queue before touching the playlist.
- **Playlist position is untouched by Up Next and history:** only playlist plays advance `playlist_pos`, so the playlist resumes where it left off.
- **History keeps the last 10 songs:** it is a `deque(maxlen=10)`, which drops the oldest automatically.

**Choices not fixed by the spec:**
- The song playing right now (`current`) is not in history. It goes onto history when `playNext()` replaces it, so `back()` returns to the previous song rather than replaying the current one.
- `back()` does not push the song you are leaving onto history. A replayed song returns to history when you move on from it.
- Up Next may contain the same song more than once.
- This milestone takes a plain list of song IDs. It does **not** use the `Playlist` class from Milestone 1.

---

## Milestone 3: Song Search and Related Artists (BST + Graph)

### `SongIndex` (binary search tree keyed by title)

| Operation | Behavior | Time |
| --- | --- | --- |
| `addSong(title, songId)` | Inserts a song. Adding an existing title updates its `songId`. | O(h) |
| `findSong(title)` | Returns the `songId` for a title, or `None`. | O(h) |
| `prefixSearch(prefix)` | Returns matching titles in alphabetical order. | O(h + k) |

`h` is the tree height and `k` is the number of matches. The tree is not self-balancing, so `h` can reach `n` if titles are inserted in sorted order.

`prefixSearch` uses an in-order traversal for alphabetical output and skips subtrees that cannot match. If a node's title does not start with the prefix, then every title that does start with it lies entirely on one side, so only that side is searched.

### `ArtistGraph` (undirected graph)

| Operation | Behavior |
| --- | --- |
| `addRelation(artistA, artistB)` | Adds an undirected "related" link. Self-links are ignored. |
| `recommendArtists(artist)` | Returns artists exactly two links away who are not already directly related, in alphabetical order. Returns `[]` for an unknown artist. |

**Choices not fixed by the spec:**
- Title matching is case-insensitive (`findSong("hello")` finds "Hello"). Results keep their original casing.
- Re-adding an existing title replaces its `songId` instead of creating a duplicate.

---

## Tests

- **Milestone 1:** assert-based checks covering duplicates, wrap-around, `"end"`, removal of current and last songs, and re-adding a removed song.
- **Milestone 2:** 12 `unittest` cases covering queue order, playlist position, history limit and ordering, and empty states, followed by a printed demo.
- **Milestone 3:** assert-based checks covering search, prefix pruning, empty prefix and empty tree, duplicate titles, and two-link recommendations.

All three files passed when last run.