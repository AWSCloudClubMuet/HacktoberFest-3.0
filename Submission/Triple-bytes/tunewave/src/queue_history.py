from collections import deque


class Player:
    def __init__(self, playlist):
        self.playlist = playlist
        self.upNext = deque()
        self.history = deque(maxlen=10)

    def addToUpNext(self, songId):
        if self.playlist.getSong(songId) is None:
            return False
        self.upNext.append(songId)
        return True

    def playNext(self):
        while self.upNext:
            song = self.playlist.getSong(self.upNext.popleft())
            if song is not None:
                self.history.append(song)
                return song
        song = self.playlist.next()
        if song == "end":
            return "end"
        self.history.append(song)
        return song

    def back(self):
        if not self.history:
            return None
        return self.history.pop()
