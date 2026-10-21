


# ---------- shared model (delete this if your project already has one) ------
class Song:
    """Minimal Song. `song_id` is the unique key used across milestones."""

    def __init__(self, song_id, title, artist):
        self.id = song_id
        self.title = title
        self.artist = artist

    def __repr__(self):
        return f"Song({self.id}, '{self.title}', '{self.artist}')"


# bst

class _BSTNode:
    __slots__ = ("key", "songs", "left", "right")

    def __init__(self, key, song):
        self.key = key          # lower-cased title (case-insensitive ordering)
        self.songs = [song]     # same title by different artists -> same node
        self.left = None
        self.right = None


class SongSearchTree:
    

    def __init__(self):
        self.root = None

    # required options

    def addSong(self, title, songId):
        
        self.insert(Song(songId, title, None))

    def findSong(self, title):

        key = title.lower()
        node = self.root
        while node:
            if key == node.key:
                return node.songs[0].id
            node = node.left if key < node.key else node.right
        return None

    def prefixSearch(self, prefix):
        """
        Return all titles starting with `prefix`, alphabetically.

        Pruning: at a node whose key is < prefix, nothing in its LEFT subtree
        can match (all are smaller still). At a node whose key does not start
        with prefix and is > prefix, nothing in its RIGHT subtree can match.
        """
        p = prefix.lower()
        out = []
        self._prefix(self.root, p, out)
        return out

    def _prefix(self, node, p, out):
        if node is None:
            return
        if node.key < p:
            # whole left subtree is smaller than prefix -> cannot match
            self._prefix(node.right, p, out)
        elif node.key.startswith(p):
            # in-order so results come out sorted
            self._prefix(node.left, p, out)
            out.extend(s.title for s in node.songs)
            self._prefix(node.right, p, out)
        else:
            # node.key > p and doesn't match -> right subtree is larger still
            self._prefix(node.left, p, out)

    # internal / convenience 

    def insert(self, song):
        
        key = song.title.lower()
        if self.root is None:
            self.root = _BSTNode(key, song)
            return
        node = self.root
        while True:
            if key == node.key:
                node.songs.append(song)
                return
            if key < node.key:
                if node.left is None:
                    node.left = _BSTNode(key, song)
                    return
                node = node.left
            else:
                if node.right is None:
                    node.right = _BSTNode(key, song)
                    return
                node = node.right

    def removeSong(self, title, songId):

        key = title.lower()
        node = self.root
        while node and node.key != key:
            node = node.left if key < node.key else node.right
        if node is None:
            return False
        before = len(node.songs)
        node.songs = [s for s in node.songs if s.id != songId]
        if len(node.songs) == before:
            return False
        if not node.songs:
            self.root = self._delete(self.root, key)
        return True

    def _delete(self, node, key):
        if node is None:
            return None
        if key < node.key:
            node.left = self._delete(node.left, key)
        elif key > node.key:
            node.right = self._delete(node.right, key)
        else:
            if node.left is None:
                return node.right
            if node.right is None:
                return node.left
            succ = node.right                      # in-order successor
            while succ.left:
                succ = succ.left
            node.key, node.songs = succ.key, succ.songs
            node.right = self._delete(node.right, succ.key)
        return node

    def findSongs(self, title):
        
        key = title.lower()
        node = self.root
        while node:
            if key == node.key:
                return list(node.songs)
            node = node.left if key < node.key else node.right
        return []

    def prefixSearchSongs(self, prefix):
        
        p = prefix.lower()
        out = []

        def walk(node):
            if node is None:
                return
            if node.key < p:
                walk(node.right)
            elif node.key.startswith(p):
                walk(node.left)
                out.extend(node.songs)
                walk(node.right)
            else:
                walk(node.left)
        walk(self.root)
        return out

    def inOrder(self):
        out = []

        def walk(n):
            if n:
                walk(n.left)
                out.extend(s.title for s in n.songs)
                walk(n.right)
        walk(self.root)
        return out




# ArtistGraph —--> undirected graph of related artists

class ArtistGraph:
   

    def __init__(self):
        self.adj = {}

    def addArtist(self, name):
        self.adj.setdefault(name, set())

    def addRelation(self, a, b):
        if a == b:
            return
        self.addArtist(a)
        self.addArtist(b)
        self.adj[a].add(b)
        self.adj[b].add(a)

    def recommendArtists(self, artist):
    
        if artist not in self.adj:
            return []
        direct = self.adj[artist]
        two_away = set()
        for friend in direct:
            for candidate in self.adj[friend]:
                if candidate != artist and candidate not in direct:
                    two_away.add(candidate)
        return sorted(two_away)


#=============================> SELF TEST RUN

def _selftest():
    print("=" * 60)
    print("Milestone 3 — self-test")
    print("=" * 60)

    # ---------- BST ----------
    tree = SongSearchTree()
    songs = [
        Song(1, "Blinding Lights", "The Weeknd"),
        Song(2, "Bad Guy", "Billie Eilish"),
        Song(3, "Levitating", "Dua Lipa"),
        Song(4, "Shape of You", "Ed Sheeran"),
        Song(5, "Shivers", "Ed Sheeran"),
        Song(6, "Save Your Tears", "The Weeknd"),
        Song(7, "Break My Heart", "Dua Lipa"),
    ]
    for s in songs:
        tree.insert(s)

    titles = tree.inOrder()
    print("in-order:", titles)
    assert titles == sorted(titles, key=str.lower), "in-order must be alphabetical"

    assert tree.prefixSearch("S") == ["Save Your Tears", "Shape of You", "Shivers"]
    assert tree.prefixSearch("s") == tree.prefixSearch("S"), "case-insensitive"
    assert tree.prefixSearch("zzz") == []
    assert tree.prefixSearch("") == tree.inOrder()

    assert tree.findSong("Shivers") == 5
    assert tree.findSong("Missing") is None
    assert [s.id for s in tree.findSongs("Shivers")] == [5]

    # convenience addSong (builds a minimal Song)
    tree.addSong("Anti-Hero", 30)
    assert tree.findSong("Anti-Hero") == 30

    # removeSong: node is deleted when its last song goes
    assert tree.removeSong("Shivers", 5) is True
    assert tree.findSong("Shivers") is None
    assert tree.removeSong("Shivers", 5) is False

    # uppercase insert still matched case-insensitively
    tree.insert(Song(99, "Zebra", "Someone"))
    assert tree.prefixSearch("z") == ["Zebra"]

    # ---------- Graph ----------
    g = ArtistGraph()
    g.addRelation("The Weeknd", "Dua Lipa")
    g.addRelation("The Weeknd", "Billie Eilish")
    g.addRelation("Dua Lipa", "Ed Sheeran")
    g.addRelation("Dua Lipa", "Harry Styles")
    g.addRelation("Billie Eilish", "Finneas")
    g.addRelation("Billie Eilish", "Ed Sheeran")
    g.addRelation("Ed Sheeran", "Taylor Swift")
    g.addArtist("Lorde")              # isolated node
    g.addRelation("Solo", "Solo")     # self-loop ignored

    rec = g.recommendArtists("The Weeknd")
    print("recommend(The Weeknd):", rec)
    assert rec == ["Ed Sheeran", "Finneas", "Harry Styles"]

    rec = g.recommendArtists("Ed Sheeran")
    print("recommend(Ed Sheeran):", rec)
    assert rec == ["Finneas", "Harry Styles", "The Weeknd"]

    assert g.recommendArtists("Lorde") == []
    assert g.recommendArtists("Nobody") == []

    print("\nAll Milestone 3 checks passed. ✅")


if __name__ == "__main__":
    _selftest()