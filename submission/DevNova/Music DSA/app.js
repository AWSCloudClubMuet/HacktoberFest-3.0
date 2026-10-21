const $ = selector => document.querySelector(selector);

let state = null;
let activeView = "home";
let searchQuery = "";
let searchResults = [];
let searchRequestId = 0;
let seeking = false;
let refreshInProgress = false;
let lastListKey = "";

function escapeHTML(value) {
     return String(value ?? "").replace(/[&<>"']/g, char => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
     })[char]);
}

function songId(song) {
     return song?.id ?? song?.songId;
}

async function api(url, options = {}) {
     const response = await fetch(url, options);
     const data = await response.json();

     if (!response.ok) {
          throw new Error(data.error || "Something went wrong");
     }

     return data;
}

async function sendAction(action, id) {
     try {
          state = await api("/api/action", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ action, id })
          });

          render(true);
     } catch (error) {
          setStatus(error.message);
     }
}

function setStatus(message) {
     const status = $("#status-text");
     if (status) status.textContent = message;
}

function formatTime(seconds) {
     const value = Math.max(0, Math.floor(Number(seconds) || 0));
     return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

function getVisibleSongs() {
     if (!state) return [];

     if (activeView === "queue") {
          return state.queue || [];
     }

     if (activeView === "history") {
          return [...(state.history || [])].reverse();
     }

     if (searchQuery) {
          return searchResults;
     }

     return state.songs;
}

function renderSongs() {
     const list = $("#song-list");
     if (!list) return;

     const songs = getVisibleSongs();

     const headings = {
          home: "Popular Tracks",
          library: "My Library",
          queue: "Up Next",
          history: "Recently Played"
     };

     $("#songs-heading").textContent = searchQuery
          ? "Search Results"
          : headings[activeView] || "Popular Tracks";

     const count = $("#track-count");
     if (count) count.textContent = `${songs.length} tracks`;

     if (songs.length === 0) {
          list.innerHTML = `
            <div class="empty-state">
                <h3>${searchQuery ? "No matching songs" : "Nothing here yet"}</h3>
                <p>${searchQuery
                    ? "Try another song title."
                    : "Songs will appear here when available."}</p>
            </div>`;
          return;
     }

     list.innerHTML = songs.map((song, index) => {
          const id = songId(song);
          const current = songId(state.currentSong) === id;

          return `
            <div
                class="song-row ${current ? "current" : ""}"
                data-song-id="${escapeHTML(id)}"
                role="button"
                tabindex="0"
                aria-label="Play ${escapeHTML(song.title)}"
            >
                <div class="cover cover-${(index % 3) + 1}">
                    ${current && state.playing ? "♫" : "♪"}
                </div>

                <div class="song-info">
                    <div class="song-title">${escapeHTML(song.title)}</div>
                    <div class="song-artist">${escapeHTML(song.artist)}</div>
                </div>

                <span class="song-index">${String(index + 1).padStart(2, "0")}</span>

                <div class="row-actions">
                    <button
                        class="small-btn"
                        data-action="play"
                        data-id="${escapeHTML(id)}"
                        type="button"
                    >${current && state.playing ? "Playing" : "Play"}</button>

                    <button
                        class="small-btn"
                        data-action="queue"
                        data-id="${escapeHTML(id)}"
                        type="button"
                    >+ Queue</button>
                </div>
            </div>`;
     }).join("");
}

function renderQueue() {
     const list = $("#queue-list");
     if (!list) return;

     const queue = state.queue || [];

     list.innerHTML = queue.length
          ? queue.map(song => `
            <div class="compact-row">
                <div class="cover cover-1">♫</div>
                <div class="song-info">
                    <div class="song-title">${escapeHTML(song.title)}</div>
                    <div class="song-artist">${escapeHTML(song.artist)}</div>
                </div>
            </div>
        `).join("")
          : '<p class="muted-note">Your queue is empty.</p>';
}

function renderArtists() {
     const list = $("#artist-list");
     if (!list) return;

     const artists = state.recommendations || [];

     list.innerHTML = artists.length
          ? artists.map(artist =>
               `<span class="artist-chip">${escapeHTML(artist)}</span>`
          ).join("")
          : '<span class="muted-note">No related artists found.</span>';
}

function renderPlayer() {
     const song = state.currentSong;
     const duration = state.duration || 210;
     const progress = Math.min(state.progress || 0, duration);

     $("#now-title").textContent = song?.title || "Nothing playing";
     $("#now-artist").textContent = song?.artist || "Choose a track to begin";
     $("#play-btn").textContent = state.playing ? "Ⅱ" : "▶";

     const repeatButton = $("#repeat-btn");
     repeatButton.classList.toggle("enabled", Boolean(state.repeat));
     repeatButton.setAttribute("aria-pressed", String(Boolean(state.repeat)));
     repeatButton.title = state.repeat ? "Repeat playlist: On" : "Repeat playlist: Off";

     const backButton = $("#back-btn");
     if (backButton) {
          backButton.disabled = !(state.history && state.history.length);
          backButton.style.opacity = backButton.disabled ? "0.35" : "1";
     }

     if (!seeking) {
          $("#elapsed").textContent = formatTime(progress);
     }
     $("#duration").textContent = formatTime(duration);

     const slider = $("#seek-bar");

     if (slider && !seeking) {
          slider.max = duration;
          slider.value = progress;

          const percent = duration ? (progress / duration) * 100 : 0;

          slider.style.background =
               `linear-gradient(to right, #e879f9 ${percent}%, #373146 ${percent}%)`;
     }

     setStatus(state.playing ? "Now playing" : "Ready to play");
}


function render(force = false) {
     if (!state) return;

     const key = JSON.stringify([
          state.songs,
          state.queue,
          state.history,
          state.currentSong,
          state.playing,
          state.recommendations
     ]);

     if (force || key !== lastListKey) {
          lastListKey = key;
          renderSongs();
          renderQueue();
          renderArtists();
     }

     renderPlayer();
}

async function refreshState() {
     if (refreshInProgress) return;

     refreshInProgress = true;

     try {
          state = await api("/api/state");
          render();
     } catch (error) {
          setStatus("Could not refresh TuneWave");
     } finally {
          refreshInProgress = false;
     }
}


$("#song-list").addEventListener("click", event => {
     const button = event.target.closest("button[data-action]");

     if (button) {
          event.stopPropagation();
          sendAction(button.dataset.action, Number(button.dataset.id));
          return;
     }

     const row = event.target.closest("[data-song-id]");
     if (row) {
          sendAction("play", Number(row.dataset.songId));
     }
});

$("#song-list").addEventListener("keydown", event => {
     const row = event.target.closest("[data-song-id]");

     if (row && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          sendAction("play", Number(row.dataset.songId));
     }
});


$("#search-input").addEventListener("input", async event => {
     searchQuery = event.target.value.trim();
     activeView = "home";

     document.querySelectorAll(".nav-item").forEach(button => {
          button.classList.toggle("active", button.dataset.view === "home");
     });

     if (!searchQuery) {
          searchResults = [];
          renderSongs();
          return;
     }

     const requestId = ++searchRequestId;

     try {
          const hits = await api(`/api/search?q=${encodeURIComponent(searchQuery)}`);


          if (requestId !== searchRequestId) return;

          searchResults = hits
               .map(hit => state.songs.find(song => song.id === hit.songId))
               .filter(Boolean);
     } catch (error) {
          if (requestId !== searchRequestId) return;
          searchResults = [];
     }

     renderSongs();
});

$("#play-btn").addEventListener("click", () => sendAction("toggle"));
$("#next-btn").addEventListener("click", () => sendAction("next"));
$("#previous-btn").addEventListener("click", () => sendAction("previous"));
$("#repeat-btn").addEventListener("click", () => sendAction("repeat"));


if ($("#back-btn")) {
     $("#back-btn").addEventListener("click", () => sendAction("back"));
}


$("#seek-bar").addEventListener("input", event => {
     seeking = true;

     const value = Number(event.target.value);
     const duration = Number(state?.duration || 210);
     const percent = (value / duration) * 100;

     $("#elapsed").textContent = formatTime(value);

     event.target.style.background =
          `linear-gradient(to right, #e879f9 ${percent}%, #373146 ${percent}%)`;
});

$("#seek-bar").addEventListener("change", async event => {
     const value = Number(event.target.value);

     try {
          state = await api("/api/action", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ action: "seek", id: value })
          });
     } catch (error) {
          setStatus(error.message);
     }

     seeking = false;
     render(true);
});


document.querySelectorAll(".nav-item").forEach(button => {
     button.addEventListener("click", () => {
          activeView = button.dataset.view;
          searchQuery = "";
          searchResults = [];

          const searchInput = $("#search-input");
          if (searchInput) searchInput.value = "";

          document.querySelectorAll(".nav-item").forEach(item => {
               item.classList.toggle("active", item === button);
          });

          renderSongs();
     });
});

if ($("#explore-btn")) {
     $("#explore-btn").addEventListener("click", () => {
          $("#songs-section").scrollIntoView({ behavior: "smooth" });
     });
}

async function initialize() {
     await refreshState();
}

initialize();

setInterval(() => {
     if (!seeking) refreshState();
}, 1000);