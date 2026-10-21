"""
TuneWave Music Player - Song Search Tree Subsystem
Milestone 3A: Custom Binary Search Tree (BST) for fast song title search and prefix queries.
"""
from typing import Any, List, Optional, Union


class SongRecord:
    """
    Represents a song record stored within a BST node.
    
    Attributes:
        title: Original display title of the song.
        song_id: Unique identifier of the song.
        id: Alias for song_id.
    """

    def __init__(
        self,
        title: str,
        song_id: str,
        all_records: Optional[List["SongRecord"]] = None,
    ):
        self.title: str = str(title)
        self.song_id: str = str(song_id)
        self.id: str = self.song_id
        self._records: List["SongRecord"] = (
            all_records if all_records is not None else [self]
        )

    @property
    def song_ids(self) -> List[str]:
        """Returns all song IDs stored under this normalized title."""
        return [r.song_id for r in self._records]

    def __getitem__(self, idx: int) -> Any:
        if len(self._records) > 1 and idx < len(self._records):
            return self._records[idx].song_id
        if idx == 0:
            return self.title
        if idx == 1:
            return self.song_id
        raise IndexError(f"Index {idx} out of range")

    def __iter__(self):
        if len(self._records) > 1:
            return iter(self._records)
        return iter([self.title, self.song_id])

    def __len__(self) -> int:
        return len(self._records)

    def __eq__(self, other: Any) -> bool:
        if isinstance(other, SongRecord):
            return self.song_id == other.song_id and self.title == other.title
        if isinstance(other, str):
            return self.song_id == other or self.title == other or other in self.song_ids
        if isinstance(other, (list, tuple)):
            return list(other) == self.song_ids or list(other) == [self.title, self.song_id]
        return False

    def __repr__(self) -> str:
        if len(self._records) > 1:
            return f"SongRecord(title='{self.title}', song_ids={self.song_ids})"
        return f"SongRecord(title='{self.title}', song_id='{self.song_id}')"


class BSTNode:
    """
    A node in the custom Binary Search Tree.
    
    Attributes:
        key: Normalized song title used for BST ordering (case-insensitive).
        records: List of SongRecord instances stored under this title.
        left: Left child node (keys < self.key).
        right: Right child node (keys > self.key).
    """

    def __init__(self, key: str, record: SongRecord):
        self.key: str = key
        self.records: List[SongRecord] = [record]
        self.left: Optional["BSTNode"] = None
        self.right: Optional["BSTNode"] = None

    def __repr__(self) -> str:
        return f"BSTNode(key='{self.key}', count={len(self.records)})"


