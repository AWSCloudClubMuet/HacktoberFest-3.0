package com.phantomx.tunewave.dsa;

import java.util.Objects;

public final class Song {
    private final String id;
    private final String title;
    private final String artist;

    public Song(String id, String title) {
        this(id, title, null);
    }

    public Song(String id, String title, String artist) {
        this.id = id;
        this.title = title;
        this.artist = artist;
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

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof Song)) {
            return false;
        }
        return Objects.equals(id, ((Song) other).id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }

    @Override
    public String toString() {
        return title != null ? title : String.valueOf(id);
    }
}
