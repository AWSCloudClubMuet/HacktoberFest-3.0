"""
Unit tests for TuneWave Music Player - Milestone 2: Up Next Queue & Playback History.
Tests FIFO queue ordering, LIFO bounded stack, playback transitions, cursor isolation,
loop prevention, capacity capping, and boundary conditions.
"""
import pytest
from src.models import Song
from src.playlist import Playlist
from src.playback import Queue, HistoryStack, Player


def test_queue_fifo_ordering():
    """Validates that Queue strictly adheres to FIFO ordering."""
    q = Queue()
    assert q.is_empty() is True
    assert len(q) == 0
    assert q.dequeue() is None
    assert q.peek() is None

    q.enqueue("first")
    q.enqueue("second")
    q.enqueue("third")

    assert q.is_empty() is False
    assert len(q) == 3
    assert q.peek() == "first"
    assert q.to_list() == ["first", "second", "third"]

    # Dequeue in FIFO order
    assert q.dequeue() == "first"
    assert len(q) == 2
    assert q.dequeue() == "second"
    assert len(q) == 1
    assert q.dequeue() == "third"
    assert len(q) == 0
    assert q.is_empty() is True
    assert q.dequeue() is None


def test_history_stack_lifo_and_capping():
    """Validates that HistoryStack operates in LIFO order and strictly caps at 10 items."""
    stack = HistoryStack(max_capacity=10)
    assert stack.is_empty() is True
    assert len(stack) == 0
    assert stack.pop() is None
    assert stack.peek() is None

    # Push 12 items: 1 through 12
    for i in range(1, 13):
        stack.push(f"song_{i}")

    # Maximum capacity is strictly enforced
    assert len(stack) == 10

    # Oldest entries (song_1 and song_2) were discarded.
    # to_list returns most recent (top) to oldest (bottom)
    expected = [f"song_{i}" for i in range(12, 2, -1)]
    assert stack.to_list() == expected

    # Pop returns in LIFO order: 12 down to 3
    for expected_item in expected:
        assert stack.pop() == expected_item

    assert len(stack) == 0
    assert stack.is_empty() is True
    assert stack.pop() is None


def test_queued_songs_take_priority_over_playlist():
    """Queued songs in Up Next must play before the playlist advances."""
    playlist = Playlist()
    s1 = Song("s1", "Song 1")
    s2 = Song("s2", "Song 2")
    s3 = Song("s3", "Song 3")
    for s in (s1, s2, s3):
        playlist.addSong(s)

    player = Player(playlist)
    assert player.current_playing == s1

    # Queue s3 to play next
    assert player.addToUpNext("s3") is True
    assert len(player.up_next) == 1

    # playNext should play queued s3 first instead of playlist's next (s2)
    played = player.playNext()
    assert played == s3
    assert player.current_playing == s3
    assert len(player.up_next) == 0


def test_playlist_cursor_remains_unchanged_when_queued_song_plays():
    """Playing a queued song must NOT modify the playlist.current cursor."""
    playlist = Playlist()
    s1 = Song("s1", "Song 1")
    s2 = Song("s2", "Song 2")
    s3 = Song("s3", "Song 3")
    for s in (s1, s2, s3):
        playlist.addSong(s)

    player = Player(playlist)
    assert playlist.current_song == s1
    assert player.current_playing == s1

    # Queue s3 and play it
    player.addToUpNext("s3")
    player.playNext()

    # Active track is s3, but playlist cursor remains locked at s1
    assert player.current_playing == s3
    assert playlist.current_song == s1


def test_playlist_resumes_from_cursor_after_queue_empties():
    """After all queued songs finish, playNext advances the playlist from its saved cursor."""
    playlist = Playlist()
    s1 = Song("s1", "Song 1")
    s2 = Song("s2", "Song 2")
    s3 = Song("s3", "Song 3")
    for s in (s1, s2, s3):
        playlist.addSong(s)

    player = Player(playlist)
    # Advance to s2 in playlist
    player.playNext()
    assert playlist.current_song == s2
    assert player.current_playing == s2

    # Queue two songs
    player.addToUpNext("s1")
    player.addToUpNext("s1")

    # Both queued songs play
    assert player.playNext() == s1
    assert playlist.current_song == s2  # Cursor still s2
    assert player.playNext() == s1
    assert playlist.current_song == s2  # Cursor still s2

    # Now queue is empty; playlist resumes advancing from s2 to s3
    resumed = player.playNext()
    assert resumed == s3
    assert player.current_playing == s3
    assert playlist.current_song == s3


def test_history_supports_back_and_removes_entries():
    """back() replays the most recently played previous song and pops it from history."""
    playlist = Playlist()
    s1 = Song("s1", "Song 1")
    s2 = Song("s2", "Song 2")
    s3 = Song("s3", "Song 3")
    for s in (s1, s2, s3):
        playlist.addSong(s)

    player = Player(playlist)
    # Initial: s1 playing
    assert player.current_playing == s1

    # Transition s1 -> s2: s1 enters history
    player.playNext()
    assert player.current_playing == s2
    assert len(player.history) == 1
    assert player.history.peek() == s1

    # Transition s2 -> s3: s2 enters history
    player.playNext()
    assert player.current_playing == s3
    assert len(player.history) == 2
    assert player.history.peek() == s2

    # First back(): replays s2, pops s2 from history
    replayed = player.back()
    assert replayed == s2
    assert player.current_playing == s2
    assert len(player.history) == 1
    assert player.history.peek() == s1

    # Second back(): replays s1, pops s1 from history
    replayed_first = player.back()
    assert replayed_first == s1
    assert player.current_playing == s1
    assert len(player.history) == 0

    # Third back(): history empty -> returns None, current remains s1
    assert player.back() is None
    assert player.current_playing == s1


