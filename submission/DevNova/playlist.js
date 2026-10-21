class SongNode {
     constructor(song) {
         this.song = song;
         this.prev = null;
         this.next = null;
     }
 }
 
 class Playlist {
     constructor() {
         this.head = null;
         this.tail = null;
         this.current = null;
         this.songMap = new Map(); // songId -> node (O(1) lookup, blocks duplicates)
         this.repeat = false;
     }
 
     getId(song) {
         return song.id ?? song.songId;
     }
 
     addSong(song) {
         const id = this.getId(song);
 
         if (id === undefined || id === null) {
             throw new Error("Song must have an id or songId");
         }
 
         if (this.songMap.has(id)) {
             return false;
         }
 
         const node = new SongNode(song);
 
         if (!this.head) {
             this.head = node;
             this.tail = node;
             this.current = node;
         } else {
             node.prev = this.tail;
             this.tail.next = node;
             this.tail = node;
         }
 
         this.songMap.set(id, node);
         return true;
     }
 
     removeSong(songId) {
         const node = this.songMap.get(songId);
 
         if (!node) return false;
 
         if (node.prev) node.prev.next = node.next;
         else this.head = node.next;
 
         if (node.next) node.next.prev = node.prev;
         else this.tail = node.prev;
 
         if (this.current === node) {
             this.current = node.next || node.prev;
         }
 
         this.songMap.delete(songId);
         return true;
     }
 
    
     next() {
         if (!this.current) return "end";
 
         if (this.current.next) {
             this.current = this.current.next;
             return this.current.song;
         }
 
         if (this.repeat) {
             this.current = this.head;
             return this.current.song;
         }
 
         return "end";
     }
 
     previous() {
         if (!this.current) return "start";
 
         if (this.current.prev) {
             this.current = this.current.prev;
             return this.current.song;
         }
 
         return "start";
     }
 
     toggleRepeat() {
         this.repeat = !this.repeat;
         return this.repeat;
     }
 
     getSongById(songId) {
         return this.songMap.get(songId)?.song ?? null;
     }
 
     getCurrentSong() {
         return this.current?.song ?? null;
     }
 
     getAllSongs() {
         const songs = [];
         let node = this.head;
 
         while (node) {
             songs.push(node.song);
             node = node.next;
         }
 
         return songs;
     }
 }
 
 module.exports = Playlist;