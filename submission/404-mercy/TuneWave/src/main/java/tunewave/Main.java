package tunewave;

import java.util.List;
import java.util.Scanner;

/**
 * TuneWave Music Player — Console Demo
 *
 * <p>Team: <b>404 MERCY</b>
 *
 * <p>This is a <em>DSA-based music player simulation</em>.  No real audio
 * is played; the application demonstrates the underlying data structures:
 * doubly-linked list, queue, stack, BST, and adjacency-list graph.
 *
 * <h2>How to run</h2>
 * <pre>
 *   mvn package -q
 *   java -jar target/TuneWave-1.0.0.jar
 * </pre>
 *
 * <p>The demo runs in two phases:
 * <ol>
 *   <li>Automated walkthrough — shows every milestone feature.</li>
 *   <li>Interactive menu — lets you explore the player yourself.</li>
 * </ol>
 */
public class Main {

    // Separator line used throughout the demo output.
    private static final String SEP = "─".repeat(60);

    public static void main(String[] args) {
        if (args.length > 0 && "--gui".equalsIgnoreCase(args[0])) {
            javafx.application.Application.launch(TuneWaveApp.class, args);
            return;
        }
        if (args.length > 0 && "--swing".equalsIgnoreCase(args[0])) {
            TuneWaveService service = buildSampleData();
            TuneWaveGUI.launch(service);
            return;
        }

        System.out.println(SEP);
        System.out.println("  🎵  TuneWave Music Player  |  Team 404 MERCY");
        System.out.println("  DSA-based simulation — no real audio is played.");
        System.out.println(SEP);

        TuneWaveService service = buildSampleData();

        runAutomatedDemo(service);
        runInteractiveMenu(service);
    }

    // ================================================================ sample data

    static TuneWaveService buildSampleData() {
        TuneWaveService svc = new TuneWaveService();

        // ── Songs ──────────────────────────────────────────────────────────
        Song[] songs = {
            new Song("S01", "Blinding Lights",    "The Weeknd"),
            new Song("S02", "Bohemian Rhapsody",  "Queen"),
            new Song("S03", "Shape of You",       "Ed Sheeran"),
            new Song("S04", "Rolling in the Deep","Adele"),
            new Song("S05", "Starboy",            "The Weeknd"),
            new Song("S06", "Blackbird",          "The Beatles"),
            new Song("S07", "Blue (Da Ba Dee)",   "Eiffel 65"),
            new Song("S08", "Boulevard of Broken Dreams", "Green Day"),
            new Song("S09", "Bad Guy",            "Billie Eilish"),
            new Song("S10", "Believer",           "Imagine Dragons"),
            new Song("S11", "Blueberry Hill",     "Fats Domino"),
            new Song("S12", "All of Me",          "John Legend"),
        };
        for (Song s : songs) svc.addSong(s);

        // ── Artist relations (undirected graph) ───────────────────────────
        svc.addArtistRelation("The Weeknd",     "Daft Punk");
        svc.addArtistRelation("The Weeknd",     "Drake");
        svc.addArtistRelation("Drake",          "Nicki Minaj");
        svc.addArtistRelation("Drake",          "Future");
        svc.addArtistRelation("Ed Sheeran",     "Taylor Swift");
        svc.addArtistRelation("Ed Sheeran",     "Adele");
        svc.addArtistRelation("Adele",          "Sam Smith");
        svc.addArtistRelation("Queen",          "David Bowie");
        svc.addArtistRelation("The Beatles",    "John Lennon");
        svc.addArtistRelation("Billie Eilish",  "Finneas");
        svc.addArtistRelation("Imagine Dragons","OneRepublic");
        svc.addArtistRelation("Imagine Dragons","Bastille");

        return svc;
    }

    // ================================================================ automated demo

