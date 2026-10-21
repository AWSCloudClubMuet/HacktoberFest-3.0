# 🎵 TuneWave Music Player

The core of a music player app, built with classic data structures in Java.

## Features

| Milestone | Feature | Data Structure |
|-----------|---------|----------------|
| 1 | Playlist with next, previous, repeat | Doubly Linked List + Hash Map |
| 2 | Up Next queue and play history | Queue + Stack |
| 3 | Title search and artist recommendations | BST + Graph |

## How It Works

### Milestone 1: Playlist
- Songs are stored in a doubly linked list.
- A hash map (song ID to node) blocks duplicates and gives O(1) lookup.
- With repeat on, `next()` on the last song wraps to the first.
- With repeat off, `next()` stays on the last song and returns `"end"`.
- Removing the current song moves the position to the next song (or the previous one if it was last).

### Milestone 2: Up Next and History
- Songs in the Up Next queue play before the playlist continues.
- Playing from Up Next or history does not move the playlist position.
- History keeps the last 10 songs and drops the oldest.
- `back()` replays the top song and removes it from history.

### Milestone 3: Search and Recommendations
- Songs are stored in a BST keyed by title (case-insensitive).
- `prefixSearch` returns titles in alphabetical order and skips subtrees that cannot match.
- Artists form an undirected graph of "related" links.
- `recommendArtists` returns artists exactly two links away who are not already directly related, in alphabetical order.

## Operations

```
Playlist:    addSong(id)  removeSong(id)  next()  previous()  toggleRepeat()
Player:      addToUpNext(id)  playNext()  back()
SongIndex:   addSong(title, id)  findSong(title)  prefixSearch(prefix)
ArtistGraph: addRelation(a, b)  recommendArtists(artist)
```

## Run

Requires Java 8 or higher.

```bash
javac TuneWave.java
java TuneWave
```

Expected output:

```
All TuneWave tests passed
```

## Complexity

| Operation | Time |
|-----------|------|
| addSong, removeSong, lookup (playlist) | O(1) |
| next, previous | O(1) |
| addToUpNext, playNext, back | O(1) |
| findSong (BST) | O(h) |
| prefixSearch (BST) | O(h + k) |
| recommendArtists | O(V + E) |

`h` is the tree height and `k` is the number of matches.

## Project Structure

```
.
├── TuneWave.java
└── README.md
```

## Team

Built for the hackathon by Team TuneWave.