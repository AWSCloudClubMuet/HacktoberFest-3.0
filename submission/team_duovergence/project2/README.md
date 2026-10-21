# TuneWave Music Player (Java)

A Java implementation of the three milestones in the official TuneWave Music Player challenge:

https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/13

## Requirements

- Java JDK 17 or newer (JDK 21 is fine)
- No external libraries are required

## Run

Open a terminal in this folder and run:

```bash
javac TuneWave.java
java TuneWave
```

On Windows, use PowerShell or Command Prompt. Make sure `java -version` and `javac -version` work first.

## Implemented requirements

### Milestone 1 — Playlist

- Custom doubly linked list (`previous` and `next` pointers)
- `HashMap<String, Node>` for song-ID-to-node lookup
- Duplicate song IDs are rejected from the playlist
- `addSong(song)`, `removeSong(songId)`, `next()`, `previous()`, `toggleRepeat()`
- With repeat on, moving forward from the last song wraps to the first
- With repeat off, `next()` at the end returns `"end"` and leaves the current song at the tail

### Milestone 2 — Up Next and History

- FIFO queue for Up Next
- Queue songs are played before advancing the playlist
- Playing a queued song does not move the playlist pointer
- A bounded stack stores up to the last 10 previous songs
- `back()` pops and replays the newest history entry without moving the playlist pointer

### Milestone 3 — Search and Artist Recommendations

- Binary search tree keyed by song title
- Exact title search
- Prefix search returns matches in alphabetical order and prunes irrelevant branches
- Undirected artist graph
- `recommendArtists(artist)` returns artists exactly two links away, excluding the artist itself and direct neighbors, alphabetically

## Design notes

- This is the required **player core**, not an audio streaming app. It models songs and playback decisions without playing MP3 files.
- Song metadata is held in a small in-memory library for the demonstration. Playlist membership is separate from the library so a queued song can be known even if it is not in the playlist.
- The demo uses sample songs and artists; replace them with your own data if you want.
- The challenge issue doesn't require a GUI, network streaming, accounts, or a database.

## Quick manual checks

When running the program, check that:

1. Adding the same song ID to the playlist twice returns `false`.
2. `next()` and `previous()` move through the playlist.
3. With repeat enabled, moving forward at the last song wraps to the first.
4. A queued song plays before the playlist advances, and queue playback doesn't change the playlist's current pointer.
5. History never contains more than 10 entries.
6. `prefixSearch("G")` returns titles beginning with G in alphabetical order.
7. An artist recommendation is two edges away and is not already a direct neighbor.

## Suggested improvements if you have extra time

- Add automated unit tests.
- Add a menu-driven console interface.
- Persist songs/playlists to a file.
- Add a GUI only after the required DSA operations are tested.
