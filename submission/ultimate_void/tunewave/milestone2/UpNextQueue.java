package tunewave.milestone2;

import tunewave.model.Song;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/**
 * Milestone 2 — Up Next Queue (Queue: FIFO)
 *
 * <p>Holds songs that users queue up to play ahead of regular playlist order.
 * Follows First-In, First-Out (FIFO) ordering.
 */
public class UpNextQueue {

    private final Deque<Song> items;

    /**
     * Initializes an empty Up Next queue.
     */
    public UpNextQueue() {
        this.items = new ArrayDeque<>();
    }

    /**
     * Adds a song to the end of the Up Next queue.
     *
     * @param song The song to enqueue.
     */
    public void enqueue(Song song) {
        if (song != null) {
            this.items.addLast(song);
        }
    }

    /**
     * Dequeues and returns the next song to be played.
     *
     * @return The front {@link Song}, or {@code null} if empty.
     */
    public Song dequeue() {
        return this.items.pollFirst();
    }

    /**
     * Peeks at the next song without removing it.
     *
     * @return The front {@link Song}, or {@code null} if empty.
     */
    public Song peek() {
        return this.items.peekFirst();
    }

    /**
     * Checks if the queue is empty.
     *
     * @return {@code true} if empty, {@code false} otherwise.
     */
    public boolean isEmpty() {
        return this.items.isEmpty();
    }

    /**
     * Returns the number of songs currently in the queue.
     *
     * @return Queue size.
     */
    public int size() {
        return this.items.size();
    }

    /**
     * Returns a snapshot of songs in the queue from front to back.
     *
     * @return List of queued songs.
     */
    public List<Song> toList() {
        return new ArrayList<>(this.items);
    }

    /**
     * Clears all songs from the queue.
     */
    public void clear() {
        this.items.clear();
    }

    @Override
    public String toString() {
        return "UpNextQueue(" + toList() + ")";
    }
}
