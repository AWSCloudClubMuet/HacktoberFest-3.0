from src.search_graph import SongTree, ArtistGraph

TITLES = ["banana", "apple", "apricot", "cherry", "application", "blue", "ant"]

def make_tree():
    t = SongTree()
    for i, title in enumerate(TITLES, 1):
        t.addSong(title, i)
    return t

def test_find_song_returns_id():
    assert make_tree().findSong("cherry") == 4

def test_find_song_is_case_insensitive():
    assert make_tree().findSong("CHERRY") == 4

def test_find_missing_returns_none():
    assert make_tree().findSong("zebra") is None

def test_duplicate_title_rejected():
    t = make_tree()
    assert t.addSong("apple", 99) is False

def test_prefix_search_alphabetical():
    assert make_tree().prefixSearch("ap") == ["apple", "application", "apricot"]

def test_prefix_search_no_false_matches():
    assert make_tree().prefixSearch("b") == ["banana", "blue"]

def test_prefix_search_no_match():
    assert make_tree().prefixSearch("z") == []

def test_prefix_search_case_insensitive():
    assert make_tree().prefixSearch("AP") == ["apple", "application", "apricot"]

def test_prefix_search_preserves_titles_and_sorts_case_insensitively():
    t = SongTree()
    t.addSong("apricot", 1)
    t.addSong("Apple", 2)
    t.addSong("application", 3)
    assert t.prefixSearch("AP") == ["Apple", "application", "apricot"]

def test_prefix_search_empty_prefix_returns_all_sorted():
    assert make_tree().prefixSearch("") == sorted(TITLES)

def test_prefix_search_matches_brute_force():
    t = make_tree()
    for prefix in ["a", "an", "ap", "app", "b", "ba", "c", "ch", "x"]:
        expected = sorted(x for x in TITLES if x.startswith(prefix))
        assert t.prefixSearch(prefix) == expected

def test_relation_is_undirected():
    g = ArtistGraph()
    g.addRelation("A", "B")
    assert "A" in g.links["B"]
    assert "B" in g.links["A"]

def test_self_relation_ignored():
    g = ArtistGraph()
    g.addRelation("A", "A")
    assert "A" not in g.links

def test_recommend_excludes_direct_and_self():
    g = ArtistGraph()
    g.addRelation("A", "B")
    g.addRelation("B", "C")
    g.addRelation("B", "D")
    g.addRelation("A", "C")
    assert g.recommendArtists("A") == ["D"]

def test_recommend_sorted_and_deduplicated():
    g = ArtistGraph()
    g.addRelation("A", "B")
    g.addRelation("A", "C")
    g.addRelation("B", "Z")
    g.addRelation("C", "Z")
    g.addRelation("B", "M")
    assert g.recommendArtists("A") == ["M", "Z"]

def test_recommend_is_sorted_case_insensitively():
    g = ArtistGraph()
    g.addRelation("A", "B")
    g.addRelation("B", "zebra")
    g.addRelation("B", "Alpha")
    assert g.recommendArtists("A") == ["Alpha", "zebra"]

def test_recommend_ignores_three_links_away():
    g = ArtistGraph()
    g.addRelation("A", "B")
    g.addRelation("B", "C")
    g.addRelation("C", "D")
    assert g.recommendArtists("A") == ["C"]

def test_recommend_unknown_artist():
    assert ArtistGraph().recommendArtists("Nobody") == []
