"""
TuneWave Music Player - Artist Graph Subsystem
Milestone 3B: Related-artist recommendations using a custom undirected graph.
"""
from typing import Any, Dict, List, Optional, Set


class ArtistGraph:
    """
    Custom Undirected Graph implementation for artist relationship modeling
    and 2-hop collaborative recommendations.
    
    Data Structure Architecture:
    - Adjacency List: Maps normalized artist name (lower-cased) to a Set of normalized
      neighbor artist names.
    - Undirected / Bidirectional: An edge between A and B implies bidirectional adjacency:
      A is connected to B, and B is connected to A.
    - Display Names: Maintains original display casing for user-facing output.
    - Two-Hop Traversal: Recommends artists exactly 2 graph edges away, strictly excluding
      the start artist and all direct 1-hop neighbors.
    """

    def __init__(self):
        self._adjacency: Dict[str, Set[str]] = {}
        self._display_names: Dict[str, str] = {}
        self._edge_count: int = 0

    # -------------------------------------------------------------------------
    # Milestone 3B Required Public Operations
    # -------------------------------------------------------------------------

    def addRelation(self, artistA: Any, artistB: Any) -> bool:
        """
        Creates an undirected, bidirectional relationship between artistA and artistB.
        
        Rules:
        - Bidirectional: A is connected to B, and B is connected to A.
        - Automatically creates entries for newly discovered artists.
        - Prevents duplicate edges and self-edges.
        - Rejects invalid, None, or empty artist names.
        
        Returns:
            True if relationship was added, False if invalid or self-relation.
        """
        if artistA is None or artistB is None:
            return False

        name_a = str(artistA).strip()
        name_b = str(artistB).strip()
        if not name_a or not name_b:
            return False

        key_a = name_a.lower()
        key_b = name_b.lower()

        # Reject self-edges (Rule 5)
        if key_a == key_b:
            return False

        # Register artist A
        if key_a not in self._adjacency:
            self._adjacency[key_a] = set()
            self._display_names[key_a] = name_a

        # Register artist B
        if key_b not in self._adjacency:
            self._adjacency[key_b] = set()
            self._display_names[key_b] = name_b

        # Check for duplicate edge
        if key_b in self._adjacency[key_a]:
            return False  # Edge already exists

        # Add bidirectional edge (Rule 2)
        self._adjacency[key_a].add(key_b)
        self._adjacency[key_b].add(key_a)
        self._edge_count += 1
        return True

    def recommendArtists(self, artist: Any) -> List[str]:
        """
        Finds and returns artists that are exactly two graph edges away from the requested artist.
        
        Rules:
        - Exactly two edges away: path length must be 2.
        - Excludes the start artist itself.
        - Excludes all direct (1-hop) neighbors, even if reachable by a 2-hop path (e.g. triangles).
        - Returns recommendations in strict alphabetical order (case-insensitive).
        - Preserves original display names.
        - Returns an empty list if artist is unknown or has no 2-hop recommendations.
        
        Returns:
            Alphabetical list of recommended artist display names.
        """
        if artist is None:
            return []

        name = str(artist).strip()
        if not name:
            return []

        key_start = name.lower()

        # Unknown artist returns empty list (Rule 9)
        if key_start not in self._adjacency:
            return []

        direct_neighbors: Set[str] = self._adjacency[key_start]
        if not direct_neighbors:
            return []

        # Graph Traversal: discover all 2-hop neighbors
        two_hop_candidates: Set[str] = set()

        for neighbor in direct_neighbors:
            for candidate in self._adjacency.get(neighbor, set()):
                # Exclude starting artist and direct neighbors (Rules 6 & 7)
                if candidate != key_start and candidate not in direct_neighbors:
                    two_hop_candidates.add(candidate)

        # Collect display names and sort alphabetically (Rule 8)
        recommendations = [
            self._display_names[cand] for cand in two_hop_candidates
        ]
        recommendations.sort(key=lambda s: s.lower())
        return recommendations

    # -------------------------------------------------------------------------
    # Pythonic Compatibility Wrappers & Helpers
    # -------------------------------------------------------------------------

    def add_relation(self, artist_a: Any, artist_b: Any) -> bool:
        """Pythonic alias for addRelation."""
        return self.addRelation(artist_a, artist_b)

    def recommend_artists(self, artist: Any) -> List[str]:
        """Pythonic alias for recommendArtists."""
        return self.recommendArtists(artist)

    def get_direct_relations(self, artist: Any) -> List[str]:
        """Returns direct (1-hop) neighbors of an artist."""
        if artist is None:
            return []
        key = str(artist).strip().lower()
        if key not in self._adjacency:
            return []
        neighbors = [self._display_names[k] for k in self._adjacency[key]]
        neighbors.sort(key=lambda s: s.lower())
        return neighbors

    @property
    def artist_count(self) -> int:
        """Total number of registered artist vertices."""
        return len(self._adjacency)

    @property
    def edge_count(self) -> int:
        """Total number of undirected relationship edges."""
        return self._edge_count

    def clear(self) -> None:
        """Clears all vertices and edges from the graph."""
        self._adjacency.clear()
        self._display_names.clear()
        self._edge_count = 0

    def __contains__(self, artist: Any) -> bool:
        if artist is None:
            return False
        return str(artist).strip().lower() in self._adjacency

    def __len__(self) -> int:
        return len(self._adjacency)

    def __repr__(self) -> str:
        return f"ArtistGraph(artists={len(self._adjacency)}, edges={self._edge_count})"