class SongSearchTree:
    """
    Custom Binary Search Tree (BST) implementation for indexing and searching songs.
    
    Data Structure Architecture:
    1. BST Ordering:
       - Ordered alphabetically by normalized song title (lower-cased).
       - Left subtree contains strictly smaller keys; right subtree strictly larger keys.
    2. Duplicate Title Handling:
       - Multiple distinct song IDs sharing the same title are stored in a records list
         at the same node, ensuring no songs or IDs are overwritten or lost.
       - Duplicate insertions of the identical (title, songId) are rejected.
    3. Prefix Pruning:
       - Subtrees that cannot mathematically contain a given prefix are pruned during traversal.
       - An in-order traversal naturally returns matching titles in alphabetical order without
         needing post-search sorting.
    """

    def __init__(self):
        self.root: Optional[BSTNode] = None
        self._size: int = 0
        self._last_visited: List[str] = []

    @property
    def visited_nodes(self) -> List[str]:
        """Returns the keys of nodes visited during the most recent search operation."""
        return list(self._last_visited)

    # -------------------------------------------------------------------------
    # Milestone 3A Required Public Operations
    # -------------------------------------------------------------------------

    def addSong(self, title: Any, songId: Any) -> bool:
        """
        Inserts a song into the BST ordered by title.
        
        Rules:
        - Compares titles case-insensitively while preserving original display title.
        - Multiple song IDs under the same title are stored in the same node.
        - Duplicate insertion of identical (title, songId) is rejected.
        
        Returns:
            True if inserted, False if duplicate or invalid.
        """
        if title is None or songId is None:
            return False

        title_str = str(title).strip()
        song_id_str = str(songId)
        if not title_str:
            return False

        key = title_str.lower()
        record = SongRecord(title=title_str, song_id=song_id_str)

        if self.root is None:
            self.root = BSTNode(key, record)
            self._size += 1
            return True

        curr = self.root
        while True:
            if key == curr.key:
                # Same normalized title: check for duplicate songId
                if any(r.song_id == song_id_str for r in curr.records):
                    return False
                curr.records.append(record)
                self._size += 1
                return True
            elif key < curr.key:
                if curr.left is None:
                    curr.left = BSTNode(key, record)
                    self._size += 1
                    return True
                curr = curr.left
            else:
                if curr.right is None:
                    curr.right = BSTNode(key, record)
                    self._size += 1
                    return True
                curr = curr.right

    def findSong(self, title: Any) -> Optional[SongRecord]:
        """
        Retrieves the song record for an exact title using BST traversal.
        
        Rules:
        - Case-insensitive search.
        - Returns SongRecord if found.
        - Returns None if title is missing, empty, or not found.
        """
        self._last_visited.clear()
        if self.root is None or title is None:
            return None

        title_str = str(title).strip()
        if not title_str:
            return None

        key = title_str.lower()
        curr = self.root
        while curr is not None:
            self._last_visited.append(curr.key)
            if key == curr.key:
                if len(curr.records) == 1:
                    return curr.records[0]
                return SongRecord(
                    curr.records[0].title,
                    curr.records[0].song_id,
                    all_records=curr.records,
                )
            elif key < curr.key:
                curr = curr.left
            else:
                curr = curr.right

        return None

    def prefixSearch(self, prefix: Any) -> List[str]:
        """
        Returns all matching song display titles in alphabetical order.
        
        Pruning Invariants:
        - Left child is visited IF AND ONLY IF prefix < node.key.
          (If prefix >= node.key, all keys in left subtree are < node.key <= prefix,
           meaning no left descendant can start with prefix -> pruned!)
        - Current node is collected IF node.key.startswith(prefix).
        - Right child is visited IF node.key.startswith(prefix) OR node.key < prefix.
          (If node.key > prefix and does NOT start with prefix, all right descendants
           are strictly greater than any possible prefix match -> pruned!)
        - In-order traversal naturally yields alphabetical results without extra sorting.
        
        Returns:
            Alphabetical list of matching display titles.
        """
        self._last_visited.clear()
        results: List[str] = []

        if self.root is None or prefix is None:
            return results

        prefix_str = str(prefix).strip().lower()

        def _search(node: Optional[BSTNode]):
            if node is None:
                return

            self._last_visited.append(node.key)

            # Pruning check for Left Subtree
            if not prefix_str or prefix_str < node.key:
                _search(node.left)

            # Check Current Node
            if not prefix_str or node.key.startswith(prefix_str):
                for rec in node.records:
                    results.append(rec.title)

            # Pruning check for Right Subtree
            if (
                not prefix_str
                or node.key < prefix_str
                or node.key.startswith(prefix_str)
            ):
                _search(node.right)

        _search(self.root)
        return results

    # -------------------------------------------------------------------------
    # Pythonic Compatibility Wrappers & Helper Methods
    # -------------------------------------------------------------------------

    def add_song(self, title: Any, song_id: Any) -> bool:
        """Pythonic alias for addSong."""
        return self.addSong(title, song_id)

    def find_song(self, title: Any) -> Optional[SongRecord]:
        """Pythonic alias for findSong."""
        return self.findSong(title)

    def prefix_search(self, prefix: Any) -> List[str]:
        """Pythonic alias for prefixSearch."""
        return self.prefixSearch(prefix)

    def __len__(self) -> int:
        return self._size

    def __contains__(self, title: Any) -> bool:
        return self.findSong(title) is not None

    def clear(self) -> None:
        """Clears all nodes from the BST."""
        self.root = None
        self._size = 0
        self._last_visited.clear()

    def __repr__(self) -> str:
        return f"SongSearchTree(total_songs={self._size}, root='{self.root.key if self.root else None}')"


# Aliases
SongBST = SongSearchTree
SongSearch = SongSearchTree
