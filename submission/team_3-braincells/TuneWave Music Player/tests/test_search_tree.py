"""
Unit tests for TuneWave Music Player - Milestone 3A: Song Search using custom BST.
Tests BST insertion, exact title lookup, alphabetical prefix search, subtree pruning,
duplicate title handling, case-insensitivity, and boundary cases.
"""
import pytest
from src.search_tree import SongSearchTree, SongRecord, BSTNode


def test_empty_search_tree():
    """Validates behavior on an empty BST."""
    tree = SongSearchTree()
    assert len(tree) == 0
    assert tree.root is None

    # Missing lookups on empty tree return None
    assert tree.findSong("Yesterday") is None
    assert tree.findSong("") is None
    assert tree.findSong(None) is None

    # Prefix search on empty tree returns empty list
    assert tree.prefixSearch("Y") == []
    assert tree.prefixSearch("") == []
    assert tree.prefixSearch(None) == []


def test_insert_and_size_tracking():
    """Inserting valid songs builds the tree and updates size."""
    tree = SongSearchTree()
    assert tree.addSong("Bohemian Rhapsody", "s1") is True
    assert tree.addSong("Imagine", "s2") is True
    assert tree.addSong("Hotel California", "s3") is True

    assert len(tree) == 3
    assert tree.root is not None
    # Root key is normalized
    assert tree.root.key == "bohemian rhapsody"


def test_successful_find_song():
    """findSong locates records for exact title queries."""
    tree = SongSearchTree()
    tree.addSong("Comfortably Numb", "pink_01")
    tree.addSong("Time", "pink_02")

    record = tree.findSong("Comfortably Numb")
    assert record is not None
    assert record.title == "Comfortably Numb"
    assert record.song_id == "pink_01"
    # Interoperability tests
    assert record == "pink_01"
    assert record.id == "pink_01"


def test_unsuccessful_find_song():
    """findSong returns None when a title does not exist in the BST."""
    tree = SongSearchTree()
    tree.addSong("Hey Jude", "beatles_01")

    assert tree.findSong("Let It Be") is None
    assert tree.findSong("hey") is None  # Prefix, not exact title
    assert tree.findSong("Hey Jude 2") is None


def test_case_insensitivity_and_display_title_preservation():
    """
    Search is case-insensitive, but original display casing is preserved.
    """
    tree = SongSearchTree()
    tree.addSong("Stairway to Heaven", "lz_01")

    # Lowercase lookup
    rec_lower = tree.findSong("stairway to heaven")
    assert rec_lower is not None
    assert rec_lower.song_id == "lz_01"
    assert rec_lower.title == "Stairway to Heaven"

    # Uppercase lookup
    rec_upper = tree.findSong("STAIRWAY TO HEAVEN")
    assert rec_upper is not None
    assert rec_upper.song_id == "lz_01"

    # Mixed case lookup
    rec_mixed = tree.findSong("sTaiRwAy To HeAvEn")
    assert rec_mixed is not None

    # Prefix search preserves display casing
    results = tree.prefixSearch("stair")
    assert results == ["Stairway to Heaven"]


def test_prefix_search_alphabetical_order():
    """prefixSearch returns matching titles in strict alphabetical order."""
    tree = SongSearchTree()
    songs = [
        ("Radioactive", "s1"),
        ("Rocket Man", "s2"),
        ("Rolling in the Deep", "s3"),
        ("Roar", "s4"),
        ("Redemption Song", "s5"),
        ("Yesterday", "s6"),
        ("Africa", "s7"),
    ]
    for title, sid in songs:
        tree.addSong(title, sid)

    # Search prefix 'r' or 'ro'
    ro_matches = tree.prefixSearch("ro")
    # Expected in-order traversal alphabetical order:
    # "Roar", "Rocket Man", "Rolling in the Deep"
    assert ro_matches == ["Roar", "Rocket Man", "Rolling in the Deep"]

    r_matches = tree.prefixSearch("R")
    assert r_matches == [
        "Radioactive",
        "Redemption Song",
        "Roar",
        "Rocket Man",
        "Rolling in the Deep",
    ]


def test_prefix_search_empty_prefix_returns_all_in_order():
    """An empty prefix search returns all song titles in alphabetical order."""
    tree = SongSearchTree()
    titles = ["Zebra", "Apple", "Mango", "Banana"]
    for t in titles:
        tree.addSong(t, f"id_{t}")

    all_titles = tree.prefixSearch("")
    assert all_titles == ["Apple", "Banana", "Mango", "Zebra"]


