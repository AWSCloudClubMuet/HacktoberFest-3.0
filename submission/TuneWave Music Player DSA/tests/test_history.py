import unittest
from data_structures.history_stack import HistoryStack
from music.library_manager import LibraryManager
from player.playback_controller import PlaybackController


class HistoryStackTests(unittest.TestCase):
    def test_lifo_and_limit(self):
        h = HistoryStack(10)
        for i in range(1, 13):
            h.push(i)
        self.assertEqual(len(h), 10)
        self.assertEqual(h.to_list()[0], 12)         # newest first
        self.assertEqual(h.to_list()[-1], 3)         # 1 and 2 dropped
        self.assertEqual(h.pop(), 12)

    def test_empty(self):
        h = HistoryStack()
        self.assertIsNone(h.pop()); self.assertIsNone(h.peek())


class ControllerTests(unittest.TestCase):
    def setUp(self):
        self.lib = LibraryManager()
        self.pc = PlaybackController(self.lib)
        self.ids = [self.lib.add_song(t, "Art").id for t in ("A", "B", "C", "X")]
        for i in self.ids[:3]:
            self.pc.add_to_playlist(i)
        self.x = self.ids[3]

    def test_queue_does_not_move_playlist_pointer(self):
        self.pc.play(); self.pc.play_next()                 # playing B, position B
        self.pc.add_to_up_next(self.x)
        self.assertEqual(self.pc.play_next().title, "X")
        self.assertEqual(self.pc.playlist.current_song.title, "B")
        self.assertEqual(self.pc.play_next().title, "C")    # queue empty: playlist continues

    def test_back_does_not_move_playlist_pointer(self):
        self.pc.play(); self.pc.play_next(); self.pc.play_next()   # A,B,C ; history [A,B]
        self.assertEqual(self.pc.back().title, "B")
        self.assertEqual(self.pc.playlist.current_song.title, "C")
        self.assertEqual(self.pc.back().title, "A")
        self.assertIsNone(self.pc.back())                    # empty history is safe

    def test_no_self_history_entry(self):
        self.pc.play(); self.pc.play()
        self.assertEqual(len(self.pc.history), 0)

    def test_end_without_repeat(self):
        self.pc.play(); self.pc.play_next(); self.pc.play_next()
        self.assertEqual(self.pc.play_next(), "end")
        self.assertEqual(self.pc.current_song.title, "C")

    def test_unknown_id_rejected(self):
        with self.assertRaises(ValueError):
            self.pc.add_to_up_next(999)

    def test_deleted_song_skipped(self):
        self.pc.play(); self.pc.add_to_up_next(self.x); self.pc.add_to_up_next(self.ids[1])
        self.pc.delete_song(self.x)
        self.assertEqual(self.pc.play_next().title, "B")

    def test_history_cap_via_playback(self):
        self.pc.toggle_repeat(); self.pc.play()
        for _ in range(30):
            self.pc.play_next()
        self.assertEqual(len(self.pc.history), 10)


if __name__ == "__main__":
    unittest.main()
