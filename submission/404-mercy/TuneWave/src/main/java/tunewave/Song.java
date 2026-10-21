package tunewave;

import java.util.Objects;

/**
 * Immutable representation of a single song in the TuneWave catalog.
 *
 * <p>Two Song objects are considered equal if and only if they share the same
 * {@code songId}. This allows songs to be stored in hash-based collections
 * while using the ID as the primary key.
 */
public final class Song {

    private final String songId;
    private final String title;
    private final String artist;

    /**
     * Constructs a new Song.
     *
     * @param songId  unique identifier (non-null, non-blank)
     * @param title   song title (non-null, non-blank)
     * @param artist  artist name (non-null, non-blank)
     * @throws IllegalArgumentException if any parameter is null or blank
     */
    public Song(String songId, String title, String artist) {
        if (songId == null || songId.isBlank()) {
            throw new IllegalArgumentException("songId must not be null or blank");
        }
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title must not be null or blank");
        }
        if (artist == null || artist.isBlank()) {
            throw new IllegalArgumentException("artist must not be null or blank");
        }
        this.songId = songId.trim();
        this.title  = title.trim();
        this.artist = artist.trim();
    }

    /** @return unique song ID */
    public String getSongId() { return songId; }

    /** @return song title */
    public String getTitle() { return title; }

    /** @return artist name */
    public String getArtist() { return artist; }

    /**
     * Equality is determined solely by {@code songId}.
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Song other)) return false;
        return songId.equals(other.songId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(songId);
    }

    @Override
    public String toString() {
        return String.format("[%s] \"%s\" by %s", songId, title, artist);
    }
}

