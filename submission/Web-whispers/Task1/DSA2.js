//Milestone 2 — Up Next and History (Queue + Stack)
const { Playlist } = require("./DSA1");

const HISTORY_LIMIT = 10;

class Player {
  constructor(playlist) {
    this.playlist = playlist; // Milestone 1 playlist
    this.upNext = [];         // queue: add at the back, play from the front
    this.history = [];        // stack: top of stack = end of array
    this.nowPlaying = null;   // song playing right now
  }

  // Queue a playlist song to play before the playlist continues
  addToUpNext(songId) {
    const node = this.playlist.map.get(songId);
    if (!node) return false;
    this.upNext.push(node.song);
    return true;
  }

  // Play the next song then Up Next first, otherwise the playlist continues
  playNext() {
    let song;

    if (this.upNext.length > 0) {
      song = this.upNext.shift();
    } else if (this.nowPlaying === null) {
      // nothing has played yet then start at the playlist's current song
      song = this.playlist.current ? this.playlist.current.song : null;
    } else {
      song = this.playlist.next();    // moves the playlist position
    }

    if (song === null) return null;
    if (song === "end") return "end";

    this._pushHistory(this.nowPlaying);
    this.nowPlaying = song;
    return song;
  }

  // Replay the most recent song in history and remove it from history
  back() {
    if (this.history.length === 0) return null;
    this.nowPlaying = this.history.pop(); // playlist position NOT moved
    return this.nowPlaying;
  }

  // Keep only the last 10 songs and  drop the oldest
  _pushHistory(song) {
    if (song === null) return;
    this.history.push(song);
    if (this.history.length > HISTORY_LIMIT) this.history.shift();
  }
}

// check Test (runs only with node DSa2.js)
if (require.main === module) {
  const pl = new Playlist();
  for (let i = 1; i <= 4; i++) pl.addSong({ id: `s${i}`, title: `Song ${i}` });
  const p = new Player(pl);

  console.log(p.playNext().title);        // Song 1 (playlist starts)
  p.addToUpNext("s4");
  p.addToUpNext("s3");
  console.log(p.playNext().title);        // Song 4 (Up Next first)
  console.log(p.playNext().title);        // Song 3 (Up Next)
  console.log(p.playNext().title);        // Song 2 (playlist continues from Song 1)
  console.log(p.back().title);            // Song 3 (top of history)
  console.log(p.history.length);          // 2 (Song 1, Song 4 remain)

  // history limit
  const big = new Playlist();
  for (let i = 1; i <= 15; i++) big.addSong({ id: `s${i}`, title: `Song ${i}` });
  const q = new Player(big);
  for (let i = 0; i < 15; i++) q.playNext();
  console.log(q.history.length);          // 10
  console.log(q.history[0].title);        // Song 5 (oldest kept)
}

module.exports = { Player };