package tunewave.milestone1;

import tunewave.model.PlaybackResult;
import tunewave.model.Song;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Milestone 1 — Playlist (Doubly Linked List + Hash Map)
 *
 * <p>Why use a Doubly Linked List?
 * Moving forward and backward through songs is an O(1) pointer adjustment,
 * perfect for player controls (next, previous).
 *
 * <p>Why use a Hash Map?
 * Enforces the uniqueness rule in O(1) and allows removing any song by song ID
 * in O(1) time without linearly traversing the list.
 *
 * <p>Playback Rules:
 * <ul>
 *   <li>A song can appear only once in a playlist (enforced via {@code songMap}).</li>
 *   <li>With repeat ON, {@code next()} on the last song wraps back to the first song.</li>
 *   <li>With repeat OFF, {@code next()} stays on the last song and returns {@code "end"}.</li>
 * </ul>
 */
public class Playlist {

    private PlaylistNode head;
    private PlaylistNode tail;
    private PlaylistNode current;
    private boolean repeat;
    private final Map<String, PlaylistNode> songMap;

    /**
     * Initializes an empty playlist with repeat turned OFF.
     */
    public Playlist() {
        this.head = null;
        this.tail = null;
        this.current = null;
        this.repeat = false;
        this.songMap = new HashMap<>();
    }

    /**
     * Adds a song to the end of the playlist.
     *
     * <p>Rule: A song can appear only once in a playlist.
     * The hash map is checked first in O(1) time. If the song is already present,
     * it is not added and {@code false} is returned.
     *
     * @param song The {@link Song} to append.
     * @return {@code true} if the song was added, {@code false} if it was already in the playlist or null.
     */
    public boolean addSong(Song song) {
        if (song == null) {
            return false;
        }

        String id = song.getSongId();
        if (this.songMap.containsKey(id)) {
            return false;
        }

        PlaylistNode newNode = new PlaylistNode(song);

        if (this.head == null) {
            this.head = newNode;
            this.tail = newNode;
            this.current = newNode;
        } else {
            this.tail.setNext(newNode);
            newNode.setPrev(this.tail);
            this.tail = newNode;
        }

        this.songMap.put(id, newNode);
        return true;
    }

    /**
     * Removes a song from the playlist using its songId.
     *
     * <p>Rule: Uses the internal hash map for O(1) node lookup and unlinks it
     * from the Doubly Linked List in O(1) without scanning.
     *
     * <p>If the removed song was the currently playing song:
     * <ul>
     *   <li>Moves {@code current} to {@code node.next} if available.</li>
     *   <li>Otherwise moves {@code current} to {@code node.prev}.</li>
     *   <li>If the playlist becomes empty, {@code current} becomes {@code null}.</li>
     * </ul>
     *
     * @param songId Unique identifier of the song to remove.
     * @return {@code true} if found and removed, {@code false} otherwise.
     */
    public boolean removeSong(String songId) {
        if (songId == null) {
            return false;
        }

        PlaylistNode nodeToRemove = this.songMap.get(songId);
        if (nodeToRemove == null) {
            return false;
        }

        // Adjust current pointer if current node is being removed
        if (this.current == nodeToRemove) {
            if (nodeToRemove.getNext() != null) {
                this.current = nodeToRemove.getNext();
            } else if (nodeToRemove.getPrev() != null) {
                this.current = nodeToRemove.getPrev();
            } else {
                this.current = null;
            }
        }

        // Unlink prev pointer
        if (nodeToRemove.getPrev() != null) {
            nodeToRemove.getPrev().setNext(nodeToRemove.getNext());
        } else {
            this.head = nodeToRemove.getNext();
        }

        // Unlink next pointer
        if (nodeToRemove.getNext() != null) {
            nodeToRemove.getNext().setPrev(nodeToRemove.getPrev());
        } else {
            this.tail = nodeToRemove.getPrev();
        }

        this.songMap.remove(songId);
        return true;
    }

    /**
     * Moves the playlist pointer forward by one song.
     *
     * <p>Rules:
     * <ul>
     *   <li>If not at the last song, advances to {@code current.next} and returns that song.</li>
     *   <li>If at the last song and repeat is ON: wraps around to {@code head} and returns that song.</li>
     *   <li>If at the last song and repeat is OFF: stays on the last song and returns {@code "end"}.</li>
     * </ul>
     *
     * @return {@link PlaybackResult} containing the next Song or "end".
     */
    public PlaybackResult next() {
        if (this.current == null) {
            return PlaybackResult.empty();
        }

        if (this.current.getNext() != null) {
            this.current = this.current.getNext();
            return PlaybackResult.of(this.current.getSong());
        }

        if (this.repeat) {
            this.current = this.head;
            return PlaybackResult.of(this.current.getSong());
        }

        // Repeat is OFF and already on the last song: stay on last song and return "end"
        return PlaybackResult.END;
    }

    /**
     * Moves the playlist pointer backward by one song.
     *
     * <p>If already on the first song, stays on the first song.
     *
     * @return The {@link Song} now pointed to by {@code current}, or {@code null} if playlist is empty.
     */
    public Song previous() {
        if (this.current == null) {
            return null;
        }

        if (this.current.getPrev() != null) {
            this.current = this.current.getPrev();
        }

        return this.current.getSong();
    }

    /**
     * Toggles repeat mode ON or OFF.
     *
     * @return The new repeat status after toggling.
     */
    public boolean toggleRepeat() {
        this.repeat = !this.repeat;
        return this.repeat;
    }

    public boolean isRepeat() {
        return repeat;
    }

    public void setRepeat(boolean repeat) {
        this.repeat = repeat;
    }

    /**
     * Returns the song currently pointed to by the playlist.
     *
     * @return Current {@link Song}, or {@code null} if empty.
     */
    public Song getCurrent() {
        return (this.current != null) ? this.current.getSong() : null;
    }

    /**
     * Returns the currently pointed node.
     *
     * @return {@link PlaylistNode} or {@code null}.
     */
    public PlaylistNode getCurrentNode() {
        return this.current;
    }

    public PlaylistNode getHead() {
        return head;
    }

    public PlaylistNode getTail() {
        return tail;
    }

    /**
     * Returns the number of songs in the playlist.
     *
     * @return Size of playlist.
     */
    public int size() {
        return this.songMap.size();
    }

    /**
     * Checks if the playlist contains any songs.
     *
     * @return {@code true} if empty, {@code false} otherwise.
     */
    public boolean isEmpty() {
        return this.songMap.isEmpty();
    }

    /**
     * Checks whether a song with the given ID exists in the playlist (O(1)).
     *
     * @param songId Song ID to check.
     * @return {@code true} if present, {@code false} otherwise.
     */
    public boolean contains(String songId) {
        return this.songMap.containsKey(songId);
    }

    /**
     * Returns an unmodifiable view of the internal song hash map.
     *
     * @return Song ID to PlaylistNode map.
     */
    public Map<String, PlaylistNode> getSongMap() {
        return Collections.unmodifiableMap(this.songMap);
    }

    /**
     * Returns all songs currently in the playlist in sequence from head to tail.
     *
     * @return Ordered list of songs.
     */
    public List<Song> toList() {
        List<Song> list = new ArrayList<>(this.songMap.size());
        PlaylistNode runner = this.head;
        while (runner != null) {
            list.add(runner.getSong());
            runner = runner.getNext();
        }
        return list;
    }

    @Override
    public String toString() {
        return "Playlist(size=" + size() + ", repeat=" + repeat + ", current=" + getCurrent() + ")";
    }
}