    private static void runAutomatedDemo(TuneWaveService svc) {
        System.out.println("\n" + SEP);
        System.out.println("  AUTOMATED DEMO — Milestone walkthrough");
        System.out.println(SEP);

        // ── Milestone 1: Playlist ──────────────────────────────────────────
        section("Milestone 1 · Playlist (Doubly-Linked List + HashMap)");

        System.out.println("Playlist after adding 12 songs:");
        printPlaylist(svc);

        System.out.println("\n▶  play()  →  " + svc.play());

        System.out.println("\n▶  next()  →  " + svc.playlistNext());
        System.out.println("▶  next()  →  " + svc.playlistNext());
        System.out.println("▶  prev()  →  " + svc.playlistPrevious());
        System.out.println("▶  prev() at head  →  " + svc.playlistPrevious()); // should say "start"

        System.out.println("\nAttempt to add duplicate S01:");
        svc.addSong(new Song("S01", "Blinding Lights", "The Weeknd")); // ignored
        System.out.println("Playlist size (should still be 12): " + svc.playlistSize());

        System.out.println("\nRemoving S02 (Bohemian Rhapsody) — middle node:");
        svc.removeSongFromPlaylist("S02");
        System.out.println("Playlist size now: " + svc.playlistSize());
        printPlaylist(svc);

        System.out.println("\nToggle repeat ON: " + svc.toggleRepeat());
        // Navigate to last song
        for (int i = 0; i < svc.playlistSize(); i++) svc.playlistNext();
        System.out.println("cursor after going to end: " + svc.currentSong());
        System.out.println("▶  next() with repeat ON (should wrap) →  " + svc.playlistNext());
        System.out.println("Toggle repeat OFF: " + svc.toggleRepeat());

        // ── Milestone 2: Queue + Stack ─────────────────────────────────────
        section("Milestone 2 · Up Next Queue (FIFO) + History Stack (LIFO)");

        // Start fresh playback state by playing the current cursor song.
        Song startSong = svc.currentSong();
        svc.getPlaybackManager().setCurrentlyPlayingId(
                startSong == null ? null : startSong.getSongId());
        System.out.println("Currently playing: " + svc.currentlyPlaying());

        System.out.println("\nQueueing S09 (Bad Guy) and S10 (Believer) into Up Next…");
        svc.addToUpNext("S09");
        svc.addToUpNext("S10");
        System.out.println("Up Next queue size: " + svc.getPlaybackManager().upNextSize());

        System.out.println("\n▶  playNext() — should play queued S09 (not advance playlist cursor):");
        System.out.println("   → " + svc.playNext());
        System.out.println("   Playlist cursor still at: " + svc.currentSong());

        System.out.println("\n▶  playNext() — should play queued S10:");
        System.out.println("   → " + svc.playNext());

        System.out.println("\n▶  playNext() — queue empty, advances playlist:");
        System.out.println("   → " + svc.playNext());

        System.out.println("\n▶  playNext() — advances playlist again:");
        System.out.println("   → " + svc.playNext());

        System.out.println("\nHistory (most-recent first): " + svc.getHistoryIds());
        System.out.println("History size: " + svc.getPlaybackManager().historySize());

        System.out.println("\n▶  back() — replay previous song (playlist cursor unchanged):");
        System.out.println("   → " + svc.back());
        System.out.println("   Playlist cursor: " + svc.currentSong());

        // Test history max size (10)
        System.out.println("\nFilling history to test 10-entry cap…");
        for (int i = 0; i < 8; i++) svc.playNext();
        System.out.println("History size after many transitions (should be ≤10): "
                + svc.getPlaybackManager().historySize());

        // ── Milestone 3: BST + Graph ───────────────────────────────────────
        section("Milestone 3 · Search BST + Related-Artist Graph");

        System.out.println("── Exact search ──");
        System.out.println("Search 'shape of you'    → " + svc.searchByTitle("shape of you"));
        System.out.println("Search 'BLINDING LIGHTS' → " + svc.searchByTitle("BLINDING LIGHTS"));
        System.out.println("Search 'nonexistent'     → " + svc.searchByTitle("nonexistent"));

        System.out.println("\n── Prefix search 'bl' ──");
        List<Song> blResults = svc.prefixSearch("bl");
        blResults.forEach(s -> System.out.println("   " + s));

        System.out.println("\n── Prefix search 'B' ──");
        List<Song> bResults = svc.prefixSearch("B");
        bResults.forEach(s -> System.out.println("   " + s));

        System.out.println("\n── Prefix search '' (empty — all songs) ──");
        List<Song> allResults = svc.prefixSearch("");
        System.out.println("  Count: " + allResults.size());

        System.out.println("\n── Artist recommendations ──");
        printRecs(svc, "The Weeknd");
        printRecs(svc, "Ed Sheeran");
        printRecs(svc, "Adele");
        printRecs(svc, "Unknown Artist");

        System.out.println("\n" + SEP);
        System.out.println("  Automated demo complete.");
        System.out.println(SEP);
    }

