"""Playlist = doubly linked list (order) + dict (song id -> node).

The dict stores NODES, not song copies, so finding/removing by id is O(1)
and duplicates are detected instantly. Every add/remove updates both
structures together, which keeps them consistent.

Position rules (documented design choices):
  * current = the playlist position. It starts on the first song added.
  * next() at the last song: repeat ON -> wrap to first; OFF -> stay, return "end".
  * previous() at the first song: repeat ON -> wrap to last; OFF -> stay, return "start".
  * Removing the current song moves the position to the next song,
    or to the previous song if it was the last one, or None if now empty.
"""
from typing import List, Optional, Union
from data_structures.doubly_linked_list import DoublyLinkedList, Node
from models.song import Song


class Playlist:
    def __init__(self):
        self._list = DoublyLinkedList()
        self._nodes: dict = {}                  # song id -> Node
        self._current: Optional[Node] = None
        self.repeat = False

    def add_song(self, song: Song) -> bool:
        """Append a song. Returns False (and changes nothing) if it is already present."""
        if song.id in self._nodes:
            return False
        self._nodes[song.id] = self._list.append(song)
        if self._current is None:
            self._current = self._nodes[song.id]
        return True

    def remove_song(self, song_id: int) -> bool:
        node = self._nodes.get(song_id)
        if node is None:
            return False
        if node is self._current:
            self._current = node.next or node.prev   # may be None
        self._list.unlink(node)
        del self._nodes[song_id]
        return True

    def next(self) -> Union[Song, str, None]:
        if self._current is None:
            return None
        if self._current.next is not None:
            self._current = self._current.next
        elif self.repeat:
            self._current = self._list.head
        else:
            return "end"
        return self._current.song

    def previous(self) -> Union[Song, str, None]:
        if self._current is None:
            return None
        if self._current.prev is not None:
            self._current = self._current.prev
        elif self.repeat:
            self._current = self._list.tail
        else:
            return "start"
        return self._current.song

    def jump_to(self, song_id: int) -> Optional[Song]:
        """Move the playlist position straight to a song (hash-map lookup, no scanning)."""
        node = self._nodes.get(song_id)
        if node is None:
            return None
        self._current = node
        return node.song

    def toggle_repeat(self) -> bool:
        self.repeat = not self.repeat
        return self.repeat

    @property
    def current_song(self) -> Optional[Song]:
        return self._current.song if self._current else None

    def contains(self, song_id: int) -> bool:
        return song_id in self._nodes

    def songs(self) -> List[Song]:
        return list(self._list)

    def __len__(self) -> int:
        return len(self._nodes)

    def check_consistency(self) -> None:
        """Raise AssertionError if list and dict disagree (used by tests)."""
        forward, node, prev = [], self._list.head, None
        while node is not None:
            assert node.prev is prev, "prev pointer broken"
            forward.append(node.song.id)
            prev, node = node, node.next
        assert prev is self._list.tail, "tail wrong"
        assert sorted(forward) == sorted(self._nodes), "dict and list differ"
        assert len(forward) == self._list.size == len(self._nodes)
        for song_id in forward:
            assert self._nodes[song_id].song.id == song_id
        if self._current is not None:
            assert self._current.song.id in self._nodes, "current points at removed node"
        else:
            assert not forward, "non-empty list needs a current position"

    # Names used in the original specification
    addSong = add_song
    removeSong = remove_song
    toggleRepeat = toggle_repeat
