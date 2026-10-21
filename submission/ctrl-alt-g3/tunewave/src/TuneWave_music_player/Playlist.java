package TuneWave_music_player;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/** Explicit doubly linked list. Public operations are individually synchronized.
 * Network requests must run outside this object; compound player actions need
 * coordination through TuneWavePlayer, which owns queue/history.
 */
public final class Playlist {
    public record NodeView(String nodeId, String songId, String previous, String next) { }
    public record MapEntry(String songId, String nodeId) { }
    private static final class Node {
        final Song song;
        Node previous;
        Node next;
        Node(Song song) { this.song = song; }
    }

    public record Navigation(String status, Song song) {
        public Navigation {
            if (status == null || !List.of("empty", "ok", "start", "end").contains(status)) {
                throw new IllegalArgumentException("Unknown navigation status.");
            }
            if (status.equals("empty") != (song == null)) {
                throw new IllegalArgumentException("Only an empty result can have no song.");
            }
        }

        public Optional<Song> songOptional() { return Optional.ofNullable(song); }
    }

    private final Map<String, Node> nodesById = new HashMap<>();
    private Node head;
    private Node tail;
    private Node current;
    private boolean repeatEnabled;

    /** Append to the tail; duplicate IDs leave all state unchanged. */
    public synchronized boolean addSong(Song song) {
        Objects.requireNonNull(song, "song");
        if (nodesById.containsKey(song.songId())) return false;
        Node node = new Node(song);
        node.previous = tail;
        if (tail == null) {
            head = node;
            current = node;
        } else {
            tail.next = node;
        }
        tail = node;
        nodesById.put(song.songId(), node);
        return true;
    }

    public synchronized boolean removeSong(String songId) {
        Song.requireId(songId);
        Node node = nodesById.remove(songId);
        if (node == null) return false;
        if (node.previous == null) head = node.next;
        else node.previous.next = node.next;
        if (node.next == null) tail = node.previous;
        else node.next.previous = node.previous;
        if (current == node) current = node.next != null ? node.next : node.previous;
        node.previous = null;
        node.next = null;
        return true;
    }

    public synchronized Navigation next() {
        if (current == null) return new Navigation("empty", null);
        if (current.next != null) current = current.next;
        else if (repeatEnabled) current = head;
        else return new Navigation("end", current.song);
        return new Navigation("ok", current.song);
    }

    public synchronized Navigation previous() {
        if (current == null) return new Navigation("empty", null);
        if (current.previous != null) current = current.previous;
        else if (repeatEnabled) current = tail;
        else return new Navigation("start", current.song);
        return new Navigation("ok", current.song);
    }

    public synchronized boolean toggleRepeat() { return repeatEnabled = !repeatEnabled; }
    public synchronized boolean isRepeatEnabled() { return repeatEnabled; }
    public synchronized int size() { return nodesById.size(); }
    public synchronized Optional<Song> currentSong() {
        return current == null ? Optional.empty() : Optional.of(current.song);
    }

    /** Select through the existing song-ID index in expected O(1) time. */
    public synchronized boolean selectSong(String songId) {
        Song.requireId(songId);
        Node node = nodesById.get(songId);
        if (node == null) return false;
        current = node;
        return true;
    }

    /** Read-only snapshot for a future UI; the linked list stays authoritative. */
    public synchronized List<Song> songs() {
        List<Song> result = new ArrayList<>();
        for (Node node = head; node != null; node = node.next) result.add(node.song);
        return List.copyOf(result);
    }

    /** Read-only snapshots of actual node links and the ID index. */
    public synchronized List<NodeView> nodeViews() {
        List<NodeView> result = new ArrayList<>();
        for (Node node = head; node != null; node = node.next)
            result.add(new NodeView(nodeId(node), node.song.songId(), nodeId(node.previous), nodeId(node.next)));
        return List.copyOf(result);
    }
    public synchronized List<MapEntry> indexEntries() {
        return nodesById.entrySet().stream().sorted(Map.Entry.comparingByKey())
                .map(entry -> new MapEntry(entry.getKey(), nodeId(entry.getValue()))).toList();
    }
    private static String nodeId(Node node) { return node == null ? null : "node:" + node.song.songId(); }

    /** O(n) diagnostic used by tests, never on the normal mutation path. */
    synchronized void validateStructure() {
        if (nodesById.isEmpty()) {
            if (head != null || tail != null || current != null)
                throw new IllegalStateException("Empty playlist retains a node.");
            return;
        }
        if (head == null || tail == null || current == null
                || head.previous != null || tail.next != null)
            throw new IllegalStateException("Invalid endpoints or current position.");
        var seen = new HashSet<Node>();
        Node prior = null;
        for (Node node = head; node != null; node = node.next) {
            if (!seen.add(node) || node.previous != prior
                    || nodesById.get(node.song.songId()) != node)
                throw new IllegalStateException("Cycle, broken link or mismatched index.");
            prior = node;
        }
        if (prior != tail || seen.size() != nodesById.size() || !seen.contains(current))
            throw new IllegalStateException("Unreachable node or stale current position.");
    }
}
