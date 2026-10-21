"""Console demo of the core (no GUI, no audio). Run: python demo.py"""
from music.library_manager import LibraryManager
from player.playback_controller import PlaybackController


def main() -> None:
    lib = LibraryManager()
    player = PlaybackController(lib)
    for title, artist in [("Alpha", "A"), ("Beta", "B"), ("Gamma", "C"), ("Bounce", "D")]:
        player.add_to_playlist(lib.add_song(title, artist).id)
    lib.add_relation("A", "B"); lib.add_relation("B", "C")
    print("Playing:", player.play().title)
    player.add_to_up_next(4)
    print("Next (queued):", player.play_next().title, "| playlist position:", player.playlist.current_song.title)
    print("Next (playlist):", player.play_next().title)
    print("Back:", player.back().title)
    print("Prefix 'b':", [s.title for s in lib.prefix_search("b")])
    print("Recommend for A:", lib.recommend_artists("A"))


if __name__ == "__main__":
    main()
