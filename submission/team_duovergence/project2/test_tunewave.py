import unittest
from tunewave import Song, Playlist, SongBST, ArtistGraph, TuneWave, END, START


def songs(n):
    return [Song(i, f"Song {i}", f"Artist {i}") for i in range(1, n + 1)]


class TestPlaylist(unittest.TestCase):
    def setUp(self):
        self.p = Playlist()
        for s in songs(3):
            self.p.addSong(s)

    def test_no_duplicates(self):
        self.assertFalse(self.p.addSong(Song(1, "Song 1")))
        self.assertEqual(len(self.p), 3)

    def test_next_and_previous(self):
        self.assertEqual(self.p.next().id, 1)
        self.assertEqual(self.p.next().id, 2)
        self.assertEqual(self.p.previous().id, 1)

    def test_end_with_repeat_off(self):
        for _ in range(3):
            self.p.next()
        self.assertEqual(self.p.next(), END)
        self.assertEqual(self.p.current.id, 3)       # stays on last song

    def test_repeat_wraps(self):
        self.p.toggleRepeat()
        for _ in range(3):
            self.p.next()
        self.assertEqual(self.p.next().id, 1)        # wrap to first
        self.assertEqual(self.p.previous().id, 3)    # wrap back to last

    def test_previous_at_start(self):
        self.p.next()
        self.assertEqual(self.p.previous(), START)

    def test_remove(self):
        self.assertTrue(self.p.removeSong(2))
        self.assertFalse(self.p.removeSong(2))
        self.assertEqual([s.id for s in self.p.songs()], [1, 3])
        self.assertTrue(self.p.addSong(Song(2, "Song 2")))  # can re-add after removal

    def test_remove_head_and_tail(self):
        self.p.removeSong(1)
        self.p.removeSong(3)
        self.assertEqual([s.id for s in self.p.songs()], [2])
        self.assertEqual(self.p.next().id, 2)

    def test_remove_current_plays_following_song(self):
        self.p.next()
        self.p.next()                                 # playing 2
        self.p.removeSong(2)
        self.assertEqual(self.p.next().id, 3)

    def test_remove_current_head(self):
        self.p.next()                                 # playing 1
        self.p.removeSong(1)
        self.assertEqual(self.p.next().id, 2)

    def test_empty_playlist(self):
        e = Playlist()
        self.assertEqual(e.next(), END)
        self.assertEqual(e.previous(), START)

    def test_remove_all_then_add(self):
        for i in (1, 2, 3):
            self.p.removeSong(i)
        self.assertEqual(len(self.p), 0)
        self.p.addSong(Song(9, "New"))
        self.assertEqual(self.p.next().id, 9)


class TestUpNextHistory(unittest.TestCase):
    def setUp(self):
        self.t = TuneWave()
        for s in songs(5):
            self.t.playlist.addSong(s)

    def test_up_next_plays_before_playlist(self):
        self.t.playlist.next()                        # playlist at song 1
        self.t.addToUpNext(4)
        self.t.addToUpNext(5)
        self.assertEqual(self.t.playNext().id, 4)     # FIFO
        self.assertEqual(self.t.playNext().id, 5)
        self.assertEqual(self.t.playNext().id, 2)     # playlist continues

    def test_playlist_position_not_moved(self):
        self.t.playlist.next()
        self.t.playlist.next()                        # at song 2
        self.t.addToUpNext(5)
        self.t.playNext()
        self.assertEqual(self.t.playlist.current.id, 2)

    def test_add_unknown_song(self):
        self.assertFalse(self.t.addToUpNext(999))

    def test_history_keeps_last_10(self):
        t = TuneWave()
        for s in songs(15):
            t.playlist.addSong(s)
        for _ in range(15):
            t.playNext()
        self.assertEqual(len(t.history), 10)
        self.assertEqual([s.id for s in t.history], list(range(6, 16)))  # oldest dropped

    def test_back_replays_top_and_removes(self):
        for _ in range(3):
            self.t.playNext()                         # plays 1,2,3
        self.assertEqual(self.t.back().id, 3)
        self.assertEqual([s.id for s in self.t.history], [1, 2])
        self.assertEqual(self.t.back().id, 2)
        self.assertEqual(self.t.playlist.current.id, 3)   # position unchanged

    def test_back_empty(self):
        self.assertIsNone(self.t.back())

    def test_removed_song_skipped_in_queue(self):
        self.t.addToUpNext(4)
        self.t.addToUpNext(5)
        self.t.playlist.removeSong(4)
        self.assertEqual(self.t.playNext().id, 5)

    def test_end_of_playlist(self):
        for _ in range(5):
            self.t.playNext()
        self.assertEqual(self.t.playNext(), END)


