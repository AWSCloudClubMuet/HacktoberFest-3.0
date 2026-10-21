package com.tunewave;

import java.util.List;
import java.util.Scanner;

public class Main {

    public static void main(String[] args) {
        TuneWavePlayer player = new TuneWavePlayer();
        seedData(player);

        if (args.length > 0 && ("--demo".equals(args[0]) || "-d".equals(args[0]))) {
            runAutomatedDemo(player);
            return;
        }

        Scanner scanner = new Scanner(System.in);
        System.out.println("=============================================");
        System.out.println("         TuneWave Music Player");
        System.out.println("=============================================");
        printHelp();
        printStatus(player);

        while (true) {
            System.out.print("\ntunewave> ");
            if (!scanner.hasNextLine()) {
                break;
            }
            String input = scanner.nextLine().trim();
            if (input.isEmpty()) continue;

            String[] parts = input.split("\\s+", 2);
            String cmd = parts[0].toLowerCase();
            String arg = parts.length > 1 ? parts[1].trim() : "";

            switch (cmd) {
                case "1":
                case "play":
                    Song played = player.playNext();
                    if (played != null) {
                        System.out.println("Now playing: " + played);
                    } else {
                        System.out.println("No more songs to play.");
                    }
                    break;
                case "2":
                case "back":
                    Song replayed = player.back();
                    if (replayed != null) {
                        System.out.println("Replaying: " + replayed);
                    } else {
                        System.out.println("History is empty.");
                    }
                    break;
                case "3":
                case "next":
                    Object nextSong = player.next();
                    if ("end".equals(nextSong)) {
                        System.out.println("Reached end of playlist (repeat is OFF).");
                    } else if (nextSong != null) {
                        System.out.println("Playlist cursor moved to: " + nextSong);
                    } else {
                        System.out.println("Playlist is empty.");
                    }
                    break;
                case "4":
                case "prev":
                    Song prevSong = player.previous();
                    if (prevSong != null) {
                        System.out.println("Playlist cursor moved to: " + prevSong);
                    } else {
                        System.out.println("Playlist is empty.");
                    }
                    break;
                case "5":
                case "queue":
                    if (arg.isEmpty()) {
                        System.out.print("Enter Song ID to queue: ");
                        arg = scanner.hasNextLine() ? scanner.nextLine().trim() : "";
                    }
                    if (player.addToUpNext(arg)) {
                        System.out.println("Added song [" + arg + "] to Up Next queue.");
                    } else {
                        System.out.println("Failed: Song ID not found or invalid.");
                    }
                    break;
                case "6":
                case "search":
                    if (arg.isEmpty()) {
                        System.out.print("Enter song title: ");
                        arg = scanner.hasNextLine() ? scanner.nextLine().trim() : "";
                    }
                    List<String> foundIds = player.findSong(arg);
                    if (!foundIds.isEmpty()) {
                        System.out.println("Found matching song ID(s): " + foundIds);
                    } else {
                        System.out.println("No song found with title '" + arg + "'.");
                    }
                    break;
                case "7":
                case "prefix":
                    if (arg.isEmpty()) {
                        System.out.print("Enter prefix: ");
                        arg = scanner.hasNextLine() ? scanner.nextLine().trim() : "";
                    }
                    List<String> prefixTitles = player.prefixSearch(arg);
                    if (!prefixTitles.isEmpty()) {
                        System.out.println("Matches for '" + arg + "':");
                        for (String t : prefixTitles) {
                            System.out.println("  - " + t);
                        }
                    } else {
                        System.out.println("No songs found matching prefix '" + arg + "'.");
                    }
                    break;
                case "8":
                case "rec":
                    if (arg.isEmpty()) {
                        System.out.print("Enter artist name: ");
                        arg = scanner.hasNextLine() ? scanner.nextLine().trim() : "";
                    }
                    List<String> recs = player.recommendArtists(arg);
                    if (!recs.isEmpty()) {
                        System.out.println("Recommendations (2 hops from " + arg + "): " + recs);
                    } else {
                        System.out.println("No recommendations found for '" + arg + "'.");
                    }
                    break;
                case "9":
                case "add":
                    System.out.print("Enter song ID: ");
                    String id = scanner.hasNextLine() ? scanner.nextLine().trim() : "";
                    System.out.print("Enter title: ");
                    String title = scanner.hasNextLine() ? scanner.nextLine().trim() : "";
                    System.out.print("Enter artist: ");
                    String artist = scanner.hasNextLine() ? scanner.nextLine().trim() : "";
                    Song newSong = new Song(id, title, artist, 180);
                    if (player.addSong(newSong)) {
                        System.out.println("Added: " + newSong);
                    } else {
                        System.out.println("Failed: duplicate ID or invalid.");
                    }
                    break;
                case "10":
                case "repeat":
                    boolean rep = player.toggleRepeat();
                    System.out.println("Repeat is now: " + (rep ? "ON" : "OFF"));
                    break;
                case "11":
                case "status":
                    printStatus(player);
                    break;
                case "12":
                case "demo":
                    runAutomatedDemo(new TuneWavePlayer());
                    break;
                case "help":
                    printHelp();
                    break;
                case "0":
                case "exit":
                case "quit":
                    System.out.println("Goodbye!");
                    return;
                default:
                    System.out.println("Unknown command. Type 'help' to see options.");
            }
        }
    }

