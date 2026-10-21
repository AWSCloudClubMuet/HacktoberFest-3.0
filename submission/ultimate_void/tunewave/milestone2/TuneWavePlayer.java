package tunewave.milestone2;

import tunewave.milestone1.Playlist;
import tunewave.model.PlaybackResult;
import tunewave.model.Song;

import java.util.HashMap;
import java.util.Map;

/**
 * Milestone 2 — TuneWave Player (Playback Controller)
 *
 * <p>Integrates:
 * <ul>
 *   <li>{@link Playlist}: Doubly Linked List for regular playlist navigation.</li>
 *   <li>{@link UpNextQueue}: FIFO queue for priority song queueing.</li>
 *   <li>{@link PlayHistory}: Bounded LIFO stack for tracking recently played songs.</li>
 * </ul>
 *
 * <p>Playback Rules:
 * <ol>
 *   <li>Songs in the Up Next queue play before regular playlist order continues.</li>
 *   <li>Playing from Up Next or history does NOT advance or move the playlist position.</li>
 *   <li>Whenever playback moves forward via {@code playNext()}, the currently playing
 *       song is saved into history (up to 10 songs, dropping oldest).</li>
 *   <li>{@code back()} replays the top song from history, removes it from history,
 *       and leaves the playlist position untouched.</li>
 * </ol>
 */
public class TuneWavePlayer {

    private final Playlist playlist;
    private final UpNextQueue upNext;
    private final PlayHistory history;
    private Song currentlyPlaying;
    private final Map<String, Song> catalog;

    /**
     * Initializes a player with a new empty playlist, empty Up Next queue,
     * and a 10-song bounded history stack.
     */
    public TuneWavePlayer() {
        this(new Playlist());
    }

    /**
     * Initializes a player with an existing playlist.
     *
     * @param playlist Pre-existing Playlist instance.
     */
    public TuneWavePlayer(Playlist playlist) {
        this.playlist = (playlist != null) ? playlist : new Playlist();
        this.upNext = new UpNextQueue();
        this.history = new PlayHistory(10);
        this.currentlyPlaying = null;
        this.catalog = new HashMap<>();

        // Register any existing playlist songs in catalog
        for (Song s : this.playlist.toList()) {
            registerSong(s);
        }
    }

    /**
     * Registers a song into the player's internal catalog by song ID.
     *
     * @param song Song to register.
     */
    public void registerSong(Song song) {
        if (song != null) {
            this.catalog.put(song.getSongId(), song);
        }
    }

    /**
     * Milestone 1: Adds a song to the player catalog and the playlist.
     *
     * @param song Song to add.
     * @return true if added, false if duplicate.
     */
    public boolean addSong(Song song) {
        if (song == null) {
            return false;
        }
        registerSong(song);
        return this.playlist.addSong(song);
    }

    /**
     * Milestone 1: Removes a song from the playlist using its song ID.
     *
     * @param songId Unique identifier of the song.
     * @return true if removed, false otherwise.
     */
    public boolean removeSong(String songId) {
        return this.playlist.removeSong(songId);
    }

    /**
     * Milestone 1: Moves playlist pointer forward directly.
     *
     * @return {@link PlaybackResult} with the next song or "end".
     */
    public PlaybackResult next() {
        PlaybackResult res = this.playlist.next();
        if (res.isSong()) {
            this.currentlyPlaying = res.getSong();
        }
        return res;
    }

    /**
     * Milestone 1: Moves playlist pointer backward directly.
     *
     * @return The {@link Song} or null.
     */
    public Song previous() {
        Song s = this.playlist.previous();
        if (s != null) {
            this.currentlyPlaying = s;
        }
        return s;
    }

    /**
     * Milestone 1: Toggles repeat mode.
     *
     * @return New repeat state.
     */
    public boolean toggleRepeat() {
        return this.playlist.toggleRepeat();
    }

