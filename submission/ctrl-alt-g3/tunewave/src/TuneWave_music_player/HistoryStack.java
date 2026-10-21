package TuneWave_music_player;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/** LIFO stack with a ten-entry limit. A ring buffer also permits O(1) oldest eviction. */
final class HistoryStack {
    static final int CAPACITY = 10;
    private final Song[] entries = new Song[CAPACITY];
    private int oldest;
    private int size;

    void push(Song song) {
        Objects.requireNonNull(song, "song");
        if (size == CAPACITY) {
            entries[oldest] = song;
            oldest = (oldest + 1) % CAPACITY;
        } else {
            entries[(oldest + size) % CAPACITY] = song;
            size++;
        }
    }

    Song pop() {
        if (size == 0) return null;
        int top = (oldest + size - 1) % CAPACITY;
        Song song = entries[top];
        entries[top] = null;
        if (--size == 0) oldest = 0;
        return song;
    }

    /** Top first, matching the order repeated back() calls will replay. */
    List<Song> songs() {
        List<Song> result = new ArrayList<>(size);
        for (int i = size - 1; i >= 0; i--) result.add(entries[(oldest + i) % CAPACITY]);
        return List.copyOf(result);
    }
}
