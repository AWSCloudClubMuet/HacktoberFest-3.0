package com.phantomx.tunewave.dsa;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Title BST. Same title keeps multiple songIds on one node; compareTo is case-sensitive. */
public final class SongSearchTree {
    private static final class Node {
        String title;
        final List<String> songIds = new ArrayList<String>();
        Node left;
        Node right;

        Node(String title, String songId) {
            this.title = title;
            this.songIds.add(songId);
        }
    }

    private Node root;
    private int titleCount;
    private int lastPrefixVisits;

    public boolean addSong(String title, String songId) {
        if (title == null || songId == null) {
            return false;
        }
        if (root == null) {
            root = new Node(title, songId);
            titleCount = 1;
            return true;
        }
        Node node = root;
        while (true) {
            int cmp = title.compareTo(node.title);
            if (cmp == 0) {
                if (node.songIds.contains(songId)) {
                    return false;
                }
                node.songIds.add(songId);
                return true;
            }
            if (cmp < 0) {
                if (node.left == null) {
                    node.left = new Node(title, songId);
                    titleCount++;
                    return true;
                }
                node = node.left;
            } else {
                if (node.right == null) {
                    node.right = new Node(title, songId);
                    titleCount++;
                    return true;
                }
                node = node.right;
            }
        }
    }

    public List<String> findSong(String title) {
        if (title == null || root == null) {
            return Collections.emptyList();
        }
        Node node = root;
        while (node != null) {
            int cmp = title.compareTo(node.title);
            if (cmp == 0) {
                return new ArrayList<String>(node.songIds);
            }
            node = cmp < 0 ? node.left : node.right;
        }
        return Collections.emptyList();
    }

    public boolean removeSong(String title, String songId) {
        if (title == null || songId == null || root == null) {
            return false;
        }
        Node node = root;
        while (node != null) {
            int cmp = title.compareTo(node.title);
            if (cmp == 0) {
                if (!node.songIds.remove(songId)) {
                    return false;
                }
                if (node.songIds.isEmpty()) {
                    root = deleteNode(root, title);
                    titleCount--;
                }
                return true;
            }
            node = cmp < 0 ? node.left : node.right;
        }
        return false;
    }

    public List<String> prefixSearch(String prefix) {
        lastPrefixVisits = 0;
        if (prefix == null) {
            return Collections.emptyList();
        }
        List<String> matches = new ArrayList<String>();
        collectPrefix(root, prefix, matches);
        return matches;
    }

    public int uniqueTitleCount() {
        return titleCount;
    }

    public int lastPrefixVisits() {
        return lastPrefixVisits;
    }

    public boolean isEmpty() {
        return root == null;
    }

    private void collectPrefix(Node node, String prefix, List<String> matches) {
        if (node == null) {
            return;
        }
        lastPrefixVisits++;
        if (node.title.startsWith(prefix)) {
            collectPrefix(node.left, prefix, matches);
            matches.add(node.title);
            collectPrefix(node.right, prefix, matches);
            return;
        }
        if (node.title.compareTo(prefix) < 0) {
            collectPrefix(node.right, prefix, matches);
        } else {
            collectPrefix(node.left, prefix, matches);
        }
    }

    private static Node deleteNode(Node node, String title) {
        if (node == null) {
            return null;
        }
        int cmp = title.compareTo(node.title);
        if (cmp < 0) {
            node.left = deleteNode(node.left, title);
            return node;
        }
        if (cmp > 0) {
            node.right = deleteNode(node.right, title);
            return node;
        }
        if (node.left == null) {
            return node.right;
        }
        if (node.right == null) {
            return node.left;
        }
        Node successor = node.right;
        while (successor.left != null) {
            successor = successor.left;
        }
        node.title = successor.title;
        node.songIds.clear();
        node.songIds.addAll(successor.songIds);
        node.right = deleteNode(node.right, successor.title);
        return node;
    }
}
