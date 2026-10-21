"""Doubly linked list. Each node knows the node before and after it.

Example: A <-> B <-> C.  Unlinking B makes A.next = C and C.prev = A.
"""
from typing import Iterator, Optional
from models.song import Song


class Node:
    def __init__(self, song: Song):
        self.song = song                      # reference to the Song (not a copy)
        self.prev: Optional["Node"] = None
        self.next: Optional["Node"] = None


class DoublyLinkedList:
    def __init__(self):
        self.head: Optional[Node] = None
        self.tail: Optional[Node] = None
        self.size = 0

    def append(self, song: Song) -> Node:
        node = Node(song)
        if self.tail is None:          # empty list: node is both head and tail
            self.head = self.tail = node
        else:
            node.prev = self.tail
            self.tail.next = node
            self.tail = node
        self.size += 1
        return node

    def unlink(self, node: Node) -> None:
        """Remove `node`, reconnecting its neighbours and fixing head/tail."""
        if node.prev is not None:
            node.prev.next = node.next
        else:
            self.head = node.next      # node was the head
        if node.next is not None:
            node.next.prev = node.prev
        else:
            self.tail = node.prev      # node was the tail
        node.prev = node.next = None
        self.size -= 1

    def __iter__(self) -> Iterator[Song]:
        node = self.head
        while node is not None:
            yield node.song
            node = node.next

    def __len__(self) -> int:
        return self.size
