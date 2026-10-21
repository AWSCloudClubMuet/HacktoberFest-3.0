import unittest
from data_structures.binary_search_tree import SongBST


class BSTTests(unittest.TestCase):
    def test_find_and_case_insensitive(self):
        t = SongBST(); t.add_song("Hello", 1)
        self.assertEqual(t.find_song("hello"), [1]); self.assertEqual(t.find_song("nope"), [])

    def test_duplicate_titles_keep_all_ids(self):
        t = SongBST(); t.add_song("Echo", 1); t.add_song("Echo", 2)
        self.assertEqual(t.find_song("Echo"), [1, 2]); self.assertEqual(t.node_count, 1)

    def test_prefix_alphabetical(self):
        t = SongBST()
        for i, title in enumerate(["Bravo", "alpha", "Beta", "Banana", "Cat", "Ba"], 1):
            t.add_song(title, i)
        self.assertEqual([x[0] for x in t.prefix_search("ba")], ["Ba", "Banana"])
        self.assertEqual([x[0] for x in t.prefix_search("b")], ["Ba", "Banana", "Beta", "Bravo"])
        self.assertEqual(t.prefix_search("zzz"), [])
        self.assertEqual(len(t.prefix_search("")), 6)

    def test_prefix_skips_subtrees(self):
        t = SongBST()
        for i, c in enumerate("mftcipwadhjnruxyz", 1):
            t.add_song(c, i)
        t.prefix_search("x")
        self.assertLess(t.last_visited_count, t.node_count)

    def test_remove(self):
        t = SongBST(); t.add_song("Echo", 1); t.add_song("Echo", 2)
        self.assertTrue(t.remove_song("Echo", 1))
        self.assertEqual(t.find_song("Echo"), [2]); self.assertEqual(t.prefix_search("ec"), [("Echo", 2)])

    def test_empty(self):
        t = SongBST(); self.assertEqual(t.prefix_search("a"), []); self.assertEqual(t.find_song("a"), [])


if __name__ == "__main__":
    unittest.main()
