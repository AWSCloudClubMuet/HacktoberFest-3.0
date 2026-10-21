"""Small reusable widgets: SeekBar (slider), DataTable, and two dark dialogs."""
import os
import tkinter as tk
from tkinter import filedialog, ttk
from typing import Callable, List, Optional

from player.audio_backend import SUPPORTED_EXTENSIONS
from ui import theme
from ui.icons import icon_shapes


class SeekBar(tk.Canvas):
    """A custom slider drawn on a Canvas (ttk.Scale cannot be styled properly).

    * Click anywhere on the bar, or drag the knob. The value is a fraction 0.0 - 1.0.
    * `on_drag(fraction)` is called while the mouse moves (use it to preview the time).
    * `on_seek(fraction)` is called when the mouse is released (this is where we really seek).
      With live=True (volume) on_seek is also called while dragging.
    * `set_fraction()` is ignored while the user is dragging, so the playback timer cannot
      fight with the mouse.
    """
    PAD = 8

    def __init__(self, parent, on_seek: Callable[[float], None],
                 on_drag: Optional[Callable[[float], None]] = None, live: bool = False, **options):
        options.setdefault("height", 22)
        super().__init__(parent, bg=parent.cget("bg"), highlightthickness=0, bd=0, **options)
        self.on_seek, self.on_drag, self.live = on_seek, on_drag, live
        self.fraction = 0.0
        self.enabled = True
        self.dragging = False
        self.hovering = False
        self.bind("<Configure>", lambda e: self._draw())
        self.bind("<ButtonPress-1>", self._press)
        self.bind("<B1-Motion>", self._motion)
        self.bind("<ButtonRelease-1>", self._release)
        self.bind("<Enter>", lambda e: self._hover(True))
        self.bind("<Leave>", lambda e: self._hover(False))

    # ---- public ---------------------------------------------------------------
    def set_fraction(self, fraction: float) -> None:
        if self.dragging:
            return
        fraction = min(1.0, max(0.0, fraction))
        if abs(fraction - self.fraction) > 0.0005:
            self.fraction = fraction
            self._draw()

    def set_enabled(self, enabled: bool) -> None:
        if enabled != self.enabled:
            self.enabled = enabled
            self.configure(cursor="hand2" if enabled else "arrow")
            self._draw()

    # ---- mouse ----------------------------------------------------------------
    def _fraction_at(self, x: float) -> float:
        usable = max(1, self.winfo_width() - 2 * self.PAD)
        return min(1.0, max(0.0, (x - self.PAD) / usable))

    def _press(self, event) -> None:
        if not self.enabled:
            return
        self.dragging = True
        self.fraction = self._fraction_at(event.x)
        self._draw()
        self._notify(self.on_drag)
        if self.live:
            self.on_seek(self.fraction)

    def _motion(self, event) -> None:
        if not self.dragging:
            return
        self.fraction = self._fraction_at(event.x)
        self._draw()
        self._notify(self.on_drag)
        if self.live:
            self.on_seek(self.fraction)

    def _release(self, event) -> None:
        if not self.dragging:
            return
        self.fraction = self._fraction_at(event.x)
        self.dragging = False
        self._draw()
        self.on_seek(self.fraction)

    def _notify(self, callback) -> None:
        if callback:
            callback(self.fraction)

    def _hover(self, hovering: bool) -> None:
        self.hovering = hovering
        self._draw()

    # ---- drawing --------------------------------------------------------------
    def _draw(self) -> None:
        self.delete("all")
        width, height = self.winfo_width(), self.winfo_height()
        if width <= 1:
            return
        middle = height // 2
        left, right = self.PAD, width - self.PAD
        filled = left + (right - left) * self.fraction
        trough = theme.HOVER if self.enabled else theme.PANEL_ALT
        fill = (theme.ACCENT_HOVER if (self.hovering or self.dragging) else theme.ACCENT) \
            if self.enabled else theme.DISABLED
        self.create_line(left, middle, right, middle, fill=trough, width=4, capstyle="round")
        if filled > left:
            self.create_line(left, middle, filled, middle, fill=fill, width=4, capstyle="round")
        if self.enabled and (self.hovering or self.dragging):
            self.create_oval(filled - 6, middle - 6, filled + 6, middle + 6, fill=theme.TEXT, outline="")


