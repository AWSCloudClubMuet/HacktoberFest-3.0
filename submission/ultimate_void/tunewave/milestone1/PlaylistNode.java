package tunewave.milestone1;

import tunewave.model.Song;

/**
 * Node in the Doubly Linked List representing a playlist entry.
 *
 * <p>Each node holds a reference to a {@link Song} as well as the
 * {@code prev} and {@code next} nodes in the playlist sequence.
 */
public class PlaylistNode {
    private Song song;
    private PlaylistNode prev;
    private PlaylistNode next;

    /**
     * Constructs a new node holding the specified song.
     *
     * @param song Song to hold in this node.
     */
    public PlaylistNode(Song song) {
        this.song = song;
        this.prev = null;
        this.next = null;
    }

    public Song getSong() {
        return song;
    }

    public void setSong(Song song) {
        this.song = song;
    }

    public PlaylistNode getPrev() {
        return prev;
    }

    public void setPrev(PlaylistNode prev) {
        this.prev = prev;
    }

    public PlaylistNode getNext() {
        return next;
    }

    public void setNext(PlaylistNode next) {
        this.next = next;
    }

    @Override
    public String toString() {
        return "PlaylistNode(" + (song != null ? song.getTitle() : "null") + ")";
    }
}
