from playlist import SongNode, Playlist
from playback import PlayerController
from search import SongSearch, ArtistGraph

def run_demo():
    print("Welcome to TuneWave\n")
    print("Loading Playlist")
    pl = Playlist()
    
    s1 = SongNode("1", "Despacito", "Jaint")
    s2 = SongNode("2", "Brain", "Dushant")
    s3 = SongNode("3", "Takila", "Honey singh")
    
    pl.addSong(s1)
    pl.addSong(s2)
    pl.addSong(s3)
    
    print(f"Currently playing: {pl.current.title} by {pl.current.artist}")
    
    pl.next()
    print(f"Skipped to next: {pl.current.title} by {pl.current.artist}")
    
    print("\n2. Testing Repeat")
    pl.toggleRepeat()
    print("Repeat turned ON.")
    pl.next()
    print(f"Skipped to next: {pl.current.title}")
    pl.next()
    print(f"Reached end of playlist. Returned to: {pl.current.title}")
    
    print("\n3. Up Next & History")
    controller = PlayerController(pl)
    
    print("User queues a specific song ID ('99').")
    controller.addToUpNext("99")
    
    next_song = controller.playNext()
    print(f"Playing Next: {next_song} (Pulled from Up Next Queue)")
    
    next_song = controller.playNext()
    print(f"Playing Next: {next_song} (Queue empty, resumed from main playlist)")
    
    back_song = controller.back()
    print(f"User hits Back. Replaying from History stack: {back_song}")

    print("\n4. Search Engine (BST)")
    search = SongSearch()
    search.addSong("Shape of You", "10")
    search.addSong("Shivers", "11")
    search.addSong("Perfect", "12")
    search.addSong("Starboy", "2")
    
    prefix = "Sh"
    print(f"User searches for '{prefix}'...")
    results = search.prefixSearch(prefix)
    print(f"Autocomplete results: {results}")

    print("\n--- 5. Artist Recommendations (Graph) ---")
    graph = ArtistGraph()
    graph.addRelation("Jaint", "Ariana Grande")
    graph.addRelation("Ariana Grande", "Justin Bieber")
    graph.addRelation("Jaint", "Daft Punk")
    graph.addRelation("Daft Punk", "Pharrell Williams")
    
    artist = "Jaint"
    print(f"Finding recommendations for '{artist}'...")
    print("Logic: Find artists exactly 2 connections away (friends of friends).")
    
    recs = graph.recommendArtists(artist)
    print(f"Recommended Artists: {recs}")

if __name__ == "__main__":
    run_demo()
