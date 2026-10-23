class BSTNode:
    def __init__(self, title, song_id):
        self.title = title
        self.song_id = song_id
        self.left = None
        self.right = None

class SongSearch:
    def __init__(self):
        self.root = None

    def addSong(self, title, song_id):
        if not self.root:
            self.root = BSTNode(title, song_id)
            return

        curr = self.root
        while True:
            if title < curr.title:
                if not curr.left:
                    curr.left = BSTNode(title, song_id)
                    break
                curr = curr.left
            elif title > curr.title:
                if not curr.right:
                    curr.right = BSTNode(title, song_id)
                    break
                curr = curr.right
            else:
                break

    def findSong(self, title):
        curr = self.root
        while curr:
            if title == curr.title:
                return curr.song_id
            elif title < curr.title:
                curr = curr.left
            else:
                curr = curr.right
        return None

    def prefixSearch(self, prefix):
        results = []
        def _search(node):
            if not node:
                return

            if node.title[:len(prefix)] >= prefix:
                _search(node.left)
            
            if node.title.startswith(prefix):
                results.append(node.title)

            if node.title[:len(prefix)] <= prefix:
                _search(node.right)

        _search(self.root)
        return results

class ArtistGraph:
    def __init__(self):
        self.adj_list = {}

    def addRelation(self, artistA, artistB):
        if artistA not in self.adj_list:
            self.adj_list[artistA] = set()
        if artistB not in self.adj_list:
            self.adj_list[artistB] = set()
            
        self.adj_list[artistA].add(artistB)
        self.adj_list[artistB].add(artistA)

    def recommendArtists(self, artist):
        if artist not in self.adj_list:
            return []

        direct_neighbors = self.adj_list[artist]
        two_hops = set()

        for neighbor in direct_neighbors:
            for candidate in self.adj_list.get(neighbor, []):
                if candidate != artist and candidate not in direct_neighbors:
                    two_hops.add(candidate)

        return sorted(list(two_hops))
