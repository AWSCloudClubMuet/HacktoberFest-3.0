package com.phantomx.tunewave.dsa;

final class SongSearchTreeTest {
    static int run() {
        Checks c = new Checks();
        emptyTree(c);
        oneNode(c);
        exactAndMissing(c);
        prefixes(c);
        duplicateTitles(c);
        skewedTree(c);
        removeKeepsBst(c);
        c.printSummary("SongSearchTreeTest");
        return c.failed();
    }

    private static void emptyTree(Checks c) {
        SongSearchTree t = new SongSearchTree();
        c.isTrue(t.isEmpty(), "empty tree");
        c.eq(0, Integer.valueOf(t.findSong("x").size()), "find empty");
        c.eq(0, Integer.valueOf(t.prefixSearch("x").size()), "prefix empty");
        c.eq(0, Integer.valueOf(t.prefixSearch("").size()), "empty prefix on empty tree");
        c.eq(0, Integer.valueOf(t.prefixSearch(null).size()), "null prefix");
        c.isFalse(t.addSong(null, "1"), "null title");
        c.isFalse(t.addSong("x", null), "null id");
    }

    private static void oneNode(Checks c) {
        SongSearchTree t = new SongSearchTree();
        c.isTrue(t.addSong("Helium", "s1"), "insert one");
        c.eqList(Checks.ids("s1"), t.findSong("Helium"), "find one");
        c.eqList(Checks.ids("Helium"), t.prefixSearch("He"), "prefix one");
        c.eq(0, Integer.valueOf(t.prefixSearch("Z").size()), "prefix none");
    }

    private static void exactAndMissing(Checks c) {
        SongSearchTree t = balanced();
        c.eqList(Checks.ids("m"), t.findSong("Midnight"), "exact midnight");
        c.eq(0, Integer.valueOf(t.findSong("midnight").size()), "case-sensitive miss");
        c.eq(0, Integer.valueOf(t.findSong("Missing").size()), "missing title");
    }

    private static void prefixes(Checks c) {
        SongSearchTree t = balanced();
        c.eq(0, Integer.valueOf(t.prefixSearch("Zed").size()), "prefix no matches");
        c.eqList(Checks.ids("Aurora"), t.prefixSearch("Au"), "prefix one");
        c.eqList(Checks.ids("Blue Moon", "Bluebird"), t.prefixSearch("Blue"), "prefix many alpha");
        c.eqList(
                Checks.ids("Aurora", "Blue Moon", "Bluebird", "Midnight", "Sunset"),
                t.prefixSearch(""),
                "empty prefix is all titles in order");
        c.eqList(
                Checks.ids("Aurora", "Blue Moon", "Bluebird", "Midnight", "Sunset"),
                t.prefixSearch(""),
                "prefix matching all");
    }

    private static void duplicateTitles(Checks c) {
        SongSearchTree t = new SongSearchTree();
        c.isTrue(t.addSong("Echo", "e1"), "first echo");
        c.isTrue(t.addSong("Echo", "e2"), "second echo same title");
        c.isFalse(t.addSong("Echo", "e1"), "same title+id ignored");
        c.eqList(Checks.ids("e1", "e2"), t.findSong("Echo"), "both ids kept");
        c.eq(1, Integer.valueOf(t.uniqueTitleCount()), "one unique title");
        c.eqList(Checks.ids("Echo"), t.prefixSearch("E"), "prefix still one title");
    }

    private static void skewedTree(Checks c) {
        SongSearchTree t = new SongSearchTree();
        t.addSong("A", "1");
        t.addSong("B", "2");
        t.addSong("C", "3");
        t.addSong("D", "4");
        c.eqList(Checks.ids("2"), t.findSong("B"), "find in right spine");
        c.eqList(Checks.ids("A", "B", "C", "D"), t.prefixSearch(""), "inorder on skew");
        c.eqList(Checks.ids("C"), t.prefixSearch("C"), "prefix C does not include D");
        c.eqList(Checks.ids("A"), t.prefixSearch("A"), "prefix A");
        c.eq(0, Integer.valueOf(t.prefixSearch("E").size()), "prefix past the spine");
    }

    private static void removeKeepsBst(Checks c) {
        SongSearchTree t = new SongSearchTree();
        c.isFalse(t.removeSong("Missing", "1"), "remove from empty");
        t.addSong("Echo", "e1");
        t.addSong("Echo", "e2");
        c.isTrue(t.removeSong("Echo", "e1"), "remove one id");
        c.eqList(Checks.ids("e2"), t.findSong("Echo"), "remaining id");
        c.isTrue(t.removeSong("Echo", "e2"), "remove last id");
        c.eq(0, Integer.valueOf(t.findSong("Echo").size()), "title gone");
        c.isTrue(t.isEmpty(), "tree empty");

        t.addSong("M", "m");
        t.addSong("A", "a");
        t.addSong("T", "t");
        t.addSong("S", "s");
        c.isTrue(t.removeSong("M", "m"), "delete two-child root");
        c.eqList(Checks.ids("A", "S", "T"), t.prefixSearch(""), "inorder after root delete");
        c.eq(0, Integer.valueOf(t.findSong("M").size()), "root title gone");
        c.eqList(Checks.ids("s"), t.findSong("S"), "successor data kept");
    }

    private static SongSearchTree balanced() {
        SongSearchTree t = new SongSearchTree();
        t.addSong("Midnight", "m");
        t.addSong("Blue Moon", "bm");
        t.addSong("Sunset", "s");
        t.addSong("Aurora", "a");
        t.addSong("Bluebird", "bb");
        return t;
    }
}
