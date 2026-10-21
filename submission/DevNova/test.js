const assert = require("node:assert/strict");

const Playlist = require("./playlist");
const MusicPlayer = require("./musicPlayer");
const SongSearchBST = require("./songSearch");
const ArtistGraph = require("./artistGraph");

function makePlaylist(count) {
     const list = new Playlist();
     for (let i = 1; i <= count; i++) {
          list.addSong({ id: i, title: `Song ${i}`, artist: `Artist ${i}` });
     }
     return list;
}


const playlist = new Playlist();

playlist.addSong({ id: 1, title: "Alpha", artist: "A" });
playlist.addSong({ id: 2, title: "Bravo", artist: "B" });
playlist.addSong({ id: 3, title: "Charlie", artist: "C" });


assert.equal(playlist.addSong({ id: 1, title: "Duplicate" }), false);
assert.equal(playlist.getAllSongs().length, 3);
assert.equal(playlist.previous(), "start");


assert.equal(playlist.next().id, 2);
assert.equal(playlist.next().id, 3);


assert.equal(playlist.next(), "end");
assert.equal(playlist.getCurrentSong().id, 3);


assert.equal(playlist.toggleRepeat(), true);
assert.equal(playlist.next().id, 1);


assert.equal(playlist.removeSong(1), true);
assert.equal(playlist.getSongById(1), null);
assert.equal(playlist.getCurrentSong().id, 2);
assert.equal(playlist.removeSong(999), false);


const removal = makePlaylist(4);
removal.removeSong(2); // middle
assert.deepEqual(removal.getAllSongs().map(s => s.id), [1, 3, 4]);
removal.removeSong(1); // head
assert.deepEqual(removal.getAllSongs().map(s => s.id), [3, 4]);
removal.removeSong(4); // tail
assert.deepEqual(removal.getAllSongs().map(s => s.id), [3]);
assert.equal(removal.head, removal.tail);


const queuePlaylist = makePlaylist(3);
const player = new MusicPlayer(queuePlaylist);


assert.equal(player.addToUpNext(3), true);
assert.equal(player.addToUpNext(999), false);
assert.equal(player.playNext().id, 3);
assert.equal(queuePlaylist.getCurrentSong().id, 1);


assert.equal(player.playNext().id, 2);


assert.equal(player.back().id, 3);


const fifoPlaylist = makePlaylist(5);
const fifoPlayer = new MusicPlayer(fifoPlaylist);
fifoPlayer.addToUpNext(4);
fifoPlayer.addToUpNext(2);
assert.equal(fifoPlayer.playNext().id, 4);
assert.equal(fifoPlayer.playNext().id, 2);
assert.equal(fifoPlaylist.getCurrentSong().id, 1);


const backPlaylist = makePlaylist(3);
const backPlayer = new MusicPlayer(backPlaylist);
backPlayer.playNext();
assert.equal(backPlaylist.getCurrentSong().id, 2);
assert.equal(backPlayer.back().id, 1);
assert.equal(backPlaylist.getCurrentSong().id, 2);


assert.equal(new MusicPlayer(makePlaylist(1)).back(), null);


const historyPlayer = new MusicPlayer(makePlaylist(1));
for (let i = 1; i <= 12; i++) {
     historyPlayer.saveToHistory({ id: i, title: `History ${i}` });
}
assert.equal(historyPlayer.history.length, 10);
assert.equal(historyPlayer.history[0].id, 3);
assert.equal(historyPlayer.back().id, 12);
assert.equal(historyPlayer.history.length, 9);


const stalePlaylist = makePlaylist(2);
const stalePlayer = new MusicPlayer(stalePlaylist);
stalePlayer.addToUpNext(2);
stalePlaylist.removeSong(2);
assert.equal(stalePlayer.playNext(), "end");


const bst = new SongSearchBST();

bst.addSong("Yesterday", 1);
bst.addSong("Yellow", 2);
bst.addSong("Young", 3);
bst.addSong("Apple", 4);

assert.equal(bst.findSong("Yellow"), 2);
assert.equal(bst.findSong("Missing"), null);


assert.deepEqual(bst.prefixSearch("Ye"), ["Yellow", "Yesterday"]);
assert.deepEqual(bst.prefixSearch("ye"), ["Yellow", "Yesterday"]); // case-insensitive
assert.deepEqual(bst.prefixSearch("Zzz"), []);


assert.deepEqual(bst.prefixSearchWithIds("Ye"), [
     { title: "Yellow", songId: 2 },
     { title: "Yesterday", songId: 1 }
]);


const graph = new ArtistGraph();

graph.addRelation("A", "B");
graph.addRelation("B", "C");
graph.addRelation("C", "D");
graph.addRelation("A", "C");
graph.addRelation("B", "E");

assert.deepEqual(graph.recommendArtists("A"), ["D", "E"]);
assert.deepEqual(graph.recommendArtists("Unknown"), []);


const sortGraph = new ArtistGraph();
sortGraph.addRelation("X", "M");
sortGraph.addRelation("M", "Z");
sortGraph.addRelation("M", "B");
assert.deepEqual(sortGraph.recommendArtists("X"), ["B", "Z"]);

console.log("All TuneWave tests passed!");