import java.util.HashMap;
import java.util.Map;

public class PlaylistManager {

    // One song inside the doubly linked list
    public static class SongNode {
        public String songId;
        public String title;
        public String artist;
        public SongNode prev;
        public SongNode next;

        public SongNode(String songId, String title, String artist) {
            this.songId = songId;
            this.title = title;
            this.artist = artist;
        }

        @Override
        public String toString() {
            return title + " by " + artist + " (" + songId + ")";
        }
    }

    // Simple container for song details passed into addSong
    public static class Song {
        public String id;
        public String title;
        public String artist;

        public Song(String id, String title, String artist) {
            this.id = id;
            this.title = title;
            this.artist = artist;
        }
    }

    private SongNode head;
    private SongNode tail;
    private SongNode current;
    private final Map<String, SongNode> songMap; // fast lookup + no duplicates
    private boolean isRepeatOn;

    public PlaylistManager() {
        this.songMap = new HashMap<>();
        this.isRepeatOn = false;
    }

    /** Adds a song to the end. Returns false if it is a duplicate. */
    public boolean addSong(Song song) {
        if (song == null || song.id == null || songMap.containsKey(song.id)) {
            return false;
        }

        SongNode newNode = new SongNode(song.id, song.title, song.artist);
        songMap.put(song.id, newNode);

        if (head == null) {
            head = newNode;
            tail = newNode;
            current = newNode;
        } else {
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        }
        return true;
    }

    /** Removes a song from anywhere using the map (no scanning). */
    public boolean removeSong(String songId) {
        SongNode target = songMap.get(songId);
        if (target == null) {
            return false;
        }

        // If the playing song is removed, move the pointer first
        if (current == target) {
            if (target.next != null) {
                current = target.next;
            } else if (isRepeatOn && head != target) {
                current = head;
            } else {
                current = target.prev; // becomes null if it was the only song
            }
        }

        if (target.prev != null) {
            target.prev.next = target.next;
        } else {
            head = target.next;
        }

        if (target.next != null) {
            target.next.prev = target.prev;
        } else {
            tail = target.prev;
        }

        songMap.remove(songId);
        return true;
    }

    /** Next song, or "end" if at the last song with repeat off. */
    public Object next() {
        if (current == null) {
            return "end";
        }
        if (current.next != null) {
            current = current.next;
            return current;
        }
        if (isRepeatOn && head != null) {
            current = head;
            return current;
        }
        return "end";
    }

    /** Previous song, or "end" if at the first song with repeat off. */
    public Object previous() {
        if (current == null) {
            return "end";
        }
        if (current.prev != null) {
            current = current.prev;
            return current;
        }
        if (isRepeatOn && tail != null) {
            current = tail;
            return current;
        }
        return "end";
    }

    public boolean toggleRepeat() {
        this.isRepeatOn = !this.isRepeatOn;
        return this.isRepeatOn;
    }

    public SongNode getCurrentSong() {
        return current;
    }

    public boolean isRepeatEnabled() {
        return isRepeatOn;
    }

    public static void main(String[] args) {
        PlaylistManager manager = new PlaylistManager();
        System.out.println("--- Running TuneWave Milestone 1 Tests ---");

        manager.addSong(new Song("S1", "Blinding Lights", "The Weeknd"));
        manager.addSong(new Song("S2", "Stay", "Kid LAROI"));
        manager.addSong(new Song("S3", "Circles", "Post Malone"));

        boolean duplicateAdded = manager.addSong(new Song("S1", "Fake Duplicate", "Unknown"));
        System.out.println("Duplicate blocked successfully: " + (!duplicateAdded));
        System.out.println("Initially playing: " + manager.getCurrentSong());

        System.out.println("Next track: " + manager.next());
        System.out.println("Next track: " + manager.next());
        System.out.println("Next track (at end, repeat off): " + manager.next()); // end

        manager.toggleRepeat();
        System.out.println("Repeat on. Next track (wraps): " + manager.next()); // Blinding Lights

        System.out.println("Removing 'Stay' while current is 'Blinding Lights'...");
        manager.removeSong("S2");
        System.out.println("Next track (skips removed 'Stay'): " + manager.next()); // Circles
    }
}