class DataTable:
    """A dark table (ttk.Treeview) whose rows each remember a key (e.g. a song id).

    columns = [(name, heading, width, stretch), ...]   rows = [(key, (value, value, ...)), ...]
    """

    def __init__(self, parent, columns: List[tuple], empty_text: str = "Nothing here yet.",
                 on_select: Optional[Callable] = None, on_double_click: Optional[Callable] = None):
        self.frame = tk.Frame(parent, bg=theme.PANEL)
        self.frame.rowconfigure(0, weight=1)
        self.frame.columnconfigure(0, weight=1)
        names = [c[0] for c in columns]
        self.tree = ttk.Treeview(self.frame, columns=names, show="headings", selectmode="browse")
        for name, heading, width, stretch in columns:
            self.tree.heading(name, text=heading, anchor="w")
            self.tree.column(name, width=width, minwidth=40, stretch=stretch, anchor="w")
        scroll = ttk.Scrollbar(self.frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scroll.set)
        self.tree.grid(row=0, column=0, sticky="nsew")
        scroll.grid(row=0, column=1, sticky="ns")
        self.empty = tk.Label(self.frame, text=empty_text, bg=theme.PANEL, fg=theme.MUTED,
                              font=theme.font(10))
        self.keys: list = []
        self._hover: Optional[str] = None
        self.tree.tag_configure("hover", background=theme.HOVER)
        self.tree.bind("<Motion>", self._on_motion)
        self.tree.bind("<Leave>", lambda e: self._set_hover(None))
        if on_select:
            self.tree.bind("<<TreeviewSelect>>", lambda e: on_select(self.selected_key()))
        if on_double_click:
            self.tree.bind("<Double-1>", lambda e: self._double_click(e, on_double_click))

    def set_rows(self, rows: List[tuple]) -> None:
        """Replace all rows but keep the selected row position when possible."""
        selected = self.tree.selection()
        selected_index = int(selected[0]) if selected else None
        self._hover = None
        self.tree.delete(*self.tree.get_children())
        self.keys = [key for key, _ in rows]
        for index, (_, values) in enumerate(rows):
            self.tree.insert("", "end", iid=str(index), values=values)
        if selected_index is not None and selected_index < len(rows):
            self.tree.selection_set(str(selected_index))
        if rows:
            self.empty.place_forget()
        else:
            self.empty.place(relx=0.5, rely=0.5, anchor="center")

    def _double_click(self, event, callback: Callable) -> None:
        """Double-click on a ROW (not on the header): pass that row's key to the callback."""
        iid = self.tree.identify_row(event.y)
        if iid and int(iid) < len(self.keys):
            self.tree.selection_set(iid)
            callback(self.keys[int(iid)])

    def selected_key(self):
        selected = self.tree.selection()
        return self.keys[int(selected[0])] if selected else None

    def select_key(self, key) -> None:
        if key in self.keys:
            index = str(self.keys.index(key))
            self.tree.selection_set(index)
            self.tree.see(index)

    def row_count(self) -> int:
        return len(self.keys)

    def row_values(self, index: int) -> tuple:
        return tuple(self.tree.item(str(index), "values"))

    def _on_motion(self, event) -> None:
        self._set_hover(self.tree.identify_row(event.y) or None)

    def _set_hover(self, iid: Optional[str]) -> None:
        if iid == self._hover:
            return
        for old in (self._hover,):
            if old and self.tree.exists(old):
                self.tree.item(old, tags=())
        self._hover = iid
        if iid and self.tree.exists(iid):
            self.tree.item(iid, tags=("hover",))


