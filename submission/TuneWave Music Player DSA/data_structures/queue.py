"""Up Next queue: FIFO (first in, first out). Stores song IDs."""
from collections import deque
from typing import List, Optional


class UpNextQueue:
    def __init__(self):
        self._items: deque = deque()

    def enqueue(self, song_id: int) -> None:
        self._items.append(song_id)

    def dequeue(self) -> Optional[int]:
        """Oldest queued id, or None if empty."""
        return self._items.popleft() if self._items else None

    def peek(self) -> Optional[int]:
        return self._items[0] if self._items else None

    def remove_all(self, song_id: int) -> None:
        self._items = deque(i for i in self._items if i != song_id)

    def remove_first(self, song_id: int) -> bool:
        """Remove ONE queued copy of song_id (used when the user plays it straight from the queue)."""
        try:
            self._items.remove(song_id)
        except ValueError:
            return False
        return True

    def clear(self) -> None:
        self._items.clear()

    def to_list(self) -> List[int]:
        return list(self._items)

    def __len__(self) -> int:
        return len(self._items)
