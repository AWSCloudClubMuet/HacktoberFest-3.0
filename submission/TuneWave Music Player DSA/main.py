"""TuneWave entry point. Run:  python main.py

Loads library.json (next to this file), builds the components and opens the window.
"""
import os
import sys
import tkinter as tk
from tkinter import messagebox

from player.app_service import AppService
from player.audio_backend import PygameAudio
from storage.library_storage import StorageError, load_library
from ui.main_window import MainWindow

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "library.json")


def main() -> None:
    root = tk.Tk()
    try:
        library, warnings = load_library(DATA_FILE)
    except StorageError as err:
        # Do NOT overwrite a file we cannot read: tell the user and stop.
        messagebox.showerror("TuneWave", f"{err}\n\nFix or rename library.json, then start again.")
        sys.exit(1)
    service = AppService(library, PygameAudio(), DATA_FILE)
    service.restore_playlist()
    window = MainWindow(root, service)
    if warnings:
        window._set_status("Loaded with warnings: " + "; ".join(warnings))
    root.mainloop()


if __name__ == "__main__":
    main()
