import java.util.HashMap;
import java.util.Map;

public class PlaybackManager {

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

    // ---- Playlist (doubly linked list) ----
    private SongNode head;
    private SongNode tail;
    private SongNode playlistCurrent;      // position in the main playlist
    private boolean playlistCurrentPlayed; // has that song already been played?
    private SongNode activeTrack;          // what is playing right now
    private final Map<String, SongNode> songMap;
    private boolean isRepeatOn;

    // ---- Up Next queue (array that grows) ----
    private String[] upNextQueue;
    private int queueSize;

    // ---- History: ring buffer holding the last 10 songs ----
    private static final int MAX_HISTORY = 10;
    private final SongNode[] historyStack;
    private int historyTail; // where the next item goes
    private int historySize;

    public PlaybackManager() {
        this.songMap = new HashMap<>();
        this.upNextQueue = new String[10];
        this.historyStack = new SongNode[MAX_HISTORY];
    }

    // ================= Milestone 1 methods =================

    public boolean addSong(Song song) {
        if (song == null || song.id == null || songMap.containsKey(song.id)) {
            return false;
        }
        SongNode newNode = new SongNode(song.id, song.title, song.artist);
        songMap.put(song.id, newNode);

        if (head == null) {
            head = newNode;
            tail = newNode;
            playlistCurrent = newNode;
            if (activeTrack == null) {
                activeTrack = newNode;
                playlistCurrentPlayed = true; // first song starts playing
            }
        } else {
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        }
        return true;
    }

    public boolean removeSong(String songId) {
        SongNode target = songMap.get(songId);
        if (target == null) {
            return false;
        }

        if (playlistCurrent == target) {
            if (target.next != null) {
                playlistCurrent = target.next;
                playlistCurrentPlayed = false; // new pointer song not played yet
            } else if (isRepeatOn && head != target) {
                playlistCurrent = head;
                playlistCurrentPlayed = false;
            } else {
                playlistCurrent = target.prev;
                playlistCurrentPlayed = true; // previous song was already played
            }
        }

        if (activeTrack == target) {
            activeTrack = null;
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

        // Remove the song from history too
        for (int i = 0; i < MAX_HISTORY; i++) {
            if (historyStack[i] == target) {
                historyStack[i] = null;
            }
        }
        return true;
    }

    public void toggleRepeat() {
        this.isRepeatOn = !this.isRepeatOn;
    }

    // ================= Milestone 2 methods =================

    /** Adds a song to the Up Next queue. Returns false if the song does not exist. */
    public boolean addToUpNext(String songId) {
        if (!songMap.containsKey(songId)) {
            return false;
        }
        if (queueSize == upNextQueue.length) { // grow the array
            String[] bigger = new String[upNextQueue.length * 2];
            System.arraycopy(upNextQueue, 0, bigger, 0, queueSize);
            upNextQueue = bigger;
        }
        upNextQueue[queueSize++] = songId;
        return true;
    }

    /**
     * Skips forward.
     * Up Next songs play first and do NOT move the playlist pointer.
     * After the queue is empty, the playlist continues with the song after the pointer.
     */
    public Object playNext() {
        if (activeTrack != null) {
            pushToHistory(activeTrack);
        }

        // 1) Up Next queue first (skip songs that were removed)
        while (queueSize > 0) {
            String id = upNextQueue[0];
            for (int i = 1; i < queueSize; i++) {
                upNextQueue[i - 1] = upNextQueue[i];
            }
            queueSize--;
            upNextQueue[queueSize] = null;

            SongNode queued = songMap.get(id);
            if (queued != null) {
                activeTrack = queued;
                return activeTrack;
            }
        }

        // 2) Continue the main playlist
        if (playlistCurrent == null) {
            activeTrack = null;
            return "end";
        }

        if (!playlistCurrentPlayed) {
            // Pointer song was never played (for example after a removal), play it now
            activeTrack = playlistCurrent;
            playlistCurrentPlayed = true;
        } else if (playlistCurrent.next != null) {
            playlistCurrent = playlistCurrent.next;
            activeTrack = playlistCurrent;
        } else if (isRepeatOn && head != null) {
            playlistCurrent = head;
            activeTrack = playlistCurrent;
        } else {
            activeTrack = null;
            return "end";
        }
        return activeTrack;
    }

    /** Goes back to the previously played song. Does NOT move the playlist pointer. */
    public Object back() {
        SongNode previous = popFromHistory();
        if (previous == null) {
            return "end";
        }
        activeTrack = previous;
        return activeTrack;
    }

    // ================= History helpers =================

    private void pushToHistory(SongNode node) {
        historyStack[historyTail] = node; // overwrites the oldest when full
        historyTail = (historyTail + 1) % MAX_HISTORY;
        if (historySize < MAX_HISTORY) {
            historySize++;
        }
    }

    private SongNode popFromHistory() {
        // Skip empty slots left by removed songs
        while (historySize > 0) {
            historyTail = (historyTail - 1 + MAX_HISTORY) % MAX_HISTORY;
            SongNode node = historyStack[historyTail];
            historyStack[historyTail] = null;
            historySize--;
            if (node != null) {
                return node;
            }
        }
        return null;
    }

    public SongNode getActiveTrack() {
        return activeTrack;
    }

    public SongNode getPlaylistPointer() {
        return playlistCurrent;
    }

    // ================= Test =================
    public static void main(String[] args) {
        PlaybackManager manager = new PlaybackManager();
        System.out.println("--- Starting TuneWave Milestone 2 Verification ---");

        manager.addSong(new Song("1", "Song A", "Artist X"));
        manager.addSong(new Song("2", "Song B", "Artist Y"));
        manager.addSong(new Song("3", "Song C", "Artist Z"));

        System.out.println("Currently playing: " + manager.getActiveTrack()); // Song A

        manager.addToUpNext("3");

        System.out.println("\n--- Skip forward ---");
        System.out.println("Played: " + manager.playNext()); // Song C (from Up Next)
        System.out.println("Playlist pointer (must stay at Song A): " + manager.getPlaylistPointer());

        System.out.println("\n--- Skip forward again ---");
        System.out.println("Played: " + manager.playNext()); // Song B (playlist continues)

        System.out.println("\n--- Back ---");
        System.out.println("Back: " + manager.back()); // Song C

        System.out.println("\n--- Skip forward twice ---");
        System.out.println("Played: " + manager.playNext()); // Song C (playlist pointer was at Song B)
        System.out.println("Played: " + manager.playNext()); // end (last song, repeat off)
    }
}