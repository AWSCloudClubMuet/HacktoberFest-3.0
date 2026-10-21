class TitleNode:
    def __init__(self, title, songId):
        self.title = title
        self.key = title.casefold()
        self.songId = songId
        self.left = None
        self.right = None


class SongTree:
    def __init__(self):
        self.root = None

    def addSong(self, title, songId):
        node = TitleNode(title, songId)
        if self.root is None:
            self.root = node
            return True
        cur = self.root
        while True:
            if node.key == cur.key:
                return False
            if node.key < cur.key:
                if cur.left is None:
                    cur.left = node
                    return True
                cur = cur.left
            else:
                if cur.right is None:
                    cur.right = node
                    return True
                cur = cur.right

    def findSong(self, title):
        key = title.casefold()
        cur = self.root
        while cur:
            if key == cur.key:
                return cur.songId
            cur = cur.left if key < cur.key else cur.right
        return None

    def prefixSearch(self, prefix):
        prefix = prefix.casefold()
        results = []
        self._collect(self.root, prefix, len(prefix), results)
        return results

    def _collect(self, node, prefix, n, results):
        if node is None:
            return
        head = node.key[:n]
        if head >= prefix:
            self._collect(node.left, prefix, n, results)
        if node.key.startswith(prefix):
            results.append(node.title)
        if head <= prefix:
            self._collect(node.right, prefix, n, results)


class ArtistGraph:
    def __init__(self):
        self.links = {}

    def addRelation(self, artistA, artistB):
        if artistA == artistB:
            return
        self.links.setdefault(artistA, set()).add(artistB)
        self.links.setdefault(artistB, set()).add(artistA)

    def recommendArtists(self, artist):
        direct = self.links.get(artist, set())
        found = set()
        for friend in direct:
            for other in self.links[friend]:
                if other != artist and other not in direct:
                    found.add(other)
        return sorted(found, key=str.casefold)
