class Song:
    """A song record. `song_id` is the unique key used everywhere."""

    def __init__(self, song_id, title, artist):
        self.id = song_id
        self.title = title
        self.artist = artist

    def __repr__(self):
        return f"Song({self.id}, '{self.title}', '{self.artist}')"

class _PlaylistNode:
    __slots__ = ("song", "prev", "next")

    def __init__(self, song):
        self.song = song
        self.prev = None
        self.next = None


class Playlist:
    def __init__(self):
        self.data = {}

        self.tail = None

        self.head = None

        self.current = None

        self.repeat = False


    def addSong(self, song):
        if hash(song) in self.data.keys():
            return False

        node = _PlaylistNode(song)

        if self.tail is None:                  # empty list
            self.head = self.tail = node
            self.current = node
        else:
            node.prev = self.tail
            self.tail.next = node
            self.tail = node
        self.data[song.id] = node
        return True

    def removeSong(self, songId):
        """Unlink a song by ID. Returns False if not found."""
        node = self.data.pop(songId, None)
        if node is None:
            return False

        # If we're removing the song being played, move the cursor.
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

        node.prev = node.next = None
        return True

    def next(self):
        """Advance. With repeat on, wrap from last to first; otherwise return 'end'."""
        if self.current is None:
            return None
        if self.current.next is not None:
            self.current = self.current.next
            return self.current.song
        if self.repeat:
            self.current = self.head
            return self.current.song
        return "end"                           # stay on the last song

    def previous(self):
        """Go back. With repeat on, wrap from first to last; otherwise return 'start'."""
        if self.current is None:
            return None
        if self.current.prev is not None:
            self.current = self.current.prev
            return self.current.song
        if self.repeat:
            self.current = self.tail
            return self.current.song
        return "start"

    def toggleRepeat(self):
        self.repeat = not self.repeat
        return self.repeat

    def currentSong(self):
        return self.current.song if self.current else None

    def contains(self, songId):
        return songId in self.data

    def __len__(self):
        return len(self.data)

    def __iter__(self):
        node = self.head
        while node:
            yield node.song
            node = node.next


def main():
    songs = [
        Song(1, "Blinding Lights", "The Weeknd"),
        Song(2, "Bad Guy", "Billie Eilish"),
        Song(3, "Levitating", "Dua Lipa"),
        Song(4, "Shape of You", "Ed Sheeran"),
    ]
    pl = Playlist()
    for s in songs:
        pl.addSong(s)
    # assert pl.addSong(Song(2, "Bad Guy", "Billie Eilish")) is False, "duplicate must be rejected"
    print("Playlist:", [s.title for s in pl])
    print("current :", pl.currentSong().title)

    print("next    :", pl.next().title)
    print("next    :", pl.next().title)
    print("next    :", pl.next().title)
    r = pl.next()
    print("next    :", r, "(repeat off -> stays on last)")
    assert r == "end" and pl.currentSong().id == 4

    pl.toggleRepeat()
    r = pl.next()
    print("next    :", r.title, "(repeat on -> wrapped)")
    assert r.id == 1
    print("previous:", pl.previous().title, "(repeat on -> wrapped backwards)")
    pl.toggleRepeat()

    pl.removeSong(4)                     # remove current song
    print("removed 4, current now:", pl.currentSong().title)
    assert pl.currentSong().id == 3
    assert pl.removeSong(99) is False
    print("Playlist:", [s.title for s in pl], "| len =", len(pl))

    print()
    print("=" * 60)


if __name__ == "__main__":
    main()