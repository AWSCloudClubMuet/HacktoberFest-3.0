class Song:
    def __init__(self, song_id, title, artist):
        self.id = song_id
        self.title = title
        self.artist = artist


class Node:
    def __init__(self, song):
        self.song = song
        self.prev = None
        self.next = None


class Playlist:
    def __init__(self):
        self.head = None
        self.tail = None
        self.current = None
        self.nodes = {}
        self.repeat = False

    def addSong(self, song):
        if song.id in self.nodes:
            return False
        node = Node(song)
        if self.tail is None:
            self.head = self.tail = self.current = node
        else:
            node.prev = self.tail
            self.tail.next = node
            self.tail = node
        self.nodes[song.id] = node
        return True

    def removeSong(self, songId):
        node = self.nodes.pop(songId, None)
        if node is None:
            return False
        if node is self.current:
            self.current = node.next or node.prev
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

    def getSong(self, songId):
        node = self.nodes.get(songId)
        return node.song if node else None

    def next(self):
        if self.current is None:
            return "end"
        if self.current.next:
            self.current = self.current.next
        elif self.repeat:
            self.current = self.head
        else:
            return "end"
        return self.current.song

    def previous(self):
        if self.current is None:
            return "start"
        if self.current.prev:
            self.current = self.current.prev
        elif self.repeat:
            self.current = self.tail
        else:
            return "start"
        return self.current.song

    def toggleRepeat(self):
        self.repeat = not self.repeat
        return self.repeat
