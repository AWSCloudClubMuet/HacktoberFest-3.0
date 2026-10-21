package com.phantomx.tunewave.dsa;

import java.util.ArrayList;
import java.util.List;
import java.util.TreeSet;

public final class ArtistGraph {
    private static final class Neighbor {
        final String name;
        Neighbor next;

        Neighbor(String name, Neighbor next) {
            this.name = name;
            this.next = next;
        }
    }

    private static final class Vertex {
        final String name;
        Neighbor neighbors;

        Vertex(String name) {
            this.name = name;
        }

        boolean isAdjacent(String other) {
            for (Neighbor edge = neighbors; edge != null; edge = edge.next) {
                if (edge.name.equals(other)) {
                    return true;
                }
            }
            return false;
        }

        void addNeighbor(String other) {
            if (!isAdjacent(other)) {
                neighbors = new Neighbor(other, neighbors);
            }
        }
    }

    private final SimpleHashMap<String, Vertex> vertices = new SimpleHashMap<String, Vertex>();

    public void addRelation(String artistA, String artistB) {
        if (artistA == null || artistB == null
                || artistA.isEmpty() || artistB.isEmpty()
                || artistA.equals(artistB)) {
            return;
        }
        Vertex left = vertex(artistA);
        Vertex right = vertex(artistB);
        left.addNeighbor(artistB);
        right.addNeighbor(artistA);
    }

    public List<String> recommendArtists(String artist) {
        Vertex source = vertices.get(artist);
        if (source == null) {
            return new ArrayList<String>();
        }
        SimpleHashMap<String, Boolean> direct = new SimpleHashMap<String, Boolean>();
        for (Neighbor hop1 = source.neighbors; hop1 != null; hop1 = hop1.next) {
            direct.put(hop1.name, Boolean.TRUE);
        }
        TreeSet<String> recommendations = new TreeSet<String>();
        for (Neighbor hop1 = source.neighbors; hop1 != null; hop1 = hop1.next) {
            Vertex mid = vertices.get(hop1.name);
            if (mid == null) {
                continue;
            }
            for (Neighbor hop2 = mid.neighbors; hop2 != null; hop2 = hop2.next) {
                String candidate = hop2.name;
                if (!candidate.equals(artist) && !direct.containsKey(candidate)) {
                    recommendations.add(candidate);
                }
            }
        }
        return new ArrayList<String>(recommendations);
    }

    public List<String> neighbors(String artist) {
        List<String> names = new ArrayList<String>();
        Vertex vertex = vertices.get(artist);
        if (vertex == null) {
            return names;
        }
        for (Neighbor edge = vertex.neighbors; edge != null; edge = edge.next) {
            names.add(edge.name);
        }
        return names;
    }

    public int edgeCount() {
        int degreeSum = 0;
        for (String name : vertices.keys()) {
            Vertex vertex = vertices.get(name);
            for (Neighbor edge = vertex.neighbors; edge != null; edge = edge.next) {
                degreeSum++;
            }
        }
        return degreeSum / 2;
    }

    public List<String> artists() {
        return vertices.keys();
    }

    public boolean areRelated(String artistA, String artistB) {
        Vertex vertex = vertices.get(artistA);
        return vertex != null && vertex.isAdjacent(artistB);
    }

    public boolean hasArtist(String artist) {
        return vertices.containsKey(artist);
    }

    public int artistCount() {
        return vertices.size();
    }

    private Vertex vertex(String name) {
        Vertex existing = vertices.get(name);
        if (existing != null) {
            return existing;
        }
        Vertex created = new Vertex(name);
        vertices.put(name, created);
        return created;
    }
}
