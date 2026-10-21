package com.phantomx.tunewave.dsa;

final class PlaylistTest {
    static int run() {
        Checks c = new Checks();
        emptyPlaylist(c);
        oneSong(c);
        multipleSongsAndDuplicate(c);
        removeFirstMiddleLast(c);
        removeCurrentAndOnly(c);
        nextPreviousRepeat(c);
        c.printSummary("PlaylistTest");
        return c.failed();
    }

    private static void emptyPlaylist(Checks c) {
        Playlist p = new Playlist();
        c.isTrue(p.isEmpty(), "empty size");
        c.isTrue(p.next().isEnd(), "empty next is end");
        c.eq(NextResult.END, p.next().getStatus(), "empty next status");
        c.isNull(p.previous(), "empty previous");
        c.isFalse(p.removeSong("missing"), "remove missing");
        c.isFalse(p.addSong(null), "add null song");
        c.isFalse(p.addSong(new Song(null, "x")), "add null id");
        c.isNull(p.getCurrent(), "empty current");
    }

    private static void oneSong(Checks c) {
        Playlist p = new Playlist();
        Song a = Checks.song("a", "Alpha");
        c.isTrue(p.addSong(a), "add one");
        c.eq(1, Integer.valueOf(p.size()), "one size");
        c.eq("a", p.getCurrent().getId(), "current is only");
        c.eq("a", p.getHead().getId(), "head is only");
        c.eq("a", p.getTail().getId(), "tail is only");
        c.isTrue(p.next().isEnd(), "one song next is end");
        c.eq("a", p.getCurrent().getId(), "current stays only");
        c.eq("a", p.previous().getId(), "previous stays only");
        c.isTrue(p.contains("a"), "hash map has a");
    }

    private static void multipleSongsAndDuplicate(Checks c) {
        Playlist p = seeded();
        c.isFalse(p.addSong(Checks.song("a", "Alpha")), "duplicate rejected");
        c.eq(3, Integer.valueOf(p.size()), "size after duplicate");
        c.eqList(Checks.ids("a", "b", "c"), p.idsInOrder(), "order after duplicate");
        c.eq("a", p.getCurrent().getId(), "current unchanged by rejected add");
        c.isNull(p.previousIdOf("a"), "a.prev null");
        c.eq("b", p.nextIdOf("a"), "a.next b");
        c.eq("a", p.previousIdOf("b"), "b.prev a");
        c.eq("c", p.nextIdOf("b"), "b.next c");
        c.eq("b", p.previousIdOf("c"), "c.prev b");
        c.isNull(p.nextIdOf("c"), "c.next null");
    }

    private static void removeFirstMiddleLast(Checks c) {
        Playlist first = seeded();
        c.isTrue(first.removeSong("a"), "remove first");
        c.isFalse(first.contains("a"), "hash map dropped first");
        c.eqList(Checks.ids("b", "c"), first.idsInOrder(), "order after remove first");
        c.eq("b", first.getHead().getId(), "new head");
        c.eq("c", first.getTail().getId(), "tail after remove first");
        c.eq("b", first.getCurrent().getId(), "current moved off removed first");
        c.isNull(first.previousIdOf("b"), "b is new head");
        c.eq("c", first.nextIdOf("b"), "b links to c");
        c.eq("b", first.previousIdOf("c"), "c links back to b");

        Playlist middle = seeded();
        middle.next();
        c.eq("b", middle.getCurrent().getId(), "cursor on middle");
        c.isTrue(middle.removeSong("b"), "remove middle");
        c.isFalse(middle.contains("b"), "hash map dropped middle");
        c.eqList(Checks.ids("a", "c"), middle.idsInOrder(), "order after remove middle");
        c.eq("a", middle.getHead().getId(), "head after middle remove");
        c.eq("c", middle.getTail().getId(), "tail after middle remove");
        c.eq("c", middle.getCurrent().getId(), "current moved to successor");
        c.eq("c", middle.nextIdOf("a"), "a now links to c");
        c.eq("a", middle.previousIdOf("c"), "c now links to a");

        Playlist last = seeded();
        c.isTrue(last.removeSong("c"), "remove last");
        c.isFalse(last.contains("c"), "hash map dropped last");
        c.eqList(Checks.ids("a", "b"), last.idsInOrder(), "order after remove last");
        c.eq("b", last.getTail().getId(), "new tail");
        c.eq("a", last.getCurrent().getId(), "current unchanged when last removed");
        c.isNull(last.nextIdOf("b"), "b is new tail");
    }

    private static void removeCurrentAndOnly(Checks c) {
        Playlist currentLast = seeded();
        currentLast.next();
        currentLast.next();
        c.eq("c", currentLast.getCurrent().getId(), "cursor on last");
        c.isTrue(currentLast.removeSong("c"), "remove current last");
        c.eq("b", currentLast.getCurrent().getId(), "current falls back to prev");

        Playlist only = new Playlist();
        only.addSong(Checks.song("z", "Zed"));
        c.isTrue(only.removeSong("z"), "remove only");
        c.isTrue(only.isEmpty(), "empty after only remove");
        c.isNull(only.getCurrent(), "no current");
        c.isNull(only.getHead(), "no head");
        c.isNull(only.getTail(), "no tail");
        c.isFalse(only.contains("z"), "hash map empty");
        c.isTrue(only.next().isEnd(), "next after only remove");
    }

    private static void nextPreviousRepeat(Checks c) {
        Playlist p = seeded();
        c.isFalse(p.isRepeatEnabled(), "repeat starts off");
        c.eq("b", p.next().getSong().getId(), "next to b");
        c.eq("c", p.next().getSong().getId(), "next to c");
        c.isTrue(p.next().isEnd(), "next at end without repeat");
        c.eq("c", p.getCurrent().getId(), "stays on last");
        c.eq("end", p.next().getStatus(), "second end still end");

        c.isTrue(p.toggleRepeat(), "repeat on");
        c.eq("a", p.next().getSong().getId(), "wraps to first");
        c.eq("b", p.next().getSong().getId(), "continues after wrap");

        c.eq("a", p.previous().getId(), "previous to a");
        c.eq("a", p.previous().getId(), "previous at beginning stays");
        c.eq("a", p.getHead().getId(), "head still a");

        c.isFalse(p.toggleRepeat(), "repeat off");
        p.next();
        p.next();
        c.isTrue(p.next().isEnd(), "end again after repeat off");
        c.eq("c", p.getCurrent().getId(), "still last");
    }

    private static Playlist seeded() {
        Playlist p = new Playlist();
        p.addSong(Checks.song("a", "Alpha"));
        p.addSong(Checks.song("b", "Beta"));
        p.addSong(Checks.song("c", "Gamma"));
        return p;
    }
}
