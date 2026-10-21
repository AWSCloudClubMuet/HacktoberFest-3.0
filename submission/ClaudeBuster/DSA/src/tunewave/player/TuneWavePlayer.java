package tunewave.player;

import tunewave.datastructures.*;
import tunewave.model.Song;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * TuneWavePlayer - Central Engine for TuneWave Music Streaming.
 *
 * Implements all three milestones:
 * Milestone 1: Playlist (Doubly Linked List + Hash Map)
 * Milestone 2: Up Next & History (FIFO Queue + Bounded Stack of 10)
 * Milestone 3: Song Search & Related Artists (BST + Undirected Graph)
 */
public class TuneWavePlayer {

    // --- Milestone 1: Playlist ---
    private final DoublyLinkedList<Song> playlist;
    private final CustomHashMap<String, DoublyLinkedList.Node<Song>> playlistIndex;
    private DoublyLinkedList.Node<Song> currentPlaylistNode;
    private boolean repeat;

    // --- Milestone 2: Up Next & History ---
    private final CustomQueue<Song> upNextQueue;
    private final HistoryStack<Song> historyStack;
    private Song currentlyPlaying;

    // --- Milestone 3: Search & Recommendations ---
    private final BinarySearchTree searchTree;
    private final ArtistGraph artistGraph;

    // Global song registry for quick ID resolution
    private final Map<String, Song> catalog;

    public TuneWavePlayer() {
        this.playlist = new DoublyLinkedList<>();
        this.playlistIndex = new CustomHashMap<>();
        this.currentPlaylistNode = null;
        this.repeat = false;

        this.upNextQueue = new CustomQueue<>();
        this.historyStack = new HistoryStack<>(10);
        this.currentlyPlaying = null;

        this.searchTree = new BinarySearchTree();
        this.artistGraph = new ArtistGraph();
        this.catalog = new HashMap<>();
    }

    // =========================================================================
    // MILESTONE 1 — PLAYLIST (Doubly Linked List + Hash Map)
    // =========================================================================

    /**
     * Adds a song to the playlist.
     * Rule: A song can appear only once in a playlist; a hash map checks this in O(1).
     *
     * @param song Song to add
     * @return true if added, false if already in playlist
     */
    public boolean addSong(Song song) {
        if (song == null) {
            return false;
        }

        // Check if already in playlist via hash map in O(1).
        // This must happen FIRST so a rejected duplicate never leaks into the
        // catalog or the search tree.
        if (playlistIndex.containsKey(song.getSongId())) {
            return false; // Already in playlist
        }

        // Register in global catalog and search BST
        catalog.put(song.getSongId(), song);
        searchTree.insert(song.getTitle(), song.getSongId(), song);

        // Append to doubly linked list
        DoublyLinkedList.Node<Song> newNode = playlist.append(song);
        playlistIndex.put(song.getSongId(), newNode);

        // If this is the first song in playlist, point current node and playing song to it
        if (currentPlaylistNode == null) {
            currentPlaylistNode = newNode;
            if (currentlyPlaying == null) {
                currentlyPlaying = song;
            }
        }

        return true;
    }

    /**
     * Overload for Milestone 3 compatibility: addSong(title, songId).
     */
    public boolean addSong(String title, String songId) {
        return addSong(new Song(songId, title));
    }

    /**
     * Convenience overload: addSong(title, songId, artist).
     */
    public boolean addSong(String title, String songId, String artist) {
        return addSong(new Song(songId, title, artist));
    }

    /**
     * Removes a song from the playlist using the hash map for O(1) lookup.
     * Adjusts current playlist position if the currently pointed song is removed.
     *
     * @param songId ID of the song to remove
     * @return true if removed, false if not in playlist
     */
    public boolean removeSong(String songId) {
        if (songId == null) {
            return false;
        }

        DoublyLinkedList.Node<Song> targetNode = playlistIndex.get(songId);
        if (targetNode == null) {
            return false; // Not in playlist
        }

        // If removing the current playlist node, adjust current pointer
        if (currentPlaylistNode == targetNode) {
            if (targetNode.next != null) {
                currentPlaylistNode = targetNode.next;
            } else if (targetNode.prev != null) {
                currentPlaylistNode = targetNode.prev;
            } else {
                currentPlaylistNode = null;
            }

            // If the song currently playing was this song, update currentlyPlaying
            if (currentlyPlaying != null && currentlyPlaying.getSongId().equals(songId)) {
                currentlyPlaying = (currentPlaylistNode != null) ? currentPlaylistNode.data : null;
            }
        }

        // Remove node from doubly linked list in O(1)
        playlist.removeNode(targetNode);
        // Remove from hash map in O(1)
        playlistIndex.remove(songId);

        return true;
    }

    /**
     * Moves forward in the playlist.
     * Rules:
     * - With repeat on, next() on the last song wraps to the first.
     * - With repeat off, it stays on the last song and returns "end".
     *
     * @return Next Song, or String "end" if reached the end with repeat off
     */
    public Object next() {
        if (currentPlaylistNode == null) {
            return "end";
        }

        if (currentPlaylistNode.next != null) {
            currentPlaylistNode = currentPlaylistNode.next;
            currentlyPlaying = currentPlaylistNode.data;
            return currentlyPlaying;
        }

        // At the last song in playlist
        if (repeat) {
            currentPlaylistNode = playlist.getHead();
            currentlyPlaying = (currentPlaylistNode != null) ? currentPlaylistNode.data : null;
            return currentlyPlaying != null ? currentlyPlaying : "end";
        } else {
            // Stay on the last song and return "end"
            return "end";
        }
    }

