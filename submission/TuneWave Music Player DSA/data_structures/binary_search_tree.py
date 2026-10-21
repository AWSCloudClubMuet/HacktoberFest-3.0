"""BST of songs keyed by title.

Search behaviour (documented): CASE-INSENSITIVE. Keys are title.strip().casefold().
Duplicate titles share one node; the node keeps a list of (original title, song id).
Rule: key < node.key -> go left, key > node.key -> go right, equal -> found.
"""
from typing import List, Optional, Tuple


def _key(title: str) -> str:
    return title.strip().casefold()


class _BSTNode:
    def __init__(self, key: str):
        self.key = key
        self.entries: List[Tuple[str, int]] = []   # (original title, song id)
        self.left: Optional["_BSTNode"] = None
        self.right: Optional["_BSTNode"] = None


class SongBST:
    def __init__(self):
        self.root: Optional[_BSTNode] = None
        self.node_count = 0
        self.last_visited_count = 0     # nodes visited by last prefix search (shows pruning)

    def add_song(self, title: str, song_id: int) -> None:
        key = _key(title)
        if self.root is None:
            self.root = _BSTNode(key)
            self.node_count = 1
            node = self.root
        else:
            node = self.root
            while key != node.key:
                side = "left" if key < node.key else "right"
                child = getattr(node, side)
                if child is None:
                    child = _BSTNode(key)
                    setattr(node, side, child)
                    self.node_count += 1
                node = child
        if (title, song_id) not in node.entries:
            node.entries.append((title, song_id))

    def _find_node(self, title: str) -> Optional[_BSTNode]:
        key, node = _key(title), self.root
        while node is not None and key != node.key:
            node = node.left if key < node.key else node.right
        return node

    def find_song(self, title: str) -> List[int]:
        """All song ids whose title equals `title` (ignoring case)."""
        node = self._find_node(title)
        return [sid for _, sid in node.entries] if node else []

    def remove_song(self, title: str, song_id: int) -> bool:
        """Remove one id. The (possibly empty) node stays in the tree; empty nodes add no results."""
        node = self._find_node(title)
        if node is None:
            return False
        before = len(node.entries)
        node.entries = [e for e in node.entries if e[1] != song_id]
        return len(node.entries) < before

    def prefix_search(self, prefix: str) -> List[Tuple[str, int]]:
        """(title, id) pairs whose title starts with prefix, alphabetical."""
        self.last_visited_count = 0
        results: List[Tuple[str, int]] = []
        self._collect(self.root, _key(prefix), results)
        return results

    def _collect(self, node, prefix, results) -> None:
        if node is None:
            return
        self.last_visited_count += 1
        if node.key.startswith(prefix):
            self._collect(node.left, prefix, results)    # smaller keys may still match
            results.extend(node.entries)
            self._collect(node.right, prefix, results)
        elif prefix < node.key:
            self._collect(node.left, prefix, results)    # every match is smaller: skip right
        else:
            self._collect(node.right, prefix, results)   # every match is larger: skip left

    addSong = add_song
    findSong = find_song
    prefixSearch = prefix_search
