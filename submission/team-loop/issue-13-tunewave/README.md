# TuneWave Music Player

Our Python solution for issue 13 covers the playlist, Up Next queue, history,
song search and artist recommendations in [TASK.md](TASK.md). It models playback
without playing audio files. Use Python 3.11 or later; no extra packages are needed.

## Run it

From the repository root:

```powershell
python submission/team-loop/issue-13-tunewave/demo.py
python -m unittest discover -s submission/team-loop/issue-13-tunewave -v
```

The demo shows every required operation. All 30 tests passed on Python 3.11.9.
They cover navigation, removal, repeat, queue order, history, search and artist
recommendations, including empty inputs and duplicate songs.

## How it works

`player.py` contains the song record and four main classes:

1. `Playlist` uses a doubly linked list and a dictionary from song ID to node.
   It supports `addSong(song)`, `removeSong(songId)`, `next()`, `previous()` and
   `toggleRepeat()`. A song ID can appear only once in the playlist.
2. `MusicPlayer` connects the parts. `addSong(song)` adds to the catalog and
   playlist. `registerSong(song)` adds to the catalog only. `addToUpNext(songId)`
   queues a registered song. `playNext()` plays queued songs before continuing
   the playlist. History is a stack limited to ten entries. `back()` pops and
   replays the latest entry without adding it again.
3. `SongSearch` uses a BST ordered by title. Its separate `addSong(title, songId)`
   adds a search entry. `findSong(title)` returns matching IDs as a tuple, or
   `None`. `prefixSearch(prefix)` returns matching titles in alphabetical order
   and skips branches outside the prefix range.
4. `ArtistGraph` stores undirected links in sets. `addRelation(a, b)` links two
   artists. `recommendArtists(artist)` returns artists exactly two links away,
   excluding the starting artist and direct neighbors, in alphabetical order.

Use the player's `addSong` or `registerSong` to make songs playable. Adding an
entry directly to `player.search` changes only the search index. Artist links
are added explicitly rather than inferred from songs.

## Playback choices

The first `next()` selects the first song; the first `previous()` selects the
last. Empty navigation returns `None`. With repeat off, moving past the last
song returns `"end"` and keeps the cursor there. Moving before the first returns
`"start"`. With repeat on, navigation wraps in both directions.

Removing the current song moves the cursor to its predecessor, or clears it if
the first song was removed. The next advance then selects the successor. If the
last song was removed, the next advance returns `"end"` unless repeat is on.
Removing another song leaves the cursor alone.

Queue playback and history replay never move the playlist cursor. Repeated queue
entries are allowed. Removing a playlist song leaves it in the catalog, queue,
history and `nowPlaying`. It can be added again with the same metadata.

History records successful `playNext()` calls, including the latest song. The
first `back()` therefore replays that song and removes its history entry, as the
task specifies. Empty history returns `None`. Direct playlist navigation only
selects a song; it does not record playback. Reaching `"end"` or an empty playlist
does not change `nowPlaying` or history.

Missing IDs raise `KeyError`. Duplicate IDs and conflicting song metadata raise
`ValueError`. Different songs can share a title; prefix results list each title
once. Titles and artist names are case sensitive. An empty prefix matches all
titles. Unknown artists return an empty list, repeated links have no effect,
and self links are rejected. Song fields and artist names must be nonblank strings.

## Efficiency

Playlist add, removal and navigation take O(1), using expected constant time
dictionary access. Queue operations, playback and history replay also take O(1).
The playlist uses O(n) space, the queue O(q), and history holds at most ten songs.

BST insertion takes O(h), where h is tree height. Finding a title takes O(h + m)
when m matching IDs are returned. Prefix search takes O(h + k) for k matching
titles and uses O(h + k) extra space. These bounds count tree operations; string
comparisons also depend on title length. The tree is not balanced, so its height
can reach the number of distinct titles. Traversal is iterative to avoid recursion
limits. The catalog and index use O(c) space for c songs.

Artist links take expected O(1) to add. Recommendations inspect the starting
artist's neighbors and their links, then sort the candidates. For d direct
neighbors, L links inspected and r candidates, this takes O(d + L + r log r).
The graph uses O(V + E) space and recommendations use at most O(V) extra space.

The core has no file storage or support for concurrent updates. Public attributes
are available for inspection; normal changes should use the methods.
