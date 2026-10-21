# TuneWave Music Player

A dark, minimal Tkinter music player with real audio (pygame-ce) and a **seek slider**. It demonstrates a doubly linked list, hash map (dict), queue, stack, binary search tree and graph.

## Setup (Windows PowerShell)
```powershell
cd path\to\TuneWave
python -m venv .venv
.\.venv\Scripts\Activate.ps1      # if blocked: Set-ExecutionPolicy -Scope Process Bypass  (then retry)
python -m pip uninstall -y pygame # only matters if plain "pygame" was installed earlier
python -m pip install -r requirements.txt
python main.py                    # opens the player
python -m unittest discover -s tests -v
python demo.py                    # optional: console demo, no GUI/audio
```
Use the python.org installer and keep "tcl/tk and IDLE" ticked (it provides Tkinter).
`requirements.txt` = **pygame-ce** (audio; same `import pygame`, ships Windows wheels) + **mutagen** (reads MP3/OGG/FLAC lengths; small, pure Python).

## The window
* **Sidebar:** Library, Playlist, Artists, Up Next, History. The **playback bar at the bottom never goes away**.
* **Library:** type in the search box (prefix search, alphabetical, case-insensitive; *Exact match* finds whole titles). *+ Add song* opens a dialog. Select a row, then *Add to playlist*, *Add to Up Next* or *Delete song*. ♪ marks the song playing now.
* **Playlist:** ♪ = playing now, ▸ = playlist position. Queued/history songs never move ▸.
* **Artists:** pick an artist to see its direct relations and **"You might like"** (exactly two links away, not directly related). Link two artists with the two drop-downs at the bottom (you may type a new name).
* **Up Next / History:** the queue (oldest first) and the last 10 songs (newest first). *Replay most recent* = `back()`.

### Playback bar
Drawn icons (identical on every PC; hover for a hint): rewind 10 s · previous · **play/pause** · next · forward 10 s · repeat (violet when on) · history-back · stop · volume slider. Keys: **Space** play/pause, **Left/Right arrows** seek ∓5 s (not while typing in a box).

### Double-click to play
| Where | What happens |
|---|---|
| Library, History | plays that song; the **playlist position does not move** (like Up Next); the song that was playing goes to history |
| Playlist | plays it **and moves the playlist position** there (next/previous continue from it) |
| Up Next | plays it now and removes that one entry from the queue (others keep their order) |

### Seeking
The slider shows `elapsed ── total`. **Click** anywhere on it or **drag** the knob; the time under the mouse is previewed while dragging and the audio jumps when you let go. Works playing or paused (a paused song stays paused). Seeking changes *only* the audio position: the playlist position, history and Up Next are untouched, and no history entry is added.

How it works (`player/audio_backend.py`):
| File type | Seek method |
|---|---|
| .mp3 .ogg .flac | `pygame.mixer.music.play(start=seconds)` |
| .wav | play a trimmed temporary copy that begins at the target (made with Python's `wave`; deleted afterwards) |

The shown position comes from our own clock (`player/timeline.py`) because pygame's `get_pos()` ignores seeks.

### Seeking limitations (please read)
* **Unknown length:** if a file's duration cannot be read (damaged file, mutagen missing) the slider is greyed out, total shows `--:--`, and seeking says why instead of guessing.
* **If a format cannot start mid-file** on your machine, TuneWave reports "Seeking is not supported for this file", restarts that song from the beginning (never goes silent), and disables the slider for that song.
* MP3 seeking depends on pygame's SDL_mixer; for variable-bit-rate MP3s the landing point can be off by a fraction of a second.
* The position is a software clock, so it can drift a little from the true audio position on very long songs after many pauses.
* A seek reloads the file (a very short gap is possible); large WAVs are copied to a temp file (a second or two for very long files).
* Volume is not saved between runs.

## Project layout
`models/` Song | `data_structures/` linked list, playlist, queue, history, BST, graph | `music/` library manager | `player/` playback_controller (rules), audio_backend (pygame), timeline (seek maths + clock), audio_info (durations), app_service (what the UI calls) | `storage/` JSON | `ui/` main_window, widgets (SeekBar, tables, dialogs), theme (all colours) | `tests/`

To change colours or fonts, edit only `ui/theme.py`.

## Behaviour choices (unchanged)
- IDs: ever-increasing integer, saved in JSON, never reused.
- `next()` at last song: repeat on wraps, off returns "end" and stays. `previous()` at first: repeat on wraps, off stays.
- Removing the current playlist song moves the position to the next one (previous if it was last). Deleting the song that is *playing* does not interrupt it.
- History: the previously playing song is pushed when playback switches to a different song; `back()` pops the top and does not push the current song.
- Missing/unplayable file: the status line says so and playback stays stopped (no skipping loop).
- Saved to `library.json`: songs, ID counter, artist links, playlist order. Not saved: Up Next, history, repeat, volume. An unreadable `library.json` is never overwritten.

## Other limitations
Audio paths are absolute; moving a file makes that song unplayable until re-added. The file-picker is Windows' native dialog (not dark). The pygame/GUI parts were **not run by the author on Windows**; see PROJECT_STATE.md for exactly what was and was not tested.
