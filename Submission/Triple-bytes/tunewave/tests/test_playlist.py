from src.playlist import Playlist, Song

def make():
    p = Playlist()
    for i, t in enumerate(["a", "b", "c"], 1):
        p.addSong(Song(i, t, "x"))
    return p

def test_duplicate_rejected():
    p = make()
    assert p.addSong(Song(1, "a", "x")) is False

def test_repeat_off_returns_end():
    p = make()
    p.next()
    p.next()
    assert p.next() == "end"
    assert p.current.song.id == 3

def test_repeat_on_wraps():
    p = make()
    p.toggleRepeat()
    p.next()
    p.next()
    assert p.next().id == 1

def test_remove_current_moves_forward():
    p = make()
    p.removeSong(1)
    assert p.current.song.id == 2

def test_remove_head_updates_head():
    p = make()
    p.removeSong(1)
    assert p.head.song.id == 2
    assert p.head.prev is None

def test_remove_tail_updates_tail():
    p = make()
    p.removeSong(3)
    assert p.tail.song.id == 2
    assert p.tail.next is None

def test_remove_middle_links_neighbors():
    p = make()
    removed = p.nodes[2]
    p.removeSong(2)
    assert p.head.next.song.id == 3
    assert p.tail.prev.song.id == 1
    assert removed.prev is None and removed.next is None

def test_remove_current_tail_moves_back():
    p = make()
    p.next()
    p.next()
    p.removeSong(3)
    assert p.current.song.id == 2

def test_remove_only_song_empties_playlist():
    p = Playlist()
    p.addSong(Song(1, "a", "x"))
    p.removeSong(1)
    assert p.head is None and p.tail is None and p.current is None

def test_remove_missing_returns_false():
    assert make().removeSong(99) is False

def test_remove_clears_hash_map():
    p = make()
    p.removeSong(2)
    assert p.getSong(2) is None
    assert p.addSong(Song(2, "b", "x")) is True

def test_next_on_empty_returns_end():
    assert Playlist().next() == "end"

def test_previous_at_start_without_repeat():
    assert make().previous() == "start"

def test_previous_wraps_with_repeat():
    p = make()
    p.toggleRepeat()
    assert p.previous().id == 3

def test_toggle_repeat_flips():
    p = make()
    assert p.toggleRepeat() is True
    assert p.toggleRepeat() is False
