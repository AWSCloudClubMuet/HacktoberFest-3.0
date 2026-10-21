package tunewave.model;

import java.util.Objects;

/**
 * Encapsulates the outcome of a playback operation (e.g. next(), playNext()).
 *
 * <p>Supports returning:
 * <ul>
 *   <li>A played {@link Song}.</li>
 *   <li>The literal status {@code "end"} when the playlist finishes and repeat is OFF.</li>
 *   <li>An empty status when there are no songs available.</li>
 * </ul>
 */
public class PlaybackResult {

    public static final PlaybackResult END = new PlaybackResult(null, "end");
    public static final PlaybackResult EMPTY = new PlaybackResult(null, "empty");

    private final Song song;
    private final String status; // "ok", "end", or "empty"

    private PlaybackResult(Song song, String status) {
        this.song = song;
        this.status = status;
    }

    /**
     * Creates a successful playback result wrapping the specified song.
     *
     * @param song Song being played.
     * @return PlaybackResult with status "ok".
     */
    public static PlaybackResult of(Song song) {
        if (song == null) {
            return EMPTY;
        }
        return new PlaybackResult(song, "ok");
    }

    /**
     * Returns the singleton representing the end of a playlist (when repeat is OFF).
     *
     * @return PlaybackResult with status "end".
     */
    public static PlaybackResult end() {
        return END;
    }

    /**
     * Returns the singleton representing an empty playlist or no song available.
     *
     * @return PlaybackResult with status "empty".
     */
    public static PlaybackResult empty() {
        return EMPTY;
    }

    /**
     * Indicates whether the playback reached the end of the playlist.
     *
     * @return true if status is "end", false otherwise.
     */
    public boolean isEnd() {
        return "end".equalsIgnoreCase(this.status);
    }

    /**
     * Indicates whether a song is present in this result.
     *
     * @return true if a song was returned, false otherwise.
     */
    public boolean isSong() {
        return this.song != null;
    }

    /**
     * Returns the song wrapped in this result, or {@code null} if none.
     *
     * @return {@link Song} or null.
     */
    public Song getSong() {
        return song;
    }

    /**
     * Returns the status string ("ok", "end", or "empty").
     *
     * @return Status string.
     */
    public String getStatus() {
        return status;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;

        if (o instanceof PlaybackResult other) {
            return Objects.equals(this.status, other.status) && Objects.equals(this.song, other.song);
        }

        if (o instanceof Song otherSong) {
            return isSong() && Objects.equals(this.song, otherSong);
        }

        if (o instanceof String str) {
            if ("end".equalsIgnoreCase(str)) {
                return isEnd();
            }
            if ("empty".equalsIgnoreCase(str)) {
                return "empty".equalsIgnoreCase(this.status);
            }
            return isSong() && Objects.equals(this.song.getSongId(), str);
        }

        return false;
    }

    @Override
    public int hashCode() {
        return Objects.hash(song, status);
    }

    @Override
    public String toString() {
        if (isEnd()) {
            return "end";
        }
        if (song != null) {
            return song.toString();
        }
        return "empty";
    }
}
