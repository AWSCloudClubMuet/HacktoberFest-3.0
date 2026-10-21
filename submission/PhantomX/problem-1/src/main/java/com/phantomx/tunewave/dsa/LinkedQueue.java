package com.phantomx.tunewave.dsa;

import java.util.ArrayList;
import java.util.List;

final class LinkedQueue {
    private static final class Node {
        final String songId;
        Node next;

        Node(String songId) {
            this.songId = songId;
        }
    }

    private Node head;
    private Node tail;
    private int size;

    void enqueue(String songId) {
        if (songId == null) {
            return;
        }
        Node node = new Node(songId);
        if (tail == null) {
            head = tail = node;
        } else {
            tail.next = node;
            tail = node;
        }
        size++;
    }

    String dequeue() {
        if (head == null) {
            return null;
        }
        String songId = head.songId;
        head = head.next;
        if (head == null) {
            tail = null;
        }
        size--;
        return songId;
    }

    boolean isEmpty() {
        return head == null;
    }

    int size() {
        return size;
    }

    List<String> toList() {
        List<String> ids = new ArrayList<String>();
        for (Node node = head; node != null; node = node.next) {
            ids.add(node.songId);
        }
        return ids;
    }
}
