"""Undirected artist graph stored as an adjacency list: name -> set of related names.

Names are compared exactly (case-sensitive) after stripping whitespace.
"""
from typing import List, Set, Tuple


class ArtistGraph:
    def __init__(self):
        self._adj: dict = {}

    def add_artist(self, artist: str) -> None:
        self._adj.setdefault(artist.strip(), set())

    def add_relation(self, artist_a: str, artist_b: str) -> bool:
        """Link two artists both ways. False for blank names or self-relations."""
        a, b = artist_a.strip(), artist_b.strip()
        if not a or not b or a == b:
            return False
        self._adj.setdefault(a, set()).add(b)
        self._adj.setdefault(b, set()).add(a)     # sets prevent duplicate edges
        return True

    def related(self, artist: str) -> List[str]:
        return sorted(self._adj.get(artist.strip(), set()))

    def recommend_artists(self, artist: str) -> List[str]:
        """Artists exactly two links away and NOT directly related, alphabetical."""
        start = artist.strip()
        direct = self._adj.get(start)
        if not direct:
            return []
        found: Set[str] = set()
        for friend in direct:
            found |= self._adj.get(friend, set())
        found -= direct
        found.discard(start)
        return sorted(found)

    def edges(self) -> List[Tuple[str, str]]:
        return sorted((a, b) for a, others in self._adj.items() for b in others if a < b)

    def artists(self) -> List[str]:
        return sorted(self._adj)

    addRelation = add_relation
    recommendArtists = recommend_artists
