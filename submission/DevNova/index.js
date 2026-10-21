
const Playlist = require("./playlist");
const MusicPlayer = require("./musicPlayer");
const SongSearchBST = require("./songSearch");
const ArtistGraph = require("./artistGraph");

const playlist = new Playlist();

playlist.addSong({ id: 1, title: "Yellow", artist: "Coldplay" });
playlist.addSong({ id: 2, title: "Yesterday", artist: "The Beatles" });
playlist.addSong({ id: 3, title: "Shape of You", artist: "Ed Sheeran" });

const player = new MusicPlayer(playlist);

const search = new SongSearchBST();
playlist.getAllSongs().forEach(song => {
    search.addSong(song.title, song.id);
});

const artists = new ArtistGraph();
artists.addRelation("Coldplay", "Ed Sheeran");
artists.addRelation("Ed Sheeran", "The Beatles");

console.log("=== TuneWave Music Player ===");
console.log("Playlist:", playlist.getAllSongs().map(song => song.title));
console.log("Current song:", player.getCurrentSong().title);
console.log("Next song:", player.playNext().title);
console.log("Search 'Ye':", search.prefixSearch("Ye"));
console.log("Artist recommendations for Coldplay:", artists.recommendArtists("Coldplay"));
console.log("TuneWave started successfully!");

