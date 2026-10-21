package tunewave.demo;

import tunewave.model.Song;
import tunewave.player.TuneWavePlayer;

import java.util.List;
import java.util.Scanner;

/**
 * Interactive console for the TuneWave music player.
 *
 * Start screen: welcome banner -> what is playing now -> the playlist -> commands.
 * After every action a short status line shows what is playing and what is queued.
 * Output is plain ASCII so it displays correctly in any Windows/Mac/Linux terminal.
 */
public class TuneWaveDemo {

    private static final String LINE = "=====================================================================";
    private static final String THIN = "---------------------------------------------------------------------";

    public static void main(String[] args) {
        TuneWavePlayer player = new TuneWavePlayer();
        seedSampleData(player);

        printWelcome();

        if (args.length > 0 && args[0].equalsIgnoreCase("--automated")) {
            runAutomatedWalkthrough(player);
            return;
        }

        printNowPlaying(player);
        printPlaylist(player);
        printHelp();
        runInteractiveRepl(player);
    }

    // ------------------------------------------------------------------
    // Sample data
    // ------------------------------------------------------------------

    private static void seedSampleData(TuneWavePlayer player) {
        player.addSong(new Song("S1", "Bohemian Rhapsody", "Queen", 354));
        player.addSong(new Song("S2", "Blinding Lights", "The Weeknd", 200));
        player.addSong(new Song("S3", "Shape of You", "Ed Sheeran", 233));
        player.addSong(new Song("S4", "Bad Guy", "Billie Eilish", 194));
        player.addSong(new Song("S5", "Believer", "Imagine Dragons", 204));
        player.addSong(new Song("S6", "Demons", "Imagine Dragons", 177));
        player.addSong(new Song("S7", "Despacito", "Luis Fonsi", 228));
        player.addSong(new Song("S8", "Someone Like You", "Adele", 285));

        // Queen cluster
        player.addRelation("Queen", "David Bowie");
        player.addRelation("Queen", "The Beatles");
        player.addRelation("Queen", "Elton John");

        // Ed Sheeran cluster
        player.addRelation("Ed Sheeran", "Taylor Swift");
        player.addRelation("Ed Sheeran", "Shawn Mendes");
        player.addRelation("Ed Sheeran", "Justin Bieber");

        // Taylor Swift cluster
        player.addRelation("Taylor Swift", "Selena Gomez");
        player.addRelation("Taylor Swift", "Phoebe Bridgers");

        // Shawn Mendes cluster
        player.addRelation("Shawn Mendes", "Camila Cabello");
        player.addRelation("Shawn Mendes", "Charlie Puth");

        // Imagine Dragons cluster
        player.addRelation("Imagine Dragons", "OneRepublic");
        player.addRelation("OneRepublic", "Maroon 5");
        player.addRelation("Maroon 5", "Coldplay");
    }

    // ------------------------------------------------------------------
    // Screens
    // ------------------------------------------------------------------

    private static void printWelcome() {
        System.out.println(LINE);
        System.out.println("   WELCOME TO TUNEWAVE - Music Streaming Core");
        System.out.println("   Playlist, Up Next queue, History, Search, Artist suggestions");
        System.out.println(LINE);
    }

    private static String describe(Song s) {
        return s.getTitle() + " - " + s.getArtist() + " [" + s.getFormattedDuration() + "]";
    }

    /** What is playing right now, plus repeat state. */
    private static void printNowPlaying(TuneWavePlayer player) {
        System.out.println();
        System.out.println("NOW PLAYING");
        Song playing = player.getCurrentlyPlaying();
        System.out.println("  " + (playing != null ? "> " + describe(playing) : "(nothing playing)"));
        System.out.println("  Repeat: " + (player.isRepeat() ? "ON (last song wraps to first)"
                                                              : "OFF (stops at the last song)"));
    }

