package tunewave.datastructures;

import java.util.ArrayList;
import java.util.List;

/**
 * Doubly Linked List implementation for TuneWave Playlist.
 * Allows bidirectional traversal (previous/next) and O(1) removal when node reference is known.
 *
 * @param <T> Element type
 */
public class DoublyLinkedList<T> {

    public static class Node<T> {
        public T data;
        public Node<T> prev;
        public Node<T> next;

        public Node(T data) {
            this.data = data;
            this.prev = null;
            this.next = null;
        }

        @Override
        public String toString() {
            return String.valueOf(data);
        }
    }

    private Node<T> head;
    private Node<T> tail;
    private int size;

    public DoublyLinkedList() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    /**
     * Appends a new element to the end of the list.
     * @param data Item to append
     * @return The newly created node
     */
    public Node<T> append(T data) {
        Node<T> newNode = new Node<>(data);
        if (head == null) {
            head = newNode;
            tail = newNode;
        } else {
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        }
        size++;
        return newNode;
    }

    /**
     * Removes the specified node from the doubly linked list in O(1) time.
     * @param node The node to remove
     * @return true if removed, false if node is null
     */
    public boolean removeNode(Node<T> node) {
        if (node == null) {
            return false;
        }

        if (node.prev != null) {
            node.prev.next = node.next;
        } else {
            head = node.next;
        }

        if (node.next != null) {
            node.next.prev = node.prev;
        } else {
            tail = node.prev;
        }

        node.prev = null;
        node.next = null;
        size--;
        return true;
    }

    public Node<T> getHead() {
        return head;
    }

    public Node<T> getTail() {
        return tail;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public void clear() {
        head = null;
        tail = null;
        size = 0;
    }

    public List<T> toList() {
        List<T> list = new ArrayList<>();
        Node<T> curr = head;
        while (curr != null) {
            list.add(curr.data);
            curr = curr.next;
        }
        return list;
    }
}
