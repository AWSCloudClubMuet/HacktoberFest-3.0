"""
TuneWave Music Player - Playlist Subsystem
Milestone 1: Custom Doubly Linked List + Hash Map for O(1) song tracking.
"""
from typing import Any, Dict, List, Optional, Union
from .models import Song, normalize_song


class SongNode:
    """
    A node in the custom doubly linked list representing a song in the playlist.
    
    Attributes:
        song: The Song object stored in this node.
        prev: Pointer to the previous node in the sequence.
        next: Pointer to the next node in the sequence.
    """

    def __init__(self, song: Song):
        self.song: Song = song
        self.prev: Optional["SongNode"] = None
        self.next: Optional["SongNode"] = None

    def __repr__(self) -> str:
        return f"SongNode(id='{self.song.id}', title='{self.song.title}')"


class Playlist:
    """
    Playlist implementation combining a Doubly Linked List with a Hash Map.
    
    Data Structure Architecture:
    1. Doubly Linked List:
       - Maintains the ordered playback sequence.
       - Supports bidirectional navigation (next and previous) in O(1) step time.
       - Supports O(1) node splicing/removal when node reference is known.
    2. Hash Map (_nodes):
       - Keyed by song ID (str) -> references the exact SongNode in the DLL.
       - Guarantees O(1) duplicate checks on insertion (a song can appear only once).
       - Provides O(1) lookup for song removal without scanning the list.
    """

    def __init__(self, name: str = "Default Playlist"):
        self.name: str = name
        self.head: Optional[SongNode] = None
        self.tail: Optional[SongNode] = None
        self.current: Optional[SongNode] = None
        self.repeat: bool = False
        self._nodes: Dict[str, SongNode] = {}
        self._player: Optional[Any] = None

    # -------------------------------------------------------------------------
    # Milestone 1 Required Public Operations
    # -------------------------------------------------------------------------

    def addSong(self, song: Any) -> bool:
        """
        Adds a song to the end of the playlist.
        
        Rules:
        - A song ID can appear only once in a playlist.
        - Hash map checks existence in O(1) time without scanning.
        
        Returns:
            True if the song was added successfully.
            False if the song is a duplicate.
        """
        song_obj = normalize_song(song)
        song_id = song_obj.id

        # O(1) duplicate check via hash map
        if song_id in self._nodes:
            return False

        new_node = SongNode(song_obj)

        if self.head is None:
            # First song in playlist: initialize head, tail, and current
            self.head = new_node
            self.tail = new_node
            self.current = new_node
        else:
            # Append to tail and update DLL pointers
            self.tail.next = new_node
            new_node.prev = self.tail
            self.tail = new_node
            if self.current is None:
                self.current = new_node

        # Store in hash map for O(1) retrieval
        self._nodes[song_id] = new_node
        return True

    def removeSong(self, songId: Any) -> bool:
        """
        Removes a song from the playlist by its ID in O(1) time.
        
        Rules:
        - Locates the node via hash map without scanning the list.
        - Updates head, tail, prev, and next pointers.
        - If removing the current song:
            - advances current to next song if available,
            - otherwise falls back to previous song,
            - or resets current to None if playlist becomes empty.
        - Boundary behavior: returns False for invalid or absent song IDs.
        
        Returns:
            True if the song was found and removed, False otherwise.
        """
        song_id_str = str(songId)
        node = self._nodes.get(song_id_str)
        if node is None:
            return False

        # Adjust current pointer if the active song is removed
        if self.current == node:
            if node.next is not None:
                self.current = node.next
            elif node.prev is not None:
                self.current = node.prev
            else:
                self.current = None

        # Re-link Doubly Linked List pointers
        if node.prev is not None:
            node.prev.next = node.next
        else:
            self.head = node.next  # node was head

        if node.next is not None:
            node.next.prev = node.prev
        else:
            self.tail = node.prev  # node was tail

        # Clean node references to prevent dangling pointer leaks
        node.prev = None
        node.next = None

        # Remove from hash map
        del self._nodes[song_id_str]
        return True

    def next(self) -> Union[Song, str, None]:
        """
        Advances to the next song in the playlist.
        
        Rules:
        - With repeat ON: at the last song, wraps to the first song.
        - With repeat OFF: at the last song, stays on the last song and returns 'end'.
        - On empty playlist: returns None.
        
        Returns:
            The newly active Song object, 'end' if at tail with repeat off, or None if empty.
        """
        if self.current is None:
            return None

        if self.current.next is not None:
            self.current = self.current.next
            return self.current.song

        # Reached the last song (current.next is None)
        if self.repeat:
            self.current = self.head
            return self.current.song if self.current else None
        else:
            # Stays on the last song and returns 'end'
            return "end"

    def previous(self) -> Union[Song, str, None]:
        """
        Moves to the previous song in the playlist.
        
        Sensible boundary behavior:
        - With repeat ON: at the first song, wraps to the last song (tail).
        - With repeat OFF: at the first song, stays on the first song and returns 'start'.
        - On empty playlist: returns None.
        
        Returns:
            The newly active Song object, 'start' if at head with repeat off, or None if empty.
        """
        if self.current is None:
            return None

        if self.current.prev is not None:
            self.current = self.current.prev
            return self.current.song

        # At the first song (current.prev is None)
        if self.repeat:
            if self.tail is not None:
                self.current = self.tail
                return self.current.song
            return self.current.song
        else:
            # Stays on the first song and returns 'start'
            return "start"

    def toggleRepeat(self) -> bool:
        """
        Toggles repeat mode between ON (True) and OFF (False).
        
        Returns:
            The new boolean repeat state.
        """
        self.repeat = not self.repeat
        return self.repeat

    # -------------------------------------------------------------------------
    # Milestone 2 Delegation Methods (Up Next & History)
    # -------------------------------------------------------------------------

    @property
    def player(self) -> Any:
        """Returns the associated Player controller, initializing one if needed."""
        if not hasattr(self, "_player") or self._player is None:
            from .playback import Player
            self._player = Player(self)
        return self._player

    def addToUpNext(self, songId: Any) -> bool:
        """Adds a song to the Up Next queue via the Player controller."""
        return self.player.addToUpNext(songId)

    def playNext(self) -> Union[Song, str, None]:
        """Plays the next song via the Player controller."""
        return self.player.playNext()

    def back(self) -> Optional[Song]:
        """Replays the previous song from history via the Player controller."""
        return self.player.back()

    # -------------------------------------------------------------------------
    # Pythonic Compatibility Wrappers & Helper Methods
    # -------------------------------------------------------------------------

    def add_song(self, song: Any) -> bool:
        """Pythonic alias for addSong."""
        return self.addSong(song)

    def remove_song(self, song_id: Any) -> bool:
        """Pythonic alias for removeSong."""
        return self.removeSong(song_id)

    def toggle_repeat(self) -> bool:
        """Pythonic alias for toggleRepeat."""
        return self.toggleRepeat()

    @property
    def current_song(self) -> Optional[Song]:
        """Returns the currently active Song, or None if playlist is empty."""
        return self.current.song if self.current else None

    def get_song(self, song_id: Any) -> Optional[Song]:
        """O(1) lookup of a song by ID using the hash map."""
        node = self._nodes.get(str(song_id))
        return node.song if node else None

    def to_list(self) -> List[Song]:
        """Returns all songs in playlist order from head to tail."""
        result: List[Song] = []
        curr = self.head
        while curr is not None:
            result.append(curr.song)
            curr = curr.next
        return result

    def clear(self) -> None:
        """Clears all songs from the playlist and resets pointers."""
        self.head = None
        self.tail = None
        self.current = None
        self._nodes.clear()

    def __len__(self) -> int:
        return len(self._nodes)

    def __contains__(self, song_id: Any) -> bool:
        return str(song_id) in self._nodes

    def __repr__(self) -> str:
        current_id = self.current.song.id if self.current else None
        return (
            f"Playlist(name='{self.name}', total_songs={len(self._nodes)}, "
            f"repeat={self.repeat}, current='{current_id}')"
        )
