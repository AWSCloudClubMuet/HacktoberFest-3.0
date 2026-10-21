package tunewave;

/**
 * A single node in TuneWave's custom doubly-linked playlist.
 *
 * <p>Each node holds a {@link Song} reference plus two links ({@code prev} and
 * {@code next}) that together form the doubly-linked chain maintained by
 * {@link Playlist}.
 *
 * <p>Access modifiers are package-private so that only classes inside the
 * {@code tunewave} package can manipulate the raw links, keeping the
 * internal representation hidden from outside callers.
 */
public class PlaylistNode {

    /** The song stored in this node. Never {@code null}. */
    Song song;

    /** Link to the previous node, or {@code null} at the head. */
    PlaylistNode prev;

    /** Link to the next node, or {@code null} at the tail. */
    PlaylistNode next;

    /**
     * Constructs a stand-alone node for the given song.
     *
     * @param song the song to store (must not be {@code null})
     */
    PlaylistNode(Song song) {
        if (song == null) throw new IllegalArgumentException("Song must not be null");
        this.song = song;
        this.prev = null;
        this.next = null;
    }

    @Override
    public String toString() {
        return "PlaylistNode{" + song + "}";
    }
}

