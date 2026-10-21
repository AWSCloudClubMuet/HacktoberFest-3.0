package com.tunewave;

public class Song {
    private final String id;
    private final String title;
    private final String artist;
    private final int durationSeconds;

    public Song(String id, String title, String artist, int durationSeconds) {
        this.id = id != null ? id.trim() : "";
        this.title = title != null ? title.trim() : "";
        this.artist = artist != null ? artist.trim() : "";
        this.durationSeconds = Math.max(0, durationSeconds);
    }

    public Song(String id, String title, String artist) {
        this(id, title, artist, 0);
    }

    public String getId() {
        return id;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Song other)) return false;
        return id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }

    @Override
    public String toString() {
        return title + " by " + artist + " (" + id + ")";
    }
}
