"""
Unit tests for TuneWave Music Player - Milestone 1: Playlist Subsystem.
Tests Doubly Linked List, Hash Map indexing, repeat rules, navigation, and edge cases.
"""
import pytest
from src.models import Song
from src.playlist import Playlist, SongNode


def test_empty_playlist():
    """Validates sensible boundary behavior on an uninitialized/empty playlist."""
    playlist = Playlist("Chill Vibes")

    assert len(playlist) == 0
    assert playlist.head is None
    assert playlist.tail is None
    assert playlist.current is None
    assert playlist.current_song is None
    assert playlist.repeat is False

    # Calling navigation on empty playlist returns None safely
    assert playlist.next() is None
    assert playlist.previous() is None

    # Removing non-existent song returns False
    assert playlist.removeSong("non-existent-id") is False
    assert playlist.to_list() == []


def test_add_single_song():
    """Adding a single song correctly initializes head, tail, and current."""
    playlist = Playlist()
    song = Song(id="s1", title="Stairway to Heaven", artist="Led Zeppelin", duration=482)

    added = playlist.addSong(song)
    assert added is True
    assert len(playlist) == 1

    # DLL pointers
    assert playlist.head is not None
    assert playlist.tail is not None
    assert playlist.current is not None
    assert playlist.head == playlist.tail
    assert playlist.current == playlist.head
    assert playlist.head.prev is None
    assert playlist.head.next is None
    assert playlist.current_song == song

    # Hash map check
    assert "s1" in playlist
    assert playlist.get_song("s1") == song


def test_add_multiple_songs_and_pointer_chain():
    """Adding multiple songs creates an intact bidirectional doubly linked list."""
    playlist = Playlist()
    s1 = Song("s1", "Song One")
    s2 = Song("s2", "Song Two")
    s3 = Song("s3", "Song Three")

    assert playlist.addSong(s1) is True
    assert playlist.addSong(s2) is True
    assert playlist.addSong(s3) is True

    assert len(playlist) == 3
    assert playlist.head.song == s1
    assert playlist.tail.song == s3
    assert playlist.current.song == s1

    # Verify forward pointers
    assert playlist.head.next.song == s2
    assert playlist.head.next.next.song == s3
    assert playlist.head.next.next.next is None

    # Verify backward pointers
    assert playlist.tail.prev.song == s2
    assert playlist.tail.prev.prev.song == s1
    assert playlist.tail.prev.prev.prev is None

    # Verify list representation
    assert playlist.to_list() == [s1, s2, s3]


def test_prevent_duplicate_songs():
    """A song ID must appear only once in a playlist; duplicates must be rejected."""
    playlist = Playlist()
    s1 = Song("s1", "Original Song")
    duplicate_s1 = Song("s1", "Different Title Same ID")

    assert playlist.addSong(s1) is True
    assert playlist.addSong(duplicate_s1) is False
    assert len(playlist) == 1
    assert playlist.to_list() == [s1]


def test_next_repeat_off():
    """
    With repeat OFF:
    next() advances through songs; on the last song, it stays on the last song and returns 'end'.
    """
    playlist = Playlist()
    s1 = Song("s1", "First")
    s2 = Song("s2", "Second")
    s3 = Song("s3", "Third")

    for s in (s1, s2, s3):
        playlist.addSong(s)

    assert playlist.current_song == s1

    # Advance to second
    assert playlist.next() == s2
    assert playlist.current_song == s2

    # Advance to third (last)
    assert playlist.next() == s3
    assert playlist.current_song == s3

    # On last song with repeat off: stays on last song and returns 'end'
    assert playlist.next() == "end"
    assert playlist.current_song == s3

    # Consecutive calls still stay on last song and return 'end'
    assert playlist.next() == "end"
    assert playlist.current_song == s3


def test_next_repeat_on():
    """
    With repeat ON:
    next() on the last song wraps around to the first song.
    """
    playlist = Playlist()
    s1 = Song("s1", "First")
    s2 = Song("s2", "Second")

    playlist.addSong(s1)
    playlist.addSong(s2)
    playlist.toggleRepeat()
    assert playlist.repeat is True

    assert playlist.current_song == s1
    assert playlist.next() == s2
    assert playlist.current_song == s2

    # Wrapping around to head
    assert playlist.next() == s1
    assert playlist.current_song == s1

    # Continues normally
    assert playlist.next() == s2
    assert playlist.current_song == s2


def test_previous_repeat_off():
    """
    With repeat OFF:
    previous() moves backward; at the first song, it stays on the first song and returns 'start'.
    """
    playlist = Playlist()
    s1 = Song("s1", "First")
    s2 = Song("s2", "Second")

    playlist.addSong(s1)
    playlist.addSong(s2)

    # Move to s2 first
    playlist.next()
    assert playlist.current_song == s2

    # Move back to s1
    assert playlist.previous() == s1
    assert playlist.current_song == s1

    # At first song with repeat off: stays on first song and returns 'start'
    assert playlist.previous() == "start"
    assert playlist.current_song == s1


