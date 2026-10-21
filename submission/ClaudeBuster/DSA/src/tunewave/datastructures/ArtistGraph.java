package tunewave.datastructures;

import java.util.*;

/**
 * Undirected Graph for modeling relations between Artists in TuneWave.
 * Supports adding links between artists and generating 2-hop recommendations.
 */
public class ArtistGraph {

    // Adjacency list mapping artist name to set of related artists
    private final Map<String, Set<String>> adjacencyList;
    // Map to preserve canonical display names while supporting case-insensitive lookup
    private final Map<String, String> canonicalNames;

    public ArtistGraph() {
        this.adjacencyList = new HashMap<>();
        this.canonicalNames = new HashMap<>();
    }

    /**
     * Adds an undirected "related" link between artistA and artistB.
     *
     * @param artistA First artist
     * @param artistB Second artist
     */
    public void addRelation(String artistA, String artistB) {
        if (artistA == null || artistB == null) return;
        String aTrim = artistA.trim();
        String bTrim = artistB.trim();
        if (aTrim.isEmpty() || bTrim.isEmpty()) return;
        if (aTrim.equalsIgnoreCase(bTrim)) return; // No self loops

        String aCanonical = canonicalNames.computeIfAbsent(aTrim.toLowerCase(), k -> aTrim);
        String bCanonical = canonicalNames.computeIfAbsent(bTrim.toLowerCase(), k -> bTrim);

        adjacencyList.computeIfAbsent(aCanonical, k -> new HashSet<>()).add(bCanonical);
        adjacencyList.computeIfAbsent(bCanonical, k -> new HashSet<>()).add(aCanonical);
    }

    /**
     * Returns artists exactly two links away who are not already directly related,
     * sorted in alphabetical order.
     *
     * Rule:
     * - Two links away: artist -> intermediate -> recommended
     * - Must NOT be directly related to the starting artist (1 link away)
     * - Must NOT be the starting artist itself
     * - Must be sorted in alphabetical order
     *
     * @param artist Starting artist
     * @return Alphabetically sorted list of recommended artists
     */
    public List<String> recommendArtists(String artist) {
        if (artist == null || artist.trim().isEmpty()) {
            return Collections.emptyList();
        }

        String searchKey = artist.trim().toLowerCase();
        String canonicalArtist = canonicalNames.get(searchKey);
        if (canonicalArtist == null || !adjacencyList.containsKey(canonicalArtist)) {
            return Collections.emptyList();
        }

        Set<String> directNeighbors = adjacencyList.getOrDefault(canonicalArtist, Collections.emptySet());
        Set<String> recommendations = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);

        // Traverse 2 hops away: for each direct neighbor, inspect their neighbors
        for (String neighbor : directNeighbors) {
            Set<String> secondHopNeighbors = adjacencyList.getOrDefault(neighbor, Collections.emptySet());
            for (String candidate : secondHopNeighbors) {
                // Must not be self
                if (candidate.equalsIgnoreCase(canonicalArtist)) {
                    continue;
                }
                // Must not be already directly related
                if (directNeighbors.contains(candidate)) {
                    continue;
                }
                recommendations.add(candidate);
            }
        }

        return new ArrayList<>(recommendations);
    }

    /**
     * Gets direct relations for a given artist.
     */
    public Set<String> getDirectRelations(String artist) {
        if (artist == null) return Collections.emptySet();
        String canonical = canonicalNames.get(artist.trim().toLowerCase());
        if (canonical == null) return Collections.emptySet();
        return new TreeSet<>(adjacencyList.getOrDefault(canonical, Collections.emptySet()));
    }

    public Set<String> getAllArtists() {
        return new TreeSet<>(adjacencyList.keySet());
    }

    public int getArtistCount() {
        return adjacencyList.size();
    }
}
