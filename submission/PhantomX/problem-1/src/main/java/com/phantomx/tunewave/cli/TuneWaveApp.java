package com.phantomx.tunewave.cli;

import com.phantomx.tunewave.config.DemoCatalog;
import com.phantomx.tunewave.dsa.NextResult;
import com.phantomx.tunewave.dsa.PlayResult;
import com.phantomx.tunewave.dsa.PlaybackEngine;
import com.phantomx.tunewave.dsa.Playlist;
import com.phantomx.tunewave.dsa.Song;
import com.phantomx.tunewave.dsa.TuneWavePlayer;

import java.util.List;
import java.util.Scanner;

public final class TuneWaveApp {
    private static final String RULE = "------------------------------------------------------------";
    private static final String BAR = "============================================================";
    private static int nextId = 1;

    public static void main(String[] args) {
        if (args.length > 0) {
            if ("demo".equalsIgnoreCase(args[0])) {
                runDemo();
                return;
            }
            System.out.println("Usage: java com.phantomx.tunewave.TuneWaveApp [demo]");
            return;
        }
        runInteractive();
    }

    private static void runInteractive() {
        TuneWavePlayer player = seededPlayer();
        Scanner in = new Scanner(System.in);
        System.out.println(BAR);
        System.out.println("                    TUNEWAVE MUSIC PLAYER");
        System.out.println("Type a number, then press Enter. 0 quits.");
        System.out.println(BAR);
        printStatus(player);

        while (true) {
            System.out.println();
            System.out.println(" 1 add song          2 remove song       3 next");
            System.out.println(" 4 previous          5 toggle repeat     6 queue song (by name)");
            System.out.println(" 7 play next         8 back              9 find song");
            System.out.println("10 prefix search    11 add relation     12 recommend artists");
            System.out.println("13 show status      14 auto demo         0 quit");
            System.out.print("> ");
            if (!in.hasNextLine()) {
                break;
            }
            String choice = in.nextLine().trim();
            if (choice.isEmpty()) {
                System.out.println("Enter a number from the menu.");
                continue;
            }
            if ("0".equals(choice) || "q".equalsIgnoreCase(choice) || "quit".equalsIgnoreCase(choice)) {
                System.out.println("Bye.");
                break;
            }
            try {
                handle(choice, player, in);
            } catch (RuntimeException ex) {
                System.out.println("Could not complete that action.");
            }
        }
    }