    /**
     * Moves backward in the playlist.
     *
     * @return Previous Song, or stays on head if at beginning without repeat
     */
    public Object previous() {
        if (currentPlaylistNode == null) {
            return null;
        }

        if (currentPlaylistNode.prev != null) {
            currentPlaylistNode = currentPlaylistNode.prev;
            currentlyPlaying = currentPlaylistNode.data;
            return currentlyPlaying;
        }

        // At the first song
        if (repeat) {
            currentPlaylistNode = playlist.getTail();
            currentlyPlaying = (currentPlaylistNode != null) ? currentPlaylistNode.data : null;
            return currentlyPlaying;
        } else {
            // Stay on first song
            currentlyPlaying = currentPlaylistNode.data;
            return currentlyPlaying;
        }
    }

    /**
     * Toggles repeat on and off.
     * @return New repeat state (true = on, false = off)
     */
    public boolean toggleRepeat() {
        this.repeat = !this.repeat;
        return this.repeat;
    }

    // =========================================================================
    // MILESTONE 2 — UP NEXT AND HISTORY (Queue + Stack)
    // =========================================================================

    /**
     * Adds a song to the Up Next queue.
     *
     * @param songId ID of the song to queue
     * @return true if song found and queued, false if the ID is unknown
     */
    public boolean addToUpNext(String songId) {
        if (songId == null) return false;

        Song song = catalog.get(songId);
        if (song == null) {
            // Check if present in playlistIndex
            DoublyLinkedList.Node<Song> node = playlistIndex.get(songId);
            if (node != null) {
                song = node.data;
            }
        }

        if (song == null) {
            return false; // Unknown song ID: do not invent a fake track
        }

        upNextQueue.enqueue(song);
        return true;
    }

    /**
     * Plays the next song following priority rules:
     * 1. Songs in Up Next queue play before the playlist continues.
     * 2. Playing from Up Next does NOT move the playlist position.
     * 3. History keeps the last 10 songs played and drops the oldest.
     *
     * @return Song playing next, or "end" if playlist reaches the end without repeat
     */
    public Object playNext() {
        // Priority 1: Check Up Next queue
        if (!upNextQueue.isEmpty()) {
            Song queuedSong = upNextQueue.dequeue();

            // Record previous song into history
            if (currentlyPlaying != null) {
                historyStack.push(currentlyPlaying);
            }

            currentlyPlaying = queuedSong;
            // CRITICAL RULE: Playing from Up Next does NOT move playlist position!
            return currentlyPlaying;
        }

        // Priority 2: Playlist continues
        if (currentPlaylistNode == null) {
            return "end";
        }

        // If at the end of playlist with repeat off, return "end"
        if (currentPlaylistNode.next == null && !repeat) {
            return "end";
        }

        // Record currently playing song before moving
        if (currentlyPlaying != null) {
            historyStack.push(currentlyPlaying);
        }

        // Move playlist position
        Object nextSong = next();
        return nextSong;
    }

    /**
     * Replays the top song from history and removes it from history.
     * Rule: Playing from history does NOT move the playlist position.
     *
     * @return Replayed Song, or null if history is empty
     */
    public Object back() {
        if (historyStack.isEmpty()) {
            return null;
        }

        Song replayedSong = historyStack.pop();
        currentlyPlaying = replayedSong;
        // CRITICAL RULE: Playing from history does NOT move playlist position!
        return currentlyPlaying;
    }

    // =========================================================================
    // MILESTONE 3 — SONG SEARCH AND RELATED ARTISTS (BST + Graph)
    // =========================================================================

    /**
     * Finds a song by exact title using the BST.
     *
     * @param title Title of the song to find
     * @return Song if found, or null
     */
    public Song findSong(String title) {
        BinarySearchTree.BSTNode node = searchTree.findSong(title);
        return node != null ? node.song : null;
    }

    /**
     * Prefix search for song titles in the BST.
     * Skips subtrees that cannot match and returns titles in alphabetical order.
     *
     * @param prefix Title prefix
     * @return Alphabetical list of matching song titles
     */
    public List<String> prefixSearch(String prefix) {
        return searchTree.prefixSearch(prefix);
    }

    /**
     * Adds an undirected "related" link between artistA and artistB.
     *
     * @param artistA First artist
     * @param artistB Second artist
     */
    public void addRelation(String artistA, String artistB) {
        artistGraph.addRelation(artistA, artistB);
    }

    /**
     * Recommends artists exactly two links away who are not already directly related,
     * sorted in alphabetical order.
     *
     * @param artist The target artist
     * @return Sorted list of recommended artists
     */
    public List<String> recommendArtists(String artist) {
        return artistGraph.recommendArtists(artist);
    }

    // =========================================================================
    // STATE INSPECTORS & GETTERS
    // =========================================================================

    public Song getCurrentlyPlaying() {
        return currentlyPlaying;
    }

    public void setCurrentlyPlaying(Song song) {
        this.currentlyPlaying = song;
    }

    public Song getCurrentPlaylistSong() {
        return currentPlaylistNode != null ? currentPlaylistNode.data : null;
    }

    public boolean isRepeat() {
        return repeat;
    }

    public List<Song> getPlaylistSongs() {
        return playlist.toList();
    }

    public List<Song> getUpNextSongs() {
        return upNextQueue.toList();
    }

    public List<Song> getHistorySongs() {
        return historyStack.toList();
    }

    public int getPlaylistSize() {
        return playlist.size();
    }

    public int getUpNextSize() {
        return upNextQueue.size();
    }

    public int getHistorySize() {
        return historyStack.size();
    }

    public Song getSongFromCatalog(String songId) {
        return catalog.get(songId);
    }
}
