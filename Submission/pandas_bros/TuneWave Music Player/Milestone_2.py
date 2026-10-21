"""
Milestone 2 - Up Next (queue) and History (stack)

Rules implemented
  1. Songs in Up Next play before the playlist continues.            -> playNext() drains the queue first
  2. Playing from Up Next or history does not move playlist position. -> only playlist plays advance `playlist_pos`
  3. History keeps the last 10 songs played, dropping the oldest.     -> deque(maxlen=10), O(1) drop
  4. back() replays the top song and removes it from history.         -> pop from the history stack

Design decisions (the spec leaves these open; each is one line of code, easy to change)
  * `current` is the song playing right now. It is NOT in history; it goes onto history when it is
    replaced by playNext(). So history = "songs I already heard before the current one",
    and back() therefore goes to the previous song instead of replaying the current one.
  * back() does not push the song you are leaving onto history (the spec only says the replayed
    song is removed). The replayed song is pushed again when you move on from it, like any played song.
  * If there is nothing to play (Up Next empty and playlist finished), playNext() returns None and
    changes nothing. If history is empty, back() returns None and changes nothing.
  * Up Next may contain duplicates (the same song can be queued twice).

All operations are O(1).
"""
from collections import deque
from typing import Deque, List, Optional

HISTORY_LIMIT = 10


class MusicPlayer:
    def __init__(self, playlist: List[str], history_limit: int = HISTORY_LIMIT):
        self.playlist = list(playlist)
        self.playlist_pos = 0                              # index of the next playlist song to play
        self.up_next: Deque[str] = deque()                 # FIFO queue
        self.history: Deque[str] = deque(maxlen=history_limit)   # LIFO stack, oldest dropped automatically
        self.current: Optional[str] = None

    # ------------------------------------------------------------------ operations
    def addToUpNext(self, songId: str) -> None:
        """Queue a song to play after the current one, before the playlist continues."""
        self.up_next.append(songId)

    def playNext(self) -> Optional[str]:
        """Play the next song: Up Next first, otherwise the playlist. Returns the song id or None."""
        if self.up_next:
            song = self.up_next.popleft()                  # does NOT touch playlist_pos
        elif self.playlist_pos < len(self.playlist):
            song = self.playlist[self.playlist_pos]
            self.playlist_pos += 1                         # only playlist plays advance the position
        else:
            return None                                    # nothing left; state unchanged
        if self.current is not None:
            self.history.append(self.current)              # the song we just finished goes to history
        self.current = song
        return song

    def back(self) -> Optional[str]:
        """Replay the most recent song from history and remove it from history. Returns the id or None."""
        if not self.history:
            return None
        self.current = self.history.pop()                  # does NOT touch playlist_pos or Up Next
        return self.current

    # ------------------------------------------------------------------ helpers
    def state(self) -> str:
        return (f"current={self.current!r} up_next={list(self.up_next)} "
                f"history(oldest->newest)={list(self.history)} playlist_pos={self.playlist_pos}")


# ====================================================================== tests
import unittest


