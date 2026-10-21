package tunewave;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Manages playback state: "Up Next" queue, listening history, and the
 * currently playing song — all independent of the {@link Playlist} cursor.
 *
 * <h2>Data structures used</h2>
 * <ul>
 *   <li><b>Up Next queue</b> – {@code ArrayDeque} used as a FIFO queue.
 *       Songs are offered at the tail and polled from the head.</li>
 *   <li><b>History stack</b> – {@code ArrayDeque} used as a LIFO stack.
 *       Songs are pushed onto the front (deque head) and popped from the
 *       front.</li>
 * </ul>
 *
 * <h2>Key invariants</h2>
 * <ul>
 *   <li>The playlist cursor in {@link Playlist} is <em>never</em> modified
 *       by this class; playback state is entirely separate.</li>
 *   <li>History holds at most {@value #MAX_HISTORY} entries; the oldest is
 *       discarded when the limit would be exceeded.</li>
 *   <li>The song catalog (passed in at construction) is the single source of
 *       truth for song metadata; songs removed from the playlist but still in
 *       the catalog remain reachable via queue or history.</li>
 * </ul>
 *
 * <h2>Behavior overview</h2>
 * <pre>
 *  addToUpNext(id)  – enqueue a song ID; duplicates are permitted.
 *  playNext()       – if the queue is non-empty, dequeue and play it;
 *                     otherwise advance the playlist cursor and play that song.
 *  back()           – pop history and play the previous song (cursor unchanged).
 * </pre>
 */
public class PlaybackManager {

    /** Maximum number of history entries retained. */
    public static final int MAX_HISTORY = 10;

    // ------------------------------------------------------------------ fields

    /**
     * FIFO "Up Next" queue.  Stores song IDs (not Song objects) so that songs
     * can be queued by ID before their metadata is needed.
     */
    private final Deque<String> upNextQueue = new ArrayDeque<>();

    /**
     * LIFO history stack.  Front of the deque = top of the stack (most recent).
     * We use {@code addFirst}/{@code peekFirst}/{@code pollFirst} to treat it
     * as a stack, and {@code removeLast} to drop the oldest entry.
     */
    private final Deque<String> historyStack = new ArrayDeque<>();

    /** The song ID that is currently playing, or {@code null} if nothing is playing. */
    private String currentlyPlayingId;

    /**
     * Central song catalog shared with {@link TuneWaveService}.  Provides
     * metadata for songs that may have been removed from the playlist.
     */
    private final Map<String, Song> catalog;

    /** The playlist – used only for cursor navigation during {@link #playNext()}. */
    private final Playlist playlist;

    // ----------------------------------------------------------- constructor

    /**
     * Creates a new PlaybackManager.
     *
     * @param catalog  song ID → Song mapping (shared reference, not copied)
     * @param playlist the active playlist (cursor-based navigation reference)
     */
    public PlaybackManager(Map<String, Song> catalog, Playlist playlist) {
        if (catalog == null)  throw new IllegalArgumentException("catalog must not be null");
        if (playlist == null) throw new IllegalArgumentException("playlist must not be null");
        this.catalog  = catalog;
        this.playlist = playlist;
    }

    // ---------------------------------------------------------- queue methods

    /**
     * Adds a song to the end of the "Up Next" queue.
     *
     * <p>Duplicate IDs are permitted (a user may want to hear the same song
     * twice in a row).
     *
     * <p>If the song ID is unknown (not in the catalog) this call is silently
     * ignored to avoid queuing unresolvable references.
     *
     * @param songId ID of the song to queue
     */
    public void addToUpNext(String songId) {
        if (songId == null || !catalog.containsKey(songId)) return;
        upNextQueue.offerLast(songId);
    }

    /**
     * Plays the next song according to the following priority:
     *
     * <ol>
     *   <li>If the "Up Next" queue is non-empty, dequeue the front entry and
     *       play it.  The playlist cursor is <em>not</em> moved.</li>
     *   <li>Otherwise, advance the playlist cursor with
     *       {@link Playlist#next()} and play whatever it returns.</li>
     * </ol>
     *
     * <p>In both cases the song that was currently playing (if any) is pushed
     * onto the history stack <em>before</em> the transition occurs.
     *
     * @return the {@link Song} that started playing, or {@code null} if the
     *         playlist is empty and the queue is empty, or the string
     *         {@code "end"} if the playlist reached its end (repeat off).
     */
    public Object playNext() {
        // Push current song to history before transitioning.
        pushToHistory(currentlyPlayingId);

        if (!upNextQueue.isEmpty()) {
            // Queued playback — playlist cursor does NOT move.
            String nextId = upNextQueue.pollFirst();
            Song song = catalog.get(nextId);
            currentlyPlayingId = (song != null) ? song.getSongId() : null;
            return song; // may be null if catalog entry was removed concurrently
        }

        // Normal playlist transition.
        Object result = playlist.next();
        if (result instanceof Song song) {
            currentlyPlayingId = song.getSongId();
            return song;
        }
        // result is "end" or null (empty)
        currentlyPlayingId = null;
        return result;
    }

    // --------------------------------------------------------- history methods

    /**
     * Replays the most-recently played song from history.
     *
     * <p>The top of the history stack is popped and set as
     * {@code currentlyPlaying}.  The playlist cursor is <em>not</em> moved.
     * The popped song is <em>not</em> immediately pushed back; it will be
     * pushed again only on the next forward transition.
     *
     * @return the {@link Song} being replayed, or {@code null} if history
     *         is empty or the referenced song ID is no longer in the catalog.
     */
    public Song back() {
        if (historyStack.isEmpty()) return null;

        String prevId = historyStack.pollFirst(); // pop top
        Song song = catalog.get(prevId);
        currentlyPlayingId = (song != null) ? song.getSongId() : null;
        return song;
    }

    // -------------------------------------------------------- helper methods

    /**
     * Pushes a song ID onto the history stack, enforcing the
     * {@value #MAX_HISTORY}-entry limit.  If the limit is exceeded, the oldest
     * entry (at the bottom of the stack / back of the deque) is discarded.
     *
     * <p>A {@code null} ID (nothing was playing) is silently ignored.
     */
    private void pushToHistory(String songId) {
        if (songId == null) return;

        historyStack.addFirst(songId); // push onto top

        if (historyStack.size() > MAX_HISTORY) {
            historyStack.removeLast(); // drop oldest entry
        }
    }

    // ---------------------------------------------------------- query methods

    /** @return the currently playing {@link Song}, or {@code null}. */
    public Song getCurrentlyPlaying() {
        return currentlyPlayingId == null ? null : catalog.get(currentlyPlayingId);
    }

    /** @return the currently playing song ID, or {@code null}. */
    public String getCurrentlyPlayingId() {
        return currentlyPlayingId;
    }

    /** @return number of songs in the "Up Next" queue. */
    public int upNextSize() {
        return upNextQueue.size();
    }

    /** @return number of entries in history. */
    public int historySize() {
        return historyStack.size();
    }

    /** @return {@code true} if the "Up Next" queue is empty. */
    public boolean isQueueEmpty() {
        return upNextQueue.isEmpty();
    }

    /** @return {@code true} if history is empty. */
    public boolean isHistoryEmpty() {
        return historyStack.isEmpty();
    }

    /**
     * Returns a snapshot of the "Up Next" queue in FIFO order (first-to-play first).
     *
     * @return list of song IDs
     */
    public java.util.List<String> getUpNextIds() {
        return java.util.List.copyOf(upNextQueue);
    }

    /**
     * Returns a snapshot of the history stack, most-recent first.
     *
     * @return list of song IDs
     */
    public java.util.List<String> getHistoryIds() {
        return java.util.List.copyOf(historyStack);
    }

    /**
     * Sets the currently playing song directly (used by service during
     * initial playback start without a transition).
     *
     * @param songId the ID to set as currently playing
     */
    public void setCurrentlyPlayingId(String songId) {
        this.currentlyPlayingId = songId;
    }
}

