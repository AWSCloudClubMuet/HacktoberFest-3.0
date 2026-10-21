import math, os, struct, wave


def make_wav(path: str, seconds: float = 0.3) -> str:
    """Write a tiny real WAV file (a quiet sine tone) for tests."""
    rate = 22050
    with wave.open(path, "wb") as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(rate)
        frames = b"".join(struct.pack("<h", int(3000 * math.sin(i / 20))) for i in range(int(rate * seconds)))
        f.writeframes(frames)
    return path


class FakeClock:
    """A clock tests can move forward by hand: clock.advance(5)."""
    def __init__(self): self.t = 1000.0
    def __call__(self): return self.t
    def advance(self, seconds): self.t += seconds


class FakeAudio:
    """Same interface as PygameAudio, but silent. Records what was played.

    Time only passes when a test calls `clock.advance(seconds)`.
    Set `fake.next_duration = None` before play() to simulate an unknown duration.
    """
    def __init__(self, duration=100.0):
        from player.timeline import PlaybackClock
        self.clock = FakeClock()
        self._timeline = PlaybackClock(self.clock)
        self.state = "stopped"; self.played = []; self.seeks = []; self.finished = False
        self.next_duration = duration; self.duration = None; self.volume = 0.8

    def play(self, path):
        from player.audio_backend import AudioError, validate_audio_file
        try:
            validate_audio_file(path)
        except ValueError as err:
            raise AudioError(str(err))
        self.played.append(path); self.state = "playing"; self.finished = False
        self.duration = self.next_duration; self._timeline.start(0.0)

    def pause(self):
        if self.state == "playing": self.state = "paused"; self._timeline.pause()

    def resume(self):
        if self.state == "paused": self.state = "playing"; self._timeline.resume()

    def stop(self): self.state = "stopped"; self._timeline.stop()
    def has_finished(self): return self.state == "playing" and self.finished
    def shutdown(self): self.stop()

    @property
    def can_seek(self): return self.state in ("playing", "paused") and self.duration is not None

    def position(self):
        if self.state == "stopped": return 0.0
        p = self._timeline.position()
        return min(p, self.duration) if self.duration is not None else p

    def seek(self, seconds):
        from player.audio_backend import AudioError
        from player.timeline import clamp_seek
        if self.state == "stopped": raise AudioError("Nothing is playing.")
        if self.duration is None: raise AudioError("Cannot seek: the length of this song is unknown.")
        target = clamp_seek(seconds, self.duration)
        self.seeks.append(target); self._timeline.seek(target)
        return target

    def set_volume(self, volume):
        self.volume = min(1.0, max(0.0, volume)); return self.volume