def test_previous_repeat_on():
    """
    With repeat ON:
    previous() on the first song wraps around to the last song (tail).
    """
    playlist = Playlist()
    s1 = Song("s1", "First")
    s2 = Song("s2", "Second")
    s3 = Song("s3", "Third")

    for s in (s1, s2, s3):
        playlist.addSong(s)

    playlist.toggleRepeat()
    assert playlist.current_song == s1

    # Wrapping back from head to tail
    assert playlist.previous() == s3
    assert playlist.current_song == s3

    # Step backward to s2
    assert playlist.previous() == s2
    assert playlist.current_song == s2


def test_toggle_repeat():
    """Toggling repeat flips the boolean flag back and forth."""
    playlist = Playlist()
    assert playlist.repeat is False
    assert playlist.toggleRepeat() is True
    assert playlist.repeat is True
    assert playlist.toggleRepeat() is False
    assert playlist.repeat is False


def test_remove_head_song_when_current():
    """Removing the head song when it is active advances current to next."""
    playlist = Playlist()
    s1 = Song("s1", "Song 1")
    s2 = Song("s2", "Song 2")
    s3 = Song("s3", "Song 3")
    for s in (s1, s2, s3):
        playlist.addSong(s)

    assert playlist.current_song == s1
    assert playlist.removeSong("s1") is True

    assert len(playlist) == 2
    assert playlist.head.song == s2
    assert playlist.head.prev is None
    assert playlist.current_song == s2
    assert "s1" not in playlist


def test_remove_head_song_when_not_current():
    """Removing head song when another song is active preserves current."""
    playlist = Playlist()
    s1 = Song("s1", "Song 1")
    s2 = Song("s2", "Song 2")
    for s in (s1, s2):
        playlist.addSong(s)

    playlist.next()  # current is now s2
    assert playlist.current_song == s2

    assert playlist.removeSong("s1") is True
    assert len(playlist) == 1
    assert playlist.head.song == s2
    assert playlist.current_song == s2


def test_remove_middle_song_when_current():
    """Removing middle song when active advances current to next and repairs DLL."""
    playlist = Playlist()
    s1 = Song("s1", "Song 1")
    s2 = Song("s2", "Song 2")
    s3 = Song("s3", "Song 3")
    for s in (s1, s2, s3):
        playlist.addSong(s)

    playlist.next()  # current is s2
    assert playlist.current_song == s2

    assert playlist.removeSong("s2") is True
    assert len(playlist) == 2

    # Pointer verification: s1 <-> s3
    assert playlist.head.song == s1
    assert playlist.tail.song == s3
    assert playlist.head.next.song == s3
    assert playlist.tail.prev.song == s1

    # Current advanced to s3
    assert playlist.current_song == s3
    assert "s2" not in playlist


def test_remove_tail_song_when_current():
    """Removing tail song when active falls back current to prev and updates tail."""
    playlist = Playlist()
    s1 = Song("s1", "Song 1")
    s2 = Song("s2", "Song 2")
    for s in (s1, s2):
        playlist.addSong(s)

    playlist.next()  # current is s2 (tail)
    assert playlist.current_song == s2

    assert playlist.removeSong("s2") is True
    assert len(playlist) == 1
    assert playlist.head.song == s1
    assert playlist.tail.song == s1
    assert playlist.tail.next is None
    assert playlist.current_song == s1
    assert "s2" not in playlist


def test_remove_only_song():
    """Removing the sole song in a playlist resets head, tail, and current to None."""
    playlist = Playlist()
    s1 = Song("s1", "Solo")
    playlist.addSong(s1)

    assert playlist.removeSong("s1") is True
    assert len(playlist) == 0
    assert playlist.head is None
    assert playlist.tail is None
    assert playlist.current is None
    assert playlist.current_song is None

    # Subsequent next/previous return None safely
    assert playlist.next() is None
    assert playlist.previous() is None


def test_remove_invalid_song_id():
    """Removing a non-existent song ID returns False without altering the playlist."""
    playlist = Playlist()
    s1 = Song("s1", "Solo")
    playlist.addSong(s1)

    assert playlist.removeSong("ghost_id") is False
    assert len(playlist) == 1
    assert playlist.current_song == s1


def test_flexible_song_inputs():
    """addSong supports Song instances, dicts, and string IDs."""
    playlist = Playlist()
    assert playlist.addSong("track1") is True
    assert playlist.addSong({"id": "track2", "title": "Track 2", "artist": "Artist 2"}) is True
    assert playlist.addSong(Song("track3", "Track 3")) is True

    assert len(playlist) == 3
    assert playlist.get_song("track1").title == "track1"
    assert playlist.get_song("track2").artist == "Artist 2"
    assert playlist.get_song("track3").id == "track3"