    private static void seedData(TuneWavePlayer player) {
        player.addSong(new Song("S1", "Midnight City", "M83", 243));
        player.addSong(new Song("S2", "Starboy", "The Weeknd", 230));
        player.addSong(new Song("S3", "Instant Crush", "Daft Punk", 337));

        Song bonus = new Song("S99", "Get Lucky", "Daft Punk", 248);
        player.getMusicCatalog().registerSong(bonus);

        player.addSong("Bohemian Rhapsody", "Q01");
        player.addSong("Boulevard of Broken Dreams", "GD01");
        player.addSong("Borderline", "TI01");
        player.addSong("Born to Run", "BS01");
        player.addSong("Borderline", "MAD01");

        player.addRelation("The Weeknd", "Daft Punk");
        player.addRelation("The Weeknd", "Kendrick Lamar");
        player.addRelation("Daft Punk", "Justice");
        player.addRelation("Daft Punk", "Giorgio Moroder");
        player.addRelation("Kendrick Lamar", "SZA");
    }

    private static void printHelp() {
        System.out.println("\nCommands:");
        System.out.println("  1. play     - Play next song (Up Next queue first, then playlist)");
        System.out.println("  2. back     - Replay previous song from history");
        System.out.println("  3. next     - Move to next song in playlist");
        System.out.println("  4. prev     - Move to previous song in playlist");
        System.out.println("  5. queue    - Add song to Up Next by ID (try: queue S99)");
        System.out.println("  6. search   - Search song by title (try: search Borderline)");
        System.out.println("  7. prefix   - Prefix search (try: prefix Bo)");
        System.out.println("  8. rec      - Recommend artists (try: rec The Weeknd)");
        System.out.println("  9. add      - Add new song to playlist");
        System.out.println("  10. repeat  - Toggle repeat mode ON/OFF");
        System.out.println("  11. status  - Show current player status");
        System.out.println("  12. demo    - Run quick automated demo");
        System.out.println("  0. exit     - Quit");
    }

    private static void printStatus(TuneWavePlayer player) {
        System.out.println("\n--- Player Status ---");
        System.out.println("Currently Playing : " + (player.getCurrentlyPlaying() != null ? player.getCurrentlyPlaying() : "None"));
        System.out.println("Playlist Cursor   : " + (player.getPlaylistCursor() != null ? player.getPlaylistCursor() : "None"));
        System.out.println("Repeat Mode       : " + (player.isRepeat() ? "ON" : "OFF"));
        System.out.println("Up Next Queue     : " + player.getPlaybackManager().getUpNextQueue());
        System.out.println("History (last 10) : " + player.getPlaybackManager().getHistoryStack());
    }

    private static void runAutomatedDemo(TuneWavePlayer player) {
        if (player.getPlaylistManager().isEmpty()) {
            seedData(player);
        }
        System.out.println("\n--- Automated Demo ---");
        System.out.println("Initial song: " + player.getPlaylistCursor());
        System.out.println("Next: " + player.next());
        System.out.println("Next: " + player.next());
        System.out.println("Next at end (repeat off): " + player.next());

        player.toggleRepeat();
        System.out.println("Next at end (repeat on): " + player.next());
        System.out.println("Previous at start (repeat on): " + player.previous());

        player.removeSong("S2");
        System.out.println("Removed S2, current cursor: " + player.getPlaylistCursor());

        player.addToUpNext("S99");
        System.out.println("Cursor before queue play: " + player.getPlaylistCursor());
        System.out.println("Playing next (queued): " + player.playNext());
        System.out.println("Cursor after queue play: " + player.getPlaylistCursor());
        System.out.println("Playing next (resumes playlist): " + player.playNext());
        System.out.println("Back (replays previous): " + player.back());
        System.out.println("Currently playing: " + player.getCurrentlyPlaying());

        System.out.println("Search 'Borderline': " + player.findSong("Borderline"));
        System.out.println("Prefix search 'Bo': " + player.prefixSearch("Bo"));
        System.out.println("Recommendations for 'The Weeknd': " + player.recommendArtists("The Weeknd"));
    }
}