def test_prefix_pruning_demonstration():
    """
    Demonstrates that prefixSearch actively prunes irrelevant subtrees.
    Tests that nodes in subtrees that cannot match the prefix are never visited.
    """
    tree = SongSearchTree()
    # Construct a tree with known topology:
    #             "mango" (root)
    #            /       \
    #        "apple"    "zebra"
    #        /     \
    #    "ant"   "banana"
    tree.addSong("Mango", "m")
    tree.addSong("Apple", "a")
    tree.addSong("Zebra", "z")
    tree.addSong("Ant", "an")
    tree.addSong("Banana", "b")

    # Total nodes in tree: 5 ("mango", "apple", "zebra", "ant", "banana")
    assert len(tree) == 5

    # 1. Search for prefix 'ba' (matches "Banana")
    matches = tree.prefixSearch("ba")
    assert matches == ["Banana"]

    visited = tree.visited_nodes
    # Visited should be: "mango" -> "apple" -> "banana"
    assert "banana" in visited
    assert "mango" in visited
    assert "apple" in visited

    # PRUNED NODES:
    # "zebra" is in right subtree of "mango"; since "ba" < "mango", right is pruned!
    assert "zebra" not in visited
    # "ant" is in left subtree of "apple"; since "ba" > "apple", left is pruned!
    assert "ant" not in visited
    # Total nodes visited (3) must be strictly less than total tree nodes (5)
    assert len(visited) == 3
    assert len(visited) < 5

    # 2. Search for prefix 'z' (matches "Zebra")
    matches_z = tree.prefixSearch("z")
    assert matches_z == ["Zebra"]

    visited_z = tree.visited_nodes
    # Visited should be: "mango" -> "zebra"
    assert "zebra" in visited_z
    assert "mango" in visited_z

    # PRUNED NODES:
    # The entire left subtree of "mango" ("apple", "ant", "banana") was pruned!
    assert "apple" not in visited_z
    assert "ant" not in visited_z
    assert "banana" not in visited_z
    assert len(visited_z) == 2


def test_multiple_songs_with_same_title():
    """
    Multiple songs can share the same title (e.g. covers or different versions).
    Both song records must be stored and preserved without overwriting.
    """
    tree = SongSearchTree()
    # Two songs with title "Hello" (Adele vs Lionel Richie)
    assert tree.addSong("Hello", "adele_01") is True
    assert tree.addSong("Hello", "lionel_01") is True

    # Both records are counted in total size
    assert len(tree) == 2

    # findSong returns the composite record holding both IDs
    record = tree.findSong("Hello")
    assert record is not None
    assert record.title == "Hello"
    assert "adele_01" in record.song_ids
    assert "lionel_01" in record.song_ids
    assert len(record) == 2

    # prefixSearch returns both entries
    matches = tree.prefixSearch("Hel")
    assert matches == ["Hello", "Hello"]


def test_duplicate_insertion_rejection():
    """
    Inserting the exact same (title, songId) twice must be rejected as a duplicate.
    """
    tree = SongSearchTree()
    assert tree.addSong("Photograph", "ed_01") is True
    # Duplicate insertion: same title, same songId
    assert tree.addSong("Photograph", "ed_01") is False
    # Duplicate insertion with different casing: same normalized title, same songId
    assert tree.addSong("PHOTOGRAPH", "ed_01") is False

    assert len(tree) == 1
    assert tree.findSong("Photograph").song_ids == ["ed_01"]


def test_invalid_and_boundary_inputs():
    """Validates resilience against None, whitespace-only, and special characters."""
    tree = SongSearchTree()
    assert tree.addSong("", "empty") is False
    assert tree.addSong("   ", "spaces") is False
    assert tree.addSong(None, "none") is False
    assert tree.addSong("Song", None) is False

    assert len(tree) == 0

    # Titles with numbers and symbols
    assert tree.addSong("1999", "prince_01") is True
    assert tree.addSong("24K Magic", "bruno_01") is True
    assert tree.addSong("$ave That Money", "dicky_01") is True

    assert tree.findSong("1999") == "prince_01"
    assert tree.prefixSearch("24") == ["24K Magic"]
    assert tree.prefixSearch("$") == ["$ave That Money"]
