import random
import unittest

from player import ArtistGraph, MusicPlayer, Playlist, Song, SongSearch

def song(number):
    return Song(str(number), f"Track {number:03}", "Artist")

class PlaylistTests(unittest.TestCase):
    def setUp(self):
        self.playlist = Playlist()

    def assertLinks(self):
        playlist = self.playlist
        forward, node, previous = [], playlist.head, None
        while node is not None:
            self.assertIs(node.previous, previous)
            self.assertIs(playlist.nodes[node.song.songId], node)
            forward.append(node.song)
            previous, node = node, node.next
        self.assertIs(previous, playlist.tail)
        backward, node, following = [], playlist.tail, None
        while node is not None:
            self.assertIs(node.next, following)
            backward.append(node.song)
            following, node = node, node.previous
        self.assertEqual(forward, backward[::-1])
        self.assertEqual(len(forward), len(playlist))
        if playlist.current is not None:
            self.assertIs(playlist.nodes[playlist.current.song.songId], playlist.current)

    def test_empty(self):
        self.assertIsNone(self.playlist.next())
        self.assertIsNone(self.playlist.previous())
        self.playlist.toggleRepeat()
        self.assertIsNone(self.playlist.next())
        with self.assertRaises(KeyError):
            self.playlist.removeSong("missing")

    def test_duplicate_rejected_without_mutation(self):
        self.playlist.addSong(song(1))
        with self.assertRaises(ValueError):
            self.playlist.addSong(Song("1", "Different", "Other"))
        self.assertEqual(list(self.playlist), [song(1)])
        self.assertLinks()

    def test_single_boundaries_and_repeat(self):
        self.playlist.addSong(song(1))
        self.assertEqual(self.playlist.next(), song(1))
        self.assertEqual(self.playlist.next(), "end")
        self.assertEqual(self.playlist.previous(), "start")
        self.assertTrue(self.playlist.toggleRepeat())
        self.assertEqual(self.playlist.next(), song(1))
        self.assertEqual(self.playlist.previous(), song(1))
        self.playlist.removeSong("1")
        self.assertLinks()
        self.assertIsNone(self.playlist.current)

    def test_navigation_and_wrapping(self):
        for i in range(3):
            self.playlist.addSong(song(i))
        self.assertEqual(self.playlist.previous(), song(2))
        self.assertEqual(self.playlist.previous(), song(1))
        self.assertEqual(self.playlist.previous(), song(0))
        self.assertEqual(self.playlist.previous(), "start")
        self.playlist.toggleRepeat()
        self.assertEqual(self.playlist.previous(), song(2))
        self.assertEqual(self.playlist.next(), song(0))

    def test_current_deletion_resumes_at_successor(self):
        for i in range(4):
            self.playlist.addSong(song(i))
        self.playlist.next()
        self.playlist.removeSong("0")
        self.assertEqual(self.playlist.next(), song(1))
        self.playlist.next()
        self.playlist.removeSong("2")
        self.assertEqual(self.playlist.next(), song(3))
        self.playlist.removeSong("3")
        self.assertEqual(self.playlist.next(), "end")
        self.assertEqual(self.playlist.current.song, song(1))
        self.assertLinks()

    def test_noncurrent_removal_preserves_cursor(self):
        for i in range(4):
            self.playlist.addSong(song(i))
        self.playlist.next()
        cursor = self.playlist.current
        for identifier in ("2", "3"):
            self.playlist.removeSong(identifier)
            self.assertIs(self.playlist.current, cursor)
            self.assertLinks()
        self.assertEqual(self.playlist.next(), song(1))

    def test_seeded_mutations_match_list_model(self):
        rng, expected = random.Random(13), []
        for number in range(250):
            if expected and rng.random() < .45:
                removed = rng.choice(expected)
                self.playlist.removeSong(removed.songId)
                expected.remove(removed)
            else:
                self.playlist.addSong(song(number))
                expected.append(song(number))
            self.assertEqual(list(self.playlist), expected)
            self.assertLinks()

