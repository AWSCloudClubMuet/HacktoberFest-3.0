class PlayerController:
    def __init__(self, playlist):
        self.playlist = playlist
        self.up_next_queue = []
        self.history_stack = []
        self.currently_playing = None

    def _record_history(self, song_id):
        if len(self.history_stack) >= 10:
            self.history_stack.pop(0)
        self.history_stack.append(song_id)

    def addToUpNext(self, song_id):
        self.up_next_queue.append(song_id)

    def playNext(self):
        if self.up_next_queue:
            next_id = self.up_next_queue.pop(0)
            self.currently_playing = next_id
            self._record_history(next_id)
            return next_id

        res = self.playlist.next()
        if res != "end":
            self.currently_playing = res
            self._record_history(res)
            return res

        return "end"

    def back(self):
        if not self.history_stack:
            return None

        song_id = self.history_stack.pop()
        self.currently_playing = song_id
        return song_id
