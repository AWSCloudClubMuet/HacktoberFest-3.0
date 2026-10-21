"""Double-click actions (controller + service) and relative seeking."""
import os, tempfile, unittest

from music.library_manager import LibraryManager
from player.app_service import AppService
from tests.helpers import FakeAudio, make_wav


class PlayFromListTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory(); self.addCleanup(self.dir.cleanup)
        self.audio = FakeAudio(200.0)
        self.svc = AppService(LibraryManager(), self.audio, None)
        self.a, self.b, self.c = [self.svc.add_song(n, "X", make_wav(os.path.join(self.dir.name, n + ".wav")))
                                  for n in "abc"]
        self.ctl = self.svc.controller

    def test_playlist_double_click_moves_position(self):
        self.assertIn("Playing", self.svc.play_from_playlist(self.c.id))
        self.assertEqual(self.ctl.playlist.current_song.id, self.c.id)
        self.assertEqual(self.audio.played[-1], self.c.audio_path)
        self.svc.previous(); self.assertEqual(self.ctl.current_song.id, self.b.id)   # continues from c
        self.ctl.playlist.check_consistency()

    def test_library_double_click_keeps_position_and_pushes_history(self):
        self.svc.toggle_play_pause()                                  # playing a, position a
        self.svc.play_now(self.c.id)
        self.assertEqual(self.ctl.current_song.id, self.c.id)
        self.assertEqual(self.ctl.playlist.current_song.id, self.a.id)
        self.assertEqual([s.id for s in self.ctl.history_songs()], [self.a.id])

    def test_double_click_same_song_does_not_duplicate_history(self):
        self.svc.toggle_play_pause(); self.svc.play_now(self.a.id)
        self.assertEqual(self.ctl.history_songs(), [])

    def test_queue_double_click_removes_one_entry(self):
        self.svc.add_to_up_next(self.b.id); self.svc.add_to_up_next(self.c.id); self.svc.add_to_up_next(self.b.id)
        self.svc.play_from_queue(self.b.id)
        self.assertEqual([s.id for s in self.ctl.up_next_songs()], [self.c.id, self.b.id])   # order kept
        self.assertEqual(self.ctl.current_song.id, self.b.id)
        self.assertEqual(self.ctl.playlist.current_song.id, self.a.id)

    def test_unknown_songs_are_reported(self):
        self.assertIn("not in the playlist", self.svc.play_from_playlist(999))
        self.assertIn("not in Up Next", self.svc.play_from_queue(self.a.id))
        self.assertIn("No song", self.svc.play_now(999))

    def test_history_limit_still_ten(self):
        for _ in range(15):
            self.svc.play_now(self.a.id); self.svc.play_now(self.b.id)
        self.assertEqual(len(self.ctl.history_songs()), 10)


class RelativeSeekTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory(); self.addCleanup(self.dir.cleanup)
        self.audio = FakeAudio(200.0)
        self.svc = AppService(LibraryManager(), self.audio, None)
        self.svc.add_song("a", "X", make_wav(os.path.join(self.dir.name, "a.wav")))

    def test_skip_forward_and_back(self):
        self.svc.toggle_play_pause(); self.audio.clock.advance(30)
        self.svc.seek_relative(10);  self.assertAlmostEqual(self.svc.position(), 40)
        self.svc.seek_relative(-10); self.assertAlmostEqual(self.svc.position(), 30)
        self.svc.seek_relative(-999); self.assertEqual(self.svc.position(), 0.0)
        self.svc.seek_relative(999); self.assertLess(self.svc.position(), 200)

    def test_nothing_playing(self):
        self.assertEqual(self.svc.seek_relative(10), "Nothing is playing.")


if __name__ == "__main__":
    unittest.main()
