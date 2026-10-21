"""Playback history: LIFO stack holding at most 10 song IDs (oldest dropped)."""
from typing import List, Optional


class HistoryStack:
    def __init__(self, max_size: int = 10):
        self.max_size = max_size
        self._items: List[int] = []     # end of list = top of stack

    def push(self, song_id: int) -> None:
        self._items.append(song_id)
        if len(self._items) > self.max_size:
            self._items.pop(0)          # discard the oldest

    def pop(self) -> Optional[int]:
        return self._items.pop() if self._items else None

    def peek(self) -> Optional[int]:
        return self._items[-1] if self._items else None

    def to_list(self) -> List[int]:
        """Newest first (what the GUI shows)."""
        return list(reversed(self._items))

    def __len__(self) -> int:
        return len(self._items)