    /**
     * Milestone 2: Adds a song to the Up Next FIFO queue.
     *
     * @param song Song to enqueue.
     */
    public void addToUpNext(Song song) {
        if (song == null) {
            return;
        }
        registerSong(song);
        this.upNext.enqueue(song);
    }

    /**
     * Milestone 2: Adds a song to the Up Next queue by songId.
     *
     * <p>Finds the song in the catalog, playlist, or creates a default track.
     *
     * @param songId Unique song identifier.
     */
    public void addToUpNext(String songId) {
        if (songId == null || songId.isBlank()) {
            return;
        }
        String idStr = songId.trim();
        Song songToQueue;
        if (this.catalog.containsKey(idStr)) {
            songToQueue = this.catalog.get(idStr);
        } else if (this.playlist.getSongMap().containsKey(idStr)) {
            songToQueue = this.playlist.getSongMap().get(idStr).getSong();
        } else {
            songToQueue = new Song(idStr, "Track " + idStr);
            registerSong(songToQueue);
        }
        this.upNext.enqueue(songToQueue);
    }

    /**
     * Milestone 2: Plays the next song following all precedence rules.
     *
     * <p>Algorithm:
     * <ol>
     *   <li>If a song is currently playing, push it to {@code history}.</li>
     *   <li>If {@code upNext} is not empty: dequeue and play that song.
     *       Crucially, playlist position is NOT touched!</li>
     *   <li>If {@code upNext} is empty:
     *     <ul>
     *       <li>If playback hasn't started yet ({@code currentlyPlaying == null}),
     *           play the current song in playlist (without advancing pointer).</li>
     *       <li>If already playing, advance playlist via {@code playlist.next()}.
     *           If "end" is reached and repeat is OFF, return "end".</li>
     *     </ul>
     *   </li>
     * </ol>
     *
     * @return {@link PlaybackResult} representing the song or "end".
     */
    public PlaybackResult playNext() {
        // Record current song into history before moving to next
        if (this.currentlyPlaying != null) {
            this.history.push(this.currentlyPlaying);
        }

        // Rule: Up Next queue plays before playlist continues
        if (!this.upNext.isEmpty()) {
            this.currentlyPlaying = this.upNext.dequeue();
            return PlaybackResult.of(this.currentlyPlaying);
        }

        // If nothing was playing yet, start at current playlist position
        if (this.currentlyPlaying == null) {
            Song currentSong = this.playlist.getCurrent();
            if (currentSong != null) {
                this.currentlyPlaying = currentSong;
                return PlaybackResult.of(this.currentlyPlaying);
            }
            return PlaybackResult.empty();
        }

        // Advance playlist
        PlaybackResult result = this.playlist.next();
        if (result.isSong()) {
            this.currentlyPlaying = result.getSong();
            return PlaybackResult.of(this.currentlyPlaying);
        } else if (result.isEnd()) {
            return PlaybackResult.END;
        }

        return PlaybackResult.empty();
    }

    /**
     * Milestone 2: Replays the top song from history and removes it from history.
     *
     * <p>Rule: Playing from history does NOT move the playlist position.
     *
     * @return Replayed {@link Song}, or {@code null} if history is empty.
     */
    public Song back() {
        if (this.history.isEmpty()) {
            return null;
        }

        Song replayedSong = this.history.pop();
        this.currentlyPlaying = replayedSong;
        return this.currentlyPlaying;
    }

    public Song getCurrentlyPlaying() {
        return currentlyPlaying;
    }

    public Playlist getPlaylist() {
        return playlist;
    }

    public UpNextQueue getUpNext() {
        return upNext;
    }

    public PlayHistory getHistory() {
        return history;
    }

    public Map<String, Song> getCatalog() {
        return catalog;
    }

    @Override
    public String toString() {
        return "TuneWavePlayer(playing=" + currentlyPlaying + ", upNext=" + upNext.size() + ", history=" + history.size() + ")";
    }
}
