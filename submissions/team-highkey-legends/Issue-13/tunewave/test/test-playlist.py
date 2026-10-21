
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models import Song
from playlist import Playlist


class TestPlaylist(unittest.TestCase):

    def setUp(self):
        self.playlist = Playlist()
        self.a = Song("S001", "Song A", "Artist A")
        self.b = Song("S002", "Song B", "Artist B")
        self.c = Song("S003", "Song C", "Artist C")

    def test_add_and_duplicate(self):
        self.assertTrue(self.playlist.add_song(self.a))
        self.assertFalse(self.playlist.add_song(self.a))
        self.assertEqual(len(self.playlist), 1)

    def test_next_and_previous(self):
        for song in (self.a, self.b, self.c):
            self.playlist.add_song(song)

        self.assertEqual(self.playlist.get_current_song(), self.a)
        self.assertEqual(self.playlist.next_song(), self.b)
        self.assertEqual(self.playlist.next_song(), self.c)
        self.assertIsNone(self.playlist.next_song())

        self.assertEqual(self.playlist.previous_song(), self.b)

    def test_repeat(self):
        self.playlist.add_song(self.a)
        self.playlist.add_song(self.b)

        self.playlist.next_song()
        self.assertIsNone(self.playlist.next_song())

        self.assertTrue(self.playlist.toggle_repeat())
        self.assertEqual(self.playlist.next_song(), self.a)

        self.assertEqual(self.playlist.previous_song(), self.b)

    def test_remove(self):
        for song in (self.a, self.b, self.c):
            self.playlist.add_song(song)

        self.assertTrue(self.playlist.remove_song("S002"))
        self.assertEqual(
            self.playlist.get_songs(), [self.a, self.c]
        )
        self.assertFalse(self.playlist.remove_song("S999"))

    def test_remove_current_and_last_song(self):
        self.playlist.add_song(self.a)
        self.playlist.add_song(self.b)

        self.assertEqual(self.playlist.remove_song("S001"), True)
        self.assertEqual(self.playlist.get_current_song(), self.b)

        self.assertTrue(self.playlist.remove_song("S002"))
        self.assertIsNone(self.playlist.get_current_song())
        self.assertEqual(len(self.playlist), 0)


if __name__ == "__main__":
    unittest.main()