    // ================================================================ interactive menu

    private static void runInteractiveMenu(TuneWaveService svc) {
        Scanner sc = new Scanner(System.in);
        boolean running = true;

        System.out.println("\nEntering interactive mode. Type 'help' for commands.\n");

        while (running && sc.hasNextLine()) {
            System.out.print("tunewave> ");
            String line = sc.nextLine().trim();
            if (line.isEmpty()) continue;

            String[] parts = line.split("\\s+", 2);
            String cmd = parts[0].toLowerCase();
            String arg = parts.length > 1 ? parts[1] : "";

            switch (cmd) {
                case "help" -> printHelp();
                case "list" -> printPlaylist(svc);
                case "play" -> System.out.println("Now playing: " + svc.play());
                case "next" -> System.out.println("▶ Next: " + svc.playlistNext());
                case "prev" -> System.out.println("◀ Prev: " + svc.playlistPrevious());
                case "playnext" -> System.out.println("▶ PlayNext: " + svc.playNext());
                case "back"  -> System.out.println("↩  Back: " + svc.back());
                case "repeat"-> System.out.println("Repeat: " + (svc.toggleRepeat() ? "ON" : "OFF"));
                case "queue" -> {
                    if (arg.isEmpty()) {
                        System.out.println("Up Next: " + svc.getUpNextIds());
                    } else {
                        svc.addToUpNext(arg);
                        System.out.println("Queued: " + svc.getSong(arg));
                    }
                }
                case "history" -> System.out.println("History: " + svc.getHistoryIds());
                case "search" -> {
                    if (arg.isEmpty()) System.out.println("Usage: search <title>");
                    else System.out.println("Found: " + svc.searchByTitle(arg));
                }
                case "prefix" -> {
                    List<Song> res = svc.prefixSearch(arg);
                    if (res.isEmpty()) System.out.println("No results.");
                    else res.forEach(s -> System.out.println("  " + s));
                }
                case "related" -> {
                    if (arg.isEmpty()) System.out.println("Usage: related <artist>");
                    else printRecs(svc, arg);
                }
                case "remove" -> {
                    svc.removeSongFromPlaylist(arg);
                    System.out.println("Removed '" + arg + "' from playlist.");
                }
                case "current" -> System.out.println("Currently playing: " + svc.currentlyPlaying()
                        + " | Playlist cursor: " + svc.currentSong());
                case "quit", "exit", "q" -> running = false;
                default -> System.out.println("Unknown command. Type 'help'.");
            }
        }

        System.out.println("Thanks for using TuneWave! 👋");
    }

    // ================================================================ helpers

    private static void section(String title) {
        System.out.println("\n" + SEP);
        System.out.println("  " + title);
        System.out.println(SEP);
    }

    private static void printPlaylist(TuneWaveService svc) {
        List<Song> songs = svc.getPlaylistSongs();
        Song current = svc.currentSong();
        System.out.println("  Playlist (" + songs.size() + " songs):");
        for (Song s : songs) {
            String marker = s.equals(current) ? " ◀ current" : "";
            System.out.println("    " + s + marker);
        }
    }

    private static void printRecs(TuneWaveService svc, String artist) {
        List<String> recs = svc.recommendArtists(artist);
        System.out.println("  Related to \"" + artist + "\": "
                + (recs.isEmpty() ? "(none)" : recs));
    }

    private static void printHelp() {
        System.out.println("""
                Commands:
                  list                 Show playlist
                  play                 Start playing cursor song
                  next                 Advance playlist cursor
                  prev                 Go back in playlist
                  playnext             Play from Up Next queue (or playlist)
                  back                 Replay previous history entry
                  repeat               Toggle repeat mode
                  queue [songId]       Show queue / add song to queue
                  history              Show playback history
                  search <title>       Exact title search (BST)
                  prefix <prefix>      Prefix title search (BST)
                  related <artist>     Distance-2 artist recommendations
                  remove <songId>      Remove song from playlist
                  current              Show currently playing + cursor
                  quit / exit          Exit
                """);
    }
}

