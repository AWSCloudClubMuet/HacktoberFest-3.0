import json, os, tempfile, unittest
from music.library_manager import LibraryManager
from storage.library_storage import load_library, save_library, StorageError


class LibraryTests(unittest.TestCase):
    def test_ids_never_reused_after_delete(self):
        lib = LibraryManager()
        a = lib.add_song("A", "x"); b = lib.add_song("B", "x")
        lib.remove_song(b.id)
        self.assertGreater(lib.add_song("C", "x").id, b.id)

    def test_validation(self):
        lib = LibraryManager()
        with self.assertRaises(ValueError): lib.add_song("  ", "x")
        with self.assertRaises(ValueError): lib.add_song("t", "")

    def test_duplicate_titles_different_ids(self):
        lib = LibraryManager()
        s1 = lib.add_song("Echo", "a"); s2 = lib.add_song("Echo", "b")
        self.assertNotEqual(s1.id, s2.id); self.assertEqual(len(lib.find_song("echo")), 2)

    def test_save_load_roundtrip_keeps_counter(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "lib.json")
            lib = LibraryManager()
            lib.add_song("A", "x"); last = lib.add_song("B", "y")
            lib.add_relation("x", "y"); lib.remove_song(last.id)
            save_library(lib, path)
            lib2, warnings = load_library(path)
            self.assertEqual(warnings, [])
            self.assertEqual([s.title for s in lib2.prefix_search("")], ["A"])
            self.assertEqual(lib2.graph.related("x"), ["y"])
            self.assertGreater(lib2.add_song("C", "z").id, last.id)

    def test_missing_and_malformed(self):
        with tempfile.TemporaryDirectory() as d:
            lib, w = load_library(os.path.join(d, "none.json"))
            self.assertEqual(len(lib.all_songs()), 0)
            bad = os.path.join(d, "bad.json")
            with open(bad, "w") as f: f.write("{not json")
            with self.assertRaises(StorageError): load_library(bad)

    def test_bad_and_duplicate_records_skipped(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "l.json")
            data = {"next_id": 1, "songs": [
                {"id": 5, "title": "A", "artist": "x"},
                {"id": 5, "title": "Dup", "artist": "x"},
                {"id": "z", "title": "Bad", "artist": "x"}], "relations": []}
            with open(path, "w") as f: json.dump(data, f)
            lib, warnings = load_library(path)
            self.assertEqual(len(warnings), 2); self.assertEqual(len(lib.all_songs()), 1)
            self.assertEqual(lib.add_song("N", "x").id, 6)


if __name__ == "__main__":
    unittest.main()
