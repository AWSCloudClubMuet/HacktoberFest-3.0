import os, tempfile, unittest
from music.library_manager import LibraryManager
from player.app_service import AppService
from storage.library_storage import load_library
from tests.helpers import FakeAudio, make_wav


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)
        self.audio = FakeAudio()
        self.data = os.path.join(self.dir.name, "lib.json")
        self.svc = AppService(LibraryManager(), self.audio, self.data)
        self.files = [make_wav(os.path.join(self.dir.name, f"{n}.wav")) for n in "abc"]

    def add(self, n, to_playlist=True):
        return self.svc.add_song(f"Song {n}", "Artist", self.files["abc".index(n)], to_playlist)

    def test_add_song_validation(self):
        with self.assertRaises(ValueError): self.svc.add_song("T", "A", "")
        with self.assertRaises(ValueError): self.svc.add_song("T", "A", os.path.join(self.dir.name, "nope.wav"))
        txt = os.path.join(self.dir.name, "x.txt"); open(txt, "w").close()
        with self.assertRaises(ValueError): self.svc.add_song("T", "A", txt)
        with self.assertRaises(ValueError): self.svc.add_song("", "A", self.files[0])
        self.assertEqual(self.svc.library.all_songs(), [])      # nothing half-added

    def test_play_pause_resume_stop(self):
        self.add("a")
        self.assertIn("Playing", self.svc.toggle_play_pause())
        self.assertEqual(self.audio.state, "playing")
        self.assertEqual(self.svc.toggle_play_pause(), "Paused.")
        self.assertEqual(self.svc.toggle_play_pause(), "Resumed.")
        self.assertEqual(len(self.audio.played), 1)             # resume did not restart
        self.svc.stop(); self.assertEqual(self.audio.state, "stopped")

    def test_empty_playlist_messages(self):
        self.assertIn("empty", self.svc.toggle_play_pause())
        self.assertEqual(self.svc.next(), "Nothing to play.")
        self.assertEqual(self.svc.back(), "History is empty.")

    def test_queue_plays_without_moving_position(self):
        a, b, c = self.add("a"), self.add("b"), self.add("c")
        self.svc.toggle_play_pause(); self.svc.next()           # playing b
        self.svc.add_to_up_next(a.id)
        self.svc.next()
        self.assertEqual(self.audio.played[-1], a.audio_path)
        self.assertEqual(self.svc.controller.playlist.current_song.id, b.id)
        self.svc.next()
        self.assertEqual(self.audio.played[-1], c.audio_path)

    def test_end_and_start_messages(self):
        self.add("a"); self.svc.toggle_play_pause()
        self.assertIn("End of playlist", self.svc.next())
        self.assertIn("first song", self.svc.previous())

    def test_auto_advance_when_song_finishes(self):
        self.add("a"); b = self.add("b")
        self.svc.toggle_play_pause()
        self.assertIsNone(self.svc.poll())                      # still playing
        self.audio.finished = True
        self.assertIn("Playing", self.svc.poll())
        self.assertEqual(self.audio.played[-1], b.audio_path)

    def test_no_auto_advance_when_paused(self):
        self.add("a"); self.add("b"); self.svc.toggle_play_pause(); self.svc.toggle_play_pause()
        self.audio.finished = True
        self.assertIsNone(self.svc.poll())

    def test_missing_file_reported_not_crash(self):
        a = self.add("a")
        os.remove(a.audio_path)
        msg = self.svc.toggle_play_pause()
        self.assertIn("Cannot play", msg); self.assertEqual(self.audio.state, "stopped")

    def test_back_and_history(self):
        self.add("a"); self.add("b")
        self.svc.toggle_play_pause(); self.svc.next()
        self.assertIn("Song a", self.svc.back())

    def test_duplicate_playlist_add_message(self):
        a = self.add("a")
        self.assertIn("already", self.svc.add_to_playlist(a.id))

    def test_delete_song_everywhere(self):
        a = self.add("a"); self.svc.add_to_up_next(a.id)
        self.svc.delete_song(a.id)
        self.assertEqual(len(self.svc.controller.playlist), 0)
        self.assertEqual(self.svc.controller.up_next_songs(), [])
        self.assertEqual(self.svc.prefix_search("song"), [])

    def test_relations_and_recommend(self):
        self.svc.add_relation("A", "B"); self.svc.add_relation("B", "C")
        self.assertEqual(self.svc.recommend("A"), ["C"])
        with self.assertRaises(ValueError): self.svc.add_relation("A", "A")

    def test_save_and_restore_playlist_and_ids(self):
        a, b = self.add("a"), self.add("b"); self.svc.add_relation("X", "Y")
        self.svc.remove_from_playlist(a.id)
        lib, warnings = load_library(self.data)
        svc2 = AppService(lib, FakeAudio(), self.data); svc2.restore_playlist()
        self.assertEqual([s.id for s in svc2.controller.playlist.songs()], [b.id])
        self.assertEqual(len(lib.all_songs()), 2)               # a still in library
        self.assertGreater(lib.add_song("N", "Z").id, b.id)


if __name__ == "__main__":
    unittest.main()
