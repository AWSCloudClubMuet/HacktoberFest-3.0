# PROJECT_STATE
**Stage:** 7 built (UI redesign + seeking). User verification on Windows pending.

## Test results (sandbox: Linux, Python 3.12, NO pygame, NO tkinter, no network)
`python -m unittest discover -s tests`: **109 tests: 90 passed, 0 failed, 19 skipped.**
- PASSED (ran): all data-structure tests, controller/queue/history, storage, AppService (fake audio), seek maths + `PlaybackClock`, seeking through AppService (forward, backward, paused, clamped, unknown duration, nothing playing, volume, no change to playlist position / history / Up Next, repeat rules), `PygameAudio` seek logic against a **stand-in `pygame` module**, WAV duration + trimming.
- Also passed: double-click/jump logic (`test_double_click`), icon geometry (`test_icons`).
- SKIPPED (need what the sandbox lacks): 8 real-pygame tests (`test_audio_backend.PygameTests`, incl. 4 new real seek/volume tests) and 11 GUI tests (`test_gui_smoke`, incl. double-click, skip buttons, arrow keys).
- Ad-hoc only (not shipped): `ui/main_window.py` was executed against a fake `tkinter` to catch typos/logic errors (add, play, seek click/drag, search, artists, repeat, delete, views). This is weak evidence: it says nothing about real Tk behaviour or looks.

## NOT verified (treat as untested until the user runs it)
- Anything real: the GUI appearance/layout/resizing, Tk option validity, hover/selection colours, the custom slider with a real mouse, dialogs, native file dialog.
- Real pygame: that `music.play(start=...)` really jumps for MP3/OGG/FLAC on Windows, WAV temp-copy seeking, volume, audible output, MP3 decoding, how the drawn icons look and whether tooltips show; real double-click events; glyphs ♪ ▸ in tables.
- Anything on Windows or with Python 3.13/3.14 (install of pygame-ce unconfirmed).

## Architecture
`ui/main_window.py` (+ `ui/widgets.py`, `ui/theme.py`) -> `player/app_service.py` -> `player/playback_controller.py` (playlist + queue + history) + `player/audio_backend.py` (pygame; uses `player/timeline.py`, `player/audio_info.py`) + `music/library_manager.py` (songs dict, BST, graph) + `storage/library_storage.py`.
One Tk timer (`_tick`, 200 ms) calls `AppService.poll()` (auto-advance) and updates slider/labels. Slider: click/drag -> `AppService.seek_fraction()` on mouse release -> `PygameAudio.seek()`. Seeks never touch `PlaybackController`.

## Design decisions (do not reverse silently)
Monotonic int IDs saved in JSON; playlist position separate from `current_song`; `back()` does not push history; `previous()` returns "start"; case-insensitive title search, lazy BST deletion; audio state tracked by us; pygame imported lazily; playback errors reported, never auto-skipped; storage never overwrites unreadable files; Up Next/history/repeat/volume not persisted; built-in dict/deque/list, custom linked list and BST; **pygame-ce** not pygame.
Stage 7: own `PlaybackClock` (pygame get_pos ignores seeks); WAV seek via trimmed temp copy; failed seek -> restart from 0 and disable slider for that song; custom Canvas slider (ttk.Scale can't be themed); seek clamped to `duration - 0.25 s`; icons are drawn on a Canvas (no image files, no font dependence); double-click: Library/History = play_now (position unchanged), Playlist = jump_to (position moves), Up Next = remove one entry.

## Next steps
1. User runs `python main.py` on Windows, adds real MP3/WAV files, tries seeking forward/back/paused, resizing; reports errors/screenshots. Run the unit tests there: the 16 skipped should now run.
2. Fix whatever real Tk/pygame behaviour differs (most likely: a Tk option error, MP3 seek landing, glyphs).
3. Optional: persist volume, sidebar icons, final docs/ZIP.
