package com.tunewave;

import java.util.ArrayList;
import java.util.List;

public class BSTNode {
    private final String title;
    private final String normalizedTitle;
    private final List<String> songIds = new ArrayList<>();
    private BSTNode left;
    private BSTNode right;

    public BSTNode(String title, String songId) {
        this.title = title != null ? title.trim() : "";
        this.normalizedTitle = this.title.toLowerCase();
        if (songId != null && !songId.trim().isEmpty()) {
            this.songIds.add(songId.trim());
        }
    }

    public String getTitle() {
        return title;
    }

    public String getNormalizedTitle() {
        return normalizedTitle;
    }

    public List<String> getSongIds() {
        return songIds;
    }

    public void addSongId(String songId) {
        if (songId != null && !songId.trim().isEmpty()) {
            String clean = songId.trim();
            if (!songIds.contains(clean)) {
                songIds.add(clean);
            }
        }
    }

    public BSTNode getLeft() {
        return left;
    }

    public void setLeft(BSTNode left) {
        this.left = left;
    }

    public BSTNode getRight() {
        return right;
    }

    public void setRight(BSTNode right) {
        this.right = right;
    }
}
