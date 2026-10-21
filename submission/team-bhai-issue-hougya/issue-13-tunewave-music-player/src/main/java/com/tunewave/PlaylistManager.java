package com.tunewave;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PlaylistManager {
    private SongNode head;
    private SongNode tail;
    private SongNode current;
    private final Map<String, SongNode> songMap = new HashMap<>();
    private boolean repeat = false;

    public boolean addSong(Song song) {
        if (song == null || songMap.containsKey(song.getId())) {
            return false;
        }

        SongNode node = new SongNode(song);
        if (head == null) {
            head = tail = current = node;
        } else {
            tail.next = node;
            node.prev = tail;
            tail = node;
        }

        songMap.put(song.getId(), node);
        return true;
    }

    public boolean removeSong(String songId) {
        if (songId == null) return false;
        SongNode node = songMap.remove(songId);
        if (node == null) return false;

        if (current == node) {
            current = (node.next != null) ? node.next : node.prev;
        }

        if (node.prev != null) {
            node.prev.next = node.next;
        } else {
            head = node.next;
        }

        if (node.next != null) {
            node.next.prev = node.prev;
        } else {
            tail = node.prev;
        }

        node.prev = null;
        node.next = null;
        return true;
    }

    public Object next() {
        if (current == null) return null;

        if (current == tail) {
            if (repeat) {
                current = head;
                return current.song;
            }
            return "end";
        }

        current = current.next;
        return current != null ? current.song : null;
    }

    public Song previous() {
        if (current == null) return null;

        if (current == head) {
            if (repeat) {
                current = tail;
            }
            return current.song;
        }

        current = current.prev;
        return current != null ? current.song : null;
    }

    public boolean toggleRepeat() {
        repeat = !repeat;
        return repeat;
    }

    public boolean isRepeat() {
        return repeat;
    }

    public void setRepeat(boolean repeat) {
        this.repeat = repeat;
    }

    public Song getCurrentSong() {
        return current != null ? current.song : null;
    }

    public SongNode getCurrent() {
        return current;
    }

    public void setCurrent(SongNode current) {
        this.current = current;
    }

    public SongNode getHead() {
        return head;
    }

    public SongNode getTail() {
        return tail;
    }

    public int size() {
        return songMap.size();
    }

    public boolean isEmpty() {
        return songMap.isEmpty();
    }

    public boolean containsSong(String songId) {
        return songId != null && songMap.containsKey(songId);
    }

    public Song getSong(String songId) {
        SongNode node = songMap.get(songId);
        return node != null ? node.song : null;
    }

    public List<Song> getSongsInOrder() {
        List<Song> list = new ArrayList<>();
        SongNode cur = head;
        while (cur != null) {
            list.add(cur.song);
            cur = cur.next;
        }
        return list;
    }
}
