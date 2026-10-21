
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models import Song
from playlist import Playlist
from playback import PlaybackManager, SongQueue, SongStack


class TestPlayback(unittest.TestCase):

    def setUp(self):
        self.playlist = Playlist()

        self.a = Song("S001", "Song A", "Artist A")
        self.b = Song("S002", "Song B", "Artist B")
        self.c = Song("S003", "Song C", "Artist C")
        self.x = Song("S004", "Song X", "Artist X")

        for song in (self.a, self.b, self.c, self.x):
            self.playlist.add_song(song)

        self.playback = PlaybackManager(self.playlist)

    def test_queue_fifo(self):
        queue = SongQueue()
        queue.enqueue(self.a)
        queue.enqueue(self.b)

        self.assertEqual(queue.dequeue(), self.a)
        self.assertEqual(queue.dequeue(), self.b)
        self.assertIsNone(queue.dequeue())

    def test_stack_lifo(self):
        stack = SongStack()
        stack.push(self.a)
        stack.push(self.b)

        self.assertEqual(stack.pop(), self.b)
        self.assertEqual(stack.pop(), self.a)
        self.assertIsNone(stack.pop())

    def test_history_limit(self):
        stack = SongStack()

        for i in range(12):
            stack.push(Song(str(i), f"Song {i}", "Artist"))

        self.assertEqual(len(stack), 10)
        self.assertEqual(stack.get_songs()[0].song_id, "2")
        self.assertEqual(stack.get_songs()[-1].song_id, "11")

    def test_up_next_does_not_move_playlist(self):
        self.assertTrue(self.playback.add_to_up_next("S004"))

        result = self.playback.play_next()

        self.assertEqual(result, self.x)
        self.assertEqual(self.playlist.get_current_song(), self.a)
        self.assertEqual(self.playback.get_currently_playing(), self.x)

    def test_playlist_resumes_after_queue(self):
        self.playback.add_to_up_next("S004")

        self.assertEqual(self.playback.play_next(), self.x)
        self.assertEqual(self.playback.play_next(), self.b)
        self.assertEqual(self.playlist.get_current_song(), self.b)

    def test_back_restores_previous_song(self):
        self.playback.play_next()  # A -> B

        self.assertEqual(self.playback.get_currently_playing(), self.b)
        self.assertEqual(self.playback.back(), self.a)
        self.assertTrue(self.playback.history.is_empty())

        # Back must not move the playlist pointer.
        self.assertEqual(self.playlist.get_current_song(), self.b)

    def test_invalid_song_id(self):
        self.assertFalse(self.playback.add_to_up_next("UNKNOWN"))

    def test_empty_history(self):
        self.assertIsNone(self.playback.back())


if __name__ == "__main__":
    unittest.main()
