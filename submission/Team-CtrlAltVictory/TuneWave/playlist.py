class SongNode:
    def __init__(self, song_id, title, artist):
        self.song_id = song_id
        self.title = title
        self.artist = artist
        self.prev = None
        self.next = None

class Playlist:
    def __init__(self):
        self.head = None
        self.tail = None
        self.current = None
        self.repeat = False
        self.node_map = {}

    def addSong(self, song_node):
        if song_node.song_id in self.node_map:
            return False 

        self.node_map[song_node.song_id] = song_node

        if not self.head:
            self.head = song_node
            self.tail = song_node
            self.current = song_node
        else:
            self.tail.next = song_node
            song_node.prev = self.tail
            self.tail = song_node

        return True

    def removeSong(self, song_id):
        if song_id not in self.node_map:
            return False

        node = self.node_map.pop(song_id)

        if self.current == node:
            self.current = node.next if node.next else node.prev

        if node.prev:
            node.prev.next = node.next
        else:
            self.head = node.next

        if node.next:
            node.next.prev = node.prev
        else:
            self.tail = node.prev

        node.prev = None
        node.next = None
        return True

    def toggleRepeat(self):
        self.repeat = not self.repeat
        return self.repeat

    def next(self):
        if not self.current:
            return "end"

        if self.current.next:
            self.current = self.current.next
            return self.current.song_id

        if self.repeat and self.head:
            self.current = self.head
            return self.current.song_id

        return "end"

    def previous(self):
        if not self.current:
            return "start"

        if self.current.prev:
            self.current = self.current.prev
            return self.current.song_id

        if self.repeat and self.tail:
            self.current = self.tail
            return self.current.song_id

        return "start"


