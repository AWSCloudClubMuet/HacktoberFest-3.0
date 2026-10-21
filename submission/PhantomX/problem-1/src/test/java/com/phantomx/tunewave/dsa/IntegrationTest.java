package com.phantomx.tunewave.dsa;

final class IntegrationTest {
    static int run() {
        Checks c = new Checks();
        TuneWavePlayer player = new TuneWavePlayer();

        player.addSong(new Song("1", "Midnight", "Nova"));
        player.addSong(new Song("2", "Blue Moon", "Orbit"));
        player.addSong(new Song("3", "Brave Heart", "Vega"));
        player.addSong(new Song("4", "Golden Hour", "Lyra"));
        for (int i = 5; i <= 12; i++) {
            player.addSong(new Song(Integer.toString(i), "Track " + i, "Extra"));
        }
        c.eq(12, Integer.valueOf(player.playlist().size()), "1-2 created playlist");
        c.eq("1", player.playlist().getCurrent().getId(), "starts on first");

        c.eq("2", player.next().getSong().getId(), "3 next");
        c.eq("1", player.previous().getId(), "3 previous restores first");

        while (!player.next().isEnd()) {
            // walk to last
        }
        c.eq("12", player.playlist().getCurrent().getId(), "5 at last song");
        c.isTrue(player.next().isEnd(), "5 next at end without repeat");
        c.eq("12", player.playlist().getCurrent().getId(), "5 cursor stays last");

        c.isTrue(player.toggleRepeat(), "4 repeat ON");
        c.eq("1", player.next().getSong().getId(), "4 wrap to first");
        c.isFalse(player.toggleRepeat(), "4 repeat OFF");

        c.isTrue(player.removeSong("12"), "6 remove last");
        c.isTrue(player.removeSong("6"), "6 remove middle");
        c.isTrue(player.removeSong("1"), "6 remove first / current");
        c.isFalse(player.playlist().contains("1"), "6 playlist dropped 1");
        c.eq(0, Integer.valueOf(player.findSong("Midnight").size()), "6 catalog dropped Midnight");
        c.eq("2", player.playlist().getCurrent().getId(), "6 cursor after removing current");
        c.eqList(Checks.ids("Blue Moon", "Brave Heart"), player.prefixSearch("B"), "6 prefix still valid");

        String cursor = player.playlist().getCurrent().getId();
        player.addToUpNext("A");
        player.addToUpNext("B");
        c.eq("A", player.playNext().getSongId(), "8 play queue A");
        c.eq(cursor, player.playlist().getCurrent().getId(), "9 cursor after A");
        c.eq("B", player.playNext().getSongId(), "8 play queue B");
        c.eq(cursor, player.playlist().getCurrent().getId(), "9 cursor after B");

        PlayResult continued = player.playNext();
        c.eq("3", continued.getSongId(), "10 playlist continuation");
        c.eq("3", player.playlist().getCurrent().getId(), "10 cursor moved on playlist play");

        TuneWavePlayer historyPlayer = new TuneWavePlayer();
        for (int i = 0; i < 12; i++) {
            historyPlayer.addSong(new Song("h" + i, "H" + i));
        }
        for (int i = 0; i < 11; i++) {
            historyPlayer.playNext();
        }
        c.eq(10, Integer.valueOf(historyPlayer.playback().historySize()), "12-13 history capped");
        c.eq("h1", historyPlayer.playback().historyOldestFirst().get(0), "13 oldest dropped");
        c.eq("h10", historyPlayer.back().getSongId(), "14 back LIFO");
        c.eq("h11", historyPlayer.playlist().getCurrent().getId(), "14 back keeps cursor");

        c.eqList(Checks.ids("2"), player.findSong("Blue Moon"), "15 findSong");
        c.eqList(Checks.ids("Blue Moon", "Brave Heart"), player.prefixSearch("B"), "16-17 prefix alpha");

        player.addRelation("Nova", "Orion");
        player.addRelation("Nova", "Vega");
        player.addRelation("Orion", "Quasar");
        player.addRelation("Vega", "Lyra");
        c.eqList(Checks.ids("Lyra", "Quasar"), player.recommendArtists("Nova"), "18-22 two-hop alpha");
        c.isFalse(player.recommendArtists("Nova").contains("Orion"), "21 direct excluded");
        c.isFalse(player.recommendArtists("Nova").contains("Nova"), "21 self excluded");

        c.printSummary("IntegrationTest");
        return c.failed();
    }
}
