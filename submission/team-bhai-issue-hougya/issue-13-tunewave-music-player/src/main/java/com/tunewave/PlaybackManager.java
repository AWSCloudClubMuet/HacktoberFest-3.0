package com.tunewave;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.function.Function;

public class PlaybackManager {
    public static final int MAX_HISTORY = 10;

    private final PlaylistManager playlistManager;
    private final Function<String, Song> songResolver;
    private final ArrayDeque<Song> upNextQueue = new ArrayDeque<>();
    private final Deque<Song> historyStack = new ArrayDeque<>();

    private Song currentlyPlaying;
    private boolean playlistCursorPlayed;

    public PlaybackManager(PlaylistManager playlistManager, Function<String, Song> songResolver) {
        this.playlistManager = playlistManager;
        this.songResolver = songResolver != null ? songResolver : playlistManager::getSong;
    }

    public PlaybackManager(PlaylistManager playlistManager) {
        this(playlistManager, null);
    }

    public boolean addToUpNext(String songId) {
        if (songId == null || songId.trim().isEmpty()) {
            return false;
        }

        Song song = songResolver.apply(songId.trim());
        if (song == null) {
            return false;
        }

        upNextQueue.addLast(song);
        return true;
    }

    public Song playNext() {
        if (!upNextQueue.isEmpty()) {
            pushHistory(currentlyPlaying);
            currentlyPlaying = upNextQueue.pollFirst();
            return currentlyPlaying;
        }

        if (playlistManager.isEmpty()) {
            return null;
        }

        if (!playlistCursorPlayed) {
            pushHistory(currentlyPlaying);
            currentlyPlaying = playlistManager.getCurrentSong();
            playlistCursorPlayed = true;
            return currentlyPlaying;
        }

        Object res = playlistManager.next();
        if ("end".equals(res)) {
            return null;
        }

        if (res instanceof Song nextSong) {
            pushHistory(currentlyPlaying);
            currentlyPlaying = nextSong;
            return currentlyPlaying;
        }

        return null;
    }

    public Song back() {
        if (historyStack.isEmpty()) {
            return null;
        }
        currentlyPlaying = historyStack.removeFirst();
        return currentlyPlaying;
    }

    private void pushHistory(Song song) {
        if (song == null) return;
        historyStack.addFirst(song);
        if (historyStack.size() > MAX_HISTORY) {
            historyStack.removeLast();
        }
    }

    public Song getCurrentlyPlaying() {
        return currentlyPlaying;
    }

    public void setCurrentlyPlaying(Song song) {
        this.currentlyPlaying = song;
    }

    public List<Song> getUpNextQueue() {
        return new ArrayList<>(upNextQueue);
    }

    public List<Song> getHistoryStack() {
        return new ArrayList<>(historyStack);
    }

    public int getHistorySize() {
        return historyStack.size();
    }

    public int getUpNextSize() {
        return upNextQueue.size();
    }

    public PlaylistManager getPlaylistManager() {
        return playlistManager;
    }
}
