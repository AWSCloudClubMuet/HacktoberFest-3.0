"""Find out how long an audio file is (in seconds), or None if we cannot tell.

  .wav            -> Python's built-in `wave` module (always works)
  .mp3/.ogg/.flac -> the small pure-Python `mutagen` package, if installed
Anything else/unreadable -> None ("unknown duration"; the UI then disables seeking).
"""
import os
import wave
from typing import Optional


def get_duration(path: str) -> Optional[float]:
    extension = os.path.splitext(path)[1].lower()
    try:
        if extension == ".wav":
            with wave.open(path, "rb") as f:
                rate = f.getframerate()
                return f.getnframes() / rate if rate else None
        from mutagen import File           # optional dependency
        info = File(path)
        length = getattr(getattr(info, "info", None), "length", None)
        return float(length) if length and length > 0 else None
    except Exception:                      # broken file, mutagen missing, odd encoding...
        return None


def write_wav_from(path: str, start_seconds: float, out_path: str) -> None:
    """Copy a WAV file to `out_path`, starting at `start_seconds`.

    This is how we seek inside WAV files: pygame cannot reliably jump inside a
    WAV, so we simply play a copy that begins at the wanted position.
    """
    with wave.open(path, "rb") as source:
        rate = source.getframerate()
        first_frame = min(source.getnframes(), max(0, int(start_seconds * rate)))
        source.setpos(first_frame)
        frames = source.readframes(source.getnframes() - first_frame)
        with wave.open(out_path, "wb") as target:
            target.setnchannels(source.getnchannels())
            target.setsampwidth(source.getsampwidth())
            target.setframerate(rate)
            target.writeframes(frames)