    /** Numbered playlist with IDs, so the user knows what to type for queue / remove. */
    private static void printPlaylist(TuneWavePlayer player) {
        System.out.println();
        System.out.println("PLAYLIST   (ID is what you type for 'queue' and 'remove')");
        List<Song> playlist = player.getPlaylistSongs();
        if (playlist.isEmpty()) {
            System.out.println("  (empty - add a song with: add <title> | <artist> | <id>)");
            return;
        }
        Song pos = player.getCurrentPlaylistSong();
        Song playing = player.getCurrentlyPlaying();
        for (int i = 0; i < playlist.size(); i++) {
            Song s = playlist.get(i);
            boolean atPos = pos != null && pos.getSongId().equals(s.getSongId());
            boolean isPlaying = playing != null && playing.getSongId().equals(s.getSongId());
            String marker = isPlaying ? ">" : " ";
            String note = "";
            if (atPos && !isPlaying) note = "   <- playlist position (a queued/replayed song is playing)";
            System.out.printf("  %s %2d. %-20s %-16s [%-3s]%s%n",
                    marker, i + 1, s.getTitle(), s.getArtist(), s.getSongId(), note);
        }
    }

    /** Up Next queue and history, shown by 'dashboard'. */
    private static void printQueueAndHistory(TuneWavePlayer player) {
        System.out.println();
        System.out.println("UP NEXT (plays before the playlist continues)");
        List<Song> upNext = player.getUpNextSongs();
        if (upNext.isEmpty()) {
            System.out.println("  (nothing queued)");
        } else {
            for (int i = 0; i < upNext.size(); i++) {
                System.out.printf("  %d. %s%n", i + 1, describe(upNext.get(i)));
            }
        }

        System.out.println();
        System.out.println("HISTORY (last 10 played, most recent first; 'back' replays the top one)");
        List<Song> history = player.getHistorySongs();
        if (history.isEmpty()) {
            System.out.println("  (nothing yet)");
        } else {
            for (int i = 0; i < history.size(); i++) {
                System.out.printf("  %d. %s%n", i + 1, describe(history.get(i)));
            }
        }
    }

    /** Full screen: now playing, playlist, queue, history. */
    public static void printPlayerDashboard(TuneWavePlayer player) {
        System.out.println();
        System.out.println(THIN);
        printNowPlaying(player);
        printPlaylist(player);
        printQueueAndHistory(player);
        System.out.println(THIN);
    }

