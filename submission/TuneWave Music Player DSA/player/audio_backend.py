"""Real audio playback using pygame.mixer.music, with seeking and volume.

Supported formats: .mp3, .wav, .ogg (and usually .flac). Other extensions are rejected
with a friendly message before pygame is even asked to load them.

pygame is imported lazily (only when you first play something), so the rest of the
app and the tests work even if pygame is not installed.

SEEKING (see README "Seeking"):
  * .mp3/.ogg/.flac: pygame's music.play(start=seconds) starts playback at that position.
  * .wav: pygame cannot jump inside a WAV, so we play a trimmed temporary copy that begins
    at the wanted position (made with Python's built-in `wave` module).
  * The position shown to the user comes from our own PlaybackClock (player/timeline.py).
  * If the duration is unknown, seeking is refused with a clear message.

State is tracked by us in `self.state`: "stopped", "playing" or "paused".
(pygame cannot tell "paused" and "finished" apart reliably, so we remember it ourselves.)
"""
import os
import tempfile
from typing import Optional

from player.audio_info import get_duration, write_wav_from
from player.timeline import PlaybackClock, clamp_seek

SUPPORTED_EXTENSIONS = (".mp3", ".wav", ".ogg", ".flac")


class AudioError(Exception):
    """Something went wrong playing audio; the message is safe to show to the user."""


def validate_audio_file(path: str) -> None:
    """Raise ValueError if `path` is not an existing file with a supported extension."""
    if not path or not path.strip():
        raise ValueError("Please choose an audio file.")
    if not os.path.isfile(path):
        raise ValueError(f"Audio file not found: {path}")
    extension = os.path.splitext(path)[1].lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported audio format '{extension}'. "
                         f"Use one of: {', '.join(SUPPORTED_EXTENSIONS)}")


class PygameAudio:
    def __init__(self):
        self.state = "stopped"
        self.volume = 0.8                         # 0.0 - 1.0
        self.duration: Optional[float] = None     # seconds; None = unknown
        self.path = ""
        self._music = None            # pygame.mixer.music, set up on first use
        self._clock = PlaybackClock()
        self._temp_path: Optional[str] = None     # trimmed WAV used after a seek
        self._seek_failed = False                 # True once a seek failed for the current song

    def _ensure_ready(self) -> None:
        if self._music is not None:
            return
        try:
            import pygame
        except ImportError as err:
            raise AudioError("pygame is not installed. Run: python -m pip install -r requirements.txt") from err
        try:
            pygame.mixer.init()
        except pygame.error as err:
            raise AudioError(f"No usable audio output device: {err}") from err
        self._music = pygame.mixer.music
        self._pygame_error = pygame.error
        self._music.set_volume(self.volume)

    # ---- starting ---------------------------------------------------------
    def _start_at(self, path: str, offset: float) -> None:
        """Load `path` and begin playing at `offset` seconds. Raises AudioError."""
        old_temp = self._temp_path
        self._temp_path = None
        try:
            if offset > 0 and os.path.splitext(path)[1].lower() == ".wav":
                handle, temp = tempfile.mkstemp(suffix=".wav", prefix="tunewave_")
                os.close(handle)
                self._temp_path = temp
                write_wav_from(path, offset, temp)
                self._music.load(temp)
                self._music.play()
            else:
                self._music.load(path)
                if offset > 0:
                    self._music.play(start=offset)
                else:
                    self._music.play()
        except (self._pygame_error, OSError, EOFError) as err:
            self._remove_file(self._temp_path)
            self._temp_path = None
            raise AudioError(f"Could not play this file: {err}") from err
        finally:
            self._remove_file(old_temp)           # the previous temp file is no longer in use
        self._music.set_volume(self.volume)

    @staticmethod
    def _remove_file(path: Optional[str]) -> None:
        if path:
            try:
                os.remove(path)
            except OSError:
                pass                              # leftover temp files are harmless

    def play(self, path: str) -> None:
        """Load and start a file from the beginning."""
        self.state = "stopped"
        self._clock.stop()
        try:
            validate_audio_file(path)
        except ValueError as err:
            raise AudioError(str(err)) from err
        self._ensure_ready()
        self._start_at(path, 0.0)
        self.path = path
        self._seek_failed = False
        self.duration = self._find_duration(path)
        self._clock.start(0.0)
        self.state = "playing"

    def _find_duration(self, path: str) -> Optional[float]:
        duration = get_duration(path)
        if duration is None and os.path.getsize(path) < 50_000_000:
            try:                                   # last resort: let pygame measure it
                import pygame
                duration = pygame.mixer.Sound(path).get_length() or None
            except Exception:
                duration = None
        return duration

    # ---- controls -----------------------------------------------------------
    def pause(self) -> None:
        if self.state == "playing":
            self._music.pause()
            self._clock.pause()
            self.state = "paused"

    def resume(self) -> None:
        if self.state == "paused":
            self._music.unpause()
            self._clock.resume()
            self.state = "playing"

    def stop(self) -> None:
        if self._music is not None:
            self._music.stop()
            try:
                self._music.unload()               # releases the file (needed on Windows)
            except (AttributeError, self._pygame_error):
                pass
        self._clock.stop()
        self._remove_file(self._temp_path)
        self._temp_path = None
        self.state = "stopped"

    # ---- position / seeking ---------------------------------------------------
    @property
    def can_seek(self) -> bool:
        return (self.state in ("playing", "paused") and self.duration is not None
                and not self._seek_failed)

    def position(self) -> float:
        """Seconds played so far (0 when stopped)."""
        if self.state == "stopped":
            return 0.0
        position = self._clock.position()
        return min(position, self.duration) if self.duration is not None else position

    def seek(self, seconds: float) -> float:
        """Jump to `seconds` in the current song; returns the position actually used.

        Keeps paused songs paused. Raises AudioError if seeking is impossible.
        """
        if self.state not in ("playing", "paused"):
            raise AudioError("Nothing is playing.")
        if self.duration is None:
            raise AudioError("Cannot seek: the length of this song is unknown.")
        if self._seek_failed:
            raise AudioError("Seeking is not supported for this file.")
        target = clamp_seek(seconds, self.duration)
        was_paused = self.state == "paused"
        previous = self.position()
        try:
            self._start_at(self.path, target)
        except AudioError as err:
            self._seek_failed = True               # do not offer seeking for this song again
            restarted = self._recover(previous, was_paused)
            note = "" if restarted is None else " The song was restarted from the beginning."
            raise AudioError(f"Seeking is not supported for this file ({err}).{note}") from err
        self._clock.seek(target)
        if was_paused:
            self._music.pause()                    # stay paused at the new position
        return target

    def _recover(self, position: float, was_paused: bool) -> Optional[float]:
        """After a failed seek keep the song going. Returns None if it resumed at `position`,
        0.0 if it had to restart from the beginning (the clock is reset to match)."""
        for offset in (position, 0.0):
            try:
                self._start_at(self.path, offset)
            except AudioError:
                continue
            self._clock.seek(offset)
            if was_paused:
                self._music.pause()
            return None if offset == position else 0.0
        self.stop()                                # could not recover at all
        return 0.0

    def set_volume(self, volume: float) -> float:
        self.volume = min(1.0, max(0.0, volume))
        if self._music is not None:
            self._music.set_volume(self.volume)
        return self.volume

    def has_finished(self) -> bool:
        """True when a song we started has played to its end."""
        return self.state == "playing" and not self._music.get_busy()

    def shutdown(self) -> None:
        self.stop()
        if self._music is not None:
            import pygame
            pygame.mixer.quit()
            self._music = None
