from collections import deque
from typing import Optional

from models import Song
from playlist import Playlist


class SongQueue:
    """FIFO queue for songs waiting to play."""

    def __init__(self):
        self._queue = deque()

    def enqueue(self, song: Song) -> None:
        self._queue.append(song)

    def dequeue(self) -> Optional[Song]:
        if not self._queue:
            return None
        return self._queue.popleft()

    def is_empty(self) -> bool:
        return len(self._queue) == 0

    def __len__(self) -> int:
        return len(self._queue)


class SongStack:
    """LIFO stack containing previously played songs."""

    MAX_HISTORY = 10

    def __init__(self):
        self._history = []

    def push(self, song: Song) -> None:
        # Discard the oldest entry when history reaches its limit.
        if len(self._history) == self.MAX_HISTORY:
            self._history.pop(0)

        self._history.append(song)

    def pop(self) -> Optional[Song]:
        if not self._history:
            return None
        return self._history.pop()

    def peek(self) -> Optional[Song]:
        if not self._history:
            return None
        return self._history[-1]

    def is_empty(self) -> bool:
        return len(self._history) == 0

    def __len__(self) -> int:
        return len(self._history)

    def get_songs(self) -> list[Song]:
        #return oldest to newset song
        return list(self._history)


class PlaybackManager:
    #Coordinates playlist playback, Up Next, and history.

    def __init__(self, playlist: Playlist):
        self.playlist = playlist
        self.up_next = SongQueue()
        self.history = SongStack()

        # The playlist's current song is the initial selection.
        self.currently_playing = playlist.get_current_song()

    def add_to_up_next(self, song_id: str) -> bool:
        #adding the song in the queue if it exists in the playlist
        node = self.playlist.song_map.get(song_id)

        if node is None:
            return False

        self.up_next.enqueue(node.song)
        return True

    def _start_song(self, song: Song) -> Song:
        """Switch songs and remember the song we are leaving."""
        if self.currently_playing is not None:
            self.history.push(self.currently_playing)

        self.currently_playing = song
        return song

    def play_next(self) -> Optional[Song]:
        """
        Play the next queued song first.
        If the queue is empty, continue the main playlist.
        """
        if not self.up_next.is_empty():
            song = self.up_next.dequeue()
            return self._start_song(song)

        if self.currently_playing is None:
            song = self.playlist.get_current_song()
        else:
            song = self.playlist.next_song()

        if song is None:
            return None

        return self._start_song(song)

    def back(self) -> Optional[Song]:
        """Replay the most recent previous song without moving the playlist."""
        song = self.history.pop()

        if song is None:
            return None

        self.currently_playing = song
        return song

    def get_currently_playing(self) -> Optional[Song]:
        return self.currently_playing
