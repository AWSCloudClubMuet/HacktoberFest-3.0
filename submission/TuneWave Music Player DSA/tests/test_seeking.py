"""Seeking through AppService (with silent FakeAudio): state must stay consistent."""
import os, tempfile, unittest

from music.library_manager import LibraryManager
from player.app_service import AppService
from tests.helpers import FakeAudio, make_wav


class SeekServiceTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory(); self.addCleanup(self.dir.cleanup)
        self.audio = FakeAudio(duration=200.0)
        self.svc = AppService(LibraryManager(), self.audio, None)
        self.songs = [self.svc.add_song(f"Song {n}", "Artist", make_wav(os.path.join(self.dir.name, f"{n}.wav")))
                      for n in "abc"]

    def snapshot(self):
        c = self.svc.controller
        return (c.playlist.current_song.id, [s.id for s in c.playlist.songs()],
                [s.id for s in c.up_next_songs()], [s.id for s in c.history_songs()],
                c.current_song.id)

    def test_progress_follows_the_clock(self):
        self.svc.toggle_play_pause()
        self.audio.clock.advance(50)
        self.assertAlmostEqual(self.svc.position(), 50)
        self.assertAlmostEqual(self.svc.progress_fraction(), 0.25)
        self.assertEqual(self.svc.duration(), 200.0)

    def test_seek_forward_then_backward_during_playback(self):
        self.svc.toggle_play_pause(); self.audio.clock.advance(10)
        self.assertEqual(self.svc.seek_fraction(0.75), "Jumped to 2:30.")     # forward to 150 s
        self.assertAlmostEqual(self.svc.position(), 150)
        self.audio.clock.advance(4); self.assertAlmostEqual(self.svc.position(), 154)
        self.assertEqual(self.svc.seek(20), "Jumped to 0:20.")                # backward
        self.assertAlmostEqual(self.svc.position(), 20)
        self.assertEqual(self.audio.seeks, [150.0, 20.0])                     # backend really told to jump
        self.assertEqual(self.audio.state, "playing")

    def test_seek_does_not_touch_playlist_history_or_queue(self):
        a, b, c = self.songs
        self.svc.toggle_play_pause(); self.svc.next()          # playing b, history = [a]
        self.svc.add_to_up_next(c.id); self.svc.add_to_up_next(a.id)
        before = self.snapshot()
        for fraction in (0.9, 0.1, 0.5, 0.0, 1.0):
            self.svc.seek_fraction(fraction)
        self.assertEqual(self.snapshot(), before)
        self.assertEqual(len(self.audio.played), 2)            # no song was restarted by seeking

    def test_seek_while_playing_from_up_next_keeps_position(self):
        a, b, c = self.songs
        self.svc.toggle_play_pause(); self.svc.add_to_up_next(c.id); self.svc.next()   # c from queue
        before = self.snapshot(); self.svc.seek(30)
        self.assertEqual(self.snapshot(), before)
        self.assertEqual(self.svc.controller.playlist.current_song.id, a.id)

    def test_seek_while_paused_stays_paused(self):
        self.svc.toggle_play_pause(); self.audio.clock.advance(5); self.svc.toggle_play_pause()
        self.svc.seek(90); self.audio.clock.advance(60)
        self.assertEqual(self.audio.state, "paused"); self.assertAlmostEqual(self.svc.position(), 90)
        self.svc.toggle_play_pause(); self.audio.clock.advance(2)
        self.assertAlmostEqual(self.svc.position(), 92)

    def test_seek_beyond_ends_is_clamped(self):
        self.svc.toggle_play_pause()
        self.svc.seek(9999); self.assertLess(self.svc.position(), 200)
        self.svc.seek(-50);  self.assertEqual(self.svc.position(), 0.0)

    def test_seek_with_nothing_playing(self):
        self.assertEqual(self.svc.seek(10), "Nothing is playing.")
        self.assertEqual(self.svc.seek_fraction(0.5), "Nothing is playing.")
        self.assertEqual(self.svc.progress_fraction(), 0.0)
        self.assertFalse(self.svc.can_seek())

    def test_unknown_duration_is_handled(self):
        self.audio.next_duration = None
        self.svc.toggle_play_pause()
        self.assertFalse(self.svc.can_seek()); self.assertIsNone(self.svc.duration())
        self.assertIn("unknown", self.svc.seek_fraction(0.5)); self.assertIn("unknown", self.svc.seek(5))
        self.assertEqual(self.svc.progress_fraction(), 0.0)
        self.assertEqual(self.audio.seeks, [])

    def test_new_song_resets_position(self):
        self.svc.toggle_play_pause(); self.svc.seek(120); self.svc.next()
        self.assertAlmostEqual(self.svc.position(), 0)

    def test_seek_then_finish_advances_once(self):
        self.svc.toggle_play_pause(); self.svc.seek(150)
        self.audio.finished = True
        self.assertIn("Playing", self.svc.poll())              # moves to the next song once
        self.assertEqual(self.svc.controller.current_song.title, "Song b")
        self.assertEqual(len(self.svc.controller.history_songs()), 1)   # no duplicate history entry

    def test_volume(self):
        self.assertEqual(self.svc.set_volume(0.3), 0.3); self.assertEqual(self.svc.volume, 0.3)
        self.assertEqual(self.svc.set_volume(5), 1.0); self.assertEqual(self.svc.set_volume(-1), 0.0)

    def test_repeat_behaviour_unchanged_by_seeking(self):
        a, b, c = self.songs
        self.svc.toggle_repeat()
        self.svc.toggle_play_pause(); self.svc.next(); self.svc.next()      # now on c (last)
        self.svc.seek(10)
        self.assertEqual(self.svc.controller.playlist.current_song.id, c.id)
        self.svc.next()                                                     # repeat on: wraps to a
        self.assertEqual(self.svc.controller.playlist.current_song.id, a.id)
        self.assertAlmostEqual(self.svc.position(), 0)                      # new song starts at 0

    def test_repeat_off_end_after_seek(self):
        self.svc.toggle_play_pause(); self.svc.next(); self.svc.next()      # on c, repeat off
        self.svc.seek(10)
        self.assertIn("End of playlist", self.svc.next())


if __name__ == "__main__":
    unittest.main()
