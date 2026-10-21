package com.phantomx.tunewave.dsa;

public final class PlayResult {
    public static final String END = "end";
    public static final String EMPTY = "empty";

    private final String songId;
    private final Song song;
    private final String status;

    private PlayResult(String songId, Song song, String status) {
        this.songId = songId;
        this.song = song;
        this.status = status;
    }

    public static PlayResult of(String songId, Song song) {
        return new PlayResult(songId, song, "ok");
    }

    public static PlayResult end() {
        return new PlayResult(null, null, END);
    }

    public static PlayResult empty() {
        return new PlayResult(null, null, EMPTY);
    }

    public boolean isEnd() {
        return END.equals(status);
    }

    public boolean isEmpty() {
        return EMPTY.equals(status);
    }

    public String getSongId() {
        return songId;
    }

    public Song getSong() {
        return song;
    }

    public String getStatus() {
        return status;
    }
}