    private static void handle(String choice, TuneWavePlayer player, Scanner in) {
        if ("1".equals(choice)) {
            action("ADD SONG", "Add a new song to the playlist.");
            String title = ask(in, "Song name: ");
            String artist = ask(in, "Artist (optional): ");
            if (title.isEmpty()) {
                System.out.println("Song name is required.");
                return;
            }
            if (idByTitle(player, title) != null) {
                System.out.println("\"" + title + "\" is already in the playlist.");
                return;
            }
            String id = "s" + (nextId++);
            boolean added = player.addSong(new Song(id, title, artist.isEmpty() ? null : artist));
            System.out.println(added ? "Added \"" + title + "\"." : "Could not add that song.");
            printStatus(player);
        } else if ("2".equals(choice)) {
            action("REMOVE SONG", "Remove a song from the playlist.");
            String title = ask(in, "Song name to remove: ");
            if (title.isEmpty()) {
                System.out.println("Song name is required.");
                return;
            }
            String id = idByTitle(player, title);
            if (id == null) {
                System.out.println("No song named \"" + title + "\".");
                return;
            }
            System.out.println(player.removeSong(id) ? "Removed \"" + title + "\"." : "Could not remove it.");
            printStatus(player);
        } else if ("3".equals(choice)) {
            action("NEXT", "Move to the next playlist song.");
            NextResult next = player.next();
            System.out.println(next.isEnd() ? "end (stayed on last song)" : label(next.getSong()));
            printStatus(player);
        } else if ("4".equals(choice)) {
            action("PREVIOUS", "Move to the previous playlist song.");
            Song prev = player.previous();
            System.out.println(prev == null ? "Playlist is empty." : label(prev));
            printStatus(player);
        } else if ("5".equals(choice)) {
            action("REPEAT", "Toggle playlist repeat mode.");
            System.out.println("Repeat " + (player.toggleRepeat() ? "ON" : "OFF"));
        } else if ("6".equals(choice)) {
            action("UP NEXT", "Add a song to the Up Next queue.");
            String title = ask(in, "Song name to queue: ");
            if (title.isEmpty()) {
                System.out.println("Song name is required.");
                return;
            }
            String id = idByTitle(player, title);
            if (id == null) {
                System.out.println("No song named \"" + title + "\".");
                return;
            }
            player.addToUpNext(id);
            System.out.println("Queued \"" + titleOf(player, id) + "\". Press 7 to play it.");
            printStatus(player);
        } else if ("7".equals(choice)) {
            action("PLAY NEXT", "Play the next queued song, or continue the playlist.");
            PlayResult result = player.playNext();
            if (result.isEnd()) {
                System.out.println("end");
            } else {
                System.out.println("Now playing: " + titleOf(player, result.getSongId()));
            }
            printStatus(player);
        } else if ("8".equals(choice)) {
            action("BACK", "Replay the most recently played song from history without moving the playlist cursor.");
            PlayResult result = player.back();
            if (result.isEmpty()) {
                System.out.println("History is empty.");
            } else {
                System.out.println("Back to: " + titleOf(player, result.getSongId()));
            }
            printStatus(player);
        } else if ("9".equals(choice)) {
            action("FIND SONG", "Find a song by its title.");
            String title = ask(in, "Song name: ");
            if (title.isEmpty()) {
                System.out.println("Song name is required.");
                return;
            }
            String id = idByTitle(player, title);
            System.out.println(id == null ? "Not found." : "Found: " + titleOf(player, id));
        } else if ("10".equals(choice)) {
            action("PREFIX SEARCH", "Find songs whose titles start with the given prefix.");
            String prefix = ask(in, "Prefix: ");
            System.out.println("Titles: " + player.prefixSearch(prefix));
        } else if ("11".equals(choice)) {
            action("ADD RELATION", "Create an undirected relationship between two artists.");
            String a = ask(in, "Artist A: ");
            String b = ask(in, "Artist B: ");
            if (a.isEmpty() || b.isEmpty()) {
                System.out.println("Both artist names are required.");
                return;
            }
            if (a.equals(b)) {
                System.out.println("Artists must be different.");
                return;
            }
            player.addRelation(a, b);
            System.out.println("Relation stored (undirected).");
        } else if ("12".equals(choice)) {
            action("RECOMMEND ARTISTS", "Find artists exactly two links away.");
            String artist = ask(in, "Artist: ");
            if (artist.isEmpty()) {
                System.out.println("Artist name is required.");
                return;
            }
            List<String> recs = player.recommendArtists(artist);
            System.out.println(recs.isEmpty() ? "No recommendations." : "Recommendations: " + recs);
        } else if ("13".equals(choice)) {
            action("STATUS", "Show the current player state.");
            printStatus(player);
        } else if ("14".equals(choice)) {
            action("DEMO", "Run the automatic demonstration.");
            runDemo();
        } else {
            System.out.println("Unknown option. Enter a number from 0 to 14.");
        }
    }

    private static void action(String tag, String description) {
        System.out.println("[" + tag + "] " + description);
    }

    private static TuneWavePlayer seededPlayer() {
        TuneWavePlayer player = new TuneWavePlayer();
        DemoCatalog.seed(player);
        nextId = DemoCatalog.size() + 1;
        return player;
    }

    private static String idByTitle(TuneWavePlayer player, String title) {
        if (title == null || title.isEmpty()) {
            return null;
        }
        List<String> exact = player.findSong(title);
        if (!exact.isEmpty()) {
            return exact.get(0);
        }
        List<String> ids = player.playlist().idsInOrder();
        for (int i = 0; i < ids.size(); i++) {
            Song song = player.playlist().getSong(ids.get(i));
            if (song != null && song.getTitle() != null && song.getTitle().equalsIgnoreCase(title)) {
                return song.getId();
            }
        }
        return null;
    }

    private static String titleOf(TuneWavePlayer player, String id) {
        Song song = player.playlist().getSong(id);
        if (song != null && song.getTitle() != null) {
            return song.getTitle();
        }
        return id;
    }

