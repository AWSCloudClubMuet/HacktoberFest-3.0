"""TuneWave - Milestone 3: Song Search (BST) and Related Artists (Graph)."""
from collections import defaultdict
from typing import Dict, List, Optional, Set


# ---------------------------------------------------------------- BST
class _BSTNode:
    __slots__ = ("key", "title", "songId", "left", "right")

    def __init__(self, title: str, songId: str):
        self.key = title.casefold()      # case-insensitive ordering
        self.title = title               # original title kept for output
        self.songId = songId
        self.left: Optional["_BSTNode"] = None
        self.right: Optional["_BSTNode"] = None


class SongIndex:
    """Binary search tree keyed by song title."""

    def __init__(self):
        self._root: Optional[_BSTNode] = None

    def addSong(self, title: str, songId: str) -> None:
        """Insert (iterative). A repeated title updates its songId."""
        key = title.casefold()
        if self._root is None:
            self._root = _BSTNode(title, songId)
            return
        cur = self._root
        while True:
            if key == cur.key:
                cur.songId = songId
                return
            side = "left" if key < cur.key else "right"
            nxt = getattr(cur, side)
            if nxt is None:
                setattr(cur, side, _BSTNode(title, songId))
                return
            cur = nxt

    def findSong(self, title: str) -> Optional[str]:
        """Return the songId for an exact title, or None. O(h)."""
        key = title.casefold()
        cur = self._root
        while cur:
            if key == cur.key:
                return cur.songId
            cur = cur.left if key < cur.key else cur.right
        return None

    def prefixSearch(self, prefix: str) -> List[str]:
        """Titles starting with prefix, alphabetical (in-order traversal).

        Pruning: if node.key does not start with the prefix then
          - key > prefix: every prefixed string is smaller -> go left only
          - key < prefix: every prefixed string is larger  -> go right only
        """
        p = prefix.casefold()
        out: List[str] = []

        def visit(node: Optional[_BSTNode]) -> None:
            if node is None:
                return
            if node.key.startswith(p):
                visit(node.left)         # left may still contain matches
                out.append(node.title)
                visit(node.right)
            elif p < node.key:
                visit(node.left)         # skip right subtree
            else:
                visit(node.right)        # skip left subtree

        visit(self._root)
        return out


# -------------------------------------------------------------- Graph
class ArtistGraph:
    """Undirected graph of 'related' links (adjacency sets)."""

    def __init__(self):
        self._adj: Dict[str, Set[str]] = defaultdict(set)

    def addRelation(self, artistA: str, artistB: str) -> None:
        if artistA == artistB:
            return                       # ignore self-links
        self._adj[artistA].add(artistB)
        self._adj[artistB].add(artistA)

    def recommendArtists(self, artist: str) -> List[str]:
        """Artists exactly two links away, not directly related, sorted."""
        if artist not in self._adj:
            return []
        direct = self._adj[artist]
        two_away: Set[str] = set()
        for friend in direct:
            two_away |= self._adj[friend]
        two_away -= direct
        two_away.discard(artist)
        return sorted(two_away)


# -------------------------------------------------------------- tests
if __name__ == "__main__":
    idx = SongIndex()
    for t, i in [("Imagine", "s1"), ("Hey Jude", "s2"), ("Help!", "s3"),
                 ("Yesterday", "s4"), ("Hello", "s5"), ("Heroes", "s6"),
                 ("Zombie", "s7"), ("Hallelujah", "s8")]:
        idx.addSong(t, i)

    assert idx.findSong("Hello") == "s5"
    assert idx.findSong("hello") == "s5"          # case-insensitive
    assert idx.findSong("Nope") is None
    assert idx.prefixSearch("He") == ["Hello", "Help!", "Hero" "es", "Hey Jude"]
    assert idx.prefixSearch("Hel") == ["Hello", "Help!"]
    assert idx.prefixSearch("H") == ["Hallelujah", "Hello", "Help!", "Heroes", "Hey Jude"]
    assert idx.prefixSearch("Q") == []
    assert idx.prefixSearch("") == sorted(
        ["Imagine", "Hey Jude", "Help!", "Yesterday", "Hello", "Heroes", "Zombie", "Hallelujah"],
        key=str.casefold)                          # empty prefix = all, sorted
    assert SongIndex().prefixSearch("a") == []     # empty tree
    idx.addSong("Hello", "s99")                    # duplicate title updates id
    assert idx.findSong("Hello") == "s99"

    g = ArtistGraph()
    g.addRelation("A", "B")
    g.addRelation("B", "C")
    g.addRelation("A", "D")
    g.addRelation("D", "E")
    g.addRelation("B", "E")
    g.addRelation("C", "F")
    g.addRelation("A", "A")                        # ignored
    assert g.recommendArtists("A") == ["C", "E"]   # E via B and D, not direct
    assert g.recommendArtists("C") == ["A", "E"]
    assert g.recommendArtists("F") == ["B"]
    assert g.recommendArtists("Unknown") == []
    g.addRelation("A", "C")                        # now direct -> excluded
    assert g.recommendArtists("A") == ["E", "F"]

    print("All Milestone 3 tests passed.")