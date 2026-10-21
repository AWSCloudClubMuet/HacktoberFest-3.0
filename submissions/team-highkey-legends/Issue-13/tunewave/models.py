class Song:
    def __init__(self, song_id, title, artist):
        self.song_id = song_id
        self.title = title
        self.artist = artist

    def __repr__(self):
        return f"{self.title} - {self.artist}"