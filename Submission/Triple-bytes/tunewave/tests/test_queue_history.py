from src.playlist import Playlist, Song
from src.queue_history import Player

def make_player(count=3):
    p = Playlist()
    for i in range(1, count + 1):
        p.addSong(Song(i, "t" + str(i), "x"))
    return Player(p)

def test_up_next_plays_before_playlist():
    pl = make_player()
    pl.addToUpNext(3)
    assert pl.playNext().id == 3

def test_up_next_does_not_move_playlist_position():
    pl = make_player()
    pl.addToUpNext(3)
    pl.playNext()
    assert pl.playlist.current.song.id == 1

def test_playlist_continues_after_queue_empties():
    pl = make_player()
    pl.addToUpNext(3)
    pl.playNext()
    assert pl.playNext().id == 2

def test_queue_is_first_in_first_out():
    pl = make_player()
    pl.addToUpNext(3)
    pl.addToUpNext(2)
    assert pl.playNext().id == 3
    assert pl.playNext().id == 2

def test_add_unknown_song_rejected():
    assert make_player().addToUpNext(99) is False

def test_removed_song_in_queue_is_skipped():
    pl = make_player()
    pl.addToUpNext(2)
    pl.playlist.removeSong(2)
    assert pl.playNext().id == 3

def test_play_next_at_end_returns_end():
    pl = make_player(1)
    assert pl.playNext() == "end"
    assert len(pl.history) == 0

def test_history_keeps_last_ten():
    pl = make_player(15)
    for _ in range(12):
        pl.playNext()
    assert len(pl.history) == 10
    assert pl.history[0].id == 4

def test_back_returns_top_and_removes_it():
    pl = make_player()
    pl.playNext()
    pl.playNext()
    assert pl.back().id == 3
    assert len(pl.history) == 1

def test_back_does_not_re_add_to_history():
    pl = make_player()
    pl.playNext()
    pl.back()
    assert pl.back() is None

def test_back_does_not_move_playlist_position():
    pl = make_player()
    pl.playNext()
    pl.playNext()
    pl.back()
    assert pl.playlist.current.song.id == 3
