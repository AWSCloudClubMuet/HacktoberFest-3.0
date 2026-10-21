# Code-Slayers — Milestone 3: Song Search and Related Artists

## Overview

This module implements **Milestone 3** of the Code-Slayers hackathon project using two data structures:

- **Binary Search Tree (BST):** stores songs by title and supports case-insensitive prefix searches in alphabetical order.
- **Undirected Graph:** stores relationships between artists and recommends artists exactly two links away who are not already directly related.

This README documents the implementation steps completed in the current Milestone 3 code. It does not claim that Milestones 1 and 2 or full-project integration are complete.

## My Responsibilities

I am responsible for **Milestone 3 — Song Search and Related Artists**. The other two team members are responsible for:

- **Milestone 1:** Playlist using a Doubly Linked List and Hash Map.
- **Milestone 2:** Up Next and History using a Queue and Stack.

## Implementation Steps

### 1. Created a shared `Song` model

Added a minimal `Song` class with:

- `id`: unique song identifier.
- `title`: song title.
- `artist`: artist name.

The BST uses the song title as its search key and retains the `Song` object in each node. If the project already has a shared `Song` model, this minimal class can be removed and the existing model used instead.

### 2. Implemented the BST node

Created `_BSTNode` with:

- `key`: lowercased song title used for case-insensitive ordering.
- `songs`: list of songs with the same case-insensitive title.
- `left` and `right`: child-node references.

Keeping multiple songs in one node allows different songs or artists to share the same title.

### 3. Implemented `SongSearchTree`

The tree provides the following operations:

| Method | Purpose |
|---|---|
| `insert(song)` | Inserts a `Song` object into the BST by title. |
| `addSong(title, songId)` | Convenience method that creates a minimal `Song` and inserts it. |
| `findSong(title)` | Finds an exact title and returns the first stored song ID, or `None` if absent. |
| `findSongs(title)` | Returns all `Song` objects with the exact title, or an empty list. |
| `prefixSearch(prefix)` | Returns matching titles in alphabetical order. |
| `prefixSearchSongs(prefix)` | Returns matching `Song` objects in alphabetical order by title. |
| `removeSong(title, songId)` | Removes the song matching the title and ID; deletes the BST node if it becomes empty. |
| `inOrder()` | Returns all stored song titles in alphabetical order. |

### 4. Added efficient prefix searching

The `prefixSearch()` method uses a recursive helper, `_prefix()`, to traverse only subtrees that may contain a matching title prefix.

- If a node's key is smaller than the prefix, the left subtree is skipped.
- If a node's key starts with the prefix, the method traverses left, records the node's titles, then traverses right.
- Otherwise, when the node's key is greater than the prefix and does not match, the right subtree is skipped.

The in-order traversal of matching nodes returns results in alphabetical order. Comparisons are case-insensitive because keys and the search prefix are converted to lowercase.

### 5. Implemented song removal

`removeSong(title, songId)` finds the title node, removes only the matching song ID, and returns:

- `True` when a song is removed.
- `False` when the title or song ID is not found.

If the node has no songs left, `_delete()` removes the node from the BST. The deletion helper handles nodes with zero, one, or two children; for two children, it uses the in-order successor.

### 6. Implemented `ArtistGraph`

The graph uses an adjacency dictionary where each artist maps to a set of directly related artists.

| Method | Purpose |
|---|---|
| `addArtist(name)` | Adds an artist, including an artist with no relationships. |
| `addRelation(a, b)` | Adds a relationship in both directions. Self-links are ignored. |
| `recommendArtists(artist)` | Returns eligible artists exactly two links away, in alphabetical order. |

Sets prevent duplicate relationships. Since the graph is undirected, adding a relationship between A and B also makes B related to A.

### 7. Implemented two-link artist recommendations

`recommendArtists(artist)`:

1. Gets the artist's direct neighbors.
2. Visits each direct neighbor's neighbors.
3. Excludes the original artist.
4. Excludes artists already directly connected to the original artist.
5. Uses a set to remove duplicate recommendations reached through multiple paths.
6. Sorts the remaining names alphabetically.

If the artist is unknown or has no eligible recommendations, the method returns an empty list.

### 8. Added a self-test

The `_selftest()` function tests the BST and graph functionality. It includes checks for:

- Alphabetical in-order output.
- Case-insensitive prefix search.
- No matching prefixes.
- Empty-prefix behavior.
- Exact title lookup and missing titles.
- Retrieving all songs with the same title.
- Adding and removing songs.
- Case-insensitive matching after insertion.
- Two-link artist recommendations and alphabetical ordering.
- Isolated and unknown artists.
- Ignoring a self-relationship.

The test code prints `All Milestone 3 checks passed.` if every assertion succeeds.

## How to Run

1. Save the implementation in a file named `milestone3.py`.
2. Open a terminal in the folder containing the file.
3. Run:

```bash
python milestone3.py
```

On some systems, use `python3 milestone3.py` or `py milestone3.py`.

The code uses Python's standard language features and does not require third-party packages.

## Example Usage

```python
from milestone3 import Song, SongSearchTree, ArtistGraph

# Song title search
tree = SongSearchTree()
tree.insert(Song(1, "Blinding Lights", "The Weeknd"))
tree.insert(Song(2, "Bad Guy", "Billie Eilish"))
tree.insert(Song(3, "Save Your Tears", "The Weeknd"))

print(tree.prefixSearch("s"))
# ['Save Your Tears']

# Artist recommendations
graph = ArtistGraph()
graph.addRelation("The Weeknd", "Dua Lipa")
graph.addRelation("Dua Lipa", "Ed Sheeran")

print(graph.recommendArtists("The Weeknd"))
# ['Ed Sheeran']
```

## Integration Notes

- Keep the BST and graph in a module that the rest of the application can import.
- Confirm with the team which shared `Song` model and song ID format the project uses.
- Milestone 1 may use song IDs for playlist operations; use a consistent ID convention across the project.
- Artist relationships must be populated from the project's data or another agreed source before recommendations are useful.
- This module currently contains data-structure logic and a self-test; it does not by itself provide a graphical user interface, persistent database, or external music-catalog integration.

## Status

- [x] BST structure and title insertion
- [x] Case-insensitive prefix search with subtree pruning
- [x] Exact title lookup
- [x] Retrieval of songs sharing a title
- [x] Song removal and BST node deletion
- [x] Undirected artist relationship graph
- [x] Two-link artist recommendations with filtering and alphabetical sorting
- [x] Self-test assertions added
- [ ] Confirmed integration with the team's complete application
- [ ] End-to-end testing with Milestones 1 and 2

## Milestone 3 Summary

Milestone 3 provides song-title search through a Binary Search Tree and related-artist recommendations through an undirected graph. A self-test is included to validate the implemented behavior. Full integration remains a team task once the playlist and queue/history modules are ready.