def test_replaying_history_does_not_modify_playlist_cursor():
    """Replaying from history must NOT alter the playlist.current position."""
    playlist = Playlist()
    s1 = Song("s1", "Song 1")
    s2 = Song("s2", "Song 2")
    for s in (s1, s2):
        playlist.addSong(s)

    player = Player(playlist)
    player.playNext()  # Moves to s2; playlist cursor is s2
    assert playlist.current_song == s2
    assert player.current_playing == s2

    # back() replays s1
    player.back()
    assert player.current_playing == s1
    # Playlist cursor remains at s2!
    assert playlist.current_song == s2


def test_no_immediate_replay_loop_on_back():
    """
    When back() replays song A, song B must NOT be pushed onto history.
    Consecutive calls to back() must traverse back in history rather than ping-ponging.
    """
    playlist = Playlist()
    s1 = Song("s1", "Song 1")
    s2 = Song("s2", "Song 2")
    s3 = Song("s3", "Song 3")
    for s in (s1, s2, s3):
        playlist.addSong(s)

    player = Player(playlist)
    player.playNext()  # s1 -> s2 (history: [s1])
    player.playNext()  # s2 -> s3 (history: [s1, s2])

    assert player.current_playing == s3
    assert len(player.history) == 2

    # First back: replays s2, history becomes [s1]
    assert player.back() == s2
    assert len(player.history) == 1

    # Second back: replays s1, history becomes []
    # (If s3 had been pushed on first back, this would have replayed s3, creating a loop!)
    assert player.back() == s1
    assert len(player.history) == 0

    # Third back: history is empty, returns None
    assert player.back() is None


def test_history_capped_at_10_discards_oldest():
    """History holds at most 10 songs. When full, the oldest entry is dropped."""
    playlist = Playlist()
    songs = [Song(f"s{i}", f"Track {i}") for i in range(1, 16)]
    for s in songs:
        playlist.addSong(s)

    player = Player(playlist)
    # Start at s1. Play through to s15 (14 transitions)
    for _ in range(14):
        player.playNext()

    assert player.current_playing == songs[14]  # s15
    assert len(player.history) == 10

    # Oldest 4 songs (s1, s2, s3, s4) were discarded.
    # The 10 songs in history should be s14 down to s5
    history_songs = player.get_history()
    assert history_songs == [songs[i] for i in range(13, 3, -1)]

    # Calling back 10 times should return s14 down to s5
    for i in range(13, 3, -1):
        assert player.back() == songs[i]

    # 11th call returns None (s4 was discarded)
    assert player.back() is None


def test_empty_queue_and_empty_history():
    """Handles an empty player gracefully without exceptions."""
    player = Player()  # Default empty playlist
    assert player.current_playing is None
    assert player.playNext() is None
    assert player.back() is None
    assert len(player.up_next) == 0
    assert len(player.history) == 0


def test_invalid_song_ids_do_not_corrupt_queue():
    """addToUpNext with invalid song ID returns False and leaves queue state intact."""
    playlist = Playlist()
    playlist.addSong(Song("valid_1", "Track 1"))
    player = Player(playlist)

    # Attempting to queue a non-existent ID
    assert player.addToUpNext("non_existent_id") is False
    assert len(player.up_next) == 0

    # Adding a valid ID succeeds
    assert player.addToUpNext("valid_1") is True
    assert len(player.up_next) == 1

    # Adding another invalid ID does not change queue
    assert player.addToUpNext("bogus") is False
    assert len(player.up_next) == 1
    assert player.up_next.peek().id == "valid_1"


def test_repeat_off_end_of_playlist_behavior():
    """
    With repeat OFF:
    When playlist reaches the end, playNext() returns 'end',
    leaves current_playing on the last song, and records NO transition in history.
    """
    playlist = Playlist()
    s1 = Song("s1", "First")
    s2 = Song("s2", "Last")
    playlist.addSong(s1)
    playlist.addSong(s2)

    player = Player(playlist)
    assert player.current_playing == s1

    # Advance to last song: s1 -> s2
    assert player.playNext() == s2
    assert player.current_playing == s2
    assert len(player.history) == 1
    assert player.history.peek() == s1

    # On last song with repeat off: returns 'end'
    assert player.playNext() == "end"
    assert player.current_playing == s2
    # History must NOT record a duplicate transition
    assert len(player.history) == 1

    # Calling playNext again still returns 'end' with no history push
    assert player.playNext() == "end"
    assert len(player.history) == 1

    # back() still safely returns s1
    assert player.back() == s1
    assert player.current_playing == s1


def test_repeat_on_wrap_with_history():
    """
    With repeat ON:
    When playNext wraps from last song to first, a normal transition is recorded in history.
    """
    playlist = Playlist()
    s1 = Song("s1", "Song 1")
    s2 = Song("s2", "Song 2")
    playlist.addSong(s1)
    playlist.addSong(s2)
    playlist.toggleRepeat()

    player = Player(playlist)
    assert player.playNext() == s2
    assert len(player.history) == 1
    assert player.history.peek() == s1

    # Wrapping around to s1
    assert player.playNext() == s1
    assert player.current_playing == s1
    assert len(player.history) == 2
    assert player.history.peek() == s2

    # back() returns s2
    assert player.back() == s2


def test_playlist_direct_delegation():
    """Validates that calling addToUpNext, playNext, and back directly on Playlist works."""
    playlist = Playlist()
    s1 = Song("s1", "Song 1")
    s2 = Song("s2", "Song 2")
    playlist.addSong(s1)
    playlist.addSong(s2)

    # Calling through playlist
    assert playlist.addToUpNext("s2") is True
    assert playlist.playNext() == s2
    assert playlist.back() == s1
