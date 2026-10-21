package com.tunewave;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ArtistGraph {
    private final Map<String, Set<String>> adjacencyList = new HashMap<>();
    private final Map<String, String> canonicalNames = new HashMap<>();

    public boolean addRelation(String artistA, String artistB) {
        if (artistA == null || artistB == null) {
            return false;
        }
        String a = artistA.trim();
        String b = artistB.trim();

        if (a.isEmpty() || b.isEmpty() || a.equalsIgnoreCase(b)) {
            return false;
        }

        String canonicalA = canonicalNames.computeIfAbsent(a.toLowerCase(), k -> a);
        String canonicalB = canonicalNames.computeIfAbsent(b.toLowerCase(), k -> b);

        adjacencyList.computeIfAbsent(canonicalA, k -> new HashSet<>()).add(canonicalB);
        adjacencyList.computeIfAbsent(canonicalB, k -> new HashSet<>()).add(canonicalA);
        return true;
    }

    public List<String> recommendArtists(String artist) {
        if (artist == null || artist.trim().isEmpty()) {
            return new ArrayList<>();
        }

        String target = canonicalNames.get(artist.trim().toLowerCase());
        if (target == null) {
            return new ArrayList<>();
        }

        Set<String> direct = adjacencyList.get(target);
        if (direct == null || direct.isEmpty()) {
            return new ArrayList<>();
        }

        Set<String> excluded = new HashSet<>();
        excluded.add(target.toLowerCase());
        for (String neighbor : direct) {
            excluded.add(neighbor.toLowerCase());
        }

        Set<String> candidates = new HashSet<>();
        for (String neighbor : direct) {
            String canonicalNeighbor = canonicalNames.getOrDefault(neighbor.toLowerCase(), neighbor);
            Set<String> secondHop = adjacencyList.get(canonicalNeighbor);
            if (secondHop != null) {
                for (String candidate : secondHop) {
                    if (!excluded.contains(candidate.toLowerCase())) {
                        candidates.add(canonicalNames.getOrDefault(candidate.toLowerCase(), candidate));
                    }
                }
            }
        }

        List<String> sorted = new ArrayList<>(candidates);
        Collections.sort(sorted);
        return sorted;
    }

    public boolean hasRelation(String artistA, String artistB) {
        if (artistA == null || artistB == null) return false;
        String canonicalA = canonicalNames.get(artistA.trim().toLowerCase());
        String canonicalB = canonicalNames.get(artistB.trim().toLowerCase());
        if (canonicalA == null || canonicalB == null) return false;

        Set<String> neighbors = adjacencyList.get(canonicalA);
        return neighbors != null && neighbors.contains(canonicalB);
    }

    public Set<String> getNeighbors(String artist) {
        if (artist == null) return Collections.emptySet();
        String canonical = canonicalNames.get(artist.trim().toLowerCase());
        if (canonical == null) return Collections.emptySet();
        return Collections.unmodifiableSet(adjacencyList.getOrDefault(canonical, Collections.emptySet()));
    }

    public int getArtistCount() {
        return adjacencyList.size();
    }
}
