
/*
  TuneWave Web App
  Connects the existing TuneWave class in index.js
*/

// Load the existing music tuneWavePlayer logic.


const audio = new Audio();
audio.preload = "metadata";

audio.addEventListener("ended", () => {
  isPlaying = false;
  updatePlayButton();
});

(() => {
const script = document.createElement("script");
script.src = "index.js";

script.onload = initializeTuneWave;
script.onerror = () => {
  showMessage("Could not load index.js. Check that the file exists.");
};

document.head.appendChild(script);

let tuneWavePlayer;
let isPlaying = false;
let searchText = "";
let selectedSongId = null;



let toastTimer;

function showMessage(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  clearTimeout(toastTimer);

  toast.textContent = message;
  toast.classList.remove("error", "info");

  if (/error|failed|could not|not found|already exists|please enter|no previous|end of the playlist/i.test(message)) {
    toast.classList.add("error");
  } else if (/paused|repeat disabled|demo mode|not available/i.test(message)) {
    toast.classList.add("info");
  }

  toast.classList.add("show");

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


function initializeTuneWave() {
  try {
    if (typeof TuneWave === "undefined") {
      showMessage("TuneWave class was not found in index.js.");
      return;
    }

    tuneWavePlayer = new TuneWave();

    const songs = [
      { id: "s1", title: "Ocean Eyes", artist: "Aisha" },
      { id: "s2", title: "Golden Hour", artist: "Bilal" },
      { id: "s3", title: "Night Changes", artist: "Cyrus" },
      { id: "s4", title: "Another Day", artist: "Dina" },
      { id: "s5", title: "Open Sky", artist: "Eman" }
    ];

    songs.forEach(song => tuneWavePlayer.addSong(song));

    tuneWavePlayer.connectArtists("Aisha", "Bilal");
    tuneWavePlayer.connectArtists("Bilal", "Cyrus");
    tuneWavePlayer.connectArtists("Cyrus", "Dina");
    tuneWavePlayer.connectArtists("Dina", "Eman");
    tuneWavePlayer.connectArtists("Aisha", "Eman");

    const firstSong = songs[0];
    selectedSongId = firstSong.id;

    renderPlaylist();
    renderQueue();
    renderRecommendations();

    document.getElementById("search-input").addEventListener("input", event => {
      searchText = event.target.value.trim().toLowerCase();
      renderPlaylist();
    });

    document.getElementById("previous-btn").addEventListener("click", previousSong);
    document.getElementById("next-btn").addEventListener("click", nextSong);
    document.getElementById("play-btn").addEventListener("click", togglePlay);
    document.getElementById("repeat-btn").addEventListener("click", toggleRepeat);
    document.getElementById("add-song-btn").addEventListener("click", addSongFromForm);
    document.getElementById("remove-song-btn").addEventListener("click", removeSongFromForm);

    updateCurrentSong(firstSong);
    showMessage("Ready to play");
  } catch (error) {
    console.error(error);
    showMessage("Could not initialize tuneWavePlayer. Check the console.");
  }
}

function getSongs() {
  return tuneWavePlayer.getPlaylist();
}

function renderPlaylist() {
  const container = document.getElementById("song-list");
  
const songs = getSongs().filter(song =>
  song.title.toLowerCase().includes(searchText) ||
  song.artist.toLowerCase().includes(searchText)
);

  document.getElementById("song-count").textContent =
    `${songs.length} song${songs.length === 1 ? "" : "s"}`;

  if (!songs.length) {
    container.innerHTML = '<p class="empty-message">No songs found.</p>';
    return;
  }

  container.innerHTML = songs.map((song, index) => `
    <div class="song-row">
      <span class="song-number">${index + 1}</span>
      <div class="song-info">
        <div class="song-cover">♫</div>
        <div>
          <strong>${escapeHTML(song.title)}</strong>
          <small>${escapeHTML(song.artist)}</small>
        </div>
      </div>
      <span class="song-artist">${escapeHTML(song.artist)}</span>
      <div class="song-actions">
        
<button class="small-button" data-action="play"
  data-id="${escapeHTML(song.id)}" title="Select song">▶ add</button>
<button class="small-button" data-action="queue"
  data-id="${escapeHTML(song.id)}" title="Add to Up Next">＋ Queue</button>

      </div>
    </div>
  `).join("");

  container.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      const songId = button.dataset.id;

      if (button.dataset.action === "queue") {
        const added = tuneWavePlayer.addToUpNext(songId);

        if (added !== false) {
          renderQueue();
          showMessage("Added to Up Next");
        } else {
          showMessage("Could not add this song to the queue.");
        }
      } else {
        const song = getSongs().find(item => item.id === songId);
        if (song) {
          
selectedSongId = songId;
updateCurrentSong(song);
renderRecommendations();
isPlaying = false;
updatePlayButton();
showMessage("Song selected");

        }
      }
    });
  });
}

function renderQueue() {
  const container = document.getElementById("queue-list");
  const queue = Array.isArray(tuneWavePlayer.upNext) ? tuneWavePlayer.upNext : [];

  if (!queue.length) {
    container.innerHTML = '<p class="empty-message">Your queue is empty.</p>';
    return;
  }

  container.innerHTML = queue.map(id => {
    const song = getSongs().find(item => item.id === id);
    if (!song) return "";

    return `
      <div class="queue-item">
        <div class="song-cover">♫</div>
        <div>
          <strong>${escapeHTML(song.title)}</strong>
          <small>${escapeHTML(song.artist)}</small>
        </div>
      </div>
    `;
  }).join("");
}

function renderRecommendations() {
  const container = document.getElementById("recommendations");
  const current = getSongs().find(song => song.id === selectedSongId);

  if (!current) {
    container.innerHTML = '<p class="empty-message">No recommendations yet.</p>';
    return;
  }

  const artists = tuneWavePlayer.recommendArtists(current.artist);

  if (!artists.length) {
    container.innerHTML = '<p class="empty-message">No related artists found.</p>';
    return;
  }

  container.innerHTML = artists.map(artist => `
    <div class="recommendation-card">
      <div class="recommendation-icon">♫</div>
      <strong>${escapeHTML(artist)}</strong>
      <small>Related artist</small>
    </div>
  `).join("");
}

function updateCurrentSong(song) {
  if (!song) return;

  document.getElementById("current-title").textContent = song.title;
  document.getElementById("current-artist").textContent = song.artist;
  renderRecommendations();
}



async function nextSong() {
  const result = tuneWavePlayer.playNext();

  if (result === "end" || result === "empty" || !result) {
    isPlaying = false;
    audio.pause();
    updatePlayButton();
    showMessage("You've reached the end of the playlist.");
    return;
  }

  selectedSongId = result.id;
  updateCurrentSong(result);
  renderQueue();
  renderPlaylist();

  audio.pause();
  isPlaying = false;
  updatePlayButton();

  await togglePlay();
}



async function previousSong() {
  const song = tuneWavePlayer.previous();

  if (!song || typeof song !== "object" || !song.id) {
    showMessage("No previous song available.");
    return;
  }

  selectedSongId = song.id;
  updateCurrentSong(song);
  renderPlaylist();
  renderQueue();

  audio.pause();
  audio.currentTime = 0;
  isPlaying = false;
  updatePlayButton();

  await togglePlay();
} 

async function togglePlay() {
  const song = getSongs().find(item => item.id === selectedSongId);

  if (!song) {
    showMessage("Please select a song first.");
    return;
  }

  const audioFiles = {
    s1: "music/ocean-eyes.mp3",
    s2: "music/golden-hour.mp3",
    s3: "music/night-changes.mp3",
    s4: "music/another-day.mp3",
    s5: "music/open-sky.mp3"
  };

  const audioFile = audioFiles[song.id];

  if (!audioFile) {
    showMessage("No audio file is assigned to this song.");
    return;
  }

  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    updatePlayButton();
    showMessage("Playback paused.");
    return;
  }

  // Load a new file only when the selected song changes.
  if (!audio.src || !audio.src.endsWith(audioFile)) {
    audio.src = audioFile;
    audio.load();
  }

  try {
    await audio.play();
    isPlaying = true;
    updatePlayButton();
    showMessage("Now playing: " + song.title);
  } catch (error) {
    console.error("Audio playback error:", error);
    isPlaying = false;
    updatePlayButton();
    showMessage("Audio could not play. Check the MP3 file.");
  }
}


function updatePlayButton() {
  const button = document.getElementById("play-btn");
  button.textContent = isPlaying ? "Ⅱ" : "▶";
  button.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
}



function toggleRepeat() {
  const enabled = tuneWavePlayer.toggleRepeat();
  const button = document.getElementById("repeat-btn");

  button.classList.toggle("enabled", enabled);
  button.title = enabled ? "Repeat enabled" : "Repeat disabled";
  showMessage(enabled ? "Repeat enabled" : "Repeat disabled");
}


function addSongFromForm() {
  const idInput = document.getElementById("add-song-id");
  const titleInput = document.getElementById("add-song-title");
  const artistInput = document.getElementById("add-song-artist");

  const id = idInput.value.trim();
  const title = titleInput.value.trim();
  const artist = artistInput.value.trim();

  if (!id || !title || !artist) {
    showMessage("Please enter Song ID, title and artist.");
    return;
  }

  if (tuneWavePlayer.songsById.has(id)) {
    showMessage("This Song ID already exists. Please use a unique ID.");
    return;
  }

  const song = { id, title, artist };

  try {
    tuneWavePlayer.addSong(song);

    idInput.value = "";
    titleInput.value = "";
    artistInput.value = "";

    renderPlaylist();
    renderQueue();
    renderRecommendations();

    showMessage(`Added "${title}" to your playlist.`);
  } catch (error) {
    showMessage(error.message);
  }
}

function removeSongFromForm() {
  const input = document.getElementById("remove-song-id");
  const songId = input.value.trim();

  if (!songId) {
    showMessage("Please enter the Song ID to remove.");
    return;
  }

  const song = tuneWavePlayer.songsById.get(songId);

  if (!song) {
    showMessage("Song ID not found.");
    return;
  }

  const removedTitle = song.song.title;
  const wasSelected = selectedSongId === songId;

  const removed = tuneWavePlayer.removeSong(songId);

  if (!removed) {
    showMessage("Could not remove the song.");
    return;
  }

  input.value = "";

  if (wasSelected) {
    const currentSong = tuneWavePlayer.getCurrentSong();

    selectedSongId = currentSong ? currentSong.id : null;
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    updatePlayButton();

    if (currentSong) {
      updateCurrentSong(currentSong);
    } else {
      document.getElementById("current-title").textContent = "No song selected";
      document.getElementById("current-artist").textContent =
        "Choose a song from your playlist";
      renderRecommendations();
    }
  }

  renderPlaylist();
  renderQueue();
  renderRecommendations();

  showMessage(`Removed "${removedTitle}" from your playlist.`);
}


function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

})();

