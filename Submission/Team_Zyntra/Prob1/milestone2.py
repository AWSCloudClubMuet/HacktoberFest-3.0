"""
TuneWave Music Player - Milestone 2: Up Next and History
Implements Queue (FIFO) for Up Next and Bounded Stack (LIFO, maxlen=10) for Play History.
"""

from collections import deque
import sys
import os

# Ensure local imports work cleanly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from milestone1 import Song, Playlist


class UpNextQueue:
    """
    FIFO Queue for Up Next tracks.
    Guarantees O(1) enqueue and dequeue.
    """
    def __init__(self):
        self._queue = deque()

    def enqueue(self, song: Song):
        """Adds a song to the end of the Up Next queue."""
        self._queue.append(song)

    def dequeue(self) -> Song:
        """Removes and returns the front song from the Up Next queue."""
        if not self._queue:
            return None
        return self._queue.popleft()

    def peek(self) -> Song:
        """Returns the front song without removing it."""
        if not self._queue:
            return None
        return self._queue[0]

    def is_empty(self) -> bool:
        return len(self._queue) == 0

    def __len__(self):
        return len(self._queue)

    def to_list(self):
        return list(self._queue)

    def __repr__(self):
        return f"UpNextQueue({list(self._queue)})"


class PlayHistory:
    """
    Bounded LIFO Stack for recently played songs.
    
    Rule:
    - History keeps the last 10 songs played and drops the oldest.
    - O(1) push, pop, and automatic bottom eviction.
    """
    def __init__(self, capacity: int = 10):
        self.capacity = capacity
        self._stack = deque(maxlen=capacity)

    def push(self, song: Song):
        """
        Pushes a played song onto the history stack.
        If size exceeds capacity, the oldest item (bottom of stack) is automatically dropped in O(1).
        """
        self._stack.append(song)

    def pop(self) -> Song:
        """
        Pops and returns the most recently played song from the top of the stack.
        """
        if not self._stack:
            return None
        return self._stack.pop()

    def peek(self) -> Song:
        """Returns top of history without removing."""
        if not self._stack:
            return None
        return self._stack[-1]

    def is_empty(self) -> bool:
        return len(self._stack) == 0

    def __len__(self):
        return len(self._stack)

    def to_list(self):
        """Returns history from oldest (bottom) to newest (top)."""
        return list(self._stack)

    def __repr__(self):
        return f"PlayHistory(size={len(self._stack)}/{self.capacity}, top={self.peek()})"


class TuneWavePlayer:
    """
    TuneWave Core Player Controller combining:
    1. Playlist (Milestone 1: Doubly Linked List + Hash Map)
    2. Up Next (Milestone 2: FIFO Queue)
    3. Play History (Milestone 2: Bounded LIFO Stack, max capacity 10)
    
    Rules:
    - Songs in the Up Next queue play before the playlist continues.
    - Playing from Up Next or history does not move the playlist position.
    - History keeps the last 10 songs played and drops the oldest.
    - back() replays the top song and removes it from history.
    """
    def __init__(self, playlist: Playlist = None, catalog: dict = None):
        self.playlist = playlist if playlist is not None else Playlist()
        self.up_next = UpNextQueue()
        self.history = PlayHistory(capacity=10)
        
        # Song catalog for fast O(1) song resolution by ID: song_id -> Song
        self.catalog = catalog if catalog is not None else {}
        
        # Populate catalog with existing playlist songs
        if playlist:
            for s_id, node in playlist.song_map.items():
                self.catalog[s_id] = node.song

        # Currently playing track
        self.currently_playing = self.playlist.getCurrentSong()

    def registerSong(self, song: Song):
        """Registers a song into the player's global catalog."""
        self.catalog[song.song_id] = song

    def addToUpNext(self, songId) -> bool:
        """
        Adds a song to the Up Next queue by songId (or Song object).
        Resolves via catalog or playlist song map.
        
        Returns:
            bool: True if song was found and queued, False otherwise.
        """
        song = None
        if isinstance(songId, Song):
            song = songId
        else:
            s_id = str(songId)
            if s_id in self.catalog:
                song = self.catalog[s_id]
            elif self.playlist and s_id in self.playlist.song_map:
                song = self.playlist.song_map[s_id].song

        if song is None:
            return False

        self.up_next.enqueue(song)
        return True

    def playNext(self):
        """
        Plays the next song following the priority rules:
        1. Songs in the Up Next queue play before the playlist continues.
        2. Playing from Up Next does NOT move the playlist position.
        3. Advances playlist only when Up Next queue is empty.
        4. Pushes the previously active song to History (retaining last 10, dropping oldest).
        """
        # If Up Next has songs, it takes absolute precedence!
        if not self.up_next.is_empty():
            next_song = self.up_next.dequeue()
            
            # Record currently playing track into history before switching
            if self.currently_playing is not None:
                self.history.push(self.currently_playing)
            
            self.currently_playing = next_song
            # CRITICAL RULE: Playing from Up Next does not move playlist position!
            return self.currently_playing

        # Up Next is empty -> advance the sequential playlist
        if self.playlist is None or len(self.playlist) == 0:
            return "end"

        # If no song is actively playing yet, start with current playlist song
        if self.currently_playing is None:
            self.currently_playing = self.playlist.getCurrentSong()
            return self.currently_playing

        # Move to next track in playlist
        res = self.playlist.next()
        if res == "end":
            return "end"

        # Record previously playing song to history
        self.history.push(self.currently_playing)
        self.currently_playing = res
        return self.currently_playing

    def back(self):
        """
        Replays the top song and removes it from history.
        
        Rules:
        - back() replays the top song and removes it from history.
        - Playing from history does NOT move the playlist position.
        
        Returns:
            Song or None: Replayed song, or None if history is empty.
        """
        if self.history.is_empty():
            return None

        # Pop top song from history
        replayed_song = self.history.pop()
        
        # Playlist position does NOT move
        self.currently_playing = replayed_song
        return self.currently_playing

    def status(self) -> dict:
        """Returns a snapshot of the player state."""
        return {
            "currently_playing": str(self.currently_playing) if self.currently_playing else "None",
            "playlist_position": str(self.playlist.getCurrentSong()) if self.playlist and self.playlist.getCurrentSong() else "None",
            "up_next_count": len(self.up_next),
            "up_next_queue": [s.title for s in self.up_next.to_list()],
            "history_count": len(self.history),
            "history_stack": [s.title for s in self.history.to_list()]
        }
