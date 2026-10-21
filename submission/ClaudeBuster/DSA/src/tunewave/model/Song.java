package tunewave.model;

import java.util.Objects;

/**
 * Represents a musical track within the TuneWave streaming service.
 */
public class Song {
    private final String songId;
    private final String title;
    private final String artist;
    private final int durationSeconds;

    public Song(String songId, String title, String artist, int durationSeconds) {
        if (songId == null || songId.trim().isEmpty()) {
            throw new IllegalArgumentException("Song ID cannot be null or empty");
        }
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Song title cannot be null or empty");
        }
        this.songId = songId.trim();
        this.title = title.trim();
        this.artist = (artist != null && !artist.trim().isEmpty()) ? artist.trim() : "Unknown Artist";
        this.durationSeconds = Math.max(0, durationSeconds);
    }

    public Song(String songId, String title, String artist) {
        this(songId, title, artist, 180);
    }

    public Song(String songId, String title) {
        this(songId, title, "Unknown Artist", 180);
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

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public String getFormattedDuration() {
        int minutes = durationSeconds / 60;
        int seconds = durationSeconds % 60;
        return String.format("%d:%02d", minutes, seconds);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Song song = (Song) o;
        return songId.equalsIgnoreCase(song.songId);
    }

    @Override
    public int hashCode() {
        return songId.toLowerCase().hashCode();
    }

    @Override
    public String toString() {
        return String.format("'%s' by %s [ID: %s, %s]", title, artist, songId, getFormattedDuration());
    }
}
