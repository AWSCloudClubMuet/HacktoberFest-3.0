package com.phantomx.tunewave.dsa;

import java.util.ArrayList;
import java.util.List;

/** Stack of recently played ids. Caps at 10 by dropping the oldest (bottom). */
final class HistoryStack {
    static final int MAX = 10;

    private static final class Node {
        final String songId;
        Node newer;
        Node older;

        Node(String songId) {
            this.songId = songId;
        }
    }

    private Node top;
    private Node bottom;
    private int size;

    void push(String songId) {
        if (songId == null) {
            return;
        }
        Node node = new Node(songId);
        node.older = top;
        if (top != null) {
            top.newer = node;
        }
        top = node;
        if (bottom == null) {
            bottom = node;
        }
        size++;
        if (size > MAX) {
            Node evicted = bottom;
            bottom = evicted.newer;
            bottom.older = null;
            evicted.newer = null;
            size--;
        }
    }

    String pop() {
        if (top == null) {
            return null;
        }
        String songId = top.songId;
        top = top.older;
        if (top != null) {
            top.newer = null;
        } else {
            bottom = null;
        }
        size--;
        return songId;
    }

    String peek() {
        return top == null ? null : top.songId;
    }

    boolean isEmpty() {
        return top == null;
    }

    int size() {
        return size;
    }

    List<String> oldestFirst() {
        List<String> ids = new ArrayList<String>();
        for (Node node = bottom; node != null; node = node.newer) {
            ids.add(node.songId);
        }
        return ids;
    }
}
