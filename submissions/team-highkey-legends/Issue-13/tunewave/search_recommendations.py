
from typing import Optional

from models import Song


class BSTNode:
    """A BST node keyed by song title."""

    def __init__(self, title: str, song: Song):
        self.title = title
        self.songs = [song]  # Supports multiple songs with the same title.
        self.left: Optional["BSTNode"] = None
        self.right: Optional["BSTNode"] = None


class SongSearchBST:
    """Binary Search Tree for exact and prefix-based song searches."""

    def __init__(self):
        self.root: Optional[BSTNode] = None

    def add_song(
        self, title: str, song_id: str, artist: str = "Unknown Artist"
    ) -> bool:
        """Insert a song. Returns False if the same song ID already exists."""
        song = Song(song_id, title, artist)

        if self._contains_id(self.root, song_id):
            return False

        self.root = self._insert(self.root, title, song)
        return True

    def _contains_id(
        self, node: Optional[BSTNode], song_id: str
    ) -> bool:
        if node is None:
            return False

        if any(song.song_id == song_id for song in node.songs):
            return True

        return (
            self._contains_id(node.left, song_id)
            or self._contains_id(node.right, song_id)
        )

    def _insert(
        self, node: Optional[BSTNode], title: str, song: Song
    ) -> BSTNode:
        if node is None:
            return BSTNode(title, song)

        if title.casefold() < node.title.casefold():
            node.left = self._insert(node.left, title, song)
        elif title.casefold() > node.title.casefold():
            node.right = self._insert(node.right, title, song)
        else:
            node.songs.append(song)

        return node

    def find_song(self, title: str) -> list[Song]:
        """Return all songs with this exact title, or an empty list."""
        node = self.root
        target = title.casefold()

        while node is not None:
            current = node.title.casefold()

            if target == current:
                return list(node.songs)
            elif target < current:
                node = node.left
            else:
                node = node.right

        return []

    def prefix_search(self, prefix: str) -> list[Song]:
        """Return matching songs alphabetically, pruning irrelevant subtrees."""
        results: list[Song] = []
        prefix_key = prefix.casefold()

        self._prefix_search(self.root, prefix_key, results)
        return results

    def _prefix_search(
        self,
        node: Optional[BSTNode],
        prefix: str,
        results: list[Song],
    ) -> None:
        if node is None:
            return

        key = node.title.casefold()

        # Titles smaller than the prefix cannot match. Search right only.
        if key < prefix:
            self._prefix_search(node.right, prefix, results)
            return

        # In-order traversal produces alphabetical results.
        self._prefix_search(node.left, prefix, results)

        if key.startswith(prefix):
            results.extend(node.songs)

        # If this title is already beyond the prefix's lexical range,
        # no title in its right subtree can begin with this prefix.
        if key.startswith(prefix):
            self._prefix_search(node.right, prefix, results)
        elif key < prefix:
            self._prefix_search(node.right, prefix, results)


class ArtistGraph:
    """Undirected graph representing relationships between artists."""

    def __init__(self):
        self.adjacency: dict[str, set[str]] = {}

    def add_relation(self, artist_a: str, artist_b: str) -> None:
        """Add a two-way relationship between artists."""
        self.adjacency.setdefault(artist_a, set())
        self.adjacency.setdefault(artist_b, set())

        if artist_a == artist_b:
            return

        self.adjacency[artist_a].add(artist_b)
        self.adjacency[artist_b].add(artist_a)

    def recommend_artists(self, artist: str) -> list[str]:
        """
        Recommend artists exactly two links away.
        Exclude the original artist and their direct connections.
        Return results alphabetically.
        """
        if artist not in self.adjacency:
            return []

        direct = self.adjacency[artist]
        recommendations: set[str] = set()

        for neighbor in direct:
            for candidate in self.adjacency.get(neighbor, set()):
                if candidate != artist and candidate not in direct:
                    recommendations.add(candidate)

        return sorted(recommendations, key=str.casefold)
