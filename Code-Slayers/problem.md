📍 Milestones & Subtasks
🧩 Milestone 1 — Playlist (Doubly Linked List + Hash Map)

Problem:

Users move forward and back through a playlist and add or remove songs while it plays.

Rules:

    A song can appear only once in a playlist; a hash map from song ID to node checks this and finds songs without scanning.
    With repeat on, next() on the last song wraps to the first. With repeat off, it stays on the last song and returns "end".

Required operations:

addSong(song)
removeSong(songId)
next()
previous()
toggleRepeat()

🧩 Milestone 2 — Up Next and History (Queue + Stack)

Problem:

Users queue songs to play next and go back to songs they just heard.

Rules:

    Songs in the Up Next queue play before the playlist continues.
    Playing from Up Next or history does not move the playlist position.
    History keeps the last 10 songs played and drops the oldest.
    back() replays the top song and removes it from history.

Required operations:

addToUpNext(songId)
playNext()
back()

🧩 Milestone 3 — Song Search and Related Artists (BST + Graph)

Problem:

Users search songs by title, and the app suggests artists they have not yet linked to.

Rules:

    Store songs in a BST keyed by title.
    prefixSearch returns matching titles in alphabetical order and skips subtrees that cannot match.
    Artists form an undirected graph of "related" links.
    recommendArtists returns artists exactly two links away who are not already directly related, in alphabetical order.
