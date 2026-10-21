import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class DiscoveryEngine {

    // ================= Binary Search Tree (song search) =================
    public static class BSTNode {
        public String title;
        public String songId;
        public BSTNode left;
        public BSTNode right;

        public BSTNode(String title, String songId) {
            this.title = title;
            this.songId = songId;
        }
    }

    private BSTNode bstRoot;

    /** Inserts a song, ordered alphabetically by title. */
    public void addSong(String title, String songId) {
        if (title == null || songId == null) {
            return;
        }
        BSTNode newNode = new BSTNode(title, songId);
        if (bstRoot == null) {
            bstRoot = newNode;
            return;
        }
        BSTNode current = bstRoot;
        while (true) {
            if (title.compareTo(current.title) < 0) {
                if (current.left == null) {
                    current.left = newNode;
                    break;
                }
                current = current.left;
            } else { // equal titles go to the right
                if (current.right == null) {
                    current.right = newNode;
                    break;
                }
                current = current.right;
            }
        }
    }

    /** Exact search. Returns the song id, or null if not found. */
    public String findSong(String title) {
        if (title == null) {
            return null;
        }
        BSTNode current = bstRoot;
        while (current != null) {
            if (current.title.equals(title)) {
                return current.songId;
            } else if (title.compareTo(current.title) < 0) {
                current = current.left;
            } else {
                current = current.right;
            }
        }
        return null;
    }

    /** Returns all titles starting with the prefix, sorted alphabetically. */
    public List<String> prefixSearch(String prefix) {
        List<String> results = new ArrayList<>();
        if (prefix == null || prefix.isEmpty()) {
            return results;
        }
        collectPrefixMatches(bstRoot, prefix, results);
        Collections.sort(results);
        return results;
    }

    private void collectPrefixMatches(BSTNode node, String prefix, List<String> results) {
        if (node == null) {
            return;
        }
        // A match can have matches on both sides, so look in both subtrees
        if (node.title.startsWith(prefix)) {
            results.add(node.title);
            collectPrefixMatches(node.left, prefix, results);
            collectPrefixMatches(node.right, prefix, results);
            return;
        }
        // No match here: only one side can contain matches
        if (prefix.compareTo(node.title) < 0) {
            collectPrefixMatches(node.left, prefix, results);
        } else {
            collectPrefixMatches(node.right, prefix, results);
        }
    }

    // ================= Graph (artist network) =================
    private final Map<String, Set<String>> artistGraph = new HashMap<>();

    /** Connects two artists in both directions. */
    public void addRelation(String artistA, String artistB) {
        if (artistA == null || artistB == null || artistA.equals(artistB)) {
            return;
        }
        artistGraph.putIfAbsent(artistA, new HashSet<>());
        artistGraph.putIfAbsent(artistB, new HashSet<>());
        artistGraph.get(artistA).add(artistB);
        artistGraph.get(artistB).add(artistA);
    }

    /** Artists exactly 2 steps away (not the artist, not direct neighbors), sorted. */
    public List<String> recommendArtists(String artist) {
        if (artist == null || !artistGraph.containsKey(artist)) {
            return new ArrayList<>();
        }
        Set<String> directNeighbors = artistGraph.get(artist);
        Set<String> recommendations = new HashSet<>();

        for (String neighbor : directNeighbors) {
            Set<String> secondLevel = artistGraph.get(neighbor);
            if (secondLevel == null) {
                continue;
            }
            for (String candidate : secondLevel) {
                if (!candidate.equals(artist) && !directNeighbors.contains(candidate)) {
                    recommendations.add(candidate);
                }
            }
        }

        List<String> ordered = new ArrayList<>(recommendations);
        Collections.sort(ordered);
        return ordered;
    }

    // ================= Test =================
    public static void main(String[] args) {
        DiscoveryEngine engine = new DiscoveryEngine();
        System.out.println("--- Starting TuneWave Milestone 3 Validation ---");

        engine.addSong("All Me", "TRK-90");
        engine.addSong("Beautiful Day", "TRK-12");
        engine.addSong("Blinding Lights", "TRK-44");
        engine.addSong("Circles", "TRK-07");
        engine.addSong("Bad Habits", "TRK-31");

        System.out.println("Find 'Circles': " + engine.findSong("Circles"));   // TRK-07
        System.out.println("Find 'Unknown': " + engine.findSong("Unknown"));   // null
        System.out.println("Prefix 'Bl': " + engine.prefixSearch("Bl"));       // [Blinding Lights]
        System.out.println("Prefix 'Ba': " + engine.prefixSearch("Ba"));       // [Bad Habits]
        System.out.println("Prefix 'B': " + engine.prefixSearch("B"));         // 3 titles, sorted

        engine.addRelation("Taylor Swift", "Ed Sheeran");
        engine.addRelation("Taylor Swift", "Justin Bieber");
        engine.addRelation("Ed Sheeran", "The Weeknd");

        System.out.println("\nRecommendations for 'Taylor Swift': "
                + engine.recommendArtists("Taylor Swift")); // [The Weeknd]
    }
}