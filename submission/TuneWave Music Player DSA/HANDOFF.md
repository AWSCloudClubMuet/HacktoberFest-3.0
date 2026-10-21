# HANDOFF (for a new AI session)
TuneWave: beginner-friendly Python music player (Tkinter + pygame-ce) demonstrating linked list, hash map, queue, stack, BST, graph. Spec: `TuneWave.md` (authoritative). User: Python beginner, Windows + PowerShell; wants simple readable code, explanations, tests, ZIP delivery, and a cumulative collapsed "Updated Memory" section at the end of every response (nothing after `</details>`).

**Status:** Stage 7 done in code: dark redesigned UI + working-by-design seek slider and volume. In the sandbox 90/109 tests pass, 19 skipped (no pygame/tkinter there). **GUI and real-pygame seeking have never been run** - first job is to get the user's Windows results. Do not claim they work.
**Entry points:** `main.py` (GUI), `demo.py` (console), `player/app_service.py` (what the UI calls), `player/audio_backend.py` (pygame + seek), `player/timeline.py` (seek maths/clock), `ui/main_window.py`, `ui/widgets.py` (SeekBar, IconButton, Tooltip, DataTable, dialogs), `ui/icons.py`, `ui/theme.py` (colours).
**Commands:** `python main.py`; `python -m unittest discover -s tests -v`. Install: `pip install -r requirements.txt` (pygame-ce + mutagen; uninstall plain pygame first).
**Do not reverse:** decisions in PROJECT_STATE.md. Keep UI free of linked-list/graph internals; seeking must never touch PlaybackController.
**Likely trouble spots:** Tk option errors in `ui/theme.py`/`widgets.py`; `music.play(start=)` behaviour per format (fallback: restart at 0 + slider disabled); glyphs on Windows; Python 3.13/3.14 wheels for pygame-ce (ask which Python version).
**Verify:** tests (16 skipped ones should now run); add two real songs (one MP3, one WAV); play; click/drag slider forward and back while playing and paused; check Playlist ▸ unchanged, History not growing, Up Next intact; Next/Previous/Repeat; resize window; Back; search; link artists; restart and confirm library/playlist reload.
Inspect existing files before editing.
