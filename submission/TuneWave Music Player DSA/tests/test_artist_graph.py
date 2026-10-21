import unittest
from data_structures.artist_graph import ArtistGraph


class GraphTests(unittest.TestCase):
    def test_symmetry_no_dupes_no_self(self):
        g = ArtistGraph()
        self.assertTrue(g.add_relation("A", "B")); g.add_relation("B", "A")
        self.assertFalse(g.add_relation("A", "A"))
        self.assertEqual(g.related("A"), ["B"]); self.assertEqual(g.related("B"), ["A"])
        self.assertEqual(g.edges(), [("A", "B")])

    def test_two_links_away(self):
        g = ArtistGraph(); g.add_relation("A", "B"); g.add_relation("B", "C")
        self.assertEqual(g.recommend_artists("A"), ["C"])
        self.assertEqual(g.recommend_artists("C"), ["A"])

    def test_exclude_direct_neighbors(self):
        g = ArtistGraph()
        for a, b in [("A", "B"), ("B", "C"), ("A", "D"), ("D", "C"), ("B", "E")]:
            g.add_relation(a, b)
        g.add_relation("A", "E")        # E is now direct; must be excluded
        self.assertEqual(g.recommend_artists("A"), ["C"])   # C via two paths, listed once

    def test_alphabetical(self):
        g = ArtistGraph()
        for x in ("Zed", "Amy", "Moe"):
            g.add_relation("Hub", x); g.add_relation("A", "Hub")
        self.assertEqual(g.recommend_artists("A"), ["Amy", "Moe", "Zed"])

    def test_unknown_empty_isolated(self):
        g = ArtistGraph()
        self.assertEqual(g.recommend_artists("nobody"), [])
        g.add_artist("Solo"); self.assertEqual(g.recommend_artists("Solo"), [])
        g.add_relation("A", "B"); self.assertEqual(g.recommend_artists("A"), [])


if __name__ == "__main__":
    unittest.main()
