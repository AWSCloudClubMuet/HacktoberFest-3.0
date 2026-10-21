"""Seek maths and a playback clock. No pygame, no Tkinter -> easy to test.

Why a clock of our own?
  pygame's get_pos() only reports time since play() was called and ignores the
  start offset, so after a seek it would say "0:00" again. We therefore keep the
  position ourselves:   position = start_offset + time played since then.
"""
import time
from typing import Callable, Optional

END_GUARD = 0.25      # seeks never land closer than this to the very end (seconds)


def format_time(seconds: Optional[float]) -> str:
    """72.4 -> '1:12'.  None or negative -> '--:--'."""
    if seconds is None or seconds < 0:
        return "--:--"
    total = int(seconds)
    return f"{total // 60}:{total % 60:02d}"


def clamp_seek(seconds: float, duration: Optional[float]) -> float:
    """Keep a requested position inside the song: 0 <= result <= duration - END_GUARD."""
    if seconds < 0:
        return 0.0
    if duration is None:
        return seconds
    return max(0.0, min(seconds, duration - END_GUARD))


def fraction_to_seconds(fraction: float, duration: Optional[float]) -> Optional[float]:
    """Slider fraction (0.0 - 1.0) -> seconds. None when the duration is unknown."""
    if duration is None or duration <= 0:
        return None
    return clamp_seek(min(1.0, max(0.0, fraction)) * duration, duration)


def seconds_to_fraction(seconds: float, duration: Optional[float]) -> float:
    """Seconds -> slider fraction, always between 0.0 and 1.0."""
    if duration is None or duration <= 0:
        return 0.0
    return min(1.0, max(0.0, seconds / duration))


class PlaybackClock:
    """Tracks the playback position of the current song.

    `now` is injectable so tests can fake the passing of time.
    """

    def __init__(self, now: Callable[[], float] = time.monotonic):
        self._now = now
        self._offset = 0.0          # position when we last started/paused/seeked
        self._started_at: Optional[float] = None    # None while paused/stopped

    def start(self, offset: float = 0.0) -> None:
        """Begin running from `offset` seconds (new song = 0, seek = target)."""
        self._offset = max(0.0, offset)
        self._started_at = self._now()

    def pause(self) -> None:
        self._offset = self.position()
        self._started_at = None

    def resume(self) -> None:
        if self._started_at is None:
            self._started_at = self._now()

    def stop(self) -> None:
        self._offset = 0.0
        self._started_at = None

    def seek(self, offset: float) -> None:
        """Jump; keeps running if it was running, stays paused if it was paused."""
        running = self._started_at is not None
        self._offset = max(0.0, offset)
        self._started_at = self._now() if running else None

    @property
    def running(self) -> bool:
        return self._started_at is not None

    def position(self) -> float:
        if self._started_at is None:
            return self._offset
        return self._offset + (self._now() - self._started_at)
