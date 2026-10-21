package com.phantomx.tunewave.dsa;

import java.util.List;

public final class PlaybackEngine {
    private final Playlist playlist;
    private final LinkedQueue upNext = new LinkedQueue();
    private final HistoryStack history = new HistoryStack();
    // set when playing from the queue or history so the playlist cursor can stay put
    private String overrideId;

    public PlaybackEngine(Playlist playlist) {
        this.playlist = playlist;
    }

    public void addToUpNext(String songId) {
        upNext.enqueue(songId);
    }

    public PlayResult playNext() {
        String leaving = nowPlayingId();

        if (!upNext.isEmpty()) {
            overrideId = upNext.dequeue();
            pushHistory(leaving);
            return PlayResult.of(overrideId, resolve(overrideId));
        }

        if (playlist.isEmpty()) {
            overrideId = null;
            return PlayResult.end();
        }

        NextResult next = playlist.next();
        if (next.isEnd()) {
            if (overrideId != null) {
                overrideId = null;
                String now = nowPlayingId();
                if (leaving != null && (now == null || !leaving.equals(now))) {
                    pushHistory(leaving);
                }
            }
            return PlayResult.end();
        }

        overrideId = null;
        pushHistory(leaving);
        return PlayResult.of(next.getSong().getId(), next.getSong());
    }

    public PlayResult back() {
        if (history.isEmpty()) {
            return PlayResult.empty();
        }
        overrideId = history.pop();
        return PlayResult.of(overrideId, resolve(overrideId));
    }

    public Song getNowPlaying() {
        String id = nowPlayingId();
        return id == null ? null : resolve(id);
    }

    public String nowPlayingId() {
        if (overrideId != null) {
            return overrideId;
        }
        Song current = playlist.getCurrent();
        return current == null ? null : current.getId();
    }

    public boolean isPlayingOverride() {
        return overrideId != null;
    }

    public List<String> upNextIds() {
        return upNext.toList();
    }

    public List<String> historyOldestFirst() {
        return history.oldestFirst();
    }

    public int historySize() {
        return history.size();
    }

    public int upNextSize() {
        return upNext.size();
    }

    private void pushHistory(String songId) {
        if (songId == null || songId.equals(history.peek())) {
            return;
        }
        history.push(songId);
    }

    private Song resolve(String songId) {
        Song song = playlist.getSong(songId);
        return song != null ? song : new Song(songId, songId);
    }
}
