# CHANGELOG
## Stage 7c - sidebar icons
- Drawn icons for Library, Playlist, Artists, Up Next and History in the sidebar (`nav_*` shapes in `ui/icons.py`; new `NavButton` widget and shared `draw_icon` in `ui/widgets.py`). Active item gets a violet icon; hover brightens it.
- `icon_shapes` now also supports `("oval", box, filled)` (used by the Artists head and the History clock).
- Tests 109 -> 110 (1 new). GUI part still unverified until run on Windows; the icon shapes were checked by rendering them to an image.
## Stage 7b - icons, skip, double-click
- Drawn icon buttons (`ui/icons.py` data + `IconButton` in `ui/widgets.py`) with tooltips; replaces the glyph text buttons.
- Skip +/-10 s buttons and Left/Right arrow keys (+/-5 s) via `AppService.seek_relative`.
- Double-click to play in Library/History (`play_now`, playlist position unchanged), Playlist (`play_from_playlist`, moves position via new `Playlist.jump_to`, a hash-map lookup) and Up Next (`play_from_queue`, new `UpNextQueue.remove_first`).
- Tests 96 -> 109 (13 new; 11 GUI + 8 real-pygame still skipped here).
## Stage 7 - UI redesign + seeking
- **New dark UI** (charcoal panels, soft-violet accent): sidebar with Library / Playlist / Artists / Up Next / History views, persistent playback bar, custom dark dialogs (Add song, Confirm delete), hover/selected states, responsive layout. All colours live in `ui/theme.py`.
- **Seek slider** (`ui/widgets.py: SeekBar`, drawn on a Canvas): click or drag, live time preview, elapsed + total labels, disabled when duration unknown. **Volume slider** added.
- **Real seeking** in `player/audio_backend.py`: `play(start=)` for MP3/OGG/FLAC, trimmed temp copy for WAV, own playback clock, recovery if a seek fails.
- New modules: `player/timeline.py` (seek maths, `PlaybackClock`), `player/audio_info.py` (durations, WAV trimming).
- `AppService`: `seek`, `seek_fraction`, `position`, `duration`, `progress_fraction`, `can_seek`, `volume`/`set_volume`, `artists`, `related_artists`. Seeking never touches the controller (playlist position, history, Up Next).
- One 200 ms `root.after` timer drives auto-advance and progress; no threads.
- `requirements.txt`: `pygame-ce`, `mutagen`.
- Tests: 55 -> 96 (new: timeline/seek maths, seek via service forward/backward/paused/unknown duration, backend seek logic with a stand-in pygame, real-pygame seek tests and rewritten GUI tests that need pygame/a display).
- Removed from UI: the old three-column layout, messagebox pop-ups for add/link errors (errors now show in the dialog / status line).
## Stage 6
- `player/audio_backend.py`, `player/app_service.py`, `ui/main_window.py`, `main.py` (console demo moved to `demo.py`), playlist order saved, 19 tests.
## Stages 1-5
- Song model, doubly linked list + playlist/dict, queue, history stack, BST, artist graph, LibraryManager, JSON storage, PlaybackController, 36 tests, console demo.
