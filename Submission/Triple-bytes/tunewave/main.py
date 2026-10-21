from src.playlist import Playlist, Song
from src.queue_history import Player
from src.search_graph import ArtistGraph, SongTree


def run_demo():
    print("=== Milestone 1: Playlist ===")
    playlist = Playlist()
    songs = [
        Song(1, "Apple", "Artist A"),
        Song(2, "Application", "Artist B"),
        Song(3, "Banana", "Artist C"),
        Song(4, "Apricot", "Artist D"),
    ]
    for song in songs:
        playlist.addSong(song)

    print("Current:", playlist.current.song.title)
    print("Next:", playlist.next().title)
    print("Previous:", playlist.previous().title)
    print("Repeat enabled:", playlist.toggleRepeat())
    print("Previous with repeat (wraps):", playlist.previous().title)
    print("Removed Banana:", playlist.removeSong(3))

    print("\n=== Milestone 2: Up Next and History ===")
    player = Player(playlist)
    player.addToUpNext(2)
    print("From Up Next:", player.playNext().title)
    print("From playlist:", player.playNext().title)
    print("Back from history:", player.back().title)

    print("\n=== Milestone 3: Search and Related Artists ===")
    tree = SongTree()
    for song in songs:
        tree.addSong(song.title, song.id)
    print("Find 'banana':", tree.findSong("banana"))
    print("Prefix 'ap':", tree.prefixSearch("ap"))

    graph = ArtistGraph()
    graph.addRelation("Artist A", "Artist B")
    graph.addRelation("Artist B", "Artist C")
    graph.addRelation("Artist B", "Artist D")
    print("Recommendations for Artist A:", graph.recommendArtists("Artist A"))


if __name__ == "__main__":
    run_demo()
