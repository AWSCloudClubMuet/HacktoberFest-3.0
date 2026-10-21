package com.tunewave;

import java.util.ArrayList;
import java.util.List;

public class SongBST {
    private BSTNode root;
    private int size;

    public void addSong(String title, String songId) {
        if (title == null || title.trim().isEmpty()) {
            return;
        }
        root = insert(root, title.trim(), songId);
    }

    private BSTNode insert(BSTNode node, String title, String songId) {
        if (node == null) {
            size++;
            return new BSTNode(title, songId);
        }

        int cmp = title.toLowerCase().compareTo(node.getNormalizedTitle());
        if (cmp < 0) {
            node.setLeft(insert(node.getLeft(), title, songId));
        } else if (cmp > 0) {
            node.setRight(insert(node.getRight(), title, songId));
        } else {
            node.addSongId(songId);
        }

        return node;
    }

    public List<String> findSong(String title) {
        if (title == null || title.trim().isEmpty() || root == null) {
            return new ArrayList<>();
        }

        String target = title.trim().toLowerCase();
        BSTNode cur = root;

        while (cur != null) {
            int cmp = target.compareTo(cur.getNormalizedTitle());
            if (cmp < 0) {
                cur = cur.getLeft();
            } else if (cmp > 0) {
                cur = cur.getRight();
            } else {
                return new ArrayList<>(cur.getSongIds());
            }
        }

        return new ArrayList<>();
    }

    public List<String> prefixSearch(String prefix) {
        return prefixSearch(prefix, null);
    }

    public List<String> prefixSearch(String prefix, int[] visitedCounter) {
        List<String> results = new ArrayList<>();
        if (root == null) return results;

        String cleanPrefix = (prefix != null) ? prefix.trim().toLowerCase() : "";
        collectPrefix(root, cleanPrefix, results, visitedCounter);
        return results;
    }

    private void collectPrefix(BSTNode node, String prefix, List<String> results, int[] visitedCounter) {
        if (node == null) return;

        if (visitedCounter != null && visitedCounter.length > 0) {
            visitedCounter[0]++;
        }

        String norm = node.getNormalizedTitle();
        if (norm.startsWith(prefix)) {
            if (!norm.equals(prefix)) {
                collectPrefix(node.getLeft(), prefix, results, visitedCounter);
            }
            results.add(node.getTitle());
            collectPrefix(node.getRight(), prefix, results, visitedCounter);
        } else if (norm.compareTo(prefix) > 0) {
            collectPrefix(node.getLeft(), prefix, results, visitedCounter);
        } else {
            collectPrefix(node.getRight(), prefix, results, visitedCounter);
        }
    }

    public BSTNode getRoot() {
        return root;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return root == null;
    }
}
