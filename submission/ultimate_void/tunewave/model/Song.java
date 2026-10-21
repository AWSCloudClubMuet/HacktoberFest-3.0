package tunewave.model;

import java.util.Objects;

/**
 * Represents a single musical track in the TuneWave Music Player.
 *
 * <p>Attributes:
 * <ul>
 *   <li>{@code songId}: Unique identifier for the song (e.g. "s1", "101").</li>
 *   <li>{@code title}: Title or track name (e.g. "Blinding Lights").</li>
 *   <li>{@code artist}: Name of the artist or band (e.g. "The Weeknd").</li>
 *   <li>{@code duration}: Duration of the song in seconds.</li>
 * </ul>
 */
public class Song {
    private final String songId;
    private final String title;
    private final String artist;
    private final int duration;

    /**
     * Constructs a Song with songId, title, artist, and duration.
     *
     * @param songId   Unique song identifier.
     * @param title    Song title.
     * @param artist   Artist name.
     * @param duration Duration in seconds.
     */
    public Song(String songId, String title, String artist, int duration) {
        this.songId = Objects.requireNonNull(songId, "songId cannot be null").trim();
        this.title = Objects.requireNonNull(title, "title cannot be null").trim();
        this.artist = (artist != null) ? artist.trim() : "Unknown Artist";
        this.duration = Math.max(0, duration);
    }

    /**
     * Constructs a Song with songId, title, and artist (default duration 0).
     *
     * @param songId Unique song identifier.
     * @param title  Song title.
     * @param artist Artist name.
     */
    public Song(String songId, String title, String artist) {
        this(songId, title, artist, 0);
    }

    /**
     * Constructs a Song with songId and title (default artist "Unknown Artist", duration 0).
     *
     * @param songId Unique song identifier.
     * @param title  Song title.
     */
    public Song(String songId, String title) {
        this(songId, title, "Unknown Artist", 0);
    }

    public String getSongId() {
        return songId;
    }

    public String getTitle() {
        return title;
    }

    public String getArtist() {
        return artist;
    }

    public int getDuration() {
        return duration;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Song other)) return false;
        return Objects.equals(this.songId, other.songId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(songId);
    }

    @Override
    public String toString() {
        return "Song(id='" + songId + "', title='" + title + "', artist='" + artist + "')";
    }
}
