package tunewave;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Doubly-linked playlist backed by a {@code HashMap} for O(1) lookup.
 *
 * <h2>Data structures used</h2>
 * <ul>
 *   <li><b>Custom doubly-linked list</b> – head / tail pointers + bidirectional
 *       {@code prev} / {@code next} links in each {@link PlaylistNode}.</li>
 *   <li><b>{@code HashMap<String, PlaylistNode>}</b> – maps song ID → node for
 *       O(1) add/remove/lookup and uniqueness enforcement.</li>
 * </ul>
 *
 * <h2>Cursor semantics</h2>
 * <ul>
 *   <li>{@code current} always points at the node the user is "at".</li>
 *   <li>When the playlist is empty, {@code current} is {@code null}.</li>
 *   <li>When the first song is added, {@code current} is set to that node.</li>
 * </ul>
 *
 * <h2>Repeat mode</h2>
 * <ul>
 *   <li>ON  – {@link #next()} at the tail wraps back to the head.</li>
 *   <li>OFF – {@link #next()} at the tail returns {@code "end"} and the cursor
 *       stays at the tail.</li>
 * </ul>
 *
 * <h2>{@code previous()} at the head</h2>
 * Returns {@code "start"} and leaves the cursor at the head (no wrap).
 */
public class Playlist {

    // ------------------------------------------------------------------ fields

    /** Head (first) node of the linked list, or {@code null} when empty. */
    private PlaylistNode head;

    /** Tail (last) node of the linked list, or {@code null} when empty. */
    private PlaylistNode tail;

    /**
     * Current position cursor.  Starts at head after the first add.
     * Stays at the nearest valid node after a deletion.
     */
    private PlaylistNode current;

    /** Enables O(1) lookup and enforces song-ID uniqueness. */
    private final Map<String, PlaylistNode> nodeMap = new HashMap<>();

    /** Whether repeat mode is active. Default: off. */
    private boolean repeatEnabled = false;

    // ------------------------------------------------------- mutation methods

    /**
     * Appends a song to the tail of the playlist.
     *
     * <p>If a song with the same ID already exists, the call is silently
     * ignored to prevent duplicates.
     *
     * @param song the song to add (must not be {@code null})
     */
    public void addSong(Song song) {
        if (song == null) throw new IllegalArgumentException("Song must not be null");

        // Enforce uniqueness via the map.
        if (nodeMap.containsKey(song.getSongId())) {
            return; // duplicate – ignore silently
        }

        PlaylistNode node = new PlaylistNode(song);
        nodeMap.put(song.getSongId(), node);

        if (head == null) {
            // First node – head, tail, and current all point here.
            head = tail = current = node;
        } else {
            // Append at tail.
            node.prev = tail;
            tail.next  = node;
            tail       = node;
        }
    }

    /**
     * Removes the song with the given ID from the playlist.
     *
     * <p>Pointer rules after removal:
     * <ul>
     *   <li>If the removed node is {@code current}, advance {@code current} to
     *       {@code next}; if there is no next, retreat to {@code prev}; if
     *       there is no prev either, the playlist is now empty.</li>
     *   <li>If the removed node is the head, the successor becomes the new head.</li>
     *   <li>If the removed node is the tail, the predecessor becomes the new tail.</li>
     * </ul>
     *
     * <p>Calling this method with an unknown or {@code null} ID is a no-op.
     *
     * @param songId the ID of the song to remove
     */
    public void removeSong(String songId) {
        if (songId == null) return;

        PlaylistNode node = nodeMap.remove(songId);
        if (node == null) return; // unknown ID – ignore

        // Fix up current pointer before unlinking.
        if (node == current) {
            if (node.next != null) {
                current = node.next;
            } else if (node.prev != null) {
                current = node.prev;
            } else {
                current = null; // playlist now empty
            }
        }

        // Unlink: stitch prev ↔ next.
        if (node.prev != null) {
            node.prev.next = node.next;
        } else {
            head = node.next; // removed node was the head
        }

        if (node.next != null) {
            node.next.prev = node.prev;
        } else {
            tail = node.prev; // removed node was the tail
        }

        // Null out the removed node's links (help GC, prevent dangling refs).
        node.prev = null;
        node.next = null;
    }

    // -------------------------------------------------------- navigation methods

    /**
     * Advances the cursor to the next song.
     *
     * @return the next {@link Song}, or the string {@code "end"} if the cursor
     *         is already at the tail and repeat mode is off, or {@code null} if
     *         the playlist is empty.
     */
    public Object next() {
        if (current == null) return null; // empty playlist

        if (current.next != null) {
            current = current.next;
            return current.song;
        }

        // At the tail.
        if (repeatEnabled) {
            current = head;
            return current.song;
        }
        return "end"; // cursor stays at tail
    }

    /**
     * Moves the cursor to the previous song.
     *
     * @return the previous {@link Song}, or the string {@code "start"} if the
     *         cursor is at the head (no wrap), or {@code null} if the playlist
     *         is empty.
     */
    public Object previous() {
        if (current == null) return null; // empty playlist

        if (current.prev != null) {
            current = current.prev;
            return current.song;
        }

        // Already at head – do not wrap.
        return "start";
    }

    /**
     * Toggles repeat mode on/off.
     *
     * @return the new repeat state ({@code true} = on)
     */
    public boolean toggleRepeat() {
        repeatEnabled = !repeatEnabled;
        return repeatEnabled;
    }

    // --------------------------------------------------------- query methods

    /**
     * @return the song the cursor currently points at, or {@code null} if empty.
     */
    public Song getCurrentSong() {
        return current == null ? null : current.song;
    }

    /**
     * @return {@code true} if repeat mode is active
     */
    public boolean isRepeatEnabled() {
        return repeatEnabled;
    }

    /**
     * @return number of songs currently in the playlist
     */
    public int size() {
        return nodeMap.size();
    }

    /**
     * @return {@code true} if the playlist contains no songs
     */
    public boolean isEmpty() {
        return nodeMap.isEmpty();
    }

    /**
     * Returns all songs in playlist order (head → tail).
     *
     * @return an unmodifiable snapshot list
     */
    public List<Song> getSongs() {
        List<Song> result = new ArrayList<>(nodeMap.size());
        PlaylistNode n = head;
        while (n != null) {
            result.add(n.song);
            n = n.next;
        }
        return List.copyOf(result);
    }

    /**
     * Returns {@code true} if the playlist contains a song with this ID.
     *
     * @param songId the ID to look up
     */
    public boolean contains(String songId) {
        return nodeMap.containsKey(songId);
    }

    /**
     * Looks up a node by song ID.  Used internally and by tests.
     *
     * @param songId the ID to look up
     * @return the node, or {@code null} if not found
     */
    PlaylistNode getNode(String songId) {
        return nodeMap.get(songId);
    }

    /**
     * Returns the current node (for test introspection).
     */
    PlaylistNode getCurrentNode() {
        return current;
    }

    /**
     * Exposes {@code head} node for test introspection.
     */
    PlaylistNode getHead() { return head; }

    /**
     * Exposes {@code tail} node for test introspection.
     */
    PlaylistNode getTail() { return tail; }
}

