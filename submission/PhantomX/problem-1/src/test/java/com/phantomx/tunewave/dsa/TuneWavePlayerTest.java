package com.phantomx.tunewave.dsa;

final class TuneWavePlayerTest {
    static int run() {
        Checks c = new Checks();
        TuneWavePlayer player = new TuneWavePlayer();
        c.isTrue(player.addSong(Checks.song("1", "Helium")), "add helium");
        c.isTrue(player.addSong(Checks.song("2", "Halo")), "add halo");
        c.isFalse(player.addSong(Checks.song("1", "Other")), "duplicate id rejected");
        c.eqList(Checks.ids("1"), player.findSong("Helium"), "catalog got helium");
        c.eqList(Checks.ids("Halo", "Helium"), player.prefixSearch("H"), "prefix via facade");

        player.addToUpNext("99");
        PlayResult queued = player.playNext();
        c.eq("99", queued.getSongId(), "queue via facade");
        c.eq("1", player.playlist().getCurrent().getId(), "facade queue keeps cursor");

        player.addRelation("Nova", "Orbit");
        player.addRelation("Orbit", "Quasar");
        c.eqList(Checks.ids("Quasar"), player.recommendArtists("Nova"), "graph via facade");

        c.isTrue(player.toggleRepeat(), "repeat via facade");
        c.isTrue(player.removeSong("1"), "remove helium");
        c.eq(0, Integer.valueOf(player.findSong("Helium").size()), "catalog dropped helium");
        c.eqList(Checks.ids("Halo"), player.prefixSearch("H"), "prefix after remove");
        c.printSummary("TuneWavePlayerTest");
        return c.failed();
    }
}