    /** Two-line status shown after every action. */
    private static void printStatus(TuneWavePlayer player) {
        Song playing = player.getCurrentlyPlaying();
        System.out.println("  Now playing: " + (playing != null ? describe(playing) : "(nothing)"));
        List<Song> upNext = player.getUpNextSongs();
        if (upNext.isEmpty()) {
            System.out.println("  Up next    : (nothing queued - playlist continues)");
        } else {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < upNext.size(); i++) {
                if (i > 0) sb.append(", ");
                sb.append(upNext.get(i).getTitle());
            }
            System.out.println("  Up next    : " + sb);
        }
    }

    private static void printHelp() {
        System.out.println();
        System.out.println("COMMANDS  (type one, then press Enter)");
        System.out.println("  Playing");
        System.out.println("    next                     go to the next song in the playlist");
        System.out.println("    prev                     go to the previous song");
        System.out.println("    playnext                 play the next song (queued songs first)");
        System.out.println("    back                     replay the song you heard before");
        System.out.println("    repeat                   turn repeat on / off");
        System.out.println("  Playlist");
        System.out.println("    add <title> | <artist> | <id>     e.g.  add Hello | Adele | S9");
        System.out.println("    remove <id>              e.g.  remove S3");
        System.out.println("    queue <id>               play a song next, e.g.  queue S7");
        System.out.println("  Search");
        System.out.println("    find <title>             exact title, e.g.  find Believer");
        System.out.println("    search <start of title>  e.g.  search Be");
        System.out.println("  Artists");
        System.out.println("    relate <artist> | <artist>   e.g.  relate Adele | Coldplay");
        System.out.println("    recommend <artist>       artists you may like, e.g.  recommend Ed Sheeran");
        System.out.println("  Other");
        System.out.println("    dashboard   show everything     help   show this list");
        System.out.println("    demo        automatic tour      exit   quit");
    }

    // ------------------------------------------------------------------
    // Interactive loop
    // ------------------------------------------------------------------

    private static void runInteractiveRepl(TuneWavePlayer player) {
        Scanner scanner = new Scanner(System.in);

        while (true) {
            System.out.print("\ntunewave> ");
            if (!scanner.hasNextLine()) break;
            String line = scanner.nextLine().trim();
            if (line.isEmpty()) continue;

            String[] parts = line.split("\\s+", 2);
            String command = parts[0].toLowerCase();
            String arg = (parts.length > 1) ? parts[1].trim() : "";

            switch (command) {
                case "next":
                    Object nextResult = player.next();
                    if ("end".equals(nextResult)) {
                        System.out.println("End of playlist. Turn on 'repeat' to wrap around to the first song.");
                    } else {
                        System.out.println("Next song:");
                    }
                    printStatus(player);
                    break;

                case "prev":
                case "previous":
                    Object prevResult = player.previous();
                    System.out.println(prevResult == null ? "The playlist is empty." : "Previous song:");
                    printStatus(player);
                    break;

                case "playnext":
                    Object playNextResult = player.playNext();
                    if ("end".equals(playNextResult)) {
                        System.out.println("End of playlist and nothing queued. Turn on 'repeat' to wrap around.");
                    } else {
                        System.out.println("Playing:");
                    }
                    printStatus(player);
                    break;

                case "back":
                    Object backResult = player.back();
                    if (backResult == null) {
                        System.out.println("History is empty - there is nothing to go back to.");
                    } else {
                        System.out.println("Replaying from history:");
                    }
                    printStatus(player);
                    break;

                case "repeat":
                    boolean rep = player.toggleRepeat();
                    System.out.println("Repeat is now " + (rep ? "ON: the last song wraps to the first."
                                                               : "OFF: playback stops at the last song."));
                    break;

                case "queue":
                    if (arg.isEmpty()) {
                        System.out.println("Which song? Type: queue <id>   (IDs are in the playlist list, e.g. queue S7)");
                    } else if (player.addToUpNext(arg)) {
                        Song q = player.getSongFromCatalog(arg);
                        System.out.println("Queued '" + (q != null ? q.getTitle() : arg)
                                + "'. It will play before the playlist continues (use 'playnext').");
                        printStatus(player);
                    } else {
                        System.out.println("No song with ID '" + arg + "'. Type 'dashboard' to see the IDs.");
                    }
                    break;

                case "add":
                    if (arg.isEmpty()) {
                        System.out.println("Type: add <title> | <artist> | <id>   e.g.  add Hello | Adele | S9");
                    } else {
                        String[] sParts = arg.split("\\|");
                        String title = sParts[0].trim();
                        String artist = sParts.length > 1 ? sParts[1].trim() : "Unknown";
                        String id = sParts.length > 2 ? sParts[2].trim() : "S" + System.currentTimeMillis() % 1000;
                        if (title.isEmpty() || id.isEmpty()) {
                            System.out.println("A song needs a title and an ID.  e.g.  add Hello | Adele | S9");
                        } else if (player.addSong(new Song(id, title, artist))) {
                            System.out.printf("Added '%s' by %s (ID %s) to the end of the playlist.%n", title, artist, id);
                        } else {
                            System.out.printf("ID '%s' is already in the playlist, so nothing was added. Pick a new ID.%n", id);
                        }
                    }
                    break;

                case "remove":
                    if (arg.isEmpty()) {
                        System.out.println("Type: remove <id>   e.g.  remove S3");
                    } else if (player.removeSong(arg)) {
                        System.out.println("Removed song ID '" + arg + "' from the playlist.");
                        printStatus(player);
                    } else {
                        System.out.println("No song with ID '" + arg + "' in the playlist. Type 'dashboard' to see the IDs.");
                    }
                    break;

                case "find":
                    if (arg.isEmpty()) {
                        System.out.println("Type: find <title>   e.g.  find Believer");
                    } else {
                        Song found = player.findSong(arg);
                        if (found != null) {
                            System.out.println("Found: " + describe(found) + "  (ID " + found.getSongId() + ")");
                        } else {
                            System.out.println("No song titled '" + arg + "'. Try 'search' with the first letters.");
                        }
                    }
                    break;

                case "search":
                case "prefix":
                    if (arg.isEmpty()) {
                        System.out.println("Type: search <start of title>   e.g.  search Be");
                    } else {
                        List<String> results = player.prefixSearch(arg);
                        if (results.isEmpty()) {
                            System.out.println("No titles start with '" + arg + "'.");
                        } else {
                            System.out.println(results.size() + " title(s) start with '" + arg + "' (A-Z):");
                            for (int i = 0; i < results.size(); i++) {
                                System.out.printf("  %d. %s%n", i + 1, results.get(i));
                            }
                        }
                    }
                    break;

                case "recommend":
                    if (arg.isEmpty()) {
                        System.out.println("Type: recommend <artist>   e.g.  recommend Ed Sheeran");
                    } else {
                        List<String> recs = player.recommendArtists(arg);
                        if (recs.isEmpty()) {
                            System.out.println("No suggestions for '" + arg
                                    + "' yet. Link artists first with: relate <artist> | <artist>");
                        } else {
                            System.out.println("Artists you may like, based on '" + arg + "' (A-Z):");
                            for (String r : recs) {
                                System.out.println("  * " + r);
                            }
                        }
                    }
                    break;

                case "relate":
                    String[] rel = arg.split("\\|");
                    if (rel.length < 2 || rel[0].trim().isEmpty() || rel[1].trim().isEmpty()) {
                        System.out.println("Type: relate <artist> | <artist>   e.g.  relate Adele | Coldplay");
                    } else {
                        player.addRelation(rel[0].trim(), rel[1].trim());
                        System.out.printf("Linked %s <-> %s.%n", rel[0].trim(), rel[1].trim());
                    }
                    break;

                case "dashboard":
                    printPlayerDashboard(player);
                    break;

                case "demo":
                    runAutomatedWalkthrough(player);
                    break;

                case "help":
                    printHelp();
                    break;

                case "exit":
                case "quit":
                    System.out.println("Goodbye from TuneWave!");
                    return;

                default:
                    System.out.println("I don't know '" + command + "'. Type 'help' to see the commands.");
            }
        }
    }

    // ------------------------------------------------------------------
    // Automatic tour (java ... TuneWaveDemo --automated, or type 'demo')
    // ------------------------------------------------------------------

    private static void runAutomatedWalkthrough(TuneWavePlayer player) {
        System.out.println("\n" + THIN);
        System.out.println("  AUTOMATIC TOUR");
        System.out.println(THIN);

        System.out.println("\n[1] Playlist");
        System.out.println("Current song: " + player.getCurrentPlaylistSong());
        System.out.println("-> next()");
        player.next();
        System.out.println("Now at: " + player.getCurrentPlaylistSong());
        System.out.println("-> toggleRepeat()");
        player.toggleRepeat();
        System.out.println("Repeat: " + player.isRepeat());

        System.out.println("\n[2] Up Next and History");
        System.out.println("-> addToUpNext(\"S7\")  (Despacito)");
        player.addToUpNext("S7");
        System.out.println("Playlist position before playNext(): " + player.getCurrentPlaylistSong().getTitle());
        Object playing = player.playNext();
        System.out.println("-> playNext() plays: " + playing);
        System.out.println("Playlist position after playNext():  " + player.getCurrentPlaylistSong().getTitle()
                + "  (unchanged)");
        Object back = player.back();
        System.out.println("-> back() replays: " + back);

        System.out.println("\n[3] Search and Artists");
        System.out.println("-> prefixSearch(\"B\"):  " + player.prefixSearch("B"));
        System.out.println("-> prefixSearch(\"De\"): " + player.prefixSearch("De"));
        System.out.println("-> recommendArtists(\"Ed Sheeran\"): " + player.recommendArtists("Ed Sheeran"));

        System.out.println("\n" + THIN);
        System.out.println("  TOUR COMPLETE");
        System.out.println(THIN);
    }
}
