#up next and history
from collections import deque
class PlaybackManager:
    History_LIMIT = 10
    def __int__(Self):
        self.up_next = deque()
        self.history = deque(maxlen=self.HISTORY_LIMIT)
        self.current = None

    def _start_playing(Self, song_id):
        if self.current is not None:
            self.history.append(self.current)
            self.current = song_id

    def playNext(Self):
        if not self.up_next:
            return None
        song_id = self.up_next.popleft()
        self._start_playing(song_id)
        return song_id
    def back(Self):

        if not self.history:
            return None
        song_id = self.history.pop()
        self.current = song_id
        return song_id

        def onPlaylistSongPlayed(Self, song_id):
            self._start_Playing(song_id)

if __name__ == "__main__":
    pm = PlaybackManager()

    pm.onPlaylistSongPlayed("S1")
    pm.addToUpNext("S5")
    pm.addToUpNext("S5")

    print(pm.playNext())
    print(pm.playNext())
    print(pm.playNext())
    print(pm.back())
    print(pm.back())
    print(pm.back())

    for i in range(15):
        pm.onPlaylistSongPlayed(f"x{i}")
        print(len(pm.history))