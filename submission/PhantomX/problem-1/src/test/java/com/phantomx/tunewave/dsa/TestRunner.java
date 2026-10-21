package com.phantomx.tunewave.dsa;

public final class TestRunner {
    public static int runAll() {
        int failed = 0;
        failed += PlaylistTest.run();
        failed += PlaybackEngineTest.run();
        failed += SongSearchTreeTest.run();
        failed += ArtistGraphTest.run();
        failed += TuneWavePlayerTest.run();
        failed += IntegrationTest.run();
        failed += InvariantTest.run();
        System.out.println();
        if (failed == 0) {
            System.out.println("ALL TESTS PASSED");
        } else {
            System.out.println("TESTS FAILED: " + failed);
        }
        return failed;
    }

    public static void main(String[] args) {
        int failed = runAll();
        if (failed != 0) {
            System.exit(1);
        }
    }
}
