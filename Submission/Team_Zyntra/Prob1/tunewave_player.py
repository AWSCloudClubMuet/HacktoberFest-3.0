"""
TuneWave Complete Music Player Core
Integrates all three milestones into a unified streaming engine:
- Milestone 1: Playlist (Doubly Linked List + Hash Map)
- Milestone 2: Up Next & History (FIFO Queue + Bounded LIFO Stack)
- Milestone 3: Song Search & Artist Recommendation (BST + Undirected Graph)
"""

from collections import deque, defaultdict


# ==========================================
# MILESTONE 1: PLAYLIST (DLL + HASH MAP)
# ==========================================

class Song:
    """Represents a song entity with metadata."""
    def __init__(self, song_id, title, artist, duration=0):
        self.song_id = str(song_id)
        self.title = str(title)
        self.artist = str(artist)
        self.duration = duration

    def __repr__(self):
        return f"Song(id='{self.song_id}', title='{self.title}', artist='{self.artist}')"

    def __str__(self):
        return f"'{self.title}' by {self.artist} [{self.song_id}]"

    def __eq__(self, other):
        if isinstance(other, Song):
            return self.song_id == other.song_id
        elif isinstance(other, str):
            return self.song_id == other
        return False

    def __hash__(self):
        return hash(self.song_id)


class SongNode:
    """Node in the Doubly Linked List."""
    def __init__(self, song: Song):
        self.song = song
        self.prev = None
        self.next = None

    def __repr__(self):
        return f"SongNode({self.song.title})"


class Playlist:
    """
    TuneWave Playlist: Doubly Linked List + Hash Map
    
    Rules:
    - A song can appear only once in a playlist; hash map from song ID to node checks this and finds songs without scanning.
    - With repeat on, next() on the last song wraps to the first.
    - With repeat off, next() on the last song stays on the last song and returns "end".
    - All operations run in O(1) time.
    """
    def __init__(self, name="My Playlist"):
        self.name = name
        self.head = None
        self.tail = None
        self.current = None
        self.repeat = False
        self.song_map = {}  # song_id -> SongNode
        self._size = 0

    def __len__(self):
        return self._size

    def addSong(self, song) -> bool:
        """
        Adds a song to the end of the playlist.
        Guarantees uniqueness via O(1) hash map lookup.
        """
        if not isinstance(song, Song):
            if isinstance(song, dict):
                song = Song(
                    song.get("song_id") or song.get("id"),
                    song.get("title", "Unknown"),
                    song.get("artist", "Unknown"),
                    song.get("duration", 0)
                )
            elif isinstance(song, str):
                song = Song(song, song, "Unknown")
            else:
                raise TypeError(f"Invalid song format: {type(song)}")

        if song.song_id in self.song_map:
            return False  # Duplicate rejected

        new_node = SongNode(song)

        if self.head is None:
            self.head = new_node
            self.tail = new_node
            self.current = new_node
        else:
            self.tail.next = new_node
            new_node.prev = self.tail
            self.tail = new_node

        self.song_map[song.song_id] = new_node
        self._size += 1
        return True

    def removeSong(self, songId) -> bool:
        """
        Removes a song by songId in O(1) time using hash map + DLL unlinking.
        """
        song_id_str = str(songId)
        node = self.song_map.get(song_id_str)
        if node is None:
            return False

        # Adjust current cursor if playing track is removed
        if node == self.current:
            if node.next is not None:
                self.current = node.next
            elif node.prev is not None:
                self.current = node.prev
            else:
                self.current = None

        # Unlink head and tail
        if node == self.head:
            self.head = node.next
            if self.head:
                self.head.prev = None
        if node == self.tail:
            self.tail = node.prev
            if self.tail:
                self.tail.next = None

        # Unlink internal nodes
        if node.prev and node != self.head:
            node.prev.next = node.next
        if node.next and node != self.tail:
            node.next.prev = node.prev

        del self.song_map[song_id_str]
        self._size -= 1
        node.prev = None
        node.next = None
        return True

    def next(self):
        """
        Advances to next song.
        - With repeat ON: wraps to head from last song.
        - With repeat OFF: stays on last song and returns 'end'.
        """
        if self.current is None:
            return "end"

        if self.current.next is not None:
            self.current = self.current.next
            return self.current.song

        if self.repeat:
            self.current = self.head
            return self.current.song if self.current else "end"
        else:
            return "end"

    def previous(self):
        """Moves to previous song."""
        if self.current is None:
            return None

        if self.current.prev is not None:
            self.current = self.current.prev
            return self.current.song

        if self.repeat:
            self.current = self.tail
            return self.current.song if self.current else None
        else:
            return self.current.song

    def toggleRepeat(self) -> bool:
        self.repeat = not self.repeat
        return self.repeat

    def getCurrentSong(self):
        return self.current.song if self.current else None

    def to_list(self):
        res = []
        curr = self.head
        while curr:
            res.append(curr.song)
            curr = curr.next
        return res


# ==========================================
# MILESTONE 2: UP NEXT & HISTORY (QUEUE + STACK)
# ==========================================

class UpNextQueue:
    """FIFO Queue for Up Next songs."""
    def __init__(self):
        self._queue = deque()

    def enqueue(self, song: Song):
        self._queue.append(song)

    def dequeue(self) -> Song:
        return self._queue.popleft() if self._queue else None

    def peek(self) -> Song:
        return self._queue[0] if self._queue else None

    def is_empty(self) -> bool:
        return len(self._queue) == 0

    def __len__(self):
        return len(self._queue)

    def to_list(self):
        return list(self._queue)


