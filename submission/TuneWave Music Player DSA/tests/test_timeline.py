"""Seek maths, time formatting and the playback clock (no pygame, no Tkinter)."""
import unittest

from player.timeline import (END_GUARD, PlaybackClock, clamp_seek, format_time,
                             fraction_to_seconds, seconds_to_fraction)
from tests.helpers import FakeClock


class FormatTests(unittest.TestCase):
    def test_format_time(self):
        self.assertEqual(format_time(0), "0:00")
        self.assertEqual(format_time(59.9), "0:59")
        self.assertEqual(format_time(72.4), "1:12")
        self.assertEqual(format_time(3600), "60:00")
        self.assertEqual(format_time(None), "--:--")
        self.assertEqual(format_time(-1), "--:--")


class SeekMathTests(unittest.TestCase):
    def test_clamp(self):
        self.assertEqual(clamp_seek(-5, 100), 0.0)
        self.assertEqual(clamp_seek(40, 100), 40)
        self.assertEqual(clamp_seek(500, 100), 100 - END_GUARD)
        self.assertEqual(clamp_seek(0.1, 0.2), 0.0)          # tiny song: never negative
        self.assertEqual(clamp_seek(30, None), 30)           # unknown length: only lower bound

    def test_fraction_to_seconds(self):
        self.assertEqual(fraction_to_seconds(0.5, 200), 100)
        self.assertEqual(fraction_to_seconds(0.0, 200), 0)
        self.assertEqual(fraction_to_seconds(1.0, 200), 200 - END_GUARD)
        self.assertEqual(fraction_to_seconds(-3, 200), 0)     # slider overshoot is clamped
        self.assertEqual(fraction_to_seconds(7, 200), 200 - END_GUARD)
        self.assertIsNone(fraction_to_seconds(0.5, None))
        self.assertIsNone(fraction_to_seconds(0.5, 0))

    def test_seconds_to_fraction(self):
        self.assertEqual(seconds_to_fraction(50, 200), 0.25)
        self.assertEqual(seconds_to_fraction(500, 200), 1.0)
        self.assertEqual(seconds_to_fraction(-1, 200), 0.0)
        self.assertEqual(seconds_to_fraction(10, None), 0.0)


class ClockTests(unittest.TestCase):
    def setUp(self):
        self.t = FakeClock(); self.clock = PlaybackClock(self.t)

    def test_runs_pauses_resumes(self):
        self.clock.start(); self.t.advance(10)
        self.assertAlmostEqual(self.clock.position(), 10)
        self.clock.pause(); self.t.advance(30)                # time passes while paused
        self.assertAlmostEqual(self.clock.position(), 10)
        self.clock.resume(); self.t.advance(5)
        self.assertAlmostEqual(self.clock.position(), 15)

    def test_seek_forward_and_backward_while_running(self):
        self.clock.start(); self.t.advance(10)
        self.clock.seek(60); self.assertAlmostEqual(self.clock.position(), 60)     # forward
        self.t.advance(2);   self.assertAlmostEqual(self.clock.position(), 62)     # keeps counting
        self.clock.seek(5);  self.assertAlmostEqual(self.clock.position(), 5)      # backward
        self.t.advance(1);   self.assertAlmostEqual(self.clock.position(), 6)

    def test_seek_while_paused_stays_paused(self):
        self.clock.start(); self.t.advance(10); self.clock.pause()
        self.clock.seek(42); self.t.advance(100)
        self.assertAlmostEqual(self.clock.position(), 42); self.assertFalse(self.clock.running)
        self.clock.resume(); self.t.advance(3)
        self.assertAlmostEqual(self.clock.position(), 45)

    def test_stop_resets_and_start_offset(self):
        self.clock.start(); self.t.advance(8); self.clock.stop()
        self.assertEqual(self.clock.position(), 0.0)
        self.clock.start(20); self.t.advance(1)
        self.assertAlmostEqual(self.clock.position(), 21)


if __name__ == "__main__":
    unittest.main()
