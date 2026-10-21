"""
Unit tests for TuneWave Music Player - Milestone 3B: Related-Artist Recommendations using custom undirected graph.
Tests bidirectional adjacency, 2-hop traversals, direct neighbor exclusion, self-exclusion,
alphabetical ordering, duplicate edge handling, and boundary conditions.
"""
import pytest
from src.graph import ArtistGraph


def test_empty_and_unknown_artist():
    """Validates behavior on empty graphs and unindexed artists."""
    graph = ArtistGraph()
    assert len(graph) == 0
    assert graph.edge_count == 0

    # Unknown artist returns empty list
    assert graph.recommendArtists("Queen") == []
    assert graph.recommendArtists("") == []
    assert graph.recommendArtists(None) == []
    assert graph.get_direct_relations("Queen") == []


def test_invalid_names_and_self_relations():
    """Invalid names, whitespace-only names, and self-edges must be rejected."""
    graph = ArtistGraph()

    # None and empty strings
    assert graph.addRelation("", "Queen") is False
    assert graph.addRelation("Queen", "") is False
    assert graph.addRelation(None, "Queen") is False
    assert graph.addRelation("Queen", None) is False
    assert graph.addRelation("   ", "Queen") is False

    # Self-relations
    assert graph.addRelation("Queen", "Queen") is False
    assert graph.addRelation("Queen", "queen") is False  # Case-insensitive self-relation

    assert len(graph) == 0
    assert graph.edge_count == 0


def test_bidirectional_relationships():
    """addRelation creates an undirected edge: A-B means both A->B and B->A."""
    graph = ArtistGraph()
    assert graph.addRelation("Queen", "David Bowie") is True

    assert len(graph) == 2
    assert graph.edge_count == 1
    assert "Queen" in graph
    assert "David Bowie" in graph

    # Both artists are directly connected to each other
    assert graph.get_direct_relations("Queen") == ["David Bowie"]
    assert graph.get_direct_relations("David Bowie") == ["Queen"]


def test_duplicate_relationships():
    """Duplicate edges are rejected and do not create duplicate relations."""
    graph = ArtistGraph()
    assert graph.addRelation("Queen", "Led Zeppelin") is True
    # Attempting to add the same relation again (both orders)
    assert graph.addRelation("Queen", "Led Zeppelin") is False
    assert graph.addRelation("Led Zeppelin", "Queen") is False
    assert graph.addRelation("queen", "led zeppelin") is False

    assert graph.edge_count == 1
    assert len(graph) == 2


def test_valid_two_hop_recommendations():
    """
    Validates exactly-two-hop recommendations.
    In a chain A - B - C:
    - recommend(A) -> [C]
    - recommend(C) -> [A]
    """
    graph = ArtistGraph()
    graph.addRelation("Artist A", "Artist B")
    graph.addRelation("Artist B", "Artist C")

    # A's 1-hop is B; 2-hop is C
    assert graph.recommendArtists("Artist A") == ["Artist C"]
    # C's 1-hop is B; 2-hop is A
    assert graph.recommendArtists("Artist C") == ["Artist A"]
    # B has direct neighbors A and C, but no 2-hop neighbors
    assert graph.recommendArtists("Artist B") == []


def test_excluding_direct_neighbors_and_self():
    """
    Triangle graph: A - B, B - C, C - A.
    Even though C is 2 hops away via B (A -> B -> C), C is also a DIRECT neighbor of A.
    It must be excluded! A itself must also be excluded.
    """
    graph = ArtistGraph()
    graph.addRelation("A", "B")
    graph.addRelation("B", "C")
    graph.addRelation("C", "A")

    # In a complete triangle, every reachable node is either self or a direct neighbor
    assert graph.recommendArtists("A") == []
    assert graph.recommendArtists("B") == []
    assert graph.recommendArtists("C") == []


