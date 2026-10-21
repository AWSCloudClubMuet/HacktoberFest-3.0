"""
TuneWave Music Player - Models
Domain models for songs and track entities.
"""
from dataclasses import dataclass
from typing import Any


@dataclass
class Song:
    """
    Represents an individual song in the TuneWave player.
    
    Attributes:
        id: Unique identifier for the song.
        title: Title of the song.
        artist: Artist or performer of the song.
        duration: Song length in seconds.
    """
    id: str
    title: str = ""
    artist: str = ""
    duration: int = 0

    def __post_init__(self):
        self.id = str(self.id)
        if not self.title:
            self.title = self.id

    @property
    def song_id(self) -> str:
        """Alias for compatibility with different naming styles."""
        return self.id

    def __eq__(self, other: Any) -> bool:
        if isinstance(other, Song):
            return self.id == other.id
        if isinstance(other, str):
            return self.id == other or self.title == other
        return False

    def __hash__(self) -> int:
        return hash(self.id)

    def __repr__(self) -> str:
        if self.artist:
            return f"Song(id='{self.id}', title='{self.title}', artist='{self.artist}')"
        return f"Song(id='{self.id}', title='{self.title}')"


def normalize_song(song: Any) -> Song:
    """
    Normalizes various representations (Song instance, dict, string ID) into a Song object.
    """
    if isinstance(song, Song):
        return song
    if isinstance(song, str):
        return Song(id=song, title=song)
    if isinstance(song, dict):
        song_id = song.get("id") or song.get("songId") or song.get("song_id")
        title = song.get("title", "")
        artist = song.get("artist", "")
        duration = song.get("duration", 0)
        return Song(id=str(song_id), title=title, artist=artist, duration=duration)
    if hasattr(song, "id"):
        return Song(
            id=str(song.id),
            title=getattr(song, "title", str(song.id)),
            artist=getattr(song, "artist", ""),
            duration=getattr(song, "duration", 0)
        )
    if hasattr(song, "songId"):
        return Song(
            id=str(song.songId),
            title=getattr(song, "title", str(song.songId)),
            artist=getattr(song, "artist", ""),
            duration=getattr(song, "duration", 0)
        )
    return Song(id=str(song), title=str(song))
