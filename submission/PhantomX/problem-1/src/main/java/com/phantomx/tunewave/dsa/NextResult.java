package com.phantomx.tunewave.dsa;

public final class NextResult {
    public static final String END = "end";

    private final Song song;
    private final String status;

    private NextResult(Song song, String status) {
        this.song = song;
        this.status = status;
    }

    public static NextResult of(Song song) {
        return new NextResult(song, "ok");
    }

    public static NextResult end() {
        return new NextResult(null, END);
    }

    public boolean isEnd() {
        return END.equals(status);
    }

    public Song getSong() {
        return song;
    }

    public String getStatus() {
        return status;
    }
}
