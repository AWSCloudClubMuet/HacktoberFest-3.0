"""
TuneWave Music Player - Playback Subsystem
Milestone 2: Up Next (FIFO Queue) and Playback History (LIFO Stack capped at 10).
"""
from typing import Any, List, Optional, Union
from .models import Song
from .playlist import Playlist


class QueueNode:
    """A node in the custom FIFO Queue."""

    def __init__(self, item: Any):
        self.item: Any = item
        self.next: Optional["QueueNode"] = None

    def __repr__(self) -> str:
        return f"QueueNode({self.item})"


class Queue:
    """
    Custom FIFO (First-In, First-Out) Queue implementation for Up Next.
    
    Operations:
    - enqueue(item): Appends item to rear (tail) in O(1) time.
    - dequeue(): Removes and returns item from front (head) in O(1) time.
    - peek(): Returns front item without removing in O(1) time.
    - is_empty(): Returns True if queue has no items.
    - __len__(): Returns number of queued items.
    - to_list(): Returns list of queued items from front to rear.
    """

    def __init__(self):
        self.head: Optional[QueueNode] = None  # Front of the queue
        self.tail: Optional[QueueNode] = None  # Rear of the queue
        self._size: int = 0

    def enqueue(self, item: Any) -> None:
        """Adds an item to the rear of the queue."""
        node = QueueNode(item)
        if self.tail is None:
            self.head = node
            self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self._size += 1

    def dequeue(self) -> Any:
        """Removes and returns the item at the front of the queue."""
        if self.head is None:
            return None
        node = self.head
        self.head = node.next
        if self.head is None:
            self.tail = None
        self._size -= 1
        node.next = None
        return node.item

    def peek(self) -> Any:
        """Returns the item at the front without removing it."""
        return self.head.item if self.head else None

    def is_empty(self) -> bool:
        """Checks if the queue is empty."""
        return self._size == 0

    def clear(self) -> None:
        """Clears all items from the queue."""
        self.head = None
        self.tail = None
        self._size = 0

    def __len__(self) -> int:
        return self._size

    def to_list(self) -> List[Any]:
        """Returns items in FIFO order (front to rear)."""
        items: List[Any] = []
        curr = self.head
        while curr is not None:
            items.append(curr.item)
            curr = curr.next
        return items

    def __repr__(self) -> str:
        return f"Queue(size={self._size}, items={self.to_list()})"


class StackNode:
    """A node in the custom doubly linked HistoryStack."""

    def __init__(self, item: Any):
        self.item: Any = item
        self.prev: Optional["StackNode"] = None
        self.next: Optional["StackNode"] = None

    def __repr__(self) -> str:
        return f"StackNode({self.item})"


class HistoryStack:
    """
    Custom LIFO (Last-In, First-Out) Stack implementation for playback history.
    Strictly capped at max_capacity (default 10). When full, drops the oldest entry.
    
    Structure:
    - Doubly linked sequence from bottom (oldest) to top (most recent).
    - push(item): Pushes to top in O(1). If size > max_capacity, discards bottom in O(1).
    - pop(): Pops from top in O(1).
    - peek(): Returns top item without removing in O(1).
    - is_empty(): Returns True if stack is empty.
    - __len__(): Returns current number of items (<= max_capacity).
    - to_list(): Returns list from most recent (top) to oldest (bottom).
    """

    def __init__(self, max_capacity: int = 10):
        self.max_capacity: int = max_capacity
        self.bottom: Optional[StackNode] = None  # Oldest entry
        self.top: Optional[StackNode] = None     # Most recent entry
        self._size: int = 0

    def push(self, item: Any) -> None:
        """Pushes an item onto the top of the stack. Discards oldest entry if full."""
        node = StackNode(item)
        if self.top is None:
            self.bottom = node
            self.top = node
            self._size = 1
        else:
            self.top.next = node
            node.prev = self.top
            self.top = node
            self._size += 1

        # Enforce max capacity: discard oldest (bottom) in O(1)
        if self._size > self.max_capacity:
            old_bottom = self.bottom
            if old_bottom is not None and old_bottom.next is not None:
                self.bottom = old_bottom.next
                self.bottom.prev = None
                old_bottom.next = None
            self._size -= 1

    def pop(self) -> Any:
        """Pops and returns the most recent item from the top of the stack."""
        if self.top is None:
            return None
        node = self.top
        if self.top == self.bottom:
            self.top = None
            self.bottom = None
            self._size = 0
        else:
            self.top = node.prev
            if self.top is not None:
                self.top.next = None
            self._size -= 1
        node.prev = None
        node.next = None
        return node.item

    def peek(self) -> Any:
        """Returns the most recent item without removing it."""
        return self.top.item if self.top else None

    def is_empty(self) -> bool:
        """Checks if the stack is empty."""
        return self._size == 0

    def clear(self) -> None:
        """Clears all items from the stack."""
        self.bottom = None
        self.top = None
        self._size = 0

    def __len__(self) -> int:
        return self._size

    def to_list(self) -> List[Any]:
        """Returns items in LIFO order (most recent top to oldest bottom)."""
        items: List[Any] = []
        curr = self.top
        while curr is not None:
            items.append(curr.item)
            curr = curr.prev
        return items

    def __repr__(self) -> str:
        return f"HistoryStack(size={self._size}/{self.max_capacity}, top={self.peek()})"


