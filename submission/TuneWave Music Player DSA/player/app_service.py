"""AppService: what the GUI buttons call. Joins library + controller + audio + saving.

The GUI never touches linked-list nodes or graph internals; it only calls these methods.
Playback methods return a short status message (str) for the status bar.
Editing methods raise ValueError with a user-friendly message when input is invalid.

Design choices:
  * Deleting the song that is playing does not interrupt playback; it just leaves all lists.
  * If a file cannot be played, we report it and stay stopped (no auto-skip loop).
  * Saved: library, artist relations, playlist order. Not saved: Up Next, history, repeat, volume.
  * Seeking only talks to the audio backend. It never touches the playlist position,
    Up Next or history (see seek()).
"""
from typing import List, Optional
from models.song import Song
from music.library_manager import LibraryManager
from player.audio_backend import AudioError, validate_audio_file
from player.playback_controller import PlaybackController
from player.timeline import format_time, fraction_to_seconds, seconds_to_fraction
from storage.library_storage import read_playlist_ids, save_library


class AppService:
    def __init__(self, library: LibraryManager, audio, storage_path: Optional[str] = None):
        self.library = library
        self.audio = audio
        self.controller = PlaybackController(library)
        self.storage_path = storage_path

    # ---- startup / saving ------------------------------------------------
    def restore_playlist(self) -> None:
        """Rebuild the playlist from saved ids (unknown ids are skipped)."""
        if not self.storage_path:
            return
        for song_id in read_playlist_ids(self.storage_path):
            if self.library.get_song(song_id):
                self.controller.add_to_playlist(song_id)

    def save(self) -> None:
        if self.storage_path:
            ids = [s.id for s in self.controller.playlist.songs()]
            save_library(self.library, self.storage_path, ids)

    # ---- library editing -------------------------------------------------
    def add_song(self, title: str, artist: str, audio_path: str, add_to_playlist: bool = True) -> Song:
        """Validate -> auto-ID -> index in library/BST/graph -> optional playlist -> save."""
        validate_audio_file(audio_path)                   # ValueError if missing/unsupported
        song = self.library.add_song(title, artist, audio_path)   # ValueError if blank
        if add_to_playlist:
            self.controller.add_to_playlist(song.id)
        self.save()
        return song

    def delete_song(self, song_id: int) -> bool:
        removed = self.controller.delete_song(song_id)
        self.save()
        return removed

    def add_to_playlist(self, song_id: int) -> str:
        if self.controller.add_to_playlist(song_id):
            self.save()
            return "Added to playlist."
        return "That song is already in the playlist."

    def remove_from_playlist(self, song_id: int) -> str:
        removed = self.controller.remove_from_playlist(song_id)
        self.save()
        return "Removed from playlist." if removed else "That song is not in the playlist."

    def add_to_up_next(self, song_id: int) -> str:
        self.controller.add_to_up_next(song_id)
        return "Added to Up Next."

    def add_relation(self, artist_a: str, artist_b: str) -> str:
        if not self.library.add_relation(artist_a, artist_b):
            raise ValueError("Enter two different artist names.")
        self.save()
        return f"Linked {artist_a.strip()} and {artist_b.strip()}."

    # ---- playback --------------------------------------------------------
    def _play_song(self, song: Song) -> str:
        try:
            self.audio.play(song.audio_path)
        except AudioError as err:
            return f"Cannot play '{song.title}': {err}"
        return f"Playing: {song.title} - {song.artist}"

    def play_from_playlist(self, song_id: int) -> str:
        """Double-click in Playlist: play it and move the playlist position there."""
        song = self.controller.play_from_playlist(song_id)
        return self._play_song(song) if song else "That song is not in the playlist."

    def play_now(self, song_id: int) -> str:
        """Double-click in Library/History: play it; the playlist position stays where it is."""
        try:
            return self._play_song(self.controller.play_now(song_id))
        except ValueError as err:
            return str(err)

    def play_from_queue(self, song_id: int) -> str:
        """Double-click in Up Next: play it now and remove that entry from the queue."""
        try:
            song = self.controller.play_from_queue(song_id)
        except ValueError as err:
            return str(err)
        return self._play_song(song) if song else "That song is not in Up Next."

    def toggle_play_pause(self) -> str:
        if self.audio.state == "playing":
            self.audio.pause()
            return "Paused."
        if self.audio.state == "paused":
            self.audio.resume()
            return "Resumed."
        song = self.controller.current_song or self.controller.play()
        if song is None:
            return "The playlist is empty. Add a song first."
        return self._play_song(song)

    def stop(self) -> str:
        self.audio.stop()
        return "Stopped."

    def next(self) -> str:
        result = self.controller.play_next()
        if result == "end":
            return "End of playlist (turn on Repeat to loop)."
        if result is None:
            return "Nothing to play."
        return self._play_song(result)

    def previous(self) -> str:
        result = self.controller.play_previous()
        if result == "start":
            return "Already at the first song."
        if result is None:
            return "Nothing to play."
        return self._play_song(result)

    def back(self) -> str:
        song = self.controller.back()
        if song is None:
            return "History is empty."
        return self._play_song(song)

    def toggle_repeat(self) -> bool:
        return self.controller.toggle_repeat()

    # ---- seeking / volume / progress (read by the GUI timer) -----------------
    def position(self) -> float:
        return self.audio.position()

    def duration(self) -> Optional[float]:
        return self.audio.duration if self.audio.state != "stopped" else None

    def progress_fraction(self) -> float:
        """0.0 - 1.0 for the slider (0.0 when stopped or the length is unknown)."""
        return seconds_to_fraction(self.position(), self.duration())

    def can_seek(self) -> bool:
        return self.audio.can_seek

    def seek(self, seconds: float) -> str:
        """Jump inside the CURRENT song. Controller state is deliberately not touched,
        so the playlist position, history and Up Next stay exactly as they were."""
        try:
            position = self.audio.seek(seconds)
        except AudioError as err:
            return str(err)
        return f"Jumped to {format_time(position)}."

    def seek_relative(self, delta_seconds: float) -> str:
        """Skip forward (+) or back (-) from the current position, e.g. +10 / -10."""
        if self.audio.state == "stopped":
            return "Nothing is playing."
        return self.seek(self.position() + delta_seconds)

    def seek_fraction(self, fraction: float) -> str:
        """Seek using a slider value between 0.0 (start) and 1.0 (end)."""
        if self.audio.state == "stopped":
            return "Nothing is playing."
        seconds = fraction_to_seconds(fraction, self.duration())
        if seconds is None:
            return "Cannot seek: the length of this song is unknown."
        return self.seek(seconds)

    @property
    def volume(self) -> float:
        return self.audio.volume

    def set_volume(self, volume: float) -> float:
        return self.audio.set_volume(volume)

    def poll(self) -> Optional[str]:
        """Called by the GUI timer. When a song ends on its own, move to the next one."""
        if self.audio.state == "playing" and self.audio.has_finished():
            self.audio.stop()
            return self.next()
        return None

    # ---- search / recommendations (read-only helpers for the GUI) ---------
    def prefix_search(self, prefix: str) -> List[Song]:
        return self.library.prefix_search(prefix)

    def exact_search(self, title: str) -> List[Song]:
        return self.library.find_song(title)

    def recommend(self, artist: str) -> List[str]:
        return self.library.recommend_artists(artist)

    def artists(self) -> List[str]:
        return self.library.graph.artists()

    def related_artists(self, artist: str) -> List[str]:
        """Artists directly linked to `artist`."""
        return self.library.graph.related(artist)

    def shutdown(self) -> None:
        self.audio.shutdown()
        self.save()