class PlayHistory:
    """Bounded LIFO Stack retaining at most 10 songs, dropping oldest in O(1)."""
    def __init__(self, capacity: int = 10):
        self.capacity = capacity
        self._stack = deque(maxlen=capacity)

    def push(self, song: Song):
        self._stack.append(song)

    def pop(self) -> Song:
        return self._stack.pop() if self._stack else None

    def peek(self) -> Song:
        return self._stack[-1] if self._stack else None

    def is_empty(self) -> bool:
        return len(self._stack) == 0

    def __len__(self):
        return len(self._stack)

    def to_list(self):
        return list(self._stack)


# ==========================================
# MILESTONE 3: BST SEARCH & ARTIST GRAPH
# ==========================================

class BSTNode:
    """Node in Song Search Binary Search Tree."""
    def __init__(self, title: str, song_id: str):
        self.title = str(title)
        self.song_id = str(song_id)
        self.left = None
        self.right = None


class SongSearchBST:
    """Binary Search Tree keyed by title with pruned prefix search."""
    def __init__(self):
        self.root = None
        self._size = 0

    def addSong(self, title: str, song_id: str):
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
            node.song_id = song_id
        return node

    def findSong(self, title: str) -> str:
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

    def prefixSearch(self, prefix: str) -> list:
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
        if prefix <= node_prefix:
            self._prefix_search(node.left, prefix, results)
        if node.title.startswith(prefix):
            results.append(node.title)
        if prefix >= node_prefix:
            self._prefix_search(node.right, prefix, results)

    def in_order_titles(self) -> list:
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
    """Undirected graph of related artist links."""
    def __init__(self):
        self.adj = defaultdict(set)

    def addRelation(self, artistA: str, artistB: str):
        a, b = str(artistA), str(artistB)
        if a == b:
            return
        self.adj[a].add(b)
        self.adj[b].add(a)

    def recommendArtists(self, artist: str) -> list:
        target = str(artist)
        if target not in self.adj:
            return []
        direct = self.adj[target]
        candidates = set()
        for neighbor in direct:
            for second_degree in self.adj[neighbor]:
                if second_degree != target and second_degree not in direct:
                    candidates.add(second_degree)
        return sorted(list(candidates))


# ==========================================
# UNIFIED TUNEWAVE PLAYER SYSTEM
# ==========================================

class TuneWavePlayer:
    """
    Unified TuneWave Music Player Core.
    Fulfills all operations and rules across Milestones 1, 2, and 3.
    """
    def __init__(self, playlist_name="Default"):
        self.playlist = Playlist(playlist_name)
        self.up_next = UpNextQueue()
        self.history = PlayHistory(capacity=10)
        self.search_bst = SongSearchBST()
        self.artist_graph = ArtistGraph()
        self.catalog = {}  # song_id -> Song
        self.currently_playing = None

    # --- Milestone 1 Operations ---
    def addSongToPlaylist(self, song: Song) -> bool:
        added = self.playlist.addSong(song)
        if added:
            self.catalog[song.song_id] = song
            self.search_bst.addSong(song.title, song.song_id)
            if self.currently_playing is None:
                self.currently_playing = song
        return added

    def removeSongFromPlaylist(self, songId: str) -> bool:
        return self.playlist.removeSong(songId)

    def next(self):
        return self.playlist.next()

    def previous(self):
        return self.playlist.previous()

    def toggleRepeat(self) -> bool:
        return self.playlist.toggleRepeat()

    # --- Milestone 2 Operations ---
    def addToUpNext(self, songId) -> bool:
        song = None
        if isinstance(songId, Song):
            song = songId
        else:
            s_id = str(songId)
            song = self.catalog.get(s_id) or (self.playlist.song_map.get(s_id).song if s_id in self.playlist.song_map else None)

        if song is None:
            return False
        self.up_next.enqueue(song)
        return True

    def playNext(self):
        # 1. Up Next plays before playlist
        if not self.up_next.is_empty():
            next_song = self.up_next.dequeue()
            if self.currently_playing is not None:
                self.history.push(self.currently_playing)
            self.currently_playing = next_song
            # Playing from Up Next does NOT move playlist position!
            return self.currently_playing

        # 2. Sequential playlist
        if len(self.playlist) == 0:
            return "end"

        if self.currently_playing is None:
            self.currently_playing = self.playlist.getCurrentSong()
            return self.currently_playing

        res = self.playlist.next()
        if res == "end":
            return "end"

        self.history.push(self.currently_playing)
        self.currently_playing = res
        return self.currently_playing

    def back(self):
        if self.history.is_empty():
            return None
        replayed = self.history.pop()
        # Playing from history does NOT move playlist position!
        self.currently_playing = replayed
        return self.currently_playing

    # --- Milestone 3 Operations ---
    def addSong(self, title: str, songId: str):
        self.search_bst.addSong(title, songId)
        if songId not in self.catalog:
            self.catalog[songId] = Song(songId, title, "Unknown")

    def findSong(self, title: str) -> str:
        return self.search_bst.findSong(title)

    def prefixSearch(self, prefix: str) -> list:
        return self.search_bst.prefixSearch(prefix)

    def addRelation(self, artistA: str, artistB: str):
        self.artist_graph.addRelation(artistA, artistB)

    def recommendArtists(self, artist: str) -> list:
        return self.artist_graph.recommendArtists(artist)