class _Dialog(tk.Toplevel):
    """Base for the dark pop-up windows: centred on the main window and modal."""

    def __init__(self, parent: tk.Misc, title: str, width: int = 440):
        super().__init__(parent, bg=theme.PANEL)
        self.title(title)
        self.resizable(False, False)
        self.transient(parent.winfo_toplevel())
        self.body = tk.Frame(self, bg=theme.PANEL, padx=24, pady=22)
        self.body.pack(fill="both", expand=True)
        self._width = width
        self.protocol("WM_DELETE_WINDOW", self.destroy)
        self.bind("<Escape>", lambda e: self.destroy())

    def show(self) -> None:
        self.update_idletasks()
        parent = self.master.winfo_toplevel()
        x = parent.winfo_rootx() + (parent.winfo_width() - self._width) // 2
        y = parent.winfo_rooty() + (parent.winfo_height() - self.winfo_reqheight()) // 3
        self.geometry(f"{self._width}x{self.winfo_reqheight()}+{max(0, x)}+{max(0, y)}")
        self.grab_set()
        self.focus_set()


class ConfirmDialog(_Dialog):
    """Yes/No question in the app's own style. After wait_window(), read `.result`."""

    def __init__(self, parent, title: str, message: str, confirm_text: str = "Confirm"):
        super().__init__(parent, title, 400)
        self.result = False
        theme.make_label(self.body, title, 13, "bold", bg=theme.PANEL).pack(anchor="w")
        theme.make_label(self.body, message, 10, colour=theme.MUTED, bg=theme.PANEL, wraplength=350,
                         justify="left").pack(anchor="w", pady=(8, 18))
        buttons = tk.Frame(self.body, bg=theme.PANEL)
        buttons.pack(anchor="e")
        theme.make_button(buttons, "Cancel", self.destroy, "ghost").pack(side="left", padx=(0, 8))
        theme.make_button(buttons, confirm_text, self._yes, "primary").pack(side="left")
        self.show()

    def _yes(self) -> None:
        self.result = True
        self.destroy()


class AddSongDialog(_Dialog):
    """Form to add a song. `submit(title, artist, path, add_to_playlist) -> error text or None`."""

    def __init__(self, parent, submit: Callable[[str, str, str, bool], Optional[str]]):
        super().__init__(parent, "Add song", 480)
        self.submit = submit
        self.title_var, self.artist_var, self.path_var = tk.StringVar(), tk.StringVar(), tk.StringVar()
        self.playlist_var = tk.BooleanVar(value=True)
        theme.make_label(self.body, "Add a song", 14, "bold", bg=theme.PANEL).grid(row=0, column=0, columnspan=2, sticky="w")
        self.body.columnconfigure(0, weight=1)

        def field(row: int, caption: str, variable, **extra):
            theme.make_label(self.body, caption, 9, colour=theme.MUTED, bg=theme.PANEL).grid(
                row=row, column=0, columnspan=2, sticky="w", pady=(14, 3))
            entry = ttk.Entry(self.body, textvariable=variable, **extra)
            entry.grid(row=row + 1, column=0, sticky="ew")
            return entry

        self.title_entry = field(1, "Title", self.title_var)
        field(3, "Artist", self.artist_var)
        field(5, "Audio file", self.path_var, state="readonly")
        theme.make_button(self.body, "Browse…", self._browse).grid(row=6, column=1, padx=(8, 0))
        tk.Checkbutton(self.body, text="Also add to playlist", variable=self.playlist_var, bg=theme.PANEL,
                       fg=theme.TEXT, selectcolor=theme.PANEL_ALT, activebackground=theme.PANEL,
                       activeforeground=theme.TEXT, highlightthickness=0, bd=0, font=theme.font(10)
                       ).grid(row=7, column=0, columnspan=2, sticky="w", pady=(14, 0))
        self.error_var = tk.StringVar()
        tk.Label(self.body, textvariable=self.error_var, bg=theme.PANEL, fg=theme.DANGER, font=theme.font(9),
                 wraplength=420, justify="left").grid(row=8, column=0, columnspan=2, sticky="w", pady=(10, 0))
        buttons = tk.Frame(self.body, bg=theme.PANEL)
        buttons.grid(row=9, column=0, columnspan=2, sticky="e", pady=(12, 0))
        theme.make_button(buttons, "Cancel", self.destroy, "ghost").pack(side="left", padx=(0, 8))
        theme.make_button(buttons, "Add song", self._submit, "primary").pack(side="left")
        self.bind("<Return>", lambda e: self._submit())
        self.show()
        self.title_entry.focus_set()

    def _browse(self) -> None:
        patterns = " ".join(f"*{e}" for e in SUPPORTED_EXTENSIONS)
        path = filedialog.askopenfilename(parent=self, title="Choose an audio file",
                                          filetypes=[("Audio files", patterns), ("All files", "*.*")])
        if path:
            self.path_var.set(path)
            if not self.title_var.get().strip():          # convenience: guess the title from the file name
                self.title_var.set(os.path.splitext(os.path.basename(path))[0])

    def _submit(self) -> None:
        error = self.submit(self.title_var.get(), self.artist_var.get(), self.path_var.get(),
                            self.playlist_var.get())
        if error:
            self.error_var.set(error)        # stay open so the user can fix the input
        else:
            self.destroy()


