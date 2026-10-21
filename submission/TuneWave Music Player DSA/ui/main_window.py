"""TuneWave main window (Tkinter). Dark, minimal layout:

    +-----------+--------------------------------------------+
    | sidebar   |  header (view title + short description)   |
    | (views)   |  the current view (table / artist explorer)|
    |           |  status line                               |
    +-----------+--------------------------------------------+
    | playback bar: song info | controls + seek slider | volume|
    +--------------------------------------------------------+

Rules that keep it beginner-friendly:
  * Buttons call AppService methods; this file never touches linked-list nodes or graph internals.
  * Every action ends with refresh(), which redraws all tables from the service.
  * ONE timer, `_tick`, runs every 200 ms on Tkinter's event loop (root.after). It asks the
    service to advance when a song ends and moves the seek slider / elapsed time.
    Nothing here blocks or uses threads.
"""
import traceback
import tkinter as tk
from collections import Counter
from tkinter import ttk
from typing import Callable, Optional

from models.song import Song
from player.app_service import AppService
from player.timeline import format_time, fraction_to_seconds
from ui import theme
from ui.widgets import AddSongDialog, ConfirmDialog, DataTable, IconButton, NavButton, SeekBar, Tooltip

TICK_MS = 200
SKIP_SECONDS = 10         # skip buttons
ARROW_SECONDS = 5         # left/right arrow keys

# (key, sidebar label, header title, header description)
VIEWS = [
    ("library", "Library", "Library", "Every song you have added. Double-click a song to play it."),
    ("playlist", "Playlist", "Playlist", "Double-click to play from here.   ♪ playing now   ▸ playlist position"),
    ("artists", "Artists", "Artist explorer", "Link related artists and discover new ones."),
    ("queue", "Up Next", "Up Next", "Queued songs play first. Double-click to play one now."),
    ("history", "History", "History", "The last 10 songs, newest first. Double-click to play one again."),
]

# which drawn icon (see ui/icons.py) each sidebar item shows
NAV_ICONS = {"library": "nav_library", "playlist": "nav_playlist", "artists": "nav_artists",
             "queue": "nav_queue", "history": "nav_history"}


def label(song: Song) -> str:
    return f"{song.title} - {song.artist}"


