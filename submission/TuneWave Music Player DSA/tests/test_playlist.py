import unittest
from models.song import Song
from data_structures.playlist import Playlist


def songs(n):
    return [Song(i, f"T{i}", "X") for i in range(1, n + 1)]


class PlaylistTests(unittest.TestCase):
    def make(self, n):
        p = Playlist()
        for s in songs(n):
            self.assertTrue(p.add_song(s))
        p.check_consistency()
        return p

    def test_empty_is_safe(self):
        p = Playlist()
        self.assertIsNone(p.next()); self.assertIsNone(p.previous())
        self.assertFalse(p.remove_song(1)); p.check_consistency()

    def test_duplicate_rejected(self):
        p = self.make(2)
        self.assertFalse(p.add_song(Song(1, "again", "X")))
        self.assertEqual(len(p), 2); p.check_consistency()

    def test_single_song(self):
        p = self.make(1)
        self.assertEqual(p.next(), "end"); self.assertEqual(p.previous(), "start")
        p.toggle_repeat()
        self.assertEqual(p.next().id, 1)

    def test_next_end_and_repeat(self):
        p = self.make(2)
        self.assertEqual(p.next().id, 2)
        self.assertEqual(p.next(), "end")
        self.assertEqual(p.current_song.id, 2)       # stays on last
        p.toggle_repeat()
        self.assertEqual(p.next().id, 1)             # wraps

    def test_previous_from_first(self):
        p = self.make(3)
        self.assertEqual(p.previous(), "start"); self.assertEqual(p.current_song.id, 1)
        p.toggle_repeat()
        self.assertEqual(p.previous().id, 3)

    def test_remove_first_middle_last(self):
        p = self.make(5)
        for sid in (1, 3, 5):
            self.assertTrue(p.remove_song(sid)); p.check_consistency()
        self.assertEqual([s.id for s in p.songs()], [2, 4])
        self.assertEqual(p.next().id, 4)

    def test_remove_current(self):
        p = self.make(3)
        p.next()                                     # current = 2
        p.remove_song(2); p.check_consistency()
        self.assertEqual(p.current_song.id, 3)       # moves to next
        p.remove_song(3); p.check_consistency()
        self.assertEqual(p.current_song.id, 1)       # tail removed -> previous
        p.remove_song(1); p.check_consistency()
        self.assertIsNone(p.current_song)

    def test_readd_after_remove(self):
        p = self.make(2)
        p.remove_song(1)
        self.assertTrue(p.add_song(Song(1, "T1", "X"))); p.check_consistency()


if __name__ == "__main__":
    unittest.main()
