
from typing import Optional

from models import Song


class PlaylistNode:
    #A single node that holds a song and optinal links to its neighbors in the playlist.

    def __init__(self, song: Song):
        self.song = song
        self.previous: Optional["PlaylistNode"] = None
        self.next: Optional["PlaylistNode"] = None


class Playlist:
   #Manage songs using a doubly linked list and a hash map.

    def __init__(self):
        self.head: Optional[PlaylistNode] = None
        self.tail: Optional[PlaylistNode] = None
        self.current: Optional[PlaylistNode] = None

        # song ID -> playlist node
        self.song_map: dict[str, PlaylistNode] = {}

        self.repeat = False

    def add_song(self, song: Song) -> bool:
        #add song only if its ID is not available in hashmap
        if song.song_id in self.song_map:
            return False

        node = PlaylistNode(song)

        if self.head is None:
            # First song in the playlist
            self.head = self.tail = self.current = node
        else:
            # Append after the current tail
            node.previous = self.tail
            self.tail.next = node
            self.tail = node

        self.song_map[song.song_id] = node
        return True

    def remove_song(self, song_id: str) -> bool:
        """Remove a song by ID while preserving list connections."""
        node = self.song_map.get(song_id)

        if node is None:
            return False

        # Reconnect the previous node
        if node.previous is not None:
            node.previous.next = node.next
        else:
            self.head = node.next

        # Reconnect the next node
        if node.next is not None:
            node.next.previous = node.previous
        else:
            self.tail = node.previous

        # If current was removed, select its successor,
        # or the new head if the removed node was the tail.
        if self.current is node:
            self.current = node.next if node.next else self.head

        del self.song_map[song_id]

        # Detach the removed node
        node.previous = None
        node.next = None

        return True

    def next_song(self) -> Optional[Song]:
        """Advance to the next song, respecting repeat mode."""
        if self.current is None:
            return None

        if self.current.next is not None:
            self.current = self.current.next
        elif self.repeat:
            self.current = self.head
        else:
            return None

        return self.current.song

    def previous_song(self) -> Optional[Song]:
        """Move backward, respecting repeat mode."""
        if self.current is None:
            return None

        if self.current.previous is not None:
            self.current = self.current.previous
        elif self.repeat:
            self.current = self.tail
        else:
            return None

        return self.current.song

    def toggle_repeat(self) -> bool:
        """Toggle repeat mode and return its new state."""
        self.repeat = not self.repeat
        return self.repeat

    def get_current_song(self) -> Optional[Song]:
        """Return the current playlist song without advancing."""
        return self.current.song if self.current else None

    def get_songs(self) -> list[Song]:
        """Return songs in playlist order."""
        songs = []
        node = self.head

        while node is not None:
            songs.append(node.song)
            node = node.next

        return songs

    def __len__(self) -> int:
        return len(self.song_map)