class Tooltip:
    """Small hint that appears under a widget after the mouse rests on it for half a second."""

    def __init__(self, widget: tk.Misc, text: str):
        self.widget, self.text = widget, text
        self._after = None
        self._window: Optional[tk.Toplevel] = None
        widget.bind("<Enter>", self._schedule, add="+")
        widget.bind("<Leave>", self._hide, add="+")
        widget.bind("<ButtonPress-1>", self._hide, add="+")

    def _schedule(self, _event=None) -> None:
        self._hide()
        self._after = self.widget.after(500, self._show)

    def _show(self) -> None:
        self._after = None
        window = tk.Toplevel(self.widget)
        window.wm_overrideredirect(True)
        tk.Label(window, text=self.text, bg=theme.PANEL_ALT, fg=theme.TEXT, font=theme.font(9),
                 padx=8, pady=4, bd=1, relief="solid", highlightthickness=0).pack()
        x = self.widget.winfo_rootx() + 4
        y = self.widget.winfo_rooty() - 34
        window.wm_geometry(f"+{x}+{max(0, y)}")
        self._window = window

    def _hide(self, _event=None) -> None:
        if self._after is not None:
            self.widget.after_cancel(self._after)
            self._after = None
        if self._window is not None:
            self._window.destroy()
            self._window = None


def draw_icon(canvas: tk.Canvas, icon: str, cx: float, cy: float, unit: float, colour: str) -> None:
    """Paint one icon (see ui/icons.py) onto a canvas. Shared by IconButton and NavButton."""
    for shape in icon_shapes(icon, cx, cy, unit):
        if shape[0] == "poly":
            canvas.create_polygon(*shape[1], fill=colour, outline=colour, width=1)
        elif shape[0] == "oval":
            canvas.create_oval(*shape[1], outline=colour, fill=colour if shape[2] else "", width=2)
        else:
            canvas.create_line(*shape[1], fill=colour, width=2, joinstyle="round",
                               arrow="last" if shape[2] else "none", arrowshape=(7, 8, 3))


class NavButton(tk.Frame):
    """A sidebar item: a drawn icon on the left, the label on the right.

    Three looks: normal (grey), hovering (lighter background), active (violet background,
    bright text and a violet icon). The whole row is clickable.
    """

    ICON_BOX = 22

    def __init__(self, parent, icon: str, text: str, command: Callable[[], None], **options):
        super().__init__(parent, bg=theme.SIDEBAR, cursor="hand2", **options)
        self.icon, self.command = icon, command
        self.active = False
        self.canvas = tk.Canvas(self, width=self.ICON_BOX, height=self.ICON_BOX, bg=theme.SIDEBAR,
                                highlightthickness=0, bd=0, cursor="hand2", takefocus=0)
        self.canvas.pack(side="left", padx=(18, 12), pady=10)
        self.label = tk.Label(self, text=text, anchor="w", bg=theme.SIDEBAR, fg=theme.MUTED,
                              font=theme.font(11), cursor="hand2")
        self.label.pack(side="left", fill="x", expand=True)
        for part in (self, self.canvas, self.label):
            part.bind("<Button-1>", lambda e: self.command())
            part.bind("<Enter>", lambda e: self._paint(True))
            part.bind("<Leave>", lambda e: self._paint(False))
        self._paint(False)

    def set_active(self, active: bool) -> None:
        self.active = active
        self._paint(False)

    def _paint(self, hovering: bool) -> None:
        if self.active:
            background, text_colour, icon_colour = theme.ACCENT_SOFT, theme.TEXT, theme.ACCENT
        else:
            background = theme.HOVER if hovering else theme.SIDEBAR
            text_colour = theme.TEXT if hovering else theme.MUTED
            icon_colour = text_colour
        for part in (self, self.canvas, self.label):
            part.configure(bg=background)
        self.label.configure(fg=text_colour)
        self.canvas.delete("all")
        centre = self.ICON_BOX / 2
        draw_icon(self.canvas, self.icon, centre, centre, self.ICON_BOX * 0.32, icon_colour)


class IconButton(tk.Canvas):
    """A round-ish button showing a drawn icon.

    kind="primary": violet disc with a dark icon (play/pause).  kind="ghost": plain icon that
    brightens on hover.  set_icon() swaps the picture, set_active() tints it violet (Repeat on).
    """

    def __init__(self, parent, icon: str, command: Callable[[], None], size: int = 36,
                 kind: str = "ghost", hint: str = "", **options):
        super().__init__(parent, width=size, height=size, bg=parent.cget("bg"), highlightthickness=0,
                         bd=0, cursor="hand2", takefocus=0, **options)
        self.icon, self.command, self.size, self.kind = icon, command, size, kind
        self.active = False
        self.hovering = False
        self.enabled = True
        self.bind("<Enter>", lambda e: self._hover(True))
        self.bind("<Leave>", lambda e: self._hover(False))
        self.bind("<ButtonRelease-1>", self._click)
        if hint:
            Tooltip(self, hint)
        self._draw()

    def set_icon(self, icon: str) -> None:
        if icon != self.icon:
            self.icon = icon
            self._draw()

    def set_active(self, active: bool) -> None:
        if active != self.active:
            self.active = active
            self._draw()

    def _hover(self, hovering: bool) -> None:
        self.hovering = hovering
        self._draw()

    def _click(self, event) -> None:
        if self.enabled and 0 <= event.x <= self.size and 0 <= event.y <= self.size:
            self.command()

    def _draw(self) -> None:
        self.delete("all")
        size, centre = self.size, self.size / 2
        unit = size * (0.17 if self.kind == "primary" else 0.2)
        if self.kind == "primary":
            self.create_oval(1, 1, size - 1, size - 1, outline="",
                             fill=theme.ACCENT_HOVER if self.hovering else theme.ACCENT)
            colour = "#14111f"
        else:
            if self.hovering:
                self.create_oval(2, 2, size - 2, size - 2, fill=theme.HOVER, outline="")
            colour = theme.ACCENT if self.active else (theme.TEXT if self.hovering else theme.MUTED)
        draw_icon(self, self.icon, centre, centre, unit, colour)
