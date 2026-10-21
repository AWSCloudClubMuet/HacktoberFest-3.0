package tunewave.milestone3;

import java.util.List;

/**
 * Standalone demo for Milestone 3: Song Search and Recommendations (BST + Graph).
 */
public class Milestone3Demo {
    public static void main(String[] args) {
        System.out.println("================================================================================");
        System.out.println("🧩 MILESTONE 3: Song Search & Related Artists (BST + Undirected Graph)");
        System.out.println("================================================================================");

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
}
