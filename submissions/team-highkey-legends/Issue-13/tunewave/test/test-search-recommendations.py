
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from search_recommendations import SongSearchBST, ArtistGraph


class TestSongSearchBST(unittest.TestCase):
    def setUp(self):
        self.search = SongSearchBST()

        songs = [
            ("Midnight City", "S001", "M83"),
            ("Another Love", "S002", "Tom Odell"),
            ("Midnight Rain", "S003", "Taylor Swift"),
            ("Anti-Hero", "S004", "Taylor Swift"),
            ("Moonlight", "S005", "Kali Uchis"),
            ("midnight City", "S006", "Cover Artist"),
        ]

        for title, song_id, artist in songs:
            self.search.add_song(title, song_id, artist)

    def test_exact_search(self):
        result = self.search.find_song("Another Love")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].song_id, "S002")

    def test_search_is_case_insensitive(self):
        result = self.search.find_song("another love")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].song_id, "S002")

    def test_missing_song(self):
        self.assertEqual(self.search.find_song("Unknown Song"), [])

    def test_prefix_search(self):
        results = self.search.prefix_search("Mid")
        titles = [song.title for song in results]

        self.assertEqual(
            [title.casefold() for title in titles],
            sorted(title.casefold() for title in titles),
        )
        self.assertEqual(len(results), 3)

    def test_prefix_search_is_case_insensitive(self):
        results = self.search.prefix_search("MOON")
        self.assertEqual([song.title for song in results], ["Moonlight"])

    def test_no_prefix_matches(self):
        self.assertEqual(self.search.prefix_search("XYZ"), [])

    def test_duplicate_song_id_is_rejected(self):
        self.assertFalse(
            self.search.add_song("Different Title", "S001", "Different Artist")
        )

    def test_duplicate_titles_are_preserved(self):
        results = self.search.find_song("Midnight City")
        self.assertEqual(len(results), 2)

    def test_empty_prefix_returns_all_songs(self):
        results = self.search.prefix_search("")
        self.assertEqual(len(results), 6)


class TestArtistGraph(unittest.TestCase):
    def setUp(self):
        self.graph = ArtistGraph()

        # A is connected to B and C.
        # D and E are two links away from A.
        # B is directly connected to A, so it must not be recommended.
        self.graph.add_relation("A", "B")
        self.graph.add_relation("A", "C")
        self.graph.add_relation("B", "D")
        self.graph.add_relation("C", "E")
        self.graph.add_relation("C", "B")

    def test_relations_are_undirected(self):
        self.assertIn("B", self.graph.adjacency["A"])
        self.assertIn("A", self.graph.adjacency["B"])

    def test_recommend_artists_two_links_away(self):
        results = self.graph.recommend_artists("A")
        self.assertEqual(results, ["D", "E"])

    def test_direct_connections_are_excluded(self):
        results = self.graph.recommend_artists("A")
        self.assertNotIn("B", results)
        self.assertNotIn("C", results)

    def test_original_artist_is_excluded(self):
        results = self.graph.recommend_artists("A")
        self.assertNotIn("A", results)

    def test_recommendations_are_alphabetical(self):
        self.graph.add_relation("B", "Z")
        self.graph.add_relation("C", "F")

        results = self.graph.recommend_artists("A")
        self.assertEqual(results, sorted(results, key=str.casefold))

    def test_unknown_artist(self):
        self.assertEqual(self.graph.recommend_artists("Unknown"), [])

    def test_duplicate_relation(self):
        self.graph.add_relation("A", "B")
        self.assertEqual(len(self.graph.adjacency["A"]), 2)


if __name__ == "__main__":
    unittest.main()
