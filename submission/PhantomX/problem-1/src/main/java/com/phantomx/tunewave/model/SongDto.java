package com.phantomx.tunewave.model;

import com.phantomx.tunewave.dsa.Song;

public record SongDto(String id, String title, String artist) {
    public static SongDto from(Song song) {
        if (song == null) {
            return null;
        }
        return new SongDto(song.getId(), song.getTitle(), song.getArtist());
    }
}
