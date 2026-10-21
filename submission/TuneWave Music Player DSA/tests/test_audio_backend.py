"""Real pygame playback, using SDL's silent 'dummy' audio device so no speakers are needed."""
import os, tempfile, time, unittest

os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
os.environ.setdefault("PYGAME_HIDE_SUPPORT_PROMPT", "1")

try:
    import pygame  # noqa: F401
    HAVE_PYGAME = True
except ImportError:
    HAVE_PYGAME = False

from player.audio_backend import AudioError, PygameAudio, validate_audio_file
from tests.helpers import make_wav


class ValidationTests(unittest.TestCase):
    def test_validate(self):
        with tempfile.TemporaryDirectory() as d:
            good = make_wav(os.path.join(d, "a.WAV")); validate_audio_file(good)   # extension check ignores case
            with self.assertRaises(ValueError): validate_audio_file("")
            with self.assertRaises(ValueError): validate_audio_file(os.path.join(d, "missing.mp3"))
            bad = os.path.join(d, "a.txt"); open(bad, "w").close()
            with self.assertRaises(ValueError): validate_audio_file(bad)


@unittest.skipUnless(HAVE_PYGAME, "pygame not installed")
class PygameTests(unittest.TestCase):
    def setUp(self):
        self.audio = PygameAudio(); self.addCleanup(self.audio.shutdown)
        self.dir = tempfile.TemporaryDirectory(); self.addCleanup(self.dir.cleanup)

    def test_play_pause_resume_stop_finish(self):
        path = make_wav(os.path.join(self.dir.name, "t.wav"), 0.4)
        self.audio.play(path); self.assertEqual(self.audio.state, "playing")
        self.audio.pause(); self.assertEqual(self.audio.state, "paused"); self.assertFalse(self.audio.has_finished())
        self.audio.resume(); self.assertEqual(self.audio.state, "playing")
        deadline = time.time() + 5
        while not self.audio.has_finished() and time.time() < deadline:
            time.sleep(0.05)
        self.assertTrue(self.audio.has_finished())              # song ended by itself
        self.audio.stop(); self.assertEqual(self.audio.state, "stopped")

    def test_corrupt_file_raises_audio_error(self):
        path = os.path.join(self.dir.name, "broken.wav")
        with open(path, "wb") as f: f.write(b"this is not audio at all")
        with self.assertRaises(AudioError): self.audio.play(path)
        self.assertEqual(self.audio.state, "stopped")

    def test_missing_and_unsupported(self):
        with self.assertRaises(AudioError): self.audio.play(os.path.join(self.dir.name, "none.mp3"))
        txt = os.path.join(self.dir.name, "n.txt"); open(txt, "w").close()
        with self.assertRaises(AudioError): self.audio.play(txt)

    # ---- seeking with the REAL pygame (skipped when pygame is missing) -------------
    def test_seek_forward_and_backward_wav(self):
        path = make_wav(os.path.join(self.dir.name, "long.wav"), 3.0)
        self.audio.play(path)
        self.assertAlmostEqual(self.audio.duration, 3.0, places=1)
        self.assertAlmostEqual(self.audio.seek(2.0), 2.0)                # forward
        self.assertEqual(self.audio.state, "playing")
        self.assertGreaterEqual(self.audio.position(), 2.0); self.assertLess(self.audio.position(), 2.6)
        self.assertAlmostEqual(self.audio.seek(0.5), 0.5)                # backward
        self.assertLess(self.audio.position(), 1.1)
        self.assertFalse(self.audio.has_finished())

    def test_seek_while_paused_stays_paused_wav(self):
        path = make_wav(os.path.join(self.dir.name, "p.wav"), 3.0)
        self.audio.play(path); self.audio.pause(); self.audio.seek(1.5)
        self.assertEqual(self.audio.state, "paused"); time.sleep(0.3)
        self.assertAlmostEqual(self.audio.position(), 1.5, places=1)
        self.audio.resume(); self.assertEqual(self.audio.state, "playing")

    def test_seek_near_end_finishes_by_itself(self):
        path = make_wav(os.path.join(self.dir.name, "e.wav"), 2.0)
        self.audio.play(path); self.audio.seek(99)                       # clamped just before the end
        deadline = time.time() + 5
        while not self.audio.has_finished() and time.time() < deadline: time.sleep(0.05)
        self.assertTrue(self.audio.has_finished())

    def test_seek_with_nothing_playing_raises(self):
        with self.assertRaises(AudioError): self.audio.seek(1.0)

    def test_volume(self):
        self.assertEqual(self.audio.set_volume(0.4), 0.4)
        self.audio.play(make_wav(os.path.join(self.dir.name, "v.wav"), 0.5))
        self.assertEqual(self.audio.set_volume(3), 1.0)


if __name__ == "__main__":
    unittest.main()
