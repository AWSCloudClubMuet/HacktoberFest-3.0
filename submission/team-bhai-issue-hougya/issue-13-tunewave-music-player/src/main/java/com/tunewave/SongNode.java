package com.tunewave;

public class SongNode {
    public final Song song;
    public SongNode prev;
    public SongNode next;

    public SongNode(Song song) {
        this.song = song;
    }

    public Song getSong() {
        return song;
    }

    public SongNode getPrev() {
        return prev;
    }

    public void setPrev(SongNode prev) {
        this.prev = prev;
    }

    public SongNode getNext() {
        return next;
    }

    public void setNext(SongNode next) {
        this.next = next;
    }

    @Override
    public String toString() {
        return "SongNode(" + song + ")";
    }
}
