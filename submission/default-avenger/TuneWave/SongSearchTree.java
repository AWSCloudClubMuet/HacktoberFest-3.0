import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class SongSearchTree {
    private static class TreeNode {
        private final String title;
        private final String songId;
        private TreeNode left;
        private TreeNode right;

        private TreeNode(String title, String songId) {
            this.title = title;
            this.songId = songId;
        }
    }

    private TreeNode root_songNode;
    private final Set<String> songIds = new HashSet<>();
//to add songs to the tree
    public boolean addSong(String title, String songId) {
        if (title == null || title.trim().isEmpty()
                || songId == null || songId.trim().isEmpty()
                || songIds.contains(songId)) {
                    System.err.println("The error is inserting the song in tree");
            return false;
        }

        if (root_songNode == null) {
            root_songNode = new TreeNode(title, songId);
            songIds.add(songId);
            return true;
        }

        TreeNode current = root_songNode;
        while (true) {
            int comparison = title.compareToIgnoreCase(current.title);
            if (comparison == 0) return false;
//Insert in left tree
            if (comparison < 0) {
                if (current.left == null) {
                    current.left = new TreeNode(title, songId);
                    songIds.add(songId);
                    return true;
                }
                current = current.left;
            } else {
                if (current.right == null) {
                    current.right = new TreeNode(title, songId);
                    songIds.add(songId);
                    return true;
                }
                current = current.right;
            }
        }
    }
//Uisng BST to serach the song
    public String findSong(String title) {
        if (title == null) return null;

        TreeNode current = root_songNode;
        while (current != null) {
            int comparison = title.compareToIgnoreCase(current.title);
            if (comparison == 0) 
                return current.songId;
if (comparison < 0) {
    current = current.left;
} else {
    current = current.right;
}        }
        return null;
    }

    public List<String> prefixSearch(String prefix) {
        List<String> matches = new ArrayList<>();//Arraylist for matching
        if (prefix == null) return matches;
        collectPrefixMatches(root_songNode, prefix, matches);
        return matches;
    }

    private void collectPrefixMatches(TreeNode node, String prefix, List<String> matches) {
        if (node == null) return;

        int comparison = node.title.compareToIgnoreCase(prefix);
        boolean matchesPrefix = node.title.regionMatches(
                true, 0, prefix, 0, prefix.length());

        if (comparison >= 0) {
            collectPrefixMatches(node.left, prefix, matches);
        }
        if (matchesPrefix) {
            matches.add(node.title);
        }
        if (comparison <= 0 || matchesPrefix) {
            collectPrefixMatches(node.right, prefix, matches);
        }
    }
}
