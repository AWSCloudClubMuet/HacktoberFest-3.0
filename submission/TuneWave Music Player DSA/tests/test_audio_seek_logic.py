"""Tests PygameAudio's seek logic WITHOUT real pygame, using a stand-in `pygame` module.

This checks OUR code (what we ask pygame to do, positions, paused state, errors).
It does not prove real pygame/SDL behaves the same - see test_audio_backend.py for the
real-pygame tests (they are skipped when pygame is not installed).
"""
import os, sys, tempfile, types, unittest, wave

from player import audio_backend
from player.audio_backend import AudioError, PygameAudio
from player.audio_info import get_duration, write_wav_from
from tests.helpers import FakeClock, make_wav


class FakeMusic:
    def __init__(self, error):
        self.error = error; self.calls = []; self.busy = False; self.fail_start = False
        self.loaded = None; self.volume = None
    def load(self, path): self.calls.append(("load", path)); self.loaded = path
    def play(self, loops=0, start=0.0):
        self.calls.append(("play", start))
        if self.fail_start and start: raise self.error("Position not implemented for music type")
        self.busy = True
    def pause(self): self.calls.append(("pause",))
    def unpause(self): self.calls.append(("unpause",))
    def stop(self): self.calls.append(("stop",)); self.busy = False
    def unload(self): self.calls.append(("unload",))
    def get_busy(self): return self.busy
    def set_volume(self, v): self.volume = v


def install_fake_pygame():
    module = types.ModuleType("pygame")
    class PygameError(Exception): pass
    module.error = PygameError
    module.mixer = types.SimpleNamespace(init=lambda: None, quit=lambda: None, music=FakeMusic(PygameError),
                                         Sound=lambda path: types.SimpleNamespace(get_length=lambda: 0.0))
    sys.modules["pygame"] = module
    return module


class SeekLogicTests(unittest.TestCase):
    def setUp(self):
        self.saved = sys.modules.get("pygame")
        self.fake = install_fake_pygame()
        self.addCleanup(self.restore)
        self.dir = tempfile.TemporaryDirectory(); self.addCleanup(self.dir.cleanup)
        self.audio = PygameAudio()
        self.time = FakeClock(); self.audio._clock._now = self.time      # control time
        self.music = self.fake.mixer.music
        self.wav = make_wav(os.path.join(self.dir.name, "s.wav"), 2.0)   # 2 second WAV
        self.mp3 = os.path.join(self.dir.name, "s.mp3")
        with open(self.mp3, "wb") as f: f.write(b"x" * 100)             # name/extension only
        self._real_duration = audio_backend.get_duration
        audio_backend.get_duration = lambda p: 180.0 if p.endswith(".mp3") else self._real_duration(p)
        self.addCleanup(lambda: setattr(audio_backend, "get_duration", self._real_duration))

    def restore(self):
        self.audio.shutdown()
        if self.saved is None: sys.modules.pop("pygame", None)
        else: sys.modules["pygame"] = self.saved

    def test_mp3_seek_asks_pygame_to_start_at_position(self):
        self.audio.play(self.mp3); self.time.advance(10)
        self.assertEqual(self.audio.duration, 180.0)
        self.assertEqual(self.audio.seek(120), 120)                      # forward
        self.assertEqual(self.music.calls[-1], ("play", 120))
        self.time.advance(3); self.assertAlmostEqual(self.audio.position(), 123)
        self.audio.seek(15)                                              # backward
        self.assertEqual(self.music.calls[-1], ("play", 15))
        self.time.advance(1); self.assertAlmostEqual(self.audio.position(), 16)
        self.assertEqual(self.audio.state, "playing")

    def test_seek_while_paused_pauses_again(self):
        self.audio.play(self.mp3); self.audio.pause(); self.time.advance(50)
        self.audio.seek(60)
        self.assertEqual(self.audio.state, "paused"); self.assertEqual(self.music.calls[-1], ("pause",))
        self.time.advance(20); self.assertAlmostEqual(self.audio.position(), 60)

    def test_wav_seek_plays_trimmed_copy(self):
        self.audio.play(self.wav); self.assertAlmostEqual(self.audio.duration, 2.0, places=2)
        self.audio.seek(1.0)
        temp = self.music.loaded
        self.assertNotEqual(temp, self.wav); self.assertTrue(os.path.exists(temp))
        with wave.open(temp) as f: self.assertAlmostEqual(f.getnframes() / f.getframerate(), 1.0, places=2)
        self.audio.seek(0.5)                                             # second seek: old temp removed
        self.assertFalse(os.path.exists(temp)); self.assertTrue(os.path.exists(self.music.loaded))
        self.audio.stop(); self.assertFalse(os.path.exists(self.music.loaded))   # cleaned up on stop

    def test_unsupported_seek_reports_and_keeps_playing(self):
        self.audio.play(self.mp3); self.time.advance(5)
        self.music.fail_start = True
        with self.assertRaises(AudioError) as ctx: self.audio.seek(100)
        self.assertIn("not supported", str(ctx.exception)); self.assertIn("restarted", str(ctx.exception))
        self.assertEqual(self.audio.state, "playing")                    # song keeps going, not stopped
        self.assertAlmostEqual(self.audio.position(), 0.0)               # clock matches the restart
        self.assertFalse(self.audio.can_seek)                            # slider will be disabled
        with self.assertRaises(AudioError): self.audio.seek(50)          # and no second attempt

    def test_unknown_duration_and_not_playing(self):
        with self.assertRaises(AudioError): self.audio.seek(5)           # nothing playing
        audio_backend.get_duration = lambda p: None
        self.audio.play(self.mp3)
        self.assertFalse(self.audio.can_seek)
        with self.assertRaises(AudioError): self.audio.seek(5)

    def test_position_never_exceeds_duration_and_stop_resets(self):
        self.audio.play(self.mp3); self.time.advance(999)
        self.assertEqual(self.audio.position(), 180.0)
        self.audio.stop(); self.assertEqual(self.audio.position(), 0.0)

    def test_volume_is_clamped_and_applied(self):
        self.audio.play(self.mp3)
        self.assertEqual(self.audio.set_volume(2), 1.0); self.assertEqual(self.music.volume, 1.0)
        self.audio.set_volume(-1); self.assertEqual(self.music.volume, 0.0)


class AudioInfoTests(unittest.TestCase):
    def test_wav_duration_and_unknown(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertAlmostEqual(get_duration(make_wav(os.path.join(d, "a.wav"), 1.5)), 1.5, places=2)
            bad = os.path.join(d, "bad.mp3"); open(bad, "wb").close()
            self.assertIsNone(get_duration(bad)); self.assertIsNone(get_duration(os.path.join(d, "none.ogg")))

    def test_write_wav_from_beyond_end_is_empty_not_crash(self):
        with tempfile.TemporaryDirectory() as d:
            src = make_wav(os.path.join(d, "a.wav"), 1.0); out = os.path.join(d, "o.wav")
            write_wav_from(src, 99, out)
            with wave.open(out) as f: self.assertEqual(f.getnframes(), 0)


if __name__ == "__main__":
    unittest.main()