class PlaybackTests(unittest.TestCase):
    def setUp(self):
        self.player = MusicPlayer()
        for i in range(3):
            self.player.addSong(song(i))

    def test_first_play_is_head(self):
        self.assertIsNone(self.player.playlist.current)
        self.assertEqual(self.player.playNext(), song(0))

    def test_fifo_priority_and_cursor_preservation(self):
        self.player.playNext()
        cursor = self.player.playlist.current
        self.player.addToUpNext("2")
        self.player.addToUpNext("0")
        self.assertEqual(self.player.playNext(), song(2))
        self.assertIs(self.player.playlist.current, cursor)
        self.assertEqual(self.player.playNext(), song(0))
        self.assertIs(self.player.playlist.current, cursor)
        self.assertEqual(self.player.playNext(), song(1))

    def test_queue_before_initial_playlist_playback(self):
        self.player.addToUpNext("2")
        self.assertEqual(self.player.playNext(), song(2))
        self.assertIsNone(self.player.playlist.current)
        self.assertEqual(self.player.playNext(), song(0))

    def test_catalog_only_and_removed_songs_remain_playable(self):
        self.player.registerSong(song(9))
        self.player.addToUpNext("9")
        self.player.addToUpNext("1")
        self.player.removeSong("1")
        self.assertEqual(self.player.playNext(), song(9))
        self.assertEqual(self.player.playNext(), song(1))
        self.assertEqual(self.player.search.findSong(song(1).title), ("1",))

    def test_unknown_queue_id_has_no_side_effect(self):
        with self.assertRaises(KeyError):
            self.player.addToUpNext("missing")
        self.assertFalse(self.player.upNext)

    def test_back_pops_without_reinserting_or_moving_cursor(self):
        self.player.playNext()
        self.player.playNext()
        cursor = self.player.playlist.current
        self.assertEqual(self.player.back(), song(1))
        self.assertEqual(self.player.back(), song(0))
        self.assertIsNone(self.player.back())
        self.assertIs(self.player.playlist.current, cursor)
        self.assertEqual(self.player.nowPlaying, song(0))
        self.assertEqual(self.player.playNext(), song(2))

    def test_history_keeps_latest_ten(self):
        for i in range(15):
            self.player.registerSong(song(i + 10))
            self.player.addToUpNext(str(i + 10))
            self.player.playNext()
        self.assertEqual(list(self.player.history), [song(i) for i in range(15, 25)])
        self.assertEqual([self.player.back() for _ in range(10)],
                         [song(i) for i in range(24, 14, -1)])
        self.assertIsNone(self.player.back())

    def test_end_and_empty_do_not_create_history(self):
        empty = MusicPlayer()
        self.assertIsNone(empty.playNext())
        self.assertIsNone(empty.back())
        for _ in range(3):
            self.player.playNext()
        self.assertEqual(self.player.playNext(), "end")
        self.assertEqual(len(self.player.history), 3)
        self.assertEqual(self.player.nowPlaying, song(2))

    def test_queue_still_plays_at_playlist_end(self):
        for _ in range(3):
            self.player.playNext()
        self.player.addToUpNext("0")
        self.assertEqual(self.player.playNext(), song(0))
        self.assertEqual(self.player.playNext(), "end")

    def test_catalog_conflict_and_playlist_readdition(self):
        with self.assertRaises(ValueError):
            self.player.addSong(song(0))
        self.player.removeSong("0")
        with self.assertRaises(ValueError):
            self.player.addSong(Song("0", "Conflict", "Artist"))
        self.player.addSong(song(0))
        self.assertEqual(self.player.search.findSong(song(0).title), ("0",))
        with self.assertRaises(ValueError):
            self.player.registerSong(song(0))

