"""
TuneWave Music Player - Milestone 1: Playlist
Implements Doubly Linked List + Hash Map for O(1) playlist management.
"""

class Song:
    """Represents a song entity with unique identifier and metadata."""
    def __init__(self, song_id, title, artist, duration=0):
        self.song_id = str(song_id)
        self.title = str(title)
        self.artist = str(artist)
        self.duration = duration

    def __repr__(self):
        return f"Song(id='{self.song_id}', title='{self.title}', artist='{self.artist}')"

    def __str__(self):
        return f"'{self.title}' by {self.artist} [{self.song_id}]"

    def __eq__(self, other):
        if isinstance(other, Song):
            return self.song_id == other.song_id
        elif isinstance(other, str):
            return self.song_id == other
        return False

    def __hash__(self):
        return hash(self.song_id)


class SongNode:
    """Node in the Doubly Linked List."""
    def __init__(self, song: Song):
        self.song = song
        self.prev = None
        self.next = None

    def __repr__(self):
        return f"SongNode({self.song})"


class Playlist:
    """
    TuneWave Playlist: Doubly Linked List + Hash Map
    
    Rules:
    - A song can appear only once in a playlist; hash map from song ID to node checks this and finds songs without scanning.
    - With repeat on, next() on the last song wraps to the first.
    - With repeat off, next() on the last song stays on the last song and returns "end".
    - All operations (add, remove, next, previous, toggleRepeat) run in O(1) time.
    """
    def __init__(self, name="My Playlist"):
        self.name = name
        self.head = None
        self.tail = None
        self.current = None
        self.repeat = False
        self.song_map = {}  # song_id -> SongNode
        self._size = 0

    def __len__(self):
        return self._size

    def addSong(self, song):
        """
        Adds a song to the end of the playlist.
        A song can appear only once in a playlist; hash map checks this without scanning.
        
        Returns:
            bool: True if song was added, False if duplicate.
        """
        # Coerce dict or string into Song object for developer ergonomics
        if not isinstance(song, Song):
            if isinstance(song, dict):
                song = Song(
                    song.get("song_id") or song.get("id"),
                    song.get("title", "Unknown"),
                    song.get("artist", "Unknown"),
                    song.get("duration", 0)
                )
            elif isinstance(song, str):
                song = Song(song, song, "Unknown")
            else:
                raise TypeError(f"Expected Song, dict, or str, got {type(song)}")

        # Uniqueness check via Hash Map in O(1)
        if song.song_id in self.song_map:
            return False

        new_node = SongNode(song)

        if self.head is None:
            self.head = new_node
            self.tail = new_node
            self.current = new_node
        else:
            self.tail.next = new_node
            new_node.prev = self.tail
            self.tail = new_node

        self.song_map[song.song_id] = new_node
        self._size += 1
        return True

    def removeSong(self, songId):
        """
        Removes a song by its songId in O(1) time using the hash map and DLL unlinking.
        
        Returns:
            bool: True if removed, False if songId not in playlist.
        """
        song_id_str = str(songId)
        node = self.song_map.get(song_id_str)
        if node is None:
            return False

        # If removing currently playing song, advance or retreat cursor
        if node == self.current:
            if node.next is not None:
                self.current = node.next
            elif node.prev is not None:
                self.current = node.prev
            else:
                self.current = None

        # Unlink head / tail
        if node == self.head:
            self.head = node.next
            if self.head:
                self.head.prev = None
        if node == self.tail:
            self.tail = node.prev
            if self.tail:
                self.tail.next = None

        # Unlink internal node pointers
        if node.prev and node != self.head:
            node.prev.next = node.next
        if node.next and node != self.tail:
            node.next.prev = node.prev

        # Remove from hash map
        del self.song_map[song_id_str]
        self._size -= 1

        # Clear disconnected node
        node.prev = None
        node.next = None
        return True

    def next(self):
        """
        Advances to the next song in the playlist.
        
        Rule:
        - With repeat on, next() on the last song wraps to the first.
        - With repeat off, it stays on the last song and returns "end".
        """
        if self.current is None:
            return "end"

        if self.current.next is not None:
            self.current = self.current.next
            return self.current.song

        # At the last song
        if self.repeat:
            self.current = self.head
            return self.current.song if self.current else "end"
        else:
            # Stays on the last song and returns "end"
            return "end"

    def previous(self):
        """
        Navigates to the previous song in the playlist.
        """
        if self.current is None:
            return None

        if self.current.prev is not None:
            self.current = self.current.prev
            return self.current.song

        # At the first song
        if self.repeat:
            self.current = self.tail
            return self.current.song if self.current else None
        else:
            # Stays on the first song
            return self.current.song

    def toggleRepeat(self):
        """
        Toggles repeat on/off.
        
        Returns:
            bool: New repeat state.
        """
        self.repeat = not self.repeat
        return self.repeat

    def getCurrentSong(self):
        """Returns the currently active song without modifying cursor."""
        return self.current.song if self.current else None

    def to_list(self):
        """Returns a list of songs in sequential playlist order."""
        res = []
        curr = self.head
        while curr:
            res.append(curr.song)
            curr = curr.next
        return res