def test_alphabetical_recommendation_order():
    """recommendArtists returns recommendations in strict alphabetical order."""
    graph = ArtistGraph()
    # Hub node 'Center' connected to A, B, C
    # Periphery nodes connected to neighbors
    graph.addRelation("Center", "Hub1")
    graph.addRelation("Center", "Hub2")

    # Connect Hub1 to 'Zebra' and 'Apple'
    graph.addRelation("Hub1", "Zebra")
    graph.addRelation("Hub1", "Apple")

    # Connect Hub2 to 'Mango' and 'Banana'
    graph.addRelation("Hub2", "Mango")
    graph.addRelation("Hub2", "Banana")

    # 2-hop recommendations for Center should be: Apple, Banana, Mango, Zebra
    recs = graph.recommendArtists("Center")
    assert recs == ["Apple", "Banana", "Mango", "Zebra"]


def test_diamond_graph_no_duplicate_recommendations():
    r"""
    Diamond graph:
         B
       /   \
      A     D
       \   /
         C
    D is reachable via both A -> B -> D and A -> C -> D.
    D must appear exactly ONCE in recommendations.
    """
    graph = ArtistGraph()
    graph.addRelation("A", "B")
    graph.addRelation("A", "C")
    graph.addRelation("B", "D")
    graph.addRelation("C", "D")

    recs_a = graph.recommendArtists("A")
    assert recs_a == ["D"]

    recs_d = graph.recommendArtists("D")
    assert recs_d == ["A"]


def test_three_hop_and_beyond_excluded():
    """
    Line graph: 1 - 2 - 3 - 4 - 5
    recommend(1) should return ONLY [3], NOT [4] or [5].
    """
    graph = ArtistGraph()
    graph.addRelation("1", "2")
    graph.addRelation("2", "3")
    graph.addRelation("3", "4")
    graph.addRelation("4", "5")

    # Exactly 2 hops from 1 is 3
    assert graph.recommendArtists("1") == ["3"]
    # Exactly 2 hops from 2 is 4
    assert graph.recommendArtists("2") == ["4"]
    # Exactly 2 hops from 3 are 1 and 5
    assert graph.recommendArtists("3") == ["1", "5"]


def test_case_insensitivity_and_display_preservation():
    """
    Lookups and edge additions are case-insensitive, but original display names are returned.
    """
    graph = ArtistGraph()
    graph.addRelation("Pink Floyd", "David Gilmour")
    graph.addRelation("david gilmour", "Roger Waters")

    # Query with mixed casing
    recs = graph.recommendArtists("pInK fLoYd")
    assert recs == ["Roger Waters"]

    # Direct relations preservation
    directs = graph.get_direct_relations("DAVID GILMOUR")
    assert directs == ["Pink Floyd", "Roger Waters"]


def test_dynamic_graph_traversal_proof():
    """
    Proves the recommendation engine genuinely traverses the dynamic graph structure
    rather than relying on precomputed or hardcoded lookups.
    """
    graph = ArtistGraph()
    # Step 1: Linear chain X - Y - Z
    graph.addRelation("X", "Y")
    graph.addRelation("Y", "Z")
    assert graph.recommendArtists("X") == ["Z"]

    # Step 2: Add direct edge X - Z (creates triangle)
    # Z is now a direct neighbor, so it must dynamically disappear from recommendations!
    graph.addRelation("X", "Z")
    assert graph.recommendArtists("X") == []

    # Step 3: Add new branch Z - W
    # Now W is 2 hops away from X (X -> Z -> W) and from Y (Y -> Z -> W)
    graph.addRelation("Z", "W")
    assert graph.recommendArtists("X") == ["W"]
    assert graph.recommendArtists("Y") == ["W"]

    # Step 4: Add another branch Y - V
    # Now V is 2 hops away from X (X -> Y -> V) and from Z (Z -> Y -> V)
    graph.addRelation("Y", "V")
    assert graph.recommendArtists("X") == ["V", "W"]
