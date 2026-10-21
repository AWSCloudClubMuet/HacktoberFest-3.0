"""
TuneWave Music Player - Milestone 3: Song Search and Related Artists
Implements:
1. Binary Search Tree (BST) for fast song search and pruned prefix search.
2. Undirected Graph for 2-hop artist recommendations.
"""

from collections import defaultdict


class BSTNode:
    """Node in the Song Search Binary Search Tree."""
    def __init__(self, title: str, song_id: str):
        self.title = str(title)
        self.song_id = str(song_id)
        self.left = None
        self.right = None

    def __repr__(self):
        return f"BSTNode('{self.title}', '{self.song_id}')"


class SongSearchBST:
    """
    Binary Search Tree storing songs keyed by title.
    
    Rules:
    - Store songs in a BST keyed by title.
    - prefixSearch returns matching titles in alphabetical order and skips subtrees that cannot match.
    """
    def __init__(self):
        self.root = None
        self._size = 0

    def addSong(self, title: str, song_id: str):
        """
        Inserts a song into the BST keyed by title.
        """
        self.root = self._insert(self.root, str(title), str(song_id))
        self._size += 1

    def _insert(self, node: BSTNode, title: str, song_id: str) -> BSTNode:
        if node is None:
            return BSTNode(title, song_id)

        if title < node.title:
            node.left = self._insert(node.left, title, song_id)
        elif title > node.title:
            node.right = self._insert(node.right, title, song_id)
        else:
            # If duplicate title, update song_id
            node.song_id = song_id

        return node

    def findSong(self, title: str) -> str:
        """
        Searches for a song by exact title in the BST.
        
        Returns:
            str or None: songId if found, else None.
        """
        curr = self.root
        target = str(title)
        while curr:
            if target == curr.title:
                return curr.song_id
            elif target < curr.title:
                curr = curr.left
            else:
                curr = curr.right
        return None

    def prefixSearch(self, prefix: str) -> list[str]:
        """
        Returns matching titles in alphabetical order and skips subtrees that cannot match.
        
        Pruning Invariant:
        Let P = prefix, L = len(P), node_prefix = node.title[:L].
        - If P <= node_prefix: Left subtree may contain matches.
        - If P >= node_prefix: Right subtree may contain matches.
        Subtrees failing these conditions are skipped (pruned).
        In-order traversal guarantees alphabetical order without additional sorting.
        """
        results = []
        prefix_str = str(prefix)
        if not prefix_str:
            return self.in_order_titles()

        self._prefix_search(self.root, prefix_str, results)
        return results

    def _prefix_search(self, node: BSTNode, prefix: str, results: list):
        if node is None:
            return

        L = len(prefix)
        node_prefix = node.title[:L]

        # 1. Prune Left Subtree if all left descendants are strictly smaller than prefix
        if prefix <= node_prefix:
            self._prefix_search(node.left, prefix, results)

        # 2. Check current node
        if node.title.startswith(prefix):
            results.append(node.title)

        # 3. Prune Right Subtree if all right descendants are strictly greater than prefix
        if prefix >= node_prefix:
            self._prefix_search(node.right, prefix, results)

    def in_order_titles(self) -> list[str]:
        """Returns all titles in alphabetical order."""
        titles = []
        def _inorder(node):
            if node:
                _inorder(node.left)
                titles.append(node.title)
                _inorder(node.right)
        _inorder(self.root)
        return titles

    def __len__(self):
        return self._size


class ArtistGraph:
    """
    Undirected Graph of related artist links.
    
    Rules:
    - Artists form an undirected graph of 'related' links.
    - recommendArtists returns artists exactly two links away who are not already directly related, in alphabetical order.
    """
    def __init__(self):
        self.adj = defaultdict(set)

    def addRelation(self, artistA: str, artistB: str):
        """
        Adds an undirected link between artistA and artistB.
        """
        a, b = str(artistA), str(artistB)
        if a == b:
            return  # No self-loops
        self.adj[a].add(b)
        self.adj[b].add(a)

    def getDirectRelations(self, artist: str) -> set:
        """Returns the 1-hop direct neighbors of an artist."""
        return set(self.adj.get(str(artist), set()))

    def recommendArtists(self, artist: str) -> list[str]:
        """
        Returns artists exactly two links away who are not already directly related,
        in alphabetical order.
        
        Logic:
        1. N1 = 1-hop neighbors of artist.
        2. N2 = 1-hop neighbors of all u in N1.
        3. Filter: second_degree != artist and second_degree not in N1.
        4. Return sorted(candidates).
        """
        target = str(artist)
        if target not in self.adj:
            return []

        direct_relations = self.adj[target]
        candidates = set()

        for direct_neighbor in direct_relations:
            for second_degree in self.adj[direct_neighbor]:
                # Must be exactly 2 links away:
                # 1. Cannot be the starting artist
                # 2. Cannot already be directly related (1 link away)
                if second_degree != target and second_degree not in direct_relations:
                    candidates.add(second_degree)

        return sorted(list(candidates))


class TuneWaveDiscovery:
    """
    Unified Discovery Engine for TuneWave satisfying all Milestone 3 required operations:
    - addSong(title, songId)
    - findSong(title)
    - prefixSearch(prefix)
    - addRelation(artistA, artistB)
    - recommendArtists(artist)
    """
    def __init__(self):
        self.search_index = SongSearchBST()
        self.artist_network = ArtistGraph()

    def addSong(self, title: str, songId: str):
        self.search_index.addSong(title, songId)

    def findSong(self, title: str) -> str:
        return self.search_index.findSong(title)

    def prefixSearch(self, prefix: str) -> list[str]:
        return self.search_index.prefixSearch(prefix)

    def addRelation(self, artistA: str, artistB: str):
        self.artist_network.addRelation(artistA, artistB)

    def recommendArtists(self, artist: str) -> list[str]:
        return self.artist_network.recommendArtists(artist)