class Player:
    """
    Playback Controller managing playlist sequencing, the Up Next FIFO queue,
    and the LIFO playback history stack.
    
    Playback Architecture:
    - Up Next: FIFO Queue holding songs queued for immediate upcoming play.
    - History: LIFO Stack holding the last 10 played songs.
    - current_playing: The actively playing song, tracked independently from
      playlist.current so playing from Up Next or history never mutates the playlist cursor.
    """

    def __init__(self, playlist: Optional[Playlist] = None):
        self.playlist: Playlist = playlist if playlist is not None else Playlist()
        self.playlist._player = self
        self._current_playing: Optional[Song] = self.playlist.current_song
        self.up_next: Queue = Queue()
        self.history: HistoryStack = HistoryStack(max_capacity=10)

    @property
    def current_playing(self) -> Optional[Song]:
        """The currently playing song, separate from playlist.current."""
        if self._current_playing is None and self.playlist.current_song is not None:
            self._current_playing = self.playlist.current_song
        return self._current_playing

    @property
    def current_song(self) -> Optional[Song]:
        """Alias for current_playing."""
        return self.current_playing

    # -------------------------------------------------------------------------
    # Milestone 2 Required Public Operations
    # -------------------------------------------------------------------------

    def addToUpNext(self, songId: Any) -> bool:
        """
        Queues a song to play next by song ID.
        
        Rules:
        - Validates the song ID using the playlist catalog (get_song).
        - If invalid, returns False and does NOT alter the queue state.
        - If valid, enqueues the song into the FIFO queue and returns True.
        """
        song_id_str = str(songId.id if hasattr(songId, "id") else songId)
        song = self.playlist.get_song(song_id_str)
        if song is None:
            return False

        self.up_next.enqueue(song)
        return True

    def playNext(self) -> Union[Song, str, None]:
        """
        Plays the next song according to TuneWave playback rules.
        
        Rules:
        1. If Up Next contains songs: plays and removes the oldest queued song.
           Does NOT modify the playlist.current cursor.
        2. If Up Next is empty: advances the playlist using Playlist.next().
        3. Pushes the previously playing song to the history stack before transition.
        4. If Playlist.next() returns 'end' (repeat off at tail), returns 'end'
           without modifying current_playing or recording a transition in history.
        5. If playlist and queue are empty, returns None.
        
        Returns:
            The newly active Song object, 'end' if at tail with repeat off, or None if empty.
        """
        current = self.current_playing

        # Priority 1: Up Next Queue has queued songs
        if not self.up_next.is_empty():
            next_song: Song = self.up_next.dequeue()
            if current is not None:
                self.history.push(current)
            self._current_playing = next_song
            return self._current_playing

        # Priority 2: Up Next is empty -> advance playlist sequence
        res = self.playlist.next()
        if isinstance(res, Song):
            if current is not None:
                self.history.push(current)
            self._current_playing = res
            return self._current_playing
        elif res == "end":
            # Reached end of playlist with repeat off; stays on last song, no transition
            return "end"
        else:
            # Empty playlist
            return None

    def back(self) -> Optional[Song]:
        """
        Replays the most recently played eligible previous song from history.
        
        Rules:
        - Pops the top song from the history stack and sets it as current_playing.
        - Does NOT push the displaced song onto history (prevents replay loops).
        - Does NOT modify the playlist cursor.
        - If history is empty, returns None and leaves current playback unchanged.
        
        Returns:
            The replayed Song object, or None if history is empty.
        """
        if self.history.is_empty():
            return None

        previous_song: Song = self.history.pop()
        self._current_playing = previous_song
        return self._current_playing

    # -------------------------------------------------------------------------
    # Pythonic Compatibility Wrappers & Helper Methods
    # -------------------------------------------------------------------------

    def add_to_up_next(self, song_id: Any) -> bool:
        """Pythonic alias for addToUpNext."""
        return self.addToUpNext(song_id)

    def play_next(self) -> Union[Song, str, None]:
        """Pythonic alias for playNext."""
        return self.playNext()

    def get_up_next(self) -> List[Song]:
        """Returns the songs currently queued in Up Next (front to rear)."""
        return self.up_next.to_list()

    def get_history(self) -> List[Song]:
        """Returns the songs in history (most recent to oldest)."""
        return self.history.to_list()

    # Playlist delegation convenience
    def addSong(self, song: Any) -> bool:
        res = self.playlist.addSong(song)
        if self._current_playing is None:
            self._current_playing = self.playlist.current_song
        return res

    def removeSong(self, songId: Any) -> bool:
        return self.playlist.removeSong(songId)

    def toggleRepeat(self) -> bool:
        return self.playlist.toggleRepeat()

    def __repr__(self) -> str:
        current_id = self._current_playing.id if self._current_playing else None
        return (
            f"Player(current='{current_id}', queued={len(self.up_next)}, "
            f"history={len(self.history)})"
        )


# Alias
TuneWavePlayer = Player
