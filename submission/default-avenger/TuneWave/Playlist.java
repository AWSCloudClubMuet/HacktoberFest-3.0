import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Objects;

public class Playlist {
    private Node head, tail, current_song;
    private boolean repeat = false;
    private final HashMap<String, Node> map = new HashMap<>();//This is the ma
    private final Deque<Song> upNext = new ArrayDeque<>();//queue double for saving upnext song lists
    private final Deque<Song> history = new ArrayDeque<>();//this double ended queue is for saving the history of songs played, so that we can go back to the previous song
    private Song playing_song;

    private static final int HISTORY_LIMIT = 10;//Limit i have putted in history to store is 10 becuase that is for testign only and memeory efficent 

    public String addSong(Song song) {
        if (song == null || map.containsKey(song.id)) 
            return "Song is not added in the system: ";

        Node node = new Node(song);
        if (head == null) {
            head = tail = current_song = node;//this would means that it is the first song in playlist
            playing_song = song;
            System.out.println("Now playing the : " + song+" Enjoy it");
        } else {
            tail.next = node;
            node.prev = tail;
            tail = node;
        }
        map.put(song.id, node);
        return "Song added successfully: " + song.id;
    }

    public String next() {
        if (current_song == null) return "empty there is no song";
        if (current_song.next != null) {
            current_song = current_song.next;
            System.out.println("Now playing the : " + current_song.song + " Enjoy it");
            return play(current_song.song);
        }
        if (repeat) {
            current_song = head;
            return play(current_song.song);
        }
        return "end";
    }

    public String previous() {
        if (current_song == null) return "empty there is no song";
        if (current_song.prev != null) {
            current_song = current_song.prev;
            return play(current_song.song);
        }
        if (repeat) {
            current_song = tail;
            return play(current_song.song);
        }
        return "start";
    }
//This is milestone two where we are adding song in Queue double
    public boolean addToUpNext(String songId) {
        Node node = map.get(songId);//I am getting the node from the map using songId and then adding it to the upNext queue
        if (node == null) return false;
        upNext.addLast(node.song);//the song id will be added in the end of queue
        return true;
    }
    public String playNext() {
        if (!upNext.isEmpty()) return play(upNext.removeFirst());
        return next();
    }

    public String back() {
        if (history.isEmpty()) return "start";
        playing_song = history.removeFirst();
        return playing_song.title;
    }

    private String play(Song song) {
        if (playing_song != null) {
            history.addFirst(playing_song);
            if (history.size() > HISTORY_LIMIT) history.removeLast();
        }
        playing_song = song;
        return song.title;
    }

    public void toggleRepeat() {
        repeat = !repeat;
    }

    public boolean removeSong(String songId) {
        Node node = map.get(songId);
        if (node == null) return false;

        if (node == current_song) {
            current_song = (node.next != null) ? node.next : node.prev;
        }
        if (node.prev != null) node.prev.next = node.next;
        else head = node.next;

        if (node.next != null) node.next.prev = node.prev;
        else tail = node.prev;

        Iterator<Song> queuedSongs = upNext.iterator();
        while (queuedSongs.hasNext()) {
            if (Objects.equals(queuedSongs.next().id, songId)) queuedSongs.remove();
        }

        if (playing_song == node.song) {
            playing_song = current_song == null ? null : current_song.song;
        }
        map.remove(songId);
        return true;
    }

    public Song getCurrent() {
        return current_song == null ? null : current_song.song;
    }
}
