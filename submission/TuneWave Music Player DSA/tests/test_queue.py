import unittest
from data_structures.queue import UpNextQueue


class QueueTests(unittest.TestCase):
    def test_fifo(self):
        q = UpNextQueue()
        for i in (3, 1, 2):
            q.enqueue(i)
        self.assertEqual([q.dequeue() for _ in range(3)], [3, 1, 2])

    def test_empty(self):
        q = UpNextQueue()
        self.assertIsNone(q.dequeue()); self.assertIsNone(q.peek())
        self.assertEqual(q.to_list(), [])


if __name__ == "__main__":
    unittest.main()