    private static String titlesOf(TuneWavePlayer player, List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return "[]";
        }
        StringBuilder text = new StringBuilder("[");
        for (int i = 0; i < ids.size(); i++) {
            if (i > 0) {
                text.append(", ");
            }
            text.append(titleOf(player, ids.get(i)));
        }
        return text.append("]").toString();
    }

    private static void printStatus(TuneWavePlayer player) {
        Playlist playlist = player.playlist();
        PlaybackEngine playback = player.playback();
        System.out.println(RULE);
        System.out.println("Playlist : " + chain(playlist));
        System.out.println("Current  : " + label(playlist.getCurrent()));
        System.out.println("Playing  : " + label(playback.getNowPlaying()));
        System.out.println("Repeat   : " + (playlist.isRepeatEnabled() ? "ON" : "OFF"));
        System.out.println("Up Next  : " + titlesOf(player, playback.upNextIds()));
        System.out.println("History  : " + titlesOf(player, playback.historyOldestFirst()));
        System.out.println(RULE);
    }

    private static String ask(Scanner in, String prompt) {
        System.out.print(prompt);
        if (!in.hasNextLine()) {
            return "";
        }
        return in.nextLine().trim();
    }

    private static void runDemo() {
        TuneWavePlayer player = new TuneWavePlayer();
        player.addSong(new Song("1", "Midnight", "Nova"));
        player.addSong(new Song("2", "Blue Moon", "Orbit"));
        player.addSong(new Song("3", "Sunset", "Quasar"));
        player.addSong(new Song("4", "Aurora", "Nova"));

        System.out.println(BAR);
        System.out.println("                    TUNEWAVE MUSIC PLAYER");
        System.out.println("                 DSA IMPLEMENTATION DEMO");
        System.out.println(BAR);

        milestone1(player);
        milestone2(player);
        milestone3(player);

        System.out.println(BAR);
        System.out.println("                      DEMO COMPLETE");
        System.out.println(BAR);
    }

    private static void milestone1(TuneWavePlayer player) {
        Playlist playlist = player.playlist();

        heading("[MILESTONE 1] PLAYLIST", "Doubly Linked List + Hash Map");
        System.out.println(RULE);
        System.out.println("Playlist");
        System.out.println(RULE);
        line("Songs", chain(playlist));
        line("IDs", playlist.idsInOrder().toString());
        line("Current", label(playlist.getCurrent()));
        line("Cursor", String.valueOf(cursor(playlist)));
        line("Repeat", playlist.isRepeatEnabled() ? "ON" : "OFF");
        System.out.println();
        System.out.println("Hash Map");
        line("Purpose", "Song ID -> Playlist Node");
        line("Status", "Active  (used for lookup and duplicate checks)");
        boolean duplicate = player.addSong(new Song("1", "Midnight", "Nova"));
        line("addSong(ID 1 again)", duplicate ? "accepted" : "rejected (duplicate ID)");

        NextResult next = player.next();
        System.out.println();
        System.out.println("> next()");
        line("Result", label(next.getSong()));
        line("Cursor", String.valueOf(cursor(playlist)));

        Song previous = player.previous();
        System.out.println();
        System.out.println("> previous()");
        line("Result", label(previous));
        line("Cursor", String.valueOf(cursor(playlist)));

        boolean repeatOn = player.toggleRepeat();
        System.out.println();
        System.out.println("> toggleRepeat()");
        line("Repeat", repeatOn ? "ON" : "OFF");
        player.toggleRepeat();
        line("Restore", "OFF");
        System.out.println();
    }

    private static void milestone2(TuneWavePlayer player) {
        Playlist playlist = player.playlist();
        PlaybackEngine playback = player.playback();

        heading("[MILESTONE 2] UP NEXT & HISTORY", "Queue + Stack");
        player.addToUpNext("bonus");
        System.out.println(RULE);
        System.out.println("Up Next Queue");
        System.out.println(RULE);
        line("Queue before playback", playback.upNextIds().toString());
        int cursorBeforeQueue = cursor(playlist);

        PlayResult queued = player.playNext();
        System.out.println();
        System.out.println("> playNext()");
        line("Source", "Up Next Queue");
        line("Result", queued.getSongId());
        line("Cursor", cursor(playlist) + " (unchanged)");
        line("Rule", "Queue playback does not move the playlist cursor");
        line("Check", cursor(playlist) == cursorBeforeQueue ? "cursor unchanged" : "cursor moved");

        PlayResult fromPlaylist = player.playNext();
        System.out.println();
        System.out.println(RULE);
        System.out.println("Playlist Playback");
        System.out.println(RULE);
        System.out.println("> playNext()");
        line("Source", "Playlist");
        line("Result", label(fromPlaylist.getSong()));
        line("Cursor", String.valueOf(cursor(playlist)));

        int cursorBeforeBack = cursor(playlist);
        PlayResult back = player.back();
        System.out.println();
        System.out.println(RULE);
        System.out.println("History Stack");
        System.out.println(RULE);
        System.out.println("> back()");
        line("Source", "History Stack");
        line("Result", back.getSongId());
        line("Cursor", cursor(playlist) + " (unchanged)");
        line("Rule", "History playback does not move the playlist cursor");
        line("Check", cursor(playlist) == cursorBeforeBack ? "cursor unchanged" : "cursor moved");
        line("History size", playback.historySize() + " / " + TuneWavePlayer.HISTORY_LIMIT);
        line("Policy", "Oldest entry removed when capacity is exceeded");
        System.out.println();
    }

    private static void milestone3(TuneWavePlayer player) {
        heading("[MILESTONE 3A] SONG SEARCH", "Binary Search Tree");
        System.out.println(RULE);
        System.out.println("Song Search");
        System.out.println(RULE);
        System.out.println("> findSong(\"Midnight\")");
        line("Search title", "Midnight");
        line("Result", player.findSong("Midnight").toString());
        line("Structure", "BST");
        System.out.println();
        System.out.println("> prefixSearch(\"B\")");
        line("Prefix", "B");
        line("Matches", player.prefixSearch("B").toString());
        line("Order", "Alphabetical");
        System.out.println();

        heading("[MILESTONE 3B] ARTIST RECOMMENDATIONS", "Undirected Graph");
        player.addRelation("Nova", "Orbit");
        player.addRelation("Orbit", "Quasar");
        System.out.println(RULE);
        System.out.println("Artist Recommendations");
        System.out.println(RULE);
        System.out.println("> recommendArtists(\"Nova\")");
        line("Artist", "Nova");
        System.out.println("Recommendation rule:");
        System.out.println("  - Exactly two links away");
        System.out.println("  - Direct relationships excluded");
        List<String> recs = player.recommendArtists("Nova");
        System.out.println("Recommended:");
        if (recs.isEmpty()) {
            System.out.println("  (none)");
        } else {
            for (int i = 0; i < recs.size(); i++) {
                System.out.println("  " + (i + 1) + ". " + recs.get(i));
            }
        }
        System.out.println();
    }

    private static void heading(String title, String structures) {
        System.out.println(title);
        System.out.println("Data Structures: " + structures);
        System.out.println();
    }

    private static void line(String key, String value) {
        String pad = key.length() >= 22 ? key : (key + "                      ").substring(0, 22);
        System.out.println(pad + ": " + value);
    }

    private static String chain(Playlist playlist) {
        List<String> ids = playlist.idsInOrder();
        StringBuilder text = new StringBuilder("[");
        for (int i = 0; i < ids.size(); i++) {
            if (i > 0) {
                text.append(" -> ");
            }
            Song song = playlist.getSong(ids.get(i));
            text.append(song == null ? ids.get(i) : song.getTitle());
        }
        return text.append("]").toString();
    }

    private static int cursor(Playlist playlist) {
        Song current = playlist.getCurrent();
        if (current == null) {
            return 0;
        }
        return playlist.idsInOrder().indexOf(current.getId()) + 1;
    }

    private static String label(Song song) {
        if (song == null) {
            return "(none)";
        }
        if (song.getArtist() != null && !song.getArtist().isEmpty()) {
            return song.getTitle() + " - " + song.getArtist();
        }
        return song.getTitle();
    }
}
