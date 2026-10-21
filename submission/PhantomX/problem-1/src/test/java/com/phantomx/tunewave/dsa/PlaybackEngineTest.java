package com.phantomx.tunewave.dsa;

final class PlaybackEngineTest {
    static int run() {
        Checks c = new Checks();
        emptyQueueUsesPlaylist(c);
        queuePriorityDoesNotMoveCursor(c);
        emptyAndSingleHistory(c);
        historyCapAndEviction(c);
        backRepeatedlyAndEmpty(c);
        historyPlaybackDoesNotMoveCursor(c);
        noDuplicateHistoryEvent(c);
        c.printSummary("PlaybackEngineTest");
        return c.failed();
    }

    private static void emptyQueueUsesPlaylist(Checks c) {
        Playlist p = seeded();
        PlaybackEngine e = new PlaybackEngine(p);
        c.eq("a", e.nowPlayingId(), "starts on playlist current");
        c.eq(0, Integer.valueOf(e.upNextSize()), "empty queue");
        PlayResult next = e.playNext();
        c.eq("b", next.getSongId(), "playNext continues playlist");
        c.eq("b", p.getCurrent().getId(), "cursor advanced");
        c.eqList(Checks.ids("a"), e.historyOldestFirst(), "a recorded in history");
        c.isFalse(e.isPlayingOverride(), "playing from playlist");
    }

    private static void queuePriorityDoesNotMoveCursor(Checks c) {
        Playlist p = seeded();
        PlaybackEngine e = new PlaybackEngine(p);
        e.addToUpNext("x");
        e.addToUpNext("y");
        c.eqList(Checks.ids("x", "y"), e.upNextIds(), "queue front first");

        PlayResult first = e.playNext();
        c.eq("x", first.getSongId(), "queued song first");
        c.eq("a", p.getCurrent().getId(), "cursor stays on a");
        c.isTrue(e.isPlayingOverride(), "now playing is override");
        c.eqList(Checks.ids("a"), e.historyOldestFirst(), "left a");
        c.eqList(Checks.ids("y"), e.upNextIds(), "x dequeued");

        PlayResult second = e.playNext();
        c.eq("y", second.getSongId(), "second queued song");
        c.eq("a", p.getCurrent().getId(), "cursor still a");
        c.eqList(Checks.ids("a", "x"), e.historyOldestFirst(), "x recorded");

        PlayResult third = e.playNext();
        c.eq("b", third.getSongId(), "playlist continuation after queue");
        c.eq("b", p.getCurrent().getId(), "cursor now moves");
        c.eqList(Checks.ids("a", "x", "y"), e.historyOldestFirst(), "y recorded");
        c.isFalse(e.isPlayingOverride(), "back on playlist");
    }

    private static void emptyAndSingleHistory(Checks c) {
        PlaybackEngine empty = new PlaybackEngine(new Playlist());
        c.isTrue(empty.back().isEmpty(), "back on empty history");
        c.isTrue(empty.playNext().isEnd(), "playNext empty playlist");

        Playlist p = seeded();
        PlaybackEngine e = new PlaybackEngine(p);
        e.playNext();
        c.eq(1, Integer.valueOf(e.historySize()), "one history item");
        PlayResult back = e.back();
        c.eq("a", back.getSongId(), "back replays a");
        c.eq(0, Integer.valueOf(e.historySize()), "history popped");
        c.eq("b", p.getCurrent().getId(), "cursor not moved by back");
    }

    private static void historyCapAndEviction(Checks c) {
        Playlist p = new Playlist();
        for (int i = 0; i < 12; i++) {
            p.addSong(Checks.song(Integer.toString(i), "s" + i));
        }
        PlaybackEngine e = new PlaybackEngine(p);
        for (int i = 0; i < 11; i++) {
            e.playNext();
        }
        c.eq(10, Integer.valueOf(e.historySize()), "history capped at 10");
        c.eq("1", e.historyOldestFirst().get(0), "oldest evicted 0, now 1");
        c.eq("10", e.historyOldestFirst().get(9), "newest is 10");
        c.isFalse(e.historyOldestFirst().contains("0"), "0 dropped");
    }

    private static void backRepeatedlyAndEmpty(Checks c) {
        Playlist p = seeded();
        PlaybackEngine e = new PlaybackEngine(p);
        e.playNext();
        e.playNext();
        c.eq("c", e.nowPlayingId(), "on c");
        c.eq("b", e.back().getSongId(), "back to b");
        c.eq("a", e.back().getSongId(), "back to a");
        c.isTrue(e.back().isEmpty(), "back exhausted");
        c.eq("a", e.nowPlayingId(), "now playing unchanged on empty back");
        c.eq("c", p.getCurrent().getId(), "cursor still c");
    }

    private static void historyPlaybackDoesNotMoveCursor(Checks c) {
        Playlist p = seeded();
        PlaybackEngine e = new PlaybackEngine(p);
        String cursorBefore = p.getCurrent().getId();
        e.addToUpNext("x");
        e.playNext();
        e.back();
        c.eq(cursorBefore, p.getCurrent().getId(), "history play keeps cursor");
        c.eq("a", e.nowPlayingId(), "now playing is history song");
        c.isTrue(e.isPlayingOverride(), "history is override");
    }

    private static void noDuplicateHistoryEvent(Checks c) {
        Playlist p = seeded();
        PlaybackEngine e = new PlaybackEngine(p);
        e.playNext();
        c.eqList(Checks.ids("a"), e.historyOldestFirst(), "single a");
        c.isTrue(e.playNext().getSongId().equals("c"), "to c");
        int size = e.historySize();
        c.isTrue(e.playNext().isEnd(), "hit end");
        c.eq(Integer.valueOf(size), Integer.valueOf(e.historySize()), "end does not re-push c");
        c.isTrue(e.playNext().isEnd(), "stay at end");
        c.eq(Integer.valueOf(size), Integer.valueOf(e.historySize()), "repeated end stays unique");
    }

    private static Playlist seeded() {
        Playlist p = new Playlist();
        p.addSong(Checks.song("a", "Alpha"));
        p.addSong(Checks.song("b", "Beta"));
        p.addSong(Checks.song("c", "Gamma"));
        return p;
    }
}
