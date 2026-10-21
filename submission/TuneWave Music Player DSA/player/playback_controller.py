"""PlaybackController: playlist + Up Next + history, WITHOUT audio.

Key idea: two separate things.
  * playlist position  -> Playlist._current   (only next()/previous() move it)
  * now playing        -> self.current_song   (can be a queued or history song)
Playing from Up Next or history changes only `current_song`.

History rule: when playback switches to a DIFFERENT song, the song that was
playing is pushed on history. back() pops the top and plays it WITHOUT pushing
the current song (otherwise back() twice would just bounce between two songs).
Songs deleted from the library are silently skipped when found in queue/history.
"""
from typing import List, Optional, Union
from data_structures.history_stack import HistoryStack
from data_structures.playlist import Playlist
from data_structures.queue import UpNextQueue
from models.song import Song
from music.library_manager import LibraryManager

Result = Union[Song, str, None]


class PlaybackController:
    def __init__(self, library: LibraryManager):
        self.library = library
        self.playlist = Playlist()
        self.up_next = UpNextQueue()
        self.history = HistoryStack(10)
        self.current_song: Optional[Song] = None

    def _require_song(self, song_id: int) -> Song:
        song = self.library.get_song(song_id)
        if song is None:
            raise ValueError(f"No song with id {song_id} in the library.")
        return song

    def _start(self, song: Song, record_history: bool = True) -> None:
        if record_history and self.current_song and self.current_song.id != song.id:
            self.history.push(self.current_song.id)
        self.current_song = song

    # --- playlist editing -------------------------------------------------
    def add_to_playlist(self, song_id: int) -> bool:
        return self.playlist.add_song(self._require_song(song_id))

    def remove_from_playlist(self, song_id: int) -> bool:
        return self.playlist.remove_song(song_id)

    def delete_song(self, song_id: int) -> bool:
        """Remove a song everywhere (playlist, queue, library, search index)."""
        self.playlist.remove_song(song_id)
        self.up_next.remove_all(song_id)
        return self.library.remove_song(song_id)

    # --- playback ---------------------------------------------------------
    def play(self) -> Result:
        """Start playing if nothing is playing: plays the playlist position."""
        if self.current_song is None and self.playlist.current_song:
            self._start(self.playlist.current_song)
        return self.current_song

    def add_to_up_next(self, song_id: int) -> None:
        self._require_song(song_id)
        self.up_next.enqueue(song_id)

    def play_next(self) -> Result:
        """Up Next first; otherwise advance the playlist ("end" at the end without repeat)."""
        while len(self.up_next):
            song = self.library.get_song(self.up_next.dequeue())
            if song is not None:
                self._start(song)
                return song
        if self.current_song is None:                  # nothing played yet
            return self.play()
        result = self.playlist.next()
        if isinstance(result, Song):
            self._start(result)
        return result

    # --- double-click helpers ----------------------------------------------
    def play_from_playlist(self, song_id: int) -> Optional[Song]:
        """Play a playlist song now AND move the playlist position to it."""
        song = self.playlist.jump_to(song_id)
        if song is not None:
            self._start(song)
        return song

    def play_now(self, song_id: int) -> Song:
        """Play any library song now. The playlist position does NOT move (like Up Next/history)."""
        song = self._require_song(song_id)
        self._start(song)
        return song

    def play_from_queue(self, song_id: int) -> Optional[Song]:
        """Play a queued song now and take that one entry out of Up Next."""
        if not self.up_next.remove_first(song_id):
            return None
        return self.play_now(song_id)

    def play_previous(self) -> Result:
        result = self.playlist.previous()
        if isinstance(result, Song):
            self._start(result)
        return result

    def back(self) -> Optional[Song]:
        """Replay the top history song and remove it from history."""
        while len(self.history):
            song = self.library.get_song(self.history.pop())
            if song is not None:
                self._start(song, record_history=False)
                return song
        return None

    def toggle_repeat(self) -> bool:
        return self.playlist.toggle_repeat()

    def up_next_songs(self) -> List[Song]:
        return [s for s in (self.library.get_song(i) for i in self.up_next.to_list()) if s]

    def history_songs(self) -> List[Song]:
        return [s for s in (self.library.get_song(i) for i in self.history.to_list()) if s]

    addToUpNext = add_to_up_next
    playNext = play_next
    toggleRepeat = toggle_repeat
