package tunewave.datastructures;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Bounded LIFO Stack implementation for TuneWave Play History.
 * Holds at most 10 songs. When full, pushing a new song drops the oldest song from the bottom.
 *
 * @param <T> Element type
 */
public class HistoryStack<T> {

    public static final int MAX_CAPACITY = 10;

    private static class SNode<T> {
        T data;
        SNode<T> next; // towards bottom
        SNode<T> prev; // towards top

        SNode(T data) {
            this.data = data;
        }
    }

    private SNode<T> top;    // Most recent (top of stack)
    private SNode<T> bottom; // Oldest element (bottom of stack)
    private int size;
    private final int capacity;

    public HistoryStack(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("Capacity must be positive");
        }
        this.capacity = capacity;
        this.top = null;
        this.bottom = null;
        this.size = 0;
    }

    public HistoryStack() {
        this(MAX_CAPACITY);
    }

    /**
     * Pushes a new song onto the history stack.
     * If the stack is at maximum capacity (10), the oldest song at the bottom is dropped.
     *
     * @param item Song to push
     */
    public void push(T item) {
        if (item == null) {
            return;
        }

        SNode<T> newNode = new SNode<>(item);

        if (isEmpty()) {
            top = newNode;
            bottom = newNode;
            size = 1;
            return;
        }

        // Push on top
        newNode.next = top;
        top.prev = newNode;
        top = newNode;
        size++;

        // If exceeded capacity, drop the oldest (bottom)
        if (size > capacity) {
            dropOldest();
        }
    }

    /**
     * Pops and returns the top song from history.
     *
     * @return Top song
     * @throws NoSuchElementException if history is empty
     */
    public T pop() {
        if (isEmpty()) {
            throw new NoSuchElementException("History stack is empty");
        }

        T data = top.data;
        top = top.next;
        if (top != null) {
            top.prev = null;
        } else {
            bottom = null;
        }
        size--;
        return data;
    }

    /**
     * Returns top song without removing it.
     */
    public T peek() {
        if (isEmpty()) {
            return null;
        }
        return top.data;
    }

    private void dropOldest() {
        if (bottom == null) return;

        if (bottom.prev != null) {
            bottom = bottom.prev;
            bottom.next = null;
        } else {
            // Only 1 node
            top = null;
            bottom = null;
        }
        size--;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public int getCapacity() {
        return capacity;
    }

    public void clear() {
        top = null;
        bottom = null;
        size = 0;
    }

    /**
     * Returns a list of songs ordered from most recently played (top) to oldest (bottom).
     */
    public List<T> toList() {
        List<T> list = new ArrayList<>();
        SNode<T> curr = top;
        while (curr != null) {
            list.add(curr.data);
            curr = curr.next;
        }
        return list;
    }
}
