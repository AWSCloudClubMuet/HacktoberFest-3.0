"""Opens the real window and drives it. Skipped automatically when no display/Tkinter exists."""
import os, tempfile, types, unittest

os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
os.environ.setdefault("PYGAME_HIDE_SUPPORT_PROMPT", "1")
try:
    import tkinter as tk
    _root = tk.Tk(); _root.destroy(); HAVE_DISPLAY = True
except Exception:
    HAVE_DISPLAY = False

from music.library_manager import LibraryManager
from player.app_service import AppService
from tests.helpers import FakeAudio, make_wav


@unittest.skipUnless(HAVE_DISPLAY, "no display / tkinter")
class GuiSmokeTests(unittest.TestCase):
    def setUp(self):
        from ui.main_window import MainWindow
        self.dir = tempfile.TemporaryDirectory(); self.addCleanup(self.dir.cleanup)
        self.audio = FakeAudio(200.0)
        self.svc = AppService(LibraryManager(), self.audio, os.path.join(self.dir.name, "l.json"))
        self.root = tk.Tk(); self.addCleanup(lambda: self.root.winfo_exists() and self.root.destroy())
        self.win = MainWindow(self.root, self.svc)
        self.root.update()

    def add_songs(self):
        for name, artist in [("Alpha", "A"), ("Beta", "B"), ("Bounce", "C")]:
            error = self.win.add_song_from_form(name, artist, make_wav(os.path.join(self.dir.name, name + ".wav")), True)
            self.assertIsNone(error)

    def test_add_play_queue_history_search_artists(self):
        self.add_songs()
        self.assertEqual(self.win.library_table.row_count(), 3)
        self.assertEqual(self.win.playlist_table.row_count(), 3)
        self.win._act(self.svc.toggle_play_pause)
        self.assertEqual(self.win.song_var.get(), "Alpha"); self.assertEqual(self.win.artist_var.get(), "A")
        self.assertEqual(self.win.play_button.icon, "pause")
        self.win.library_table.select_key(3)
        self.win._with_selected(self.win.library_table, self.svc.add_to_up_next)
        self.assertEqual(self.win.queue_table.row_count(), 1)
        self.win._act(self.svc.next)                                    # plays Bounce from the queue
        self.assertEqual(self.win.queue_table.row_count(), 0)
        self.assertEqual(self.win.history_table.row_count(), 1)
        self.assertEqual(self.win.playlist_table.row_values(0)[0], "▸")  # playlist position still on Alpha
        self.win.search_var.set("b"); self.win._search(exact=False)
        self.assertEqual([self.win.library_table.row_values(i)[1] for i in range(2)], ["Beta", "Bounce"])
        self.win.search_var.set(""); self.win._search(exact=False)
        for a, b in [("A", "B"), ("B", "C")]:
            self.win.artist_a_var.set(a); self.win.artist_b_var.set(b); self.win._link_artists()
        self.win.artist_table.select_key("A"); self.root.update()
        self.win._recommend()
        self.assertEqual(self.win.recommend_list.get(0), "C")
        self.win._toggle_repeat(); self.assertTrue(self.win.repeat_button.active)

    def test_add_song_errors_are_returned_not_raised(self):
        self.assertIn("file", self.win.add_song_from_form("T", "A", "", True).lower())
        self.assertEqual(self.win.library_table.row_count(), 0)

    def test_all_views_can_be_shown(self):
        for key in ("playlist", "artists", "queue", "history", "library"):
            self.win.show_view(key); self.root.update()

    def test_seek_slider_click_and_drag_forward_and_backward(self):
        self.add_songs(); self.win._act(self.svc.toggle_play_pause); self.root.update()
        bar = self.win.seek_bar
        self.assertTrue(bar.enabled)
        before = (self.svc.controller.playlist.current_song.id, len(self.svc.audio.played))
        width = bar.winfo_width(); self.assertGreater(width, 50)
        click = lambda fraction: types.SimpleNamespace(x=bar.PAD + fraction * (width - 2 * bar.PAD))
        bar._press(click(0.75)); bar._release(click(0.75))              # click forward
        self.assertAlmostEqual(self.svc.position() / 200, 0.75, delta=0.02)
        self.assertEqual(self.win.elapsed_var.get(), "2:30")
        bar._press(click(0.5)); bar._motion(click(0.1))                 # drag backward: audio untouched until release
        self.assertEqual(self.audio.seeks, [150.0])
        self.assertEqual(self.win.elapsed_var.get(), "0:20")            # live preview
        bar._release(click(0.1))
        self.assertAlmostEqual(self.svc.position(), 20, delta=4)
        after = (self.svc.controller.playlist.current_song.id, len(self.svc.audio.played))
        self.assertEqual(before, after)                                  # same playlist position, no restart
        self.assertEqual(self.win.history_table.row_count(), 0)

    def test_progress_labels_update_on_tick(self):
        self.add_songs(); self.win._act(self.svc.toggle_play_pause)
        self.audio.clock.advance(30); self.win._update_progress()
        self.assertEqual(self.win.elapsed_var.get(), "0:30"); self.assertEqual(self.win.total_var.get(), "3:20")
        self.assertAlmostEqual(self.win.seek_bar.fraction, 0.15, places=2)

    def test_unknown_duration_disables_slider(self):
        self.add_songs(); self.audio.next_duration = None
        self.win._act(self.svc.toggle_play_pause); self.win._update_progress()
        self.assertFalse(self.win.seek_bar.enabled); self.assertEqual(self.win.total_var.get(), "--:--")
        self.win._on_seek(0.5); self.assertIn("unknown", self.win.status_var.get())

    def test_double_click_plays_from_each_list(self):
        self.add_songs()
        def double_click(table, key):
            table.tree.selection_set(str(table.keys.index(key))); self.root.update()
            self.win._act(lambda: {"library": self.svc.play_now, "playlist": self.svc.play_from_playlist}[table.name](key))
        self.win.library_table.name, self.win.playlist_table.name = "library", "playlist"
        double_click(self.win.library_table, 3)
        self.assertEqual(self.win.song_var.get(), "Bounce")
        self.assertEqual(self.svc.controller.playlist.current_song.title, "Alpha")      # position unchanged
        double_click(self.win.playlist_table, 2)
        self.assertEqual(self.win.song_var.get(), "Beta")
        self.assertEqual(self.svc.controller.playlist.current_song.title, "Beta")       # position moved
        self.assertEqual(self.win.play_button.icon, "pause")

    def test_double_click_event_on_row_and_header(self):
        self.add_songs(); self.root.update()
        table = self.win.library_table; self.win.show_view("library"); self.root.update()
        bbox = table.tree.bbox("1")
        if bbox:                                             # row 1 is visible: real event
            table.tree.event_generate("<Double-1>", x=bbox[0] + 5, y=bbox[1] + 5); self.root.update()
            self.assertEqual(self.win.song_var.get(), "Beta")
        table.tree.event_generate("<Double-1>", x=5, y=2); self.root.update()               # header: ignored

    def test_skip_buttons_and_arrow_keys(self):
        self.add_songs(); self.win._act(self.svc.toggle_play_pause); self.audio.clock.advance(30)
        self.win._skip(10); self.assertAlmostEqual(self.svc.position(), 40)
        self.win._skip(-10); self.assertAlmostEqual(self.svc.position(), 30)
        self.win._on_arrow(types.SimpleNamespace(widget=self.root), 5); self.assertAlmostEqual(self.svc.position(), 35)
        self.win._on_arrow(types.SimpleNamespace(widget=self.win.search_entry), 5)          # typing: ignored
        self.assertAlmostEqual(self.svc.position(), 35)

    def test_empty_actions_do_not_crash(self):
        self.win._act(self.svc.next); self.win._act(self.svc.back); self.win._act(self.svc.toggle_play_pause)
        self.win._search(exact=True); self.win._recommend(); self.win._delete_selected()
        self.win._with_selected(self.win.library_table, self.svc.add_to_playlist)
        self.win._on_seek(0.5); self.win._tick()

    def test_delete_with_confirmation(self):
        self.add_songs(); self.win._confirm = lambda *a: True
        self.win.library_table.select_key(1); self.win._delete_selected()
        self.assertEqual(self.win.library_table.row_count(), 2)


if __name__ == "__main__":
    unittest.main()