class TestMusicPlayer(unittest.TestCase):
    def setUp(self):
        self.p = MusicPlayer(["p1", "p2", "p3", "p4", "p5"])

    def test_playlist_plays_in_order(self):
        self.assertEqual([self.p.playNext() for _ in range(3)], ["p1", "p2", "p3"])

    def test_up_next_plays_before_playlist_and_fifo(self):
        self.p.playNext()                                  # p1
        self.p.addToUpNext("a"); self.p.addToUpNext("b")
        self.assertEqual([self.p.playNext(), self.p.playNext(), self.p.playNext()], ["a", "b", "p2"])

    def test_up_next_does_not_move_playlist_position(self):
        self.p.playNext()                                  # p1, pos=1
        self.p.addToUpNext("a"); self.p.addToUpNext("b")
        self.p.playNext(); self.p.playNext()               # a, b
        self.assertEqual(self.p.playlist_pos, 1)
        self.assertEqual(self.p.playNext(), "p2")          # playlist resumes where it left off

    def test_back_replays_previous_and_removes_from_history(self):
        for _ in range(3): self.p.playNext()               # p1 p2 p3 ; history [p1, p2]
        self.assertEqual(self.p.back(), "p2")
        self.assertEqual(list(self.p.history), ["p1"])
        self.assertEqual(self.p.back(), "p1")
        self.assertEqual(list(self.p.history), [])

    def test_back_does_not_move_playlist_position(self):
        for _ in range(3): self.p.playNext()
        pos = self.p.playlist_pos
        self.p.back(); self.p.back()
        self.assertEqual(self.p.playlist_pos, pos)
        self.assertEqual(self.p.playNext(), "p4")          # playlist continues, not from the replayed song

    def test_back_does_not_consume_up_next(self):
        self.p.playNext(); self.p.playNext()
        self.p.addToUpNext("a")
        self.p.back()
        self.assertEqual(list(self.p.up_next), ["a"])

    def test_back_on_empty_history_is_noop(self):
        self.assertIsNone(self.p.back())
        self.p.playNext()                                  # current=p1, history empty
        self.assertIsNone(self.p.back())
        self.assertEqual(self.p.current, "p1")

    def test_history_keeps_last_10_and_drops_oldest(self):
        p = MusicPlayer([f"s{i}" for i in range(30)])
        for _ in range(15): p.playNext()                   # current=s14, history = s4..s13
        self.assertEqual(len(p.history), 10)
        self.assertEqual(list(p.history), [f"s{i}" for i in range(4, 14)])
        popped = [p.back() for _ in range(12)]             # only 10 available, then None
        self.assertEqual(popped[:10], [f"s{i}" for i in range(13, 3, -1)])
        self.assertEqual(popped[10:], [None, None])

    def test_up_next_songs_enter_history(self):
        self.p.playNext(); self.p.addToUpNext("a"); self.p.playNext(); self.p.playNext()   # p1, a, p2
        self.assertEqual(list(self.p.history), ["p1", "a"])
        self.assertEqual(self.p.back(), "a")               # can go back to an Up Next song

    def test_replayed_song_returns_to_history_when_moving_on(self):
        for _ in range(3): self.p.playNext()               # p1 p2 p3, history [p1,p2]
        self.p.back()                                      # current p2, history [p1]
        self.p.playNext()                                  # plays p4; p2 goes back on history
        self.assertEqual(list(self.p.history), ["p1", "p2"])

    def test_exhausted_playlist_returns_none_and_keeps_state(self):
        p = MusicPlayer(["x"])
        self.assertEqual(p.playNext(), "x")
        before = p.state()
        self.assertIsNone(p.playNext())
        self.assertEqual(p.state(), before)

    def test_duplicates_allowed_in_up_next(self):
        self.p.addToUpNext("a"); self.p.addToUpNext("a")
        self.assertEqual([self.p.playNext(), self.p.playNext()], ["a", "a"])


def demo():
    p = MusicPlayer(["song1", "song2", "song3", "song4", "song5"])
    steps = [("playNext()", p.playNext), ("playNext()", p.playNext),
             ("addToUpNext('A')", lambda: p.addToUpNext("A")), ("addToUpNext('B')", lambda: p.addToUpNext("B")),
             ("playNext()", p.playNext), ("playNext()", p.playNext), ("playNext()", p.playNext),
             ("back()", p.back), ("back()", p.back), ("back()", p.back), ("back()", p.back), ("back()", p.back)]
    print("Demo (playlist = song1..song5)\n")
    for name, fn in steps:
        r = fn()
        print(f"{name:<18} -> {r!s:<8} | {p.state()}")


if __name__ == "__main__":
    result = unittest.main(argv=["x"], exit=False, verbosity=1).result
    print()
    demo()