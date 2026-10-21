"""All colours, fonts and ttk styling in ONE place. Change a colour here, it changes everywhere."""
import tkinter as tk
from tkinter import ttk

# ---- palette (charcoal + soft violet) ------------------------------------------
BG = "#121214"            # window background
SIDEBAR = "#17171a"
PLAYER = "#17171a"
PANEL = "#1c1c21"         # cards and tables
PANEL_ALT = "#25252c"     # inputs
HOVER = "#2c2c35"
BORDER = "#2e2e38"
TEXT = "#ececf1"
MUTED = "#9a9aa8"
DISABLED = "#5d5d6b"
ACCENT = "#a78bfa"        # soft violet
ACCENT_HOVER = "#b9a2fb"
ACCENT_SOFT = "#2e2748"   # selected rows, active nav item
DANGER = "#f0707a"

FONT = "Segoe UI"         # Tk falls back to a default font on systems without it
SYMBOL_FONT = "Segoe UI Symbol"


def font(size: int = 10, weight: str = "normal"):
    return (FONT, size, weight)


def apply_theme(root: tk.Tk) -> None:
    """Style the ttk widgets (table, scrollbar, entry, combobox) and the root window."""
    root.configure(bg=BG)
    style = ttk.Style(root)
    style.theme_use("clam")                      # the only built-in theme that allows full recolouring
    style.configure(".", background=BG, foreground=TEXT, font=font(10))

    # Tables
    style.layout("Treeview", [("Treeview.treearea", {"sticky": "nswe"})])      # no border
    style.configure("Treeview", background=PANEL, fieldbackground=PANEL, foreground=TEXT,
                    rowheight=36, borderwidth=0, font=font(10))
    style.map("Treeview", background=[("selected", ACCENT_SOFT)], foreground=[("selected", TEXT)])
    style.configure("Treeview.Heading", background=PANEL, foreground=MUTED, relief="flat",
                    borderwidth=0, font=font(9, "bold"), padding=(8, 8))
    style.map("Treeview.Heading", background=[("active", PANEL)])

    # Scrollbar (thin, quiet)
    style.configure("Vertical.TScrollbar", background=HOVER, troughcolor=PANEL, bordercolor=PANEL,
                    lightcolor=HOVER, darkcolor=HOVER, arrowcolor=PANEL, gripcount=0, arrowsize=10)
    style.map("Vertical.TScrollbar", background=[("active", ACCENT_SOFT)])

    # Text input and drop-down
    for name in ("TEntry", "TCombobox"):
        style.configure(name, fieldbackground=PANEL_ALT, background=PANEL_ALT, foreground=TEXT,
                        insertcolor=TEXT, bordercolor=BORDER, lightcolor=PANEL_ALT,
                        darkcolor=PANEL_ALT, padding=8, arrowcolor=MUTED)
        style.map(name, bordercolor=[("focus", ACCENT)], lightcolor=[("focus", ACCENT)],
                  darkcolor=[("focus", ACCENT)])
    style.map("TCombobox", fieldbackground=[("readonly", PANEL_ALT)], foreground=[("readonly", TEXT)],
              selectbackground=[("readonly", PANEL_ALT)], selectforeground=[("readonly", TEXT)])
    # the pop-up list of a combobox is a plain Tk listbox
    root.option_add("*TCombobox*Listbox.background", PANEL_ALT)
    root.option_add("*TCombobox*Listbox.foreground", TEXT)
    root.option_add("*TCombobox*Listbox.selectBackground", ACCENT_SOFT)
    root.option_add("*TCombobox*Listbox.selectForeground", TEXT)
    root.option_add("*TCombobox*Listbox.font", f"{{{FONT}}} 10")


def make_button(parent, text: str, command, kind: str = "secondary", **options) -> tk.Button:
    """A flat button with hover colour. kind: 'primary' (violet), 'secondary', 'ghost', 'danger'."""
    colours = {                     # (background, hover background, text colour)
        "primary": (ACCENT, ACCENT_HOVER, "#14111f"),
        "secondary": (PANEL_ALT, HOVER, TEXT),
        "ghost": (parent.cget("bg"), HOVER, MUTED),
        "danger": (PANEL_ALT, HOVER, DANGER),
    }
    normal, hover, fg = colours[kind]
    settings = dict(text=text, command=command, bg=normal, fg=fg, activebackground=hover,
                    activeforeground=fg, relief="flat", bd=0, highlightthickness=0, cursor="hand2",
                    padx=14, pady=7, font=font(10, "bold" if kind == "primary" else "normal"),
                    disabledforeground=DISABLED, takefocus=0)    # takefocus=0: space bar is not stolen
    settings.update(options)
    button = tk.Button(parent, **settings)
    button.base_bg, button.hover_bg = normal, hover
    button.bind("<Enter>", lambda e: button.cget("state") != "disabled" and button.configure(bg=hover))
    button.bind("<Leave>", lambda e: button.configure(bg=button.base_bg))
    return button


def make_label(parent, text="", size: int = 10, weight: str = "normal", colour: str = TEXT, **options):
    options.setdefault("bg", parent.cget("bg"))
    return tk.Label(parent, text=text, fg=colour, font=font(size, weight), **options)