class MainWindow:
    def __init__(self, root: tk.Tk, service: AppService):
        self.root = root
        self.service = service
        self.search_text = ""
        self.search_exact = False
        self.selected_artist: Optional[str] = None
        self.current_view = "library"
        self._after_id = None

        theme.apply_theme(root)
        root.title("TuneWave")
        root.geometry("1180x760")
        root.minsize(940, 620)
        root.columnconfigure(1, weight=1)            # content column grows with the window
        root.rowconfigure(0, weight=1)

        self.status_var = tk.StringVar(value="Welcome to TuneWave. Add a song to begin.")
        self._build_sidebar()
        self._build_content()
        self._build_player()

        root.protocol("WM_DELETE_WINDOW", self._on_close)
        root.bind("<space>", self._on_space)
        root.bind("<Left>", lambda e: self._on_arrow(e, -ARROW_SECONDS))
        root.bind("<Right>", lambda e: self._on_arrow(e, ARROW_SECONDS))
        self.show_view("library")
        self.refresh()
        self._after_id = root.after(TICK_MS, self._tick)

    # =============================================================== building
    def _build_sidebar(self) -> None:
        side = tk.Frame(self.root, bg=theme.SIDEBAR, width=210)
        side.grid(row=0, column=0, sticky="ns")
        side.grid_propagate(False)
        brand = tk.Frame(side, bg=theme.SIDEBAR)
        brand.pack(anchor="w", padx=22, pady=(26, 22))
        theme.make_label(brand, "Tune", 17, "bold", bg=theme.SIDEBAR).pack(side="left")
        theme.make_label(brand, "Wave", 17, "bold", colour=theme.ACCENT, bg=theme.SIDEBAR).pack(side="left")
        self.nav_buttons = {}
        for key, text, _, _ in VIEWS:
            button = NavButton(side, NAV_ICONS[key], text, lambda k=key: self.show_view(k))
            button.pack(fill="x", padx=10, pady=1)
            self.nav_buttons[key] = button

    def _build_content(self) -> None:
        content = tk.Frame(self.root, bg=theme.BG)
        content.grid(row=0, column=1, sticky="nsew", padx=(28, 28), pady=(24, 0))
        content.columnconfigure(0, weight=1)
        content.rowconfigure(1, weight=1)
        header = tk.Frame(content, bg=theme.BG)
        header.grid(row=0, column=0, sticky="ew", pady=(0, 16))
        self.title_label = theme.make_label(header, "", 20, "bold")
        self.title_label.pack(anchor="w")
        self.subtitle_label = theme.make_label(header, "", 10, colour=theme.MUTED)
        self.subtitle_label.pack(anchor="w", pady=(2, 0))

        container = tk.Frame(content, bg=theme.BG)
        container.grid(row=1, column=0, sticky="nsew")
        container.columnconfigure(0, weight=1)
        container.rowconfigure(0, weight=1)
        self.views = {}
        for key, builder in [("library", self._build_library), ("playlist", self._build_playlist),
                             ("artists", self._build_artists), ("queue", self._build_queue),
                             ("history", self._build_history)]:
            view = tk.Frame(container, bg=theme.BG)
            view.grid(row=0, column=0, sticky="nsew")
            view.columnconfigure(0, weight=1)
            builder(view)
            self.views[key] = view

        self.status_label = tk.Label(content, textvariable=self.status_var, bg=theme.BG, fg=theme.MUTED,
                                     font=theme.font(9), anchor="w", width=1)    # width=1: never forces the window wider
        self.status_label.grid(row=2, column=0, sticky="ew", pady=(10, 12))

    def _build_library(self, view: tk.Frame) -> None:
        view.rowconfigure(1, weight=1)
        bar = tk.Frame(view, bg=theme.BG)
        bar.grid(row=0, column=0, sticky="ew", pady=(0, 12))
        bar.columnconfigure(0, weight=1)
        self.search_var = tk.StringVar()
        self.search_entry = ttk.Entry(bar, textvariable=self.search_var, font=theme.font(10))
        self.search_entry.grid(row=0, column=0, sticky="ew")
        self.search_entry.bind("<KeyRelease>", lambda e: self._search(exact=False))
        theme.make_button(bar, "Exact match", lambda: self._search(exact=True)).grid(row=0, column=1, padx=(8, 0))
        theme.make_button(bar, "+ Add song", self._open_add_dialog, "primary").grid(row=0, column=2, padx=(8, 0))
        self.library_table = DataTable(view, [("mark", "", 44, False), ("title", "Title", 320, True),
                                              ("artist", "Artist", 220, True)],
                                       "No songs yet. Click “+ Add song” to build your library.",
                                       on_double_click=lambda i: self._act(lambda: self.service.play_now(i)))
        self.library_table.frame.grid(row=1, column=0, sticky="nsew")
        actions = tk.Frame(view, bg=theme.BG)
        actions.grid(row=2, column=0, sticky="w", pady=(12, 0))
        theme.make_button(actions, "Add to playlist", lambda: self._with_selected(
            self.library_table, self.service.add_to_playlist)).pack(side="left", padx=(0, 8))
        theme.make_button(actions, "Add to Up Next", lambda: self._with_selected(
            self.library_table, self.service.add_to_up_next)).pack(side="left", padx=(0, 8))
        theme.make_button(actions, "Delete song", self._delete_selected, "danger").pack(side="left")

    def _build_playlist(self, view: tk.Frame) -> None:
        view.rowconfigure(0, weight=1)
        self.playlist_table = DataTable(view, [("mark", "", 60, False), ("title", "Title", 320, True),
                                               ("artist", "Artist", 220, True)],
                                        "The playlist is empty. Add songs from the Library.",
                                        on_double_click=lambda i: self._act(lambda: self.service.play_from_playlist(i)))
        self.playlist_table.frame.grid(row=0, column=0, sticky="nsew")
        actions = tk.Frame(view, bg=theme.BG)
        actions.grid(row=1, column=0, sticky="w", pady=(12, 0))
        theme.make_button(actions, "Remove from playlist", lambda: self._with_selected(
            self.playlist_table, self.service.remove_from_playlist)).pack(side="left")

    def _build_queue(self, view: tk.Frame) -> None:
        view.rowconfigure(0, weight=1)
        self.queue_table = DataTable(view, [("n", "#", 44, False), ("title", "Title", 320, True),
                                            ("artist", "Artist", 220, True)],
                                     "Nothing queued. Use “Add to Up Next” in the Library.",
                                     on_double_click=lambda i: self._act(lambda: self.service.play_from_queue(i)))
        self.queue_table.frame.grid(row=0, column=0, sticky="nsew")
        actions = tk.Frame(view, bg=theme.BG)
        actions.grid(row=1, column=0, sticky="w", pady=(12, 0))
        theme.make_button(actions, "Play next song", lambda: self._act(self.service.next)).pack(side="left")

    def _build_history(self, view: tk.Frame) -> None:
        view.rowconfigure(0, weight=1)
        self.history_table = DataTable(view, [("n", "#", 44, False), ("title", "Title", 320, True),
                                              ("artist", "Artist", 220, True)],
                                       "Nothing played yet.",
                                       on_double_click=lambda i: self._act(lambda: self.service.play_now(i)))
        self.history_table.frame.grid(row=0, column=0, sticky="nsew")
        actions = tk.Frame(view, bg=theme.BG)
        actions.grid(row=1, column=0, sticky="w", pady=(12, 0))
        theme.make_button(actions, "Replay most recent", lambda: self._act(self.service.back)).pack(side="left")

    def _build_artists(self, view: tk.Frame) -> None:
        view.rowconfigure(0, weight=1)
        view.columnconfigure(0, weight=1, uniform="artists")
        view.columnconfigure(1, weight=1, uniform="artists")
        self.artist_table = DataTable(view, [("artist", "Artist", 200, True), ("songs", "Songs", 80, False)],
                                      "No artists yet. Add a song first.", on_select=self._on_artist_selected)
        self.artist_table.frame.grid(row=0, column=0, sticky="nsew", padx=(0, 12))

        panel = tk.Frame(view, bg=theme.PANEL, padx=20, pady=18)
        panel.grid(row=0, column=1, sticky="nsew")
        panel.columnconfigure(0, weight=1)
        panel.rowconfigure(2, weight=1)
        panel.rowconfigure(4, weight=1)
        self.artist_title = theme.make_label(panel, "Select an artist", 14, "bold", bg=theme.PANEL)
        self.artist_title.grid(row=0, column=0, sticky="w")
        theme.make_label(panel, "Directly related", 9, colour=theme.MUTED, bg=theme.PANEL).grid(
            row=1, column=0, sticky="w", pady=(12, 3))
        self.related_list = self._dark_listbox(panel)
        self.related_list.grid(row=2, column=0, sticky="nsew")
        theme.make_label(panel, "You might like  (exactly two links away)", 9, colour=theme.MUTED,
                         bg=theme.PANEL).grid(row=3, column=0, sticky="w", pady=(12, 3))
        self.recommend_list = self._dark_listbox(panel)
        self.recommend_list.grid(row=4, column=0, sticky="nsew")

        link = tk.Frame(panel, bg=theme.PANEL)
        link.grid(row=5, column=0, sticky="ew", pady=(16, 0))
        link.columnconfigure(0, weight=1)
        link.columnconfigure(1, weight=1)
        self.artist_a_var, self.artist_b_var = tk.StringVar(), tk.StringVar()
        self.artist_a_box = ttk.Combobox(link, textvariable=self.artist_a_var, font=theme.font(10))
        self.artist_b_box = ttk.Combobox(link, textvariable=self.artist_b_var, font=theme.font(10))
        self.artist_a_box.grid(row=0, column=0, sticky="ew", padx=(0, 6))
        self.artist_b_box.grid(row=0, column=1, sticky="ew", padx=(6, 0))
        theme.make_button(link, "Link these artists", self._link_artists, "primary").grid(
            row=1, column=0, columnspan=2, sticky="ew", pady=(8, 0))

    @staticmethod
    def _dark_listbox(parent) -> tk.Listbox:
        return tk.Listbox(parent, height=4, exportselection=False, activestyle="none", bd=0,
                          highlightthickness=0, bg=theme.PANEL_ALT, fg=theme.TEXT, font=theme.font(10),
                          selectbackground=theme.ACCENT_SOFT, selectforeground=theme.TEXT)

    def _build_player(self) -> None:
        """The persistent bar: it lives outside the views, so it never disappears."""
        outer = tk.Frame(self.root, bg=theme.PLAYER)
        outer.grid(row=1, column=0, columnspan=2, sticky="ew")
        tk.Frame(outer, bg=theme.BORDER, height=1).pack(fill="x")
        bar = tk.Frame(outer, bg=theme.PLAYER, padx=24, pady=12)
        bar.pack(fill="x")
        bar.columnconfigure(0, weight=3, uniform="bar")
        bar.columnconfigure(1, weight=5, uniform="bar")
        bar.columnconfigure(2, weight=3, uniform="bar")

        # left: what is playing (width=1 lets long names be clipped instead of widening the window)
        info = tk.Frame(bar, bg=theme.PLAYER)
        info.grid(row=0, column=0, sticky="ew")
        info.columnconfigure(0, weight=1)
        self.song_var, self.artist_var = tk.StringVar(value="Nothing playing"), tk.StringVar(value="")
        tk.Label(info, textvariable=self.song_var, bg=theme.PLAYER, fg=theme.TEXT, font=theme.font(11, "bold"),
                 anchor="w", width=1).grid(row=0, column=0, sticky="ew")
        tk.Label(info, textvariable=self.artist_var, bg=theme.PLAYER, fg=theme.MUTED, font=theme.font(9),
                 anchor="w", width=1).grid(row=1, column=0, sticky="ew", pady=(2, 0))

        # centre: transport buttons + seek row
        centre = tk.Frame(bar, bg=theme.PLAYER)
        centre.grid(row=0, column=1, sticky="ew", padx=16)
        centre.columnconfigure(0, weight=1)
        controls = tk.Frame(centre, bg=theme.PLAYER)
        controls.grid(row=0, column=0)
        def icon(name, command, size=34, kind="ghost", hint=""):
            button = IconButton(controls, name, command, size, kind, hint)
            button.pack(side="left", padx=3)
            return button

        icon("rewind", lambda: self._skip(-SKIP_SECONDS), hint=f"Back {SKIP_SECONDS} seconds  (Left arrow: {ARROW_SECONDS})")
        icon("previous", lambda: self._act(self.service.previous), hint="Previous song")
        self.play_button = icon("play", lambda: self._act(self.service.toggle_play_pause), 44, "primary",
                                "Play / Pause  (Space)")
        icon("next", lambda: self._act(self.service.next), hint="Next song")
        icon("forward", lambda: self._skip(SKIP_SECONDS), hint=f"Forward {SKIP_SECONDS} seconds  (Right arrow: {ARROW_SECONDS})")
        self.repeat_button = icon("repeat", self._toggle_repeat, hint="Repeat the playlist")

        seek_row = tk.Frame(centre, bg=theme.PLAYER)
        seek_row.grid(row=1, column=0, sticky="ew", pady=(8, 0))
        seek_row.columnconfigure(1, weight=1)
        self.elapsed_var, self.total_var = tk.StringVar(value="0:00"), tk.StringVar(value="--:--")
        tk.Label(seek_row, textvariable=self.elapsed_var, bg=theme.PLAYER, fg=theme.MUTED, font=theme.font(9),
                 width=5, anchor="e").grid(row=0, column=0)
        self.seek_bar = SeekBar(seek_row, on_seek=self._on_seek, on_drag=self._on_seek_preview)
        self.seek_bar.grid(row=0, column=1, sticky="ew", padx=6)
        tk.Label(seek_row, textvariable=self.total_var, bg=theme.PLAYER, fg=theme.MUTED, font=theme.font(9),
                 width=5, anchor="w").grid(row=0, column=2)

        # right: history-back / stop + volume
        right = tk.Frame(bar, bg=theme.PLAYER)
        right.grid(row=0, column=2, sticky="e")
        buttons = tk.Frame(right, bg=theme.PLAYER)
        buttons.pack(anchor="e")
        for name, command, hint in [("history", self.service.back, "Replay the last song from History"),
                                    ("stop", self.service.stop, "Stop")]:
            IconButton(buttons, name, lambda c=command: self._act(c), 30, "ghost", hint).pack(side="left", padx=2)
        volume = tk.Frame(right, bg=theme.PLAYER)
        volume.pack(anchor="e", pady=(4, 0))
        IconButton(volume, "volume", lambda: None, 24, "ghost").pack(side="left", padx=(0, 4))
        self.volume_bar = SeekBar(volume, on_seek=self.service.set_volume, live=True, width=110)
        self.volume_bar.set_fraction(self.service.volume)
        self.volume_bar.pack(side="left")

    # =============================================================== navigation
    def show_view(self, key: str) -> None:
        self.current_view = key
        self.views[key].tkraise()
        for name, button in self.nav_buttons.items():
            button.set_active(name == key)
        self._update_header()

    def _update_header(self) -> None:
        _, _, title, description = next(v for v in VIEWS if v[0] == self.current_view)
        self.title_label.configure(text=title)
        if self.current_view == "library" and self.search_text:
            kind = "exact matches" if self.search_exact else "matches"
            description = f"{self.library_table.row_count()} {kind} for “{self.search_text}”"
        self.subtitle_label.configure(text=description)

    # =============================================================== actions
    def _set_status(self, message: str) -> None:
        self.status_var.set(message)
        failed = message.lower().startswith(("error", "cannot", "seeking is not", "nothing is playing"))
        self.status_label.configure(fg=theme.DANGER if failed else theme.MUTED)

    def _act(self, action: Callable[[], str]) -> None:
        """Run a service action that returns a status message, then redraw."""
        try:
            self._set_status(action())
        except ValueError as err:
            self._set_status(f"Error: {err}")
        self.refresh()

    def _with_selected(self, table: DataTable, action: Callable[[int], str]) -> None:
        song_id = table.selected_key()
        if song_id is None:
            self._set_status("Select a song in the list first.")
            return
        self._act(lambda: action(song_id))

    def _confirm(self, title: str, message: str, confirm_text: str) -> bool:
        dialog = ConfirmDialog(self.root, title, message, confirm_text)
        self.root.wait_window(dialog)
        return dialog.result

    def _open_add_dialog(self) -> None:
        AddSongDialog(self.root, self.add_song_from_form)

    def add_song_from_form(self, title: str, artist: str, path: str, add_to_playlist: bool) -> Optional[str]:
        """Called by the Add-song dialog. Returns an error message, or None on success."""
        try:
            song = self.service.add_song(title, artist, path, add_to_playlist)
        except ValueError as err:
            return str(err)
        self._set_status(f"Added “{song.title}” by {song.artist}.")
        self.refresh()
        return None

    def _delete_selected(self) -> None:
        song_id = self.library_table.selected_key()
        song = self.service.library.get_song(song_id) if song_id is not None else None
        if song is None:
            self._set_status("Select a song in the library first.")
            return
        if self._confirm("Delete song", f"Delete “{song.title}” from the library, playlist and Up Next?", "Delete"):
            self.service.delete_song(song_id)
            self._set_status(f"Deleted “{song.title}”.")
            self.refresh()

    def _toggle_repeat(self) -> None:
        on = self.service.toggle_repeat()
        self._set_status("Repeat is on." if on else "Repeat is off.")
        self.refresh()

    def _on_space(self, event) -> None:
        if isinstance(event.widget, (tk.Entry, ttk.Entry, ttk.Combobox, tk.Text)):
            return                                   # typing a space in a text box
        self._act(self.service.toggle_play_pause)

    def _on_arrow(self, event, delta: float) -> None:
        if isinstance(event.widget, (tk.Entry, ttk.Entry, ttk.Combobox, tk.Text)):
            return                                   # moving the cursor inside a text box
        self._skip(delta)

    def _skip(self, delta: float) -> None:
        """Jump `delta` seconds from where we are (negative = back)."""
        self._set_status(self.service.seek_relative(delta))
        self._update_progress()

    def _search(self, exact: bool) -> None:
        self.search_text = self.search_var.get().strip()
        self.search_exact = exact and bool(self.search_text)
        self.refresh()
        if self.search_text:
            self._set_status(f"{self.library_table.row_count()} song(s) found.")

    # ---- seek slider ------------------------------------------------------------
    def _on_seek_preview(self, fraction: float) -> None:
        """While dragging: show the time under the mouse (audio is NOT touched yet)."""
        seconds = fraction_to_seconds(fraction, self.service.duration())
        if seconds is not None:
            self.elapsed_var.set(format_time(seconds))

    def _on_seek(self, fraction: float) -> None:
        """Mouse released / clicked: really jump. Playlist, history and Up Next are untouched."""
        self._set_status(self.service.seek_fraction(fraction))
        self._update_progress()

    # ---- artists ------------------------------------------------------------------
    def _on_artist_selected(self, name: Optional[str]) -> None:
        if name is None:
            return
        self.selected_artist = name
        self.artist_a_var.set(name)
        self._show_artist(name)

    def _show_artist(self, name: Optional[str]) -> list:
        """Fill both lists for `name`; returns the recommendations (artists two links away)."""
        for box in (self.related_list, self.recommend_list):
            box.delete(0, "end")
        if not name:
            self.artist_title.configure(text="Select an artist")
            return []
        self.artist_title.configure(text=name)
        for related in self.service.related_artists(name):
            self.related_list.insert("end", related)
        suggestions = self.service.recommend(name)
        for suggestion in suggestions:
            self.recommend_list.insert("end", suggestion)
        return suggestions

    def _recommend(self) -> None:
        """Show (and announce) the artists exactly two links away for the selected artist."""
        name = self.selected_artist
        count = len(self._show_artist(name))
        self._set_status(f"{count} recommendation(s) for {name}." if count else f"No recommendations for {name}.")

    def _link_artists(self) -> None:
        try:
            self._set_status(self.service.add_relation(self.artist_a_var.get(), self.artist_b_var.get()))
        except ValueError as err:
            self._set_status(f"Error: {err}")
        self.refresh()

    # =============================================================== redraw / timer
    def _library_songs(self):
        if not self.search_text:
            return self.service.library.all_songs()
        return (self.service.exact_search(self.search_text) if self.search_exact
                else self.service.prefix_search(self.search_text))

    def refresh(self) -> None:
        controller = self.service.controller
        playing = controller.current_song
        position = controller.playlist.current_song
        playing_id = playing.id if playing else None

        self.library_table.set_rows([(s.id, ("♪" if s.id == playing_id else "", s.title, s.artist))
                                     for s in self._library_songs()])
        rows = []
        for song in controller.playlist.songs():
            mark = ("♪" if song.id == playing_id else "") + ("▸" if position and song.id == position.id else "")
            rows.append((song.id, (mark, song.title, song.artist)))
        self.playlist_table.set_rows(rows)
        self.queue_table.set_rows([(s.id, (str(i), s.title, s.artist))
                                   for i, s in enumerate(controller.up_next_songs(), 1)])
        self.history_table.set_rows([(s.id, (str(i), s.title, s.artist))
                                     for i, s in enumerate(controller.history_songs(), 1)])

        counts = Counter(s.artist for s in self.service.library.all_songs())
        names = self.service.artists()
        self.artist_table.set_rows([(n, (n, str(counts[n]) if counts[n] else "–")) for n in names])
        if self.selected_artist in names:
            self.artist_table.select_key(self.selected_artist)
            self._show_artist(self.selected_artist)
        for box in (self.artist_a_box, self.artist_b_box):
            box.configure(values=names)

        self.song_var.set(playing.title if playing else "Nothing playing")
        self.artist_var.set(playing.artist if playing else "")
        repeat = controller.playlist.repeat
        self.repeat_button.set_active(repeat)
        self._update_header()
        self._update_progress()

    def _update_progress(self) -> None:
        """Cheap: runs 5 times a second. Moves the slider and the two time labels."""
        service = self.service
        state = service.audio.state
        self.play_button.set_icon("pause" if state == "playing" else "play")
        self.seek_bar.set_enabled(service.can_seek())
        self.total_var.set(format_time(service.duration()) if state != "stopped" else "--:--")
        if not self.seek_bar.dragging:                # never fight with the mouse
            self.seek_bar.set_fraction(service.progress_fraction())
            self.elapsed_var.set(format_time(service.position()) if state != "stopped" else "0:00")

    def _tick(self) -> None:
        """The one repeating timer (Tkinter event loop, no threads)."""
        try:
            message = self.service.poll()             # a song ended -> next one starts
            if message:
                self._set_status(message)
                self.refresh()
            else:
                self._update_progress()
        except Exception:                             # never let a bug kill the timer
            traceback.print_exc()
        finally:
            self._after_id = self.root.after(TICK_MS, self._tick)

    def _on_close(self) -> None:
        if self._after_id is not None:
            self.root.after_cancel(self._after_id)
        self.service.shutdown()
        self.root.destroy()
