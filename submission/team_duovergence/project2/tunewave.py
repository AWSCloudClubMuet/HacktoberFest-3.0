"""
TuneWave Music Player core.

Milestone 1: Playlist          -> doubly linked list + hash map
Milestone 2: Up Next + History -> queue (deque) + stack (deque with maxlen)
Milestone 3: Search + Related  -> binary search tree + undirected graph
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import Hashable, Optional, Union

END = "end"      # returned by next() at the end of a playlist (repeat off)
START = "start"  # returned by previous() at the start of a playlist (repeat off)


@dataclass(frozen=True)
class Song:
    id: Hashable
    title: str
    artist: str = ""


# ---------------------------------------------------------------------------
# Milestone 1: Playlist (doubly linked list + hash map)
# ---------------------------------------------------------------------------
class _Node:
    __slots__ = ("song", "prev", "next")

    def __init__(self, song: Song):
        self.song = song
        self.prev: Optional[_Node] = None
        self.next: Optional[_Node] = None


class Playlist:
    """
    Doubly linked list holds the ORDER. Hash map (song id -> node) gives
    O(1) duplicate check, O(1) lookup and O(1) removal without scanning.

    `_current` is the node that is playing. None means "nothing playing yet"
    (before the first song).
    """

    def __init__(self) -> None:
        self._head: Optional[_Node] = None
        self._tail: Optional[_Node] = None
        self._index: dict[Hashable, _Node] = {}
        self._current: Optional[_Node] = None
        self.repeat = False

    def __len__(self) -> int:
        return len(self._index)

    def contains(self, song_id: Hashable) -> bool:
        return song_id in self._index

    def get(self, song_id: Hashable) -> Optional[Song]:
        node = self._index.get(song_id)
        return node.song if node else None

    @property
    def current(self) -> Optional[Song]:
        return self._current.song if self._current else None

    def songs(self) -> list[Song]:
        out, node = [], self._head
        while node:
            out.append(node.song)
            node = node.next
        return out

    # O(1)
    def addSong(self, song: Song) -> bool:
        """Append to the end. Returns False if the song is already in the playlist."""
        if song.id in self._index:
            return False
        node = _Node(song)
        if self._tail is None:
            self._head = self._tail = node
        else:
            node.prev = self._tail
            self._tail.next = node
            self._tail = node
        self._index[song.id] = node
        return True

    # O(1)
    def removeSong(self, song_id: Hashable) -> bool:
        node = self._index.pop(song_id, None)
        if node is None:
            return False
        # If the playing song is removed, step "back" one node, so the next
        # next() call plays the song that followed the removed one.
        if node is self._current:
            self._current = node.prev
        if node.prev:
            node.prev.next = node.next
        else:
            self._head = node.next
        if node.next:
            node.next.prev = node.prev
        else:
            self._tail = node.prev
        node.prev = node.next = None
        return True

    # O(1)
    def next(self) -> Union[Song, str]:
        if self._head is None:
            return END
        if self._current is None:           # nothing played yet -> first song
            self._current = self._head
            return self._current.song
        nxt = self._current.next
        if nxt is None:
            if not self.repeat:
                return END                  # stay on the last song
            nxt = self._head                # repeat on -> wrap to first
        self._current = nxt
        return nxt.song

    # O(1)
    def previous(self) -> Union[Song, str]:
        if self._current is None:
            return START
        prv = self._current.prev
        if prv is None:
            if not self.repeat:
                return START                # stay on the first song
            prv = self._tail                # repeat on -> wrap to last
        self._current = prv
        return prv.song

    def toggleRepeat(self) -> bool:
        self.repeat = not self.repeat
        return self.repeat


# ---------------------------------------------------------------------------
# Milestone 3: Song search (BST keyed by title)
# ---------------------------------------------------------------------------
class _BSTNode:
    __slots__ = ("key", "title", "song_id", "left", "right")

    def __init__(self, title: str, song_id: Hashable):
        self.key = title.casefold()         # case-insensitive ordering
        self.title = title
        self.song_id = song_id
        self.left: Optional[_BSTNode] = None
        self.right: Optional[_BSTNode] = None


class SongBST:
    """Unbalanced BST. Average O(log n); worst case O(n) if titles arrive sorted."""

    def __init__(self) -> None:
        self.root: Optional[_BSTNode] = None
        self._size = 0

    def __len__(self) -> int:
        return self._size

    def addSong(self, title: str, song_id: Hashable) -> None:
        """Insert. Same title again updates the song id (title is the key)."""
        new = _BSTNode(title, song_id)
        if self.root is None:
            self.root = new
            self._size = 1
            return
        node = self.root
        while True:
            if new.key == node.key:
                node.title, node.song_id = title, song_id
                return
            side = "left" if new.key < node.key else "right"
            child = getattr(node, side)
            if child is None:
                setattr(node, side, new)
                self._size += 1
                return
            node = child

    def findSong(self, title: str) -> Optional[Hashable]:
        key = title.casefold()
        node = self.root
        while node:
            if key == node.key:
                return node.song_id
            node = node.left if key < node.key else node.right
        return None

    def prefixSearch(self, prefix: str) -> list[str]:
        """
        Titles starting with `prefix`, alphabetical (in-order traversal).
        Subtrees that cannot contain a match are skipped:
          - left subtree is skipped if node.key < prefix (everything there is smaller)
          - right subtree is skipped if node.key >= prefix but does not start with it
            (node is already past the whole prefix range, everything right is bigger)
        """
        p = prefix.casefold()
        result: list[str] = []
        stack: list[_BSTNode] = []
        node = self.root
        while stack or node:
            while node:
                stack.append(node)
                node = node.left if node.key >= p else None
            node = stack.pop()
            matches = node.key.startswith(p)
            if matches:
                result.append(node.title)
            node = node.right if (matches or node.key < p) else None
        return result


# ---------------------------------------------------------------------------
# Milestone 3: Related artists (undirected graph, adjacency sets)
# ---------------------------------------------------------------------------
class ArtistGraph:
    def __init__(self) -> None:
        self._adj: dict[str, set[str]] = {}

    def addRelation(self, artistA: str, artistB: str) -> None:
        if artistA == artistB:
            return
        self._adj.setdefault(artistA, set()).add(artistB)
        self._adj.setdefault(artistB, set()).add(artistA)

    def related(self, artist: str) -> list[str]:
        return sorted(self._adj.get(artist, ()), key=lambda s: (s.casefold(), s))

    def recommendArtists(self, artist: str) -> list[str]:
        """Artists exactly 2 links away, not directly related, alphabetical."""
        direct = self._adj.get(artist, set())
        two_away: set[str] = set()
        for friend in direct:
            two_away |= self._adj[friend]
        two_away -= direct
        two_away.discard(artist)
        return sorted(two_away, key=lambda s: (s.casefold(), s))


# ---------------------------------------------------------------------------
# Milestone 2: Up Next (queue) + History (stack), tied to the playlist
# ---------------------------------------------------------------------------
class TuneWave:
    HISTORY_LIMIT = 10

    def __init__(self, history_limit: int = HISTORY_LIMIT) -> None:
        self.playlist = Playlist()
        self.search = SongBST()
        self.artists = ArtistGraph()
        self.up_next: deque[Hashable] = deque()                  # queue: FIFO
        self.history: deque[Song] = deque(maxlen=history_limit)  # stack: top = right end
        self.now_playing: Optional[Song] = None

    # ----- Milestone 2 -----
    def addToUpNext(self, song_id: Hashable) -> bool:
        """Enqueue a song (must exist in the playlist hash map)."""
        if not self.playlist.contains(song_id):
            return False
        self.up_next.append(song_id)
        return True

    def playNext(self) -> Union[Song, str]:
        """
        Up Next songs play first (FIFO). If the queue is empty, the playlist
        continues via playlist.next(). Playing from Up Next does NOT move the
        playlist position.
        """
        while self.up_next:
            song = self.playlist.get(self.up_next.popleft())
            if song is not None:             # skip songs removed after queuing
                return self._play(song)
        nxt = self.playlist.next()
        if nxt == END:
            return END
        return self._play(nxt)

    def previous(self) -> Union[Song, str]:
        """Playlist 'previous' button (moves the playlist position)."""
        prv = self.playlist.previous()
        if prv == START:
            return START
        return self._play(prv)

    def back(self) -> Optional[Song]:
        """
        Replay the top song of history and remove it from history.
        Does not move the playlist position and is not re-added to history.
        Returns None if history is empty.
        """
        if not self.history:
            return None
        self.now_playing = self.history.pop()
        return self.now_playing

    def _play(self, song: Song) -> Song:
        self.now_playing = song
        self.history.append(song)   # deque(maxlen=10) drops the oldest automatically
        return song
