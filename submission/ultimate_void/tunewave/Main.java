package tunewave;

import tunewave.milestone1.Playlist;
import tunewave.milestone2.PlayHistory;
import tunewave.milestone2.TuneWavePlayer;
import tunewave.milestone3.ArtistGraph;
import tunewave.milestone3.SongSearchBST;
import tunewave.model.Song;

import java.util.List;

/**
 * Live Demonstration Application for TuneWave Music Streaming Core.
 *
 * <p>Walks through all three milestones step-by-step with clear console output:
 * <ul>
 *   <li><b>Milestone 1:</b> Doubly Linked List + Hash Map Playlist (Navigation, Repeat OFF/ON, O(1) Deletion)</li>
 *   <li><b>Milestone 2:</b> Queue + Stack (Up Next Priority, Bounded History, Back Navigation, Pointer Preservation)</li>
 *   <li><b>Milestone 3:</b> BST + Undirected Graph (Title Search, Pruned Prefix Search, 2-Hop Artist Recommendations)</li>
 * </ul>
 */
public class Main {

    public static void main(String[] args) {
        printBanner();

        demonstrateMilestone1();
        demonstrateMilestone2();
        demonstrateMilestone3();
        demonstrateUnifiedSystem();

        System.out.println("\n🎉 All milestones successfully demonstrated!");
    }

    private static void printBanner() {
        System.out.println("================================================================================");
        System.out.println("                   🎵  TuneWave Music Streaming Core  🎵                        ");
        System.out.println("      Doubly Linked List | Hash Map | Queue | Stack | BST | Undirected Graph    ");
        System.out.println("================================================================================");
    }

    private static void demonstrateMilestone1() {
        System.out.println("\n--------------------------------------------------------------------------------");
        System.out.println("🧩 MILESTONE 1: Playlist (Doubly Linked List + Hash Map)");
        System.out.println("--------------------------------------------------------------------------------");

        Playlist playlist = new Playlist();
        Song s1 = new Song("s1", "Bohemian Rhapsody", "Queen", 354);
        Song s2 = new Song("s2", "Hotel California", "Eagles", 391);
        Song s3 = new Song("s3", "Stairway to Heaven", "Led Zeppelin", 482);

        System.out.println("1. Adding songs to playlist...");
        System.out.println("   - Adding s1: " + playlist.addSong(s1));
        System.out.println("   - Adding s2: " + playlist.addSong(s2));
        System.out.println("   - Adding s3: " + playlist.addSong(s3));

        System.out.println("\n2. Duplicate Prevention Rule (O(1) Hash Map check):");
        Song s1Dup = new Song("s1", "Duplicate Bohemian Rhapsody", "Queen", 354);
        boolean duplicateAdded = playlist.addSong(s1Dup);
        System.out.println("   - Attempting to add duplicate 's1': " + duplicateAdded + " (Expected: false)");
        System.out.println("   - Current playlist size: " + playlist.size() + " songs");

        System.out.println("\n3. Navigation (Repeat is OFF by default):");
        System.out.println("   - Current: " + playlist.getCurrent().getTitle());
        System.out.println("   - next() -> " + playlist.next());
        System.out.println("   - next() -> " + playlist.next());
        System.out.println("   - next() at tail (Repeat OFF) -> Result: '" + playlist.next() + "', Current remains: " + playlist.getCurrent().getTitle());

        System.out.println("\n4. Toggling Repeat ON:");
        playlist.toggleRepeat();
        System.out.println("   - Repeat mode: " + playlist.isRepeat());
        System.out.println("   - next() at tail with repeat ON wraps to -> " + playlist.next());
        System.out.println("   - previous() -> " + playlist.previous());

        System.out.println("\n5. O(1) Removal without scanning:");
        System.out.println("   - Removing 's2' (Hotel California): " + playlist.removeSong("s2"));
        System.out.println("   - Playlist now: " + playlist.toList());
    }

    private static void demonstrateMilestone2() {
        System.out.println("\n--------------------------------------------------------------------------------");
        System.out.println("🧩 MILESTONE 2: Up Next and History (Queue + Bounded Stack)");
        System.out.println("--------------------------------------------------------------------------------");

        TuneWavePlayer player = new TuneWavePlayer();
        Song p1 = new Song("p1", "Levitating", "Dua Lipa");
        Song p2 = new Song("p2", "Save Your Tears", "The Weeknd");
        Song p3 = new Song("p3", "As It Was", "Harry Styles");

        player.addSong(p1);
        player.addSong(p2);
        player.addSong(p3);

        System.out.println("1. Playing first song from playlist:");
        System.out.println("   - playNext() -> " + player.playNext().getSong().getTitle());
        System.out.println("   - Playlist current pointer: " + player.getPlaylist().getCurrent().getTitle());

        System.out.println("\n2. Queueing songs into Up Next (Priority Queue):");
        Song q1 = new Song("q1", "Priority Track 1", "Guest Artist A");
        Song q2 = new Song("q2", "Priority Track 2", "Guest Artist B");
        player.addToUpNext(q1);
        player.addToUpNext(q2);
        System.out.println("   - Added to Up Next: " + q1.getTitle() + ", " + q2.getTitle());

        System.out.println("\n3. Playback with Up Next active:");
        System.out.println("   - playNext() -> " + player.playNext().getSong().getTitle() + " (From Up Next)");
        System.out.println("   - Playlist position unchanged: " + player.getPlaylist().getCurrent().getTitle() + " (Rule verified!)");

        System.out.println("   - playNext() -> " + player.playNext().getSong().getTitle() + " (From Up Next)");
        System.out.println("   - Playlist position unchanged: " + player.getPlaylist().getCurrent().getTitle());

        System.out.println("\n4. Up Next is empty; playlist resumes:");
        System.out.println("   - playNext() -> " + player.playNext().getSong().getTitle() + " (Playlist resumed to next track!)");
        System.out.println("   - Playlist position now: " + player.getPlaylist().getCurrent().getTitle());

        System.out.println("\n5. Back Navigation via History Stack:");
        System.out.println("   - Current play history count: " + player.getHistory().size());
        System.out.println("   - back() -> Replaying: " + player.back().getTitle());
        System.out.println("   - Playlist pointer remained at: " + player.getPlaylist().getCurrent().getTitle());

        System.out.println("\n6. Bounded History Stack (Max Capacity 10):");
        PlayHistory history = new PlayHistory(10);
        for (int i = 1; i <= 12; i++) {
            history.push(new Song("id_" + i, "Track #" + i));
        }
        System.out.println("   - Pushed 12 songs. Current size: " + history.size() + " (Oldest dropped)");
        System.out.println("   - Oldest surviving song in history: " + history.toList().get(0).getTitle());
        System.out.println("   - Newest song popped: " + history.pop().getTitle());
    }

