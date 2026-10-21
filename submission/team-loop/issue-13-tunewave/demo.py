from player import MusicPlayer, Song

def label(result):
    return result.title if isinstance(result, Song) else str(result)

def main():
    player = MusicPlayer()
    for song in (Song("1", "Aurora", "Aster"), Song("2", "Breeze", "Birch"),
                 Song("3", "Blue Sky", "Cedar")):
        player.addSong(song)
    player.registerSong(Song("4", "Bonus Track", "Dune"))
    print("Playlist:", ", ".join(song.title for song in player.playlist))
    print("First play:", label(player.playNext()))
    player.addToUpNext("4")
    player.addToUpNext("3")
    print("Up Next:", label(player.playNext()), "/", label(player.playNext()))
    print("Cursor after queue:", player.playlist.current.song.title)
    print("Back (pops history):", label(player.back()))
    print("Playlist resumes:", label(player.playNext()))
    print("Next:", label(player.playlist.next()))
    print("Repeat off:", label(player.playlist.next()))
    print("Repeat enabled:", player.playlist.toggleRepeat())
    print("Wrap forward:", label(player.playlist.next()))
    print("Wrap backward:", label(player.playlist.previous()))
    print("Removed:", player.removeSong("2").title)
    player.search.addSong("Bloom", "search-only")
    print("Find Breeze:", player.search.findSong("Breeze"))
    print("Prefix B:", player.search.prefixSearch("B"))
    for a, b in (("Aster", "Birch"), ("Birch", "Cedar"),
                 ("Birch", "Dune"), ("Aster", "Cedar")):
        player.artists.addRelation(a, b)
    print("Recommendations for Aster:", player.artists.recommendArtists("Aster"))
    for _ in range(12):
        player.playNext()
    print("History capped at:", len(player.history))

if __name__ == "__main__":
    main()