class TestBST(unittest.TestCase):
    def setUp(self):
        self.b = SongBST()
        for i, title in enumerate(
            ["Shape of You", "Shallow", "Stay", "Believer", "Bad Guy", "Sunflower", "Senorita"]
        ):
            self.b.addSong(title, 100 + i)

    def test_find(self):
        self.assertEqual(self.b.findSong("Stay"), 102)
        self.assertEqual(self.b.findSong("stay"), 102)      # case-insensitive
        self.assertIsNone(self.b.findSong("Nope"))

    def test_prefix_sorted(self):
        self.assertEqual(self.b.prefixSearch("Sh"), ["Shallow", "Shape of You"])
        self.assertEqual(self.b.prefixSearch("S"),
                         ["Senorita", "Shallow", "Shape of You", "Stay", "Sunflower"])

    def test_prefix_case_insensitive(self):
        self.assertEqual(self.b.prefixSearch("sh"), ["Shallow", "Shape of You"])

    def test_prefix_no_match_and_empty(self):
        self.assertEqual(self.b.prefixSearch("Zzz"), [])
        self.assertEqual(len(self.b.prefixSearch("")), 7)
        self.assertEqual(SongBST().prefixSearch("a"), [])

    def test_update_same_title(self):
        self.b.addSong("Stay", 555)
        self.assertEqual(self.b.findSong("Stay"), 555)
        self.assertEqual(len(self.b), 7)

    def test_pruning_visits_few_nodes(self):
        # Sorted inserts -> skewed tree. Search must still be correct.
        b = SongBST()
        titles = [f"t{i:04d}" for i in range(2000)]
        for i, t in enumerate(titles):
            b.addSong(t, i)
        self.assertEqual(b.prefixSearch("t19"), [t for t in titles if t.startswith("t19")])


class TestGraph(unittest.TestCase):
    def setUp(self):
        g = ArtistGraph()
        for a, b in [("A", "B"), ("A", "C"), ("B", "D"), ("C", "D"),
                     ("C", "E"), ("E", "F"), ("B", "C")]:
            g.addRelation(a, b)
        self.g = g

    def test_two_links_away(self):
        # A: direct {B, C}. Two away via B -> D ; via C -> D, E ; B-C already direct
        self.assertEqual(self.g.recommendArtists("A"), ["D", "E"])

    def test_excludes_direct_and_self(self):
        rec = self.g.recommendArtists("A")
        self.assertNotIn("A", rec)
        self.assertNotIn("B", rec)
        self.assertNotIn("C", rec)

    def test_undirected(self):
        self.assertEqual(self.g.recommendArtists("F"), ["C"])

    def test_alphabetical(self):
        g = ArtistGraph()
        for x in ["Zed", "Amy", "Max"]:
            g.addRelation("Hub", x)
            g.addRelation(x, x + "2")
        self.assertEqual(g.recommendArtists("Hub"), ["Amy2", "Max2", "Zed2"])

    def test_unknown_and_self_loop(self):
        self.assertEqual(self.g.recommendArtists("Nobody"), [])
        self.g.addRelation("A", "A")
        self.assertEqual(self.g.recommendArtists("A"), ["D", "E"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
