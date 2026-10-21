"""TuneWave - Milestone 1: Playlist (Doubly Linked List + Hash Map)."""
from dataclasses import dataclass
from typing import Dict, Optional, Union


@dataclass(frozen=True)
class Song:
    id: str
    title: str = ""
    artist: str = ""


class _Node:
    __slots__ = ("song", "prev", "next")

    def __init__(self, song: Song):
        self.song = song
        self.prev: Optional["_Node"] = None
        self.next: Optional["_Node"] = None


class Playlist:
    """Doubly linked list for order + dict (hash map) of song id -> node."""

    def __init__(self):
        self._head: Optional[_Node] = None
        self._tail: Optional[_Node] = None
        self._current: Optional[_Node] = None
        self._index: Dict[str, _Node] = {}   # songId -> node, O(1) lookup
        self._repeat = False

    # ---------- helpers ----------
    def __len__(self):
        return len(self._index)

    @property
    def current(self) -> Optional[Song]:
        return self._current.song if self._current else None

    @property
    def repeat(self) -> bool:
        return self._repeat

    def to_list(self):
        out, n = [], self._head
        while n:
            out.append(n.song.id)
            n = n.next
        return out

    # ---------- required operations ----------
    def addSong(self, song: Song) -> bool:
        """Append to the end. O(1). Returns False if the song already exists."""
        if song.id in self._index:
            return False
        node = _Node(song)
        if self._tail is None:            # empty playlist
            self._head = self._tail = self._current = node
        else:
            node.prev = self._tail
            self._tail.next = node
            self._tail = node
        self._index[song.id] = node
        return True

    def removeSong(self, songId: str) -> bool:
        """Remove by id. O(1) thanks to the hash map. False if not found."""
        node = self._index.pop(songId, None)
        if node is None:
            return False

        # If the playing song is removed, move to the next song
        # (or the previous one if it was the last); None if playlist is empty.
        if node is self._current:
            self._current = node.next or node.prev

        # Unlink
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

    def next(self) -> Union[Song, str, None]:
        """Advance. Last song: wrap to first if repeat is on, else 'end'."""
        if self._current is None:
            return None
        if self._current.next:
            self._current = self._current.next
        elif self._repeat:
            self._current = self._head
        else:
            return "end"
        return self._current.song

    def previous(self) -> Union[Song, str, None]:
        """Go back. First song: stay put and return 'start' (assumption;
        the spec only defines the wrap/end rule for next())."""
        if self._current is None:
            return None
        if self._current.prev is None:
            return "start"
        self._current = self._current.prev
        return self._current.song

    def toggleRepeat(self) -> bool:
        self._repeat = not self._repeat
        return self._repeat


# ---------------- tests ----------------
if __name__ == "__main__":
    p = Playlist()
    S = lambda i: Song(i, f"title{i}")

    assert p.addSong(S("a")) and p.addSong(S("b")) and p.addSong(S("c"))
    assert p.addSong(S("a")) is False            # duplicates rejected
    assert p.to_list() == ["a", "b", "c"]
    assert p.current.id == "a"

    assert p.next().id == "b"
    assert p.next().id == "c"
    assert p.next() == "end"                     # repeat off at last song
    assert p.current.id == "c"

    assert p.toggleRepeat() is True
    assert p.next().id == "a"                    # wraps to first
    assert p.previous() == "start"
    assert p.next().id == "b"
    assert p.previous().id == "a"

    # remove a non-current song
    assert p.removeSong("c") and p.to_list() == ["a", "b"]
    assert p.removeSong("zzz") is False
    # remove current song -> moves to next
    assert p.removeSong("a") and p.current.id == "b"
    # remove last remaining song
    assert p.removeSong("b") and p.current is None and len(p) == 0
    assert p.next() is None
    # re-adding a removed song works
    assert p.addSong(S("a")) and p.current.id == "a"
    # single song + repeat wraps to itself; repeat off -> end
    assert p.next().id == "a"
    p.toggleRepeat()
    assert p.next() == "end"

    print("All Milestone 1 tests passed.")