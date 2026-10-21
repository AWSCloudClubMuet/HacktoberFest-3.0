
class MusicPlayer {
     constructor(playlist) {
         this.playlist = playlist;
         this.upNext = [];
         this.history = [];
         this.currentSong = playlist.getCurrentSong();
     }
 
     addToUpNext(songId) {
         const song = this.playlist.getSongById(songId);
 
         if (!song) return false;
 
         this.upNext.push(songId);
         return true;
     }
 
     saveToHistory(song) {
         if (!song) return;
 
         this.history.push(song);
 
         if (this.history.length > 10) {
             this.history.shift();
         }
     }
 
     playNext() {
          let nextSong = null;
      
          while (this.upNext.length > 0 && !nextSong) {
              nextSong = this.playlist.getSongById(this.upNext.shift());
          }
      
          if (!nextSong) {
              nextSong = this.playlist.next();
              if (nextSong === "end") return "end";
          }
      
          this.saveToHistory(this.currentSong);
          this.currentSong = nextSong;
          return nextSong;
      }

     back() {class MusicPlayer {
    constructor(playlist) {
        this.playlist = playlist;
        this.upNext = [];   
        this.history = [];  
        this.currentSong = playlist.getCurrentSong();
    }

    addToUpNext(songId) {
        const song = this.playlist.getSongById(songId);

        if (!song) return false;

        this.upNext.push(songId);
        return true;
    }

    saveToHistory(song) {
        if (!song) return;

        this.history.push(song);

      
        if (this.history.length > 10) {
            this.history.shift();
        }
    }


    playNext() {
        let nextSong = null;

        while (this.upNext.length > 0 && !nextSong) {
            nextSong = this.playlist.getSongById(this.upNext.shift());
        }

        if (!nextSong) {
            nextSong = this.playlist.next();

            if (nextSong === "end") {
                return "end";
            }
        }

        this.saveToHistory(this.currentSong);
        this.currentSong = nextSong;

        return nextSong;
    }

   
    back() {
        if (this.history.length === 0) {
            return null;
        }

        this.currentSong = this.history.pop();
        return this.currentSong;
    }

    getCurrentSong() {
        return this.currentSong;
    }
}

module.exports = MusicPlayer;
         if (this.history.length === 0) {
             return null;
         }
 
         this.currentSong = this.history.pop();
         return this.currentSong;
     }
 
     getCurrentSong() {
         return this.currentSong;
     }
 }
 
 module.exports = MusicPlayer;
 