package com.phantomx.tunewave.dsa;

final class ArtistGraphTest {
    static int run() {
        Checks c = new Checks();
        noRelations(c);
        oneRelation(c);
        chain(c);
        triangle(c);
        duplicateRelationAndPaths(c);
        alphabeticalTwoHop(c);
        c.printSummary("ArtistGraphTest");
        return c.failed();
    }

    private static void noRelations(Checks c) {
        ArtistGraph g = new ArtistGraph();
        c.eq(0, Integer.valueOf(g.recommendArtists("A").size()), "unknown artist");
        c.eq(0, Integer.valueOf(g.recommendArtists(null).size()), "null artist");
        c.isFalse(g.areRelated("A", "B"), "no edge");
        g.addRelation("", "A");
        g.addRelation("A", "");
        c.isFalse(g.areRelated("", "A"), "empty name ignored");
    }

    private static void oneRelation(Checks c) {
        ArtistGraph g = new ArtistGraph();
        g.addRelation("A", "B");
        c.isTrue(g.areRelated("A", "B"), "A-B");
        c.isTrue(g.areRelated("B", "A"), "B-A undirected");
        c.eq(0, Integer.valueOf(g.recommendArtists("A").size()), "direct neighbor not recommended");
        c.eq(0, Integer.valueOf(g.recommendArtists("B").size()), "other end also empty");
        g.addRelation("A", "A");
        c.isFalse(g.areRelated("A", "A"), "self-loop ignored");
    }

    private static void chain(Checks c) {
        ArtistGraph g = new ArtistGraph();
        g.addRelation("A", "B");
        g.addRelation("B", "C");
        c.eqList(Checks.ids("C"), g.recommendArtists("A"), "A two hops to C");
        c.eqList(Checks.ids("A"), g.recommendArtists("C"), "C two hops to A");
        c.eq(0, Integer.valueOf(g.recommendArtists("B").size()), "B has only directs");
        c.isFalse(g.areRelated("A", "C"), "A not direct to C");
    }

    private static void triangle(Checks c) {
        ArtistGraph g = new ArtistGraph();
        g.addRelation("A", "B");
        g.addRelation("B", "C");
        g.addRelation("C", "A");
        c.eq(0, Integer.valueOf(g.recommendArtists("A").size()), "triangle: two-hop is also direct");
        c.eq(0, Integer.valueOf(g.recommendArtists("B").size()), "triangle B");
        c.eq(0, Integer.valueOf(g.recommendArtists("C").size()), "triangle C");
    }

    private static void duplicateRelationAndPaths(Checks c) {
        ArtistGraph g = new ArtistGraph();
        g.addRelation("A", "B");
        g.addRelation("A", "B");
        g.addRelation("B", "A");
        c.isTrue(g.areRelated("A", "B"), "still one undirected edge");
        c.eq(0, Integer.valueOf(g.recommendArtists("A").size()), "no two-hop yet");

        g.addRelation("B", "C");
        g.addRelation("A", "D");
        g.addRelation("D", "C");
        c.eqList(Checks.ids("C"), g.recommendArtists("A"), "diamond collapses C");
        c.eqList(Checks.ids("A"), g.recommendArtists("C"), "reverse diamond A");
    }

    private static void alphabeticalTwoHop(Checks c) {
        ArtistGraph g = new ArtistGraph();
        g.addRelation("Root", "Mid");
        g.addRelation("Mid", "Zed");
        g.addRelation("Mid", "Mango");
        g.addRelation("Mid", "Ash");
        c.eqList(Checks.ids("Ash", "Mango", "Zed"), g.recommendArtists("Root"), "alpha order");
        c.isFalse(g.recommendArtists("Root").contains("Root"), "source excluded");
        c.isFalse(g.recommendArtists("Root").contains("Mid"), "direct excluded");
    }
}
