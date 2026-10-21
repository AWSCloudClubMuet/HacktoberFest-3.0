package com.phantomx.tunewave.dsa;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

final class InvariantTest {
    static int run() {
        Checks c = new Checks();
        bstInorderSorted(c);
        prefixPrunes(c);
        prefixAlphabetEnds(c);
        graphSymmetric(c);
        recInvariants(c);
        c.printSummary("InvariantTest");
        return c.failed();
    }

    private static void bstInorderSorted(Checks c) {
        SongSearchTree tree = new SongSearchTree();
        String[] titles = {
                "Midnight", "Blue Moon", "Brave Heart", "Golden Hour",
                "Aurora", "Sunset", "Echo", "Helium", "a-long-title-xxxxxxxx"
        };
        for (int i = 0; i < titles.length; i++) {
            tree.addSong(titles[i], "id" + i);
        }
        List<String> inorder = tree.prefixSearch("");
        List<String> sorted = new ArrayList<String>(inorder);
        Collections.sort(sorted);
        c.eqList(sorted, inorder, "in-order is alphabetical");
        c.eq(Integer.valueOf(titles.length), Integer.valueOf(tree.uniqueTitleCount()), "title count");
        c.eq(0, Integer.valueOf(tree.findSong("MIDNIGHT").size()), "case-sensitive miss");
    }

    private static void prefixPrunes(Checks c) {
        SongSearchTree tree = new SongSearchTree();
        tree.addSong("Midnight", "m");
        tree.addSong("Blue Moon", "bm");
        tree.addSong("Sunset", "s");
        tree.addSong("Aurora", "a");
        tree.addSong("Brave Heart", "bh");
        tree.prefixSearch("Z");
        c.isTrue(tree.lastPrefixVisits() < tree.uniqueTitleCount(), "prefix Z visits fewer than n");
        c.eq(0, Integer.valueOf(tree.prefixSearch("Z").size()), "prefix Z no matches");
        List<String> bees = tree.prefixSearch("B");
        c.eqList(Checks.ids("Blue Moon", "Brave Heart"), bees, "prefix B many");
        c.eqList(Checks.ids("Aurora"), tree.prefixSearch("A"), "prefix start of alphabet");
        c.eqList(Checks.ids("Sunset"), tree.prefixSearch("S"), "prefix later letter");
        c.eq(0, Integer.valueOf(tree.prefixSearch("Q").size()), "prefix nothing");
        c.eq(5, Integer.valueOf(tree.prefixSearch("").size()), "empty prefix all");
    }

    private static void prefixAlphabetEnds(Checks c) {
        SongSearchTree tree = new SongSearchTree();
        tree.addSong("Alpha", "1");
        tree.addSong("Zulu", "2");
        c.eqList(Checks.ids("Alpha"), tree.prefixSearch("Al"), "one match");
        c.eqList(Checks.ids("Zulu"), tree.prefixSearch("Zu"), "end of alphabet");
    }

    private static void graphSymmetric(Checks c) {
        ArtistGraph graph = new ArtistGraph();
        graph.addRelation("Nova", "Orion");
        graph.addRelation("Nova", "Vega");
        graph.addRelation("Orion", "Quasar");
        graph.addRelation("Vega", "Lyra");
        graph.addRelation("Nova", "Orion");
        List<String> artists = graph.artists();
        for (int i = 0; i < artists.size(); i++) {
            String a = artists.get(i);
            List<String> neighbors = graph.neighbors(a);
            for (int j = 0; j < neighbors.size(); j++) {
                String b = neighbors.get(j);
                c.isTrue(graph.areRelated(b, a), "undirected " + a + "-" + b);
            }
        }
        c.eq(4, Integer.valueOf(graph.edgeCount()), "four unique undirected edges");
    }

    private static void recInvariants(Checks c) {
        ArtistGraph graph = new ArtistGraph();
        graph.addRelation("Nova", "Orion");
        graph.addRelation("Nova", "Vega");
        graph.addRelation("Orion", "Quasar");
        graph.addRelation("Vega", "Lyra");
        List<String> recs = graph.recommendArtists("Nova");
        c.eqList(Checks.ids("Lyra", "Quasar"), recs, "two-hop alpha");
        c.isFalse(recs.contains("Nova"), "no self");
        c.isFalse(recs.contains("Orion"), "no direct");
        c.isFalse(recs.contains("Vega"), "no direct vega");
        c.eq(0, Integer.valueOf(graph.recommendArtists("Unknown").size()), "unknown artist");
        c.eq(0, Integer.valueOf(new ArtistGraph().recommendArtists("X").size()), "empty graph");
        List<String> copy = new ArrayList<String>(recs);
        Collections.sort(copy);
        c.eqList(copy, recs, "recs already sorted");
    }
}
