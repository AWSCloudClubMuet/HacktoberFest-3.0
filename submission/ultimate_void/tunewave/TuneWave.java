package tunewave;

import tunewave.milestone1.Playlist;
import tunewave.milestone2.TuneWavePlayer;
import tunewave.milestone3.ArtistGraph;
import tunewave.milestone3.SongSearchBST;
import tunewave.model.PlaybackResult;
import tunewave.model.Song;

import java.util.List;

/**
 * TuneWave — Unified Music Streaming Core Application
 *
 * <p>Integrates all three milestones into a single cohesive facade:
 * <ul>
 *   <li><b>Milestone 1 — Playlist:</b> Doubly Linked List + Hash Map for O(1) operations and repeat mode.</li>
 *   <li><b>Milestone 2 — Up Next and History:</b> Queue + Bounded Stack for priority playback and back navigation.</li>
 *   <li><b>Milestone 3 — Song Search and Recommendations:</b> Binary Search Tree for prefix search and Undirected Graph for 2-hop artist recommendations.</li>
 * </ul>
 */
public class TuneWave {

    private final TuneWavePlayer player;
    private final SongSearchBST searchTree;
    private final ArtistGraph artistGraph;

    /**
     * Initializes a new TuneWave application instance with fresh data structures.
     */
    public TuneWave() {
        this.player = new TuneWavePlayer();
        this.searchTree = new SongSearchBST();
        this.artistGraph = new ArtistGraph();
    }

    // ==========================================
    // MILESTONE 1: Playlist Operations
    // ==========================================

    /**
     * Milestone 1 & 3: Adds a {@link Song} to the player playlist, catalog,
     * and search tree index.
     *
     * @param song Song to add.
     * @return true if added to playlist, false if already present.
     */
    public boolean addSong(Song song) {
        if (song == null) {
            return false;
        }
        boolean added = this.player.addSong(song);
        this.searchTree.addSong(song.getTitle(), song.getSongId());
        return added;
    }

    /**
     * Milestone 3: Adds a song by title and songId directly to the search BST
     * and player catalog.
     *
     * @param title  Song title.
     * @param songId Song identifier.
     */
    public void addSong(String title, String songId) {
        if (title != null && songId != null) {
            this.searchTree.addSong(title, songId);
            this.player.registerSong(new Song(songId, title));
        }
    }

    /**
     * Milestone 1: Removes a song from the playlist using its song ID in O(1) time.
     *
     * @param songId Unique song identifier.
     * @return true if found and removed, false otherwise.
     */
    public boolean removeSong(String songId) {
        return this.player.removeSong(songId);
    }

    /**
     * Milestone 1: Moves playlist pointer forward.
     *
     * @return {@link PlaybackResult} with the next song or "end".
     */
    public PlaybackResult next() {
        return this.player.next();
    }

    /**
     * Milestone 1: Moves playlist pointer backward.
     *
     * @return The {@link Song} or null.
     */
    public Song previous() {
        return this.player.previous();
    }

    /**
     * Milestone 1: Toggles repeat mode ON or OFF.
     *
     * @return New repeat status.
     */
    public boolean toggleRepeat() {
        return this.player.toggleRepeat();
    }

    // ==========================================
    // MILESTONE 2: Up Next & Play History
    // ==========================================

    /**
     * Milestone 2: Adds a song object to the Up Next FIFO queue.
     *
     * @param song Song to queue.
     */
    public void addToUpNext(Song song) {
        if (song != null) {
            this.searchTree.addSong(song.getTitle(), song.getSongId());
            this.player.addToUpNext(song);
        }
    }

    /**
     * Milestone 2: Adds a song to the Up Next queue by songId.
     *
     * @param songId Song identifier.
     */
    public void addToUpNext(String songId) {
        this.player.addToUpNext(songId);
    }

    /**
     * Milestone 2: Plays the next song.
     * Priority: Up Next queue -> Playlist current/next.
     * Updates play history (last 10 songs, dropping oldest).
     *
     * @return {@link PlaybackResult} wrapping played song or "end".
     */
    public PlaybackResult playNext() {
        return this.player.playNext();
    }

    /**
     * Milestone 2: Replays the top song from history and removes it from history.
     * Does NOT move the playlist position.
     *
     * @return Replayed {@link Song}, or null if history is empty.
     */
    public Song back() {
        return this.player.back();
    }

    /**
     * Returns the song currently playing.
     *
     * @return Currently playing {@link Song}, or null if none.
     */
    public Song currentlyPlaying() {
        return this.player.getCurrentlyPlaying();
    }

    // ==========================================
    // MILESTONE 3: Song Search & Artist Graph
    // ==========================================

    /**
     * Milestone 3: Finds a song by exact title in the BST.
     *
     * @param title Title of the song.
     * @return Associated songId if found, null otherwise.
     */
    public String findSong(String title) {
        return this.searchTree.findSong(title);
    }

    /**
     * Milestone 3: Returns matching song titles starting with prefix in alphabetical order.
     * Subtrees that cannot match are skipped.
     *
     * @param prefix Title prefix.
     * @return Sorted list of matching titles.
     */
    public List<String> prefixSearch(String prefix) {
        return this.searchTree.prefixSearch(prefix);
    }

    /**
     * Milestone 3: Adds an undirected "related" relationship between two artists.
     *
     * @param artistA First artist.
     * @param artistB Second artist.
     */
    public void addRelation(String artistA, String artistB) {
        this.artistGraph.addRelation(artistA, artistB);
    }

    /**
     * Milestone 3: Recommends artists exactly 2 links away who are not already directly related.
     * Returned in alphabetical order.
     *
     * @param artist Target artist.
     * @return List of recommended artist names.
     */
    public List<String> recommendArtists(String artist) {
        return this.artistGraph.recommendArtists(artist);
    }

    // ==========================================
    // Component Accessors
    // ==========================================

    public TuneWavePlayer getPlayer() {
        return player;
    }

    public Playlist getPlaylist() {
        return player.getPlaylist();
    }

    public SongSearchBST getSearchTree() {
        return searchTree;
    }

    public ArtistGraph getArtistGraph() {
        return artistGraph;
    }
}
