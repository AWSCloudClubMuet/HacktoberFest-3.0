package tunewave.milestone2;

import tunewave.model.Song;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/**
 * Milestone 2 — Play History (Bounded Stack: LIFO)
 *
 * <p>Rule:
 * History keeps the last 10 songs played and drops the oldest when full.
 * When {@code push()} is called and capacity is reached, the oldest song
 * at the bottom of the stack is dropped.
 *
 * <p>When {@code back()} is called, the most recently played song is popped
 * from the top of the stack and replayed.
 */
public class PlayHistory {

    public static final int DEFAULT_MAX_CAPACITY = 10;

    private final int maxCapacity;
    private final Deque<Song> items;

    /**
     * Initializes a PlayHistory stack with the default maximum capacity of 10.
     */
    public PlayHistory() {
        this(DEFAULT_MAX_CAPACITY);
    }

    /**
     * Initializes a PlayHistory stack with a custom maximum capacity.
     *
     * @param maxCapacity Maximum number of songs to keep before dropping the oldest.
     */
    public PlayHistory(int maxCapacity) {
        if (maxCapacity <= 0) {
            throw new IllegalArgumentException("maxCapacity must be greater than 0");
        }
        this.maxCapacity = maxCapacity;
        this.items = new ArrayDeque<>();
    }

    /**
     * Pushes a played song onto the top of the history stack.
     * If the stack is at maximum capacity, the oldest song at the bottom is dropped.
     *
     * @param song Song to record in history.
     */
    public void push(Song song) {
        if (song == null) {
            return;
        }

        // Drop the oldest song if capacity is reached
        while (this.items.size() >= this.maxCapacity) {
            this.items.pollFirst();
        }

        this.items.addLast(song);
    }

    /**
     * Pops and returns the most recently played song from the top of the stack.
     *
     * @return The top {@link Song}, or {@code null} if history is empty.
     */
    public Song pop() {
        return this.items.pollLast();
    }

    /**
     * Peeks at the most recently played song without removing it.
     *
     * @return The top {@link Song}, or {@code null} if history is empty.
     */
    public Song peek() {
        return this.items.peekLast();
    }

    /**
     * Checks if history is empty.
     *
     * @return {@code true} if empty, {@code false} otherwise.
     */
    public boolean isEmpty() {
        return this.items.isEmpty();
    }

    /**
     * Returns the current number of songs in history.
     *
     * @return Number of songs.
     */
    public int size() {
        return this.items.size();
    }

    /**
     * Returns the maximum capacity of this history stack.
     *
     * @return Maximum capacity.
     */
    public int getMaxCapacity() {
        return this.maxCapacity;
    }

    /**
     * Returns an ordered list of songs from oldest (bottom) to newest (top).
     *
     * @return List of historical songs.
     */
    public List<Song> toList() {
        return new ArrayList<>(this.items);
    }

    /**
     * Clears all songs from history.
     */
    public void clear() {
        this.items.clear();
    }

    @Override
    public String toString() {
        return "PlayHistory(size=" + size() + "/" + maxCapacity + ", items=" + toList() + ")";
    }
}
