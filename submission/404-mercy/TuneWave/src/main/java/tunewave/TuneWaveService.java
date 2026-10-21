package tunewave;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Facade that wires together all TuneWave data structures into a single
 * coherent service.
 *
 * <h2>Responsibilities</h2>
 * <ul>
 *   <li>Maintain the <em>song catalog</em> ({@code Map<songId, Song>}) —
 *       the single source of truth for song metadata.</li>
 *   <li>Delegate playlist operations to {@link Playlist}.</li>
 *   <li>Delegate playback (queue, history, currently-playing) to
 *       {@link PlaybackManager}.</li>
 *   <li>Delegate search to {@link SongBST}.</li>
 *   <li>Delegate relationship recommendations to {@link ArtistGraph}.</li>
 * </ul>
 *
 * <p>All public methods validate input and return meaningful results or
 * throw {@link IllegalArgumentException} for developer errors.
 */
public class TuneWaveService {

    // ------------------------------------------------------------------ fields

    /** Shared catalog: songId → Song.  Kept in sync with BST. */
    private final Map<String, Song> catalog = new HashMap<>();

    private final Playlist        playlist;
    private final PlaybackManager playbackManager;
    private final SongBST         songBST;
    private final ArtistGraph     artistGraph;

    // ----------------------------------------------------------- constructor

    /** Constructs a new, empty TuneWaveService. */
    public TuneWaveService() {
        playlist        = new Playlist();
        playbackManager = new PlaybackManager(catalog, playlist);
        songBST         = new SongBST();
        artistGraph     = new ArtistGraph();
    }

    // ---------------------------------------------------------- catalog methods

    /**
     * Adds a song to the catalog, playlist, and BST.
     *
     * <p>If the song ID already exists in the catalog the call is a no-op.
     *
     * @param song the song to add (non-null)
     */
    public void addSong(Song song) {
        if (song == null) throw new IllegalArgumentException("Song must not be null");
        if (catalog.containsKey(song.getSongId())) return; // already exists

        catalog.put(song.getSongId(), song);
        playlist.addSong(song);
        songBST.addSong(song.getTitle(), song.getSongId());
    }

    /**
     * Removes a song from the playlist (and catalog entry is retained so that
     * any references in the queue or history remain valid).
     *
     * @param songId the ID of the song to remove
     */
    public void removeSongFromPlaylist(String songId) {
        if (songId == null) return;
        playlist.removeSong(songId);
        // Intentionally keep the catalog entry — queue/history may still reference it.
    }

    /**
     * Returns the song with the given ID from the catalog, or {@code null}.
     */
    public Song getSong(String songId) {
        return catalog.get(songId);
    }

    /**
     * Returns an unmodifiable view of all songs in the catalog.
     */
    public Collection<Song> getAllSongs() {
        return Collections.unmodifiableCollection(catalog.values());
    }

    // --------------------------------------------------- playlist delegation

    /** @see Playlist#getCurrentSong() */
    public Song currentSong() {
        return playlist.getCurrentSong();
    }

    /** @see Playlist#next() */
    public Object playlistNext() {
        return playlist.next();
    }

    /** @see Playlist#previous() */
    public Object playlistPrevious() {
        return playlist.previous();
    }

    /** @see Playlist#toggleRepeat() */
    public boolean toggleRepeat() {
        return playlist.toggleRepeat();
    }

    /** @see Playlist#isRepeatEnabled() */
    public boolean isRepeatEnabled() {
        return playlist.isRepeatEnabled();
    }

    /** @see Playlist#getSongs() */
    public List<Song> getPlaylistSongs() {
        return playlist.getSongs();
    }

    /** @see Playlist#size() */
    public int playlistSize() {
        return playlist.size();
    }

    // ----------------------------------------------- playback manager delegation

    /**
     * Starts playing the current playlist song (initial playback start).
     * Sets the PlaybackManager's currently-playing to the playlist cursor.
     */
    public Song play() {
        Song song = playlist.getCurrentSong();
        if (song != null) {
            playbackManager.setCurrentlyPlayingId(song.getSongId());
        }
        return song;
    }

    /** @see PlaybackManager#addToUpNext(String) */
    public void addToUpNext(String songId) {
        playbackManager.addToUpNext(songId);
    }

    /** @see PlaybackManager#playNext() */
    public Object playNext() {
        return playbackManager.playNext();
    }

    /** @see PlaybackManager#back() */
    public Song back() {
        return playbackManager.back();
    }

    /** @see PlaybackManager#getCurrentlyPlaying() */
    public Song currentlyPlaying() {
        return playbackManager.getCurrentlyPlaying();
    }

    /** @see PlaybackManager#getUpNextIds() */
    public List<String> getUpNextIds() {
        return playbackManager.getUpNextIds();
    }

    /** @see PlaybackManager#getHistoryIds() */
    public List<String> getHistoryIds() {
        return playbackManager.getHistoryIds();
    }

    // --------------------------------------------------- BST search delegation

    /**
     * Searches for a song by exact title (case-insensitive).
     *
     * @param title the title to look up
     * @return the {@link Song}, or {@code null} if not found
     */
    public Song searchByTitle(String title) {
        String songId = songBST.findSong(title);
        return songId == null ? null : catalog.get(songId);
    }

    /**
     * Returns all songs whose title starts with the given prefix
     * (case-insensitive), sorted alphabetically by title.
     *
     * @param prefix the prefix to match
     * @return list of matching {@link Song} objects
     */
    public List<Song> prefixSearch(String prefix) {
        List<String> titles = songBST.prefixSearch(prefix);
        return titles.stream()
                .map(t -> catalog.get(songBST.findSong(t)))
                .filter(s -> s != null)
                .toList();
    }

    // ----------------------------------------------- graph delegation

    /**
     * Adds an undirected relation between two artists.
     *
     * @see ArtistGraph#addRelation(String, String)
     */
    public void addArtistRelation(String artistA, String artistB) {
        artistGraph.addRelation(artistA, artistB);
    }

    /**
     * Returns recommended artists (distance-2 in the artist graph).
     *
     * @see ArtistGraph#recommendArtists(String)
     */
    public List<String> recommendArtists(String artist) {
        return artistGraph.recommendArtists(artist);
    }

    // ---------------------------------------------------------- accessors (for testing)

    /** Exposes the raw {@link Playlist} for test introspection. */
    public Playlist getPlaylist() { return playlist; }

    /** Exposes the raw {@link PlaybackManager} for test introspection. */
    public PlaybackManager getPlaybackManager() { return playbackManager; }

    /** Exposes the raw {@link SongBST} for test introspection. */
    public SongBST getSongBST() { return songBST; }

    /** Exposes the raw {@link ArtistGraph} for test introspection. */
    public ArtistGraph getArtistGraph() { return artistGraph; }
}