    private static void demonstrateMilestone3() {
        System.out.println("\n--------------------------------------------------------------------------------");
        System.out.println("🧩 MILESTONE 3: Song Search & Related Artists (BST + Undirected Graph)");
        System.out.println("--------------------------------------------------------------------------------");

        System.out.println("1. Binary Search Tree (BST) Song Search:");
        SongSearchBST bst = new SongSearchBST();
        String[][] tracks = {
                {"Havana", "trk1"},
                {"Bad Guy", "trk2"},
                {"Blinding Lights", "trk3"},
                {"Believer", "trk4"},
                {"Shape of You", "trk5"},
                {"Bad Romance", "trk6"},
                {"Bohemian Rhapsody", "trk7"},
                {"Someone Like You", "trk8"}
        };
        for (String[] t : tracks) {
            bst.addSong(t[0], t[1]);
        }

        System.out.println("   - Exact search findSong('Blinding Lights'): songId=" + bst.findSong("Blinding Lights"));
        System.out.println("   - Exact search findSong('Unknown Track'): " + bst.findSong("Unknown Track"));

        System.out.println("\n2. Alphabetical Prefix Search with Subtree Pruning:");
        List<String> bTracks = bst.prefixSearch("B");
        System.out.println("   - prefixSearch('B'): " + bTracks);
        List<String> badTracks = bst.prefixSearch("Bad");
        System.out.println("   - prefixSearch('Bad'): " + badTracks);

        System.out.println("\n3. Undirected Artist Relationship Graph & 2-Hop Recommendations:");
        ArtistGraph graph = new ArtistGraph();
        graph.addRelation("Taylor Swift", "Ed Sheeran");
        graph.addRelation("Ed Sheeran", "Stormzy");
        graph.addRelation("Ed Sheeran", "Eminem");
        graph.addRelation("Stormzy", "Burna Boy");

        System.out.println("   - Direct relations for 'Taylor Swift': " + graph.getDirectRelations("Taylor Swift"));
        System.out.println("   - Direct relations for 'Ed Sheeran': " + graph.getDirectRelations("Ed Sheeran"));

        List<String> recommendations = graph.recommendArtists("Taylor Swift");
        System.out.println("   - recommendArtists('Taylor Swift') [Distance = 2]: " + recommendations);
        System.out.println("     (Ed Sheeran excluded because distance=1; Burna Boy excluded because distance=3)");
    }

    private static void demonstrateUnifiedSystem() {
        System.out.println("\n--------------------------------------------------------------------------------");
        System.out.println("📦 UNIFIED TUNEWAVE APPLICATION DEMO");
        System.out.println("--------------------------------------------------------------------------------");

        TuneWave app = new TuneWave();

        // 1. Add catalog songs
        app.addSong(new Song("1", "Anti-Hero", "Taylor Swift"));
        app.addSong(new Song("2", "Cruel Summer", "Taylor Swift"));
        app.addSong(new Song("3", "Karma", "Taylor Swift"));
        app.toggleRepeat();

        // 2. Search
        System.out.println("1. Catalog search:");
        System.out.println("   - findSong('Anti-Hero'): id=" + app.findSong("Anti-Hero"));
        System.out.println("   - prefixSearch('K'): " + app.prefixSearch("K"));

        // 3. Artist network
        System.out.println("\n2. Artist graph setup:");
        app.addRelation("Taylor Swift", "Ed Sheeran");
        app.addRelation("Ed Sheeran", "Stormzy");
        app.addRelation("Ed Sheeran", "Eminem");
        System.out.println("   - Recommendations for Taylor Swift: " + app.recommendArtists("Taylor Swift"));

        // 4. Playback flow
        System.out.println("\n3. Playback flow:");
        System.out.println("   - playNext() -> " + app.playNext().getSong().getTitle());

        app.addToUpNext(new Song("99", "Special Guest Track", "Featuring Artist"));
        System.out.println("   - Added 'Special Guest Track' to Up Next");

        System.out.println("   - playNext() -> " + app.playNext().getSong().getTitle() + " (Priority from Up Next!)");
        System.out.println("   - playNext() -> " + app.playNext().getSong().getTitle() + " (Resumes playlist)");
        System.out.println("   - back() -> " + app.back().getTitle() + " (Replayed from history)");
    }
}