class SearchTests(unittest.TestCase):
    def test_empty_and_missing(self):
        search = SongSearch()
        self.assertIsNone(search.findSong("missing"))
        self.assertEqual(search.prefixSearch(""), [])

    def test_lookup_duplicate_titles_and_ids(self):
        search = SongSearch()
        search.addSong("Same", "a")
        search.addSong("Same", "b")
        self.assertEqual(search.findSong("Same"), ("a", "b"))
        self.assertIsNone(search.findSong("same"))
        with self.assertRaises(ValueError):
            search.addSong("Other", "a")
        self.assertIsNone(search.findSong("Other"))

    def test_prefix_sorted_unique_and_case_sensitive(self):
        search = SongSearch()
        titles = ["Blue", "Aurora", "Breeze", "Bloom", "blue", "B", "Zulu", "Blue"]
        for i, title in enumerate(titles):
            search.addSong(title, str(i))
        for prefix in ("", "B", "Bl", "Blue", "blue", "missing", "Z", "Zulus"):
            self.assertEqual(search.prefixSearch(prefix),
                             sorted({title for title in titles if title.startswith(prefix)}))

    def test_prefix_prunes_impossible_subtrees(self):
        class ForbiddenNode:
            @property
            def title(self):
                raise AssertionError("Visited a subtree outside the prefix range")

        search = SongSearch()
        for title in ("M", "A", "Z", "N"):
            search.addSong(title, title)
        search.root.left.left = ForbiddenNode()
        search.root.right.right = ForbiddenNode()
        self.assertEqual(search.prefixSearch("N"), ["N"])

    def test_degenerate_tree_avoids_recursion_limit(self):
        search = SongSearch()
        for i in range(1200):
            search.addSong(f"{i:04}", str(i))
        self.assertEqual(search.findSong("1199"), ("1199",))
        self.assertEqual(search.prefixSearch("119"), [f"{i:04}" for i in range(1190, 1200)])

    def test_unicode_prefix_boundaries(self):
        search = SongSearch()
        titles = ["a", "a\U0010ffff", "a\U0010ffffx", "b", "\U0010ffff", "\U0010ffffx", "écho"]
        for i, title in enumerate(titles):
            search.addSong(title, str(i))
        for prefix in ("a\U0010ffff", "\U0010ffff", "é", ""):
            self.assertEqual(search.prefixSearch(prefix),
                             sorted(title for title in titles if title.startswith(prefix)))

    def test_seeded_prefix_queries_match_reference(self):
        rng, search = random.Random(13), SongSearch()
        titles = ["".join(rng.choices("ABabé", k=rng.randint(1, 8))) for _ in range(200)]
        for i, title in enumerate(titles):
            search.addSong(title, str(i))
        for title in titles:
            prefix = title[:rng.randint(0, len(title))]
            self.assertEqual(search.prefixSearch(prefix),
                             sorted({item for item in titles if item.startswith(prefix)}))

class GraphTests(unittest.TestCase):
    def test_unknown_artist(self):
        self.assertEqual(ArtistGraph().recommendArtists("Unknown"), [])

    def test_triangle_overlap_sorting_and_distance_three(self):
        graph = ArtistGraph()
        for a, b in (("A", "B"), ("A", "C"), ("B", "C"), ("B", "Z"),
                     ("C", "Z"), ("B", "D"), ("Z", "Far")):
            graph.addRelation(a, b)
        self.assertEqual(graph.recommendArtists("A"), ["D", "Z"])
        self.assertIn("A", graph.adjacency["B"])
        graph.addRelation("A", "B")
        self.assertEqual(graph.recommendArtists("A"), ["D", "Z"])

    def test_undirected_chain(self):
        graph = ArtistGraph()
        graph.addRelation("A", "B")
        graph.addRelation("B", "C")
        self.assertEqual(graph.recommendArtists("A"), ["C"])
        self.assertEqual(graph.recommendArtists("C"), ["A"])

    def test_invalid_relation_does_not_mutate(self):
        graph = ArtistGraph()
        for a, b in (("A", "A"), ("", "B"), ("A", " ")):
            with self.assertRaises(ValueError):
                graph.addRelation(a, b)
        self.assertFalse(graph.adjacency)

class ValidationTests(unittest.TestCase):
    def test_invalid_song_fields(self):
        for fields in (("", "Title", "Artist"), ("id", " ", "Artist"),
                       ("id", "Title", None)):
            with self.assertRaises(ValueError):
                Song(*fields)

    def test_invalid_search_input(self):
        search = SongSearch()
        for title, identifier in (("", "a"), ("A", "")):
            with self.assertRaises(ValueError):
                search.addSong(title, identifier)
        with self.assertRaises(TypeError):
            search.prefixSearch(None)
        self.assertIsNone(search.root)

if __name__ == "__main__":
    unittest.main()
