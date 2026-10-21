package TuneWave_music_player;

import java.util.ArrayList;
import java.util.List;

/** A FIFO queue implemented with our own links. Owned by TuneWavePlayer. */
final class UpNextQueue {
    private static final class Node {
        final String songId;
        Node next;
        Node(String songId) { this.songId = songId; }
    }

    private Node front;
    private Node rear;

    void enqueue(String songId) {
        Node node = new Node(Song.requireId(songId));
        if (rear == null) front = node;
        else rear.next = node;
        rear = node;
    }

    String dequeue() {
        if (front == null) return null;
        String result = front.songId;
        front = front.next;
        if (front == null) rear = null;
        return result;
    }

    List<String> songIds() {
        List<String> result = new ArrayList<>();
        for (Node node = front; node != null; node = node.next) result.add(node.songId);
        return List.copyOf(result);
    }
}
