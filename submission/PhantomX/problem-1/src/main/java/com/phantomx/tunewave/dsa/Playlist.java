package com.phantomx.tunewave.dsa;

import java.util.ArrayList;
import java.util.List;

/** Doubly linked playlist; {@code index} maps songId -> node so duplicates/removes skip a full scan. */
public final class Playlist {
    private static final class Node {
        final Song song;
        Node prev;
        Node next;

        Node(Song song) {
            this.song = song;
        }
    }

    private Node head;
    private Node tail;
    private Node current;
    private boolean repeat;
    private final SimpleHashMap<String, Node> index = new SimpleHashMap<String, Node>();

    public boolean addSong(Song song) {
        if (song == null || song.getId() == null) {
            return false;
        }
        if (index.containsKey(song.getId())) {
            return false;
        }
        Node node = new Node(song);
        if (head == null) {
            head = tail = current = node;
        } else {
            tail.next = node;
            node.prev = tail;
            tail = node;
        }
        index.put(song.getId(), node);
        return true;
    }

    public boolean removeSong(String songId) {
        Node node = index.remove(songId);
        if (node == null) {
            return false;
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
        if (current == node) {
            current = node.next != null ? node.next : node.prev;
        }
        node.prev = null;
        node.next = null;
        return true;
    }

    public NextResult next() {
        if (current == null) {
            return NextResult.end();
        }
        if (current.next != null) {
            current = current.next;
            return NextResult.of(current.song);
        }
        if (repeat && head != null) {
            current = head;
            return NextResult.of(current.song);
        }
        return NextResult.end();
    }

    public Song previous() {
        if (current == null) {
            return null;
        }
        if (current.prev != null) {
            current = current.prev;
        }
        return current.song;
    }

    public boolean toggleRepeat() {
        repeat = !repeat;
        return repeat;
    }

    public boolean isRepeatEnabled() {
        return repeat;
    }

    public Song getCurrent() {
        return current == null ? null : current.song;
    }

    public Song getHead() {
        return head == null ? null : head.song;
    }

    public Song getTail() {
        return tail == null ? null : tail.song;
    }

    public Song getSong(String songId) {
        Node node = index.get(songId);
        return node == null ? null : node.song;
    }

    public boolean contains(String songId) {
        return index.containsKey(songId);
    }

    public int size() {
        return index.size();
    }

    public boolean isEmpty() {
        return index.isEmpty();
    }

    public String previousIdOf(String songId) {
        Node node = index.get(songId);
        if (node == null || node.prev == null) {
            return null;
        }
        return node.prev.song.getId();
    }

    public String nextIdOf(String songId) {
        Node node = index.get(songId);
        if (node == null || node.next == null) {
            return null;
        }
        return node.next.song.getId();
    }

    public List<String> idsInOrder() {
        List<String> ids = new ArrayList<String>();
        for (Node node = head; node != null; node = node.next) {
            ids.add(node.song.getId());
        }
        return ids;
    }
}
