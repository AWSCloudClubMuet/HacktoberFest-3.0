(function () {
  var api = window.TuneWaveApi;
  var ui = window.TuneWaveUi;
  var state = null;
  var activeView = "library";

  var viewCopy = {
    library: ["Milestone 1 · Playlist", "Library", "Doubly linked list in play order. Hash map lookup by song ID."],
    queue: ["Milestone 2 · Queue + history", "Queue", "Up Next is a FIFO queue. History is a bounded stack of 10."],
    search: ["Milestone 3 · BST", "Search", "Find an exact title or list every title with a given prefix."],
    artists: ["Milestone 3 · Graph", "Artists", "Undirected relations feed two-hop recommendations."]
  };

  function $(id) {
    return document.getElementById(id);
  }

  function setBusy(form, busy) {
    var button = form.querySelector("button[type='submit']");
    if (button) { button.disabled = busy; }
  }

  function showView(name) {
    activeView = name;
    document.querySelectorAll(".view").forEach(function (view) {
      var on = view.getAttribute("data-view") === name;
      view.hidden = !on;
      view.classList.toggle("is-active", on);
    });
    document.querySelectorAll(".nav-item").forEach(function (item) {
      item.classList.toggle("is-active", item.getAttribute("data-view") === name);
    });
    $("view-kicker").textContent = viewCopy[name][0];
    $("view-title").textContent = viewCopy[name][1];
    $("view-lede").textContent = viewCopy[name][2];
    $("sidebar").classList.remove("is-open");
    $("nav-scrim").hidden = true;
  }

  function cursorIndex() {
    if (!state.current) { return -1; }
    for (var i = 0; i < state.playlist.length; i++) {
      if (state.playlist[i].id === state.current.id) { return i; }
    }
    return -1;
  }

  function playingSource() {
    if (!state.playing) { return "Nothing playing"; }
    if (state.current && state.playing.id === state.current.id) { return "From playlist"; }
    return "From queue or history";
  }

  function renderNowPlaying() {
    var playing = state.playing;
    var index = cursorIndex();
    $("now-title").textContent = playing ? playing.title : "Nothing playing";
    $("now-artist").textContent = playing ? (playing.artist || "Unknown artist") : "Add a song or press Play next";
    $("now-cover").textContent = playing ? playing.title.slice(0, 2).toUpperCase() : "TW";
    $("playing-source").textContent = playingSource();
    $("cursor-label").textContent = state.current ? state.current.title : "—";
    $("playlist-position").textContent = index >= 0
      ? "Position " + (index + 1) + " of " + state.playlist.length
      : "No cursor";
    $("repeat-pill").textContent = state.repeat ? "Repeat on" : "Repeat off";
    $("repeat-pill").classList.toggle("is-on", state.repeat);
    $("btn-repeat").classList.toggle("is-on", state.repeat);
    $("btn-repeat").setAttribute("aria-pressed", String(state.repeat));
    $("queue-pill").textContent = "Queue " + state.upNext.length;
    $("history-pill").textContent = "History " + state.history.length + " / " + state.historyMax;
  }

  function playlistActions() {
    return [
      { label: "Queue", className: "btn ghost", onClick: queueSong },
      { label: "Remove", className: "btn danger", onClick: removeSong }
    ];
  }

  function renderLists() {
    var current = state.current || {};
    var playing = state.playing || {};
    var options = { current: current, playing: playing, actions: playlistActions() };

    $("playlist-count").textContent = state.playlist.length + " tracks";
    ui.fillList($("playlist-list"), state.playlist, function (song, index) {
      return ui.songRow(song, index, options);
    }, "Playlist is empty. Add a song to get started.");

    ui.fillList($("queue-list"), state.upNext, function (song, index) {
      return ui.songRow(song, index, { current: current, playing: playing });
    }, "Nothing queued. Queue a library track to jump the playlist.");
    ui.fillList($("rail-queue"), state.upNext, function (song, index) {
      return ui.songRow(song, index, { current: current, playing: playing });
    }, "Queue is empty.");
    $("queue-count").textContent = String(state.upNext.length);
    $("queue-page-count").textContent = state.upNext.length + " waiting";

    ui.fillList($("history-list"), state.history, function (song, index) {
      return ui.songRow(song, index, { current: current, playing: playing });
    }, "No history yet. Play next to start recording.");
    ui.fillList($("rail-history"), state.history, function (song, index) {
      return ui.songRow(song, index, { current: current, playing: playing });
    }, "History is empty.");
    $("history-count").textContent = state.history.length + " / " + state.historyMax;
    $("history-page-count").textContent = state.history.length + " / " + state.historyMax;
  }

  function refresh() {
    return api.getState().then(function (snapshot) {
      state = snapshot;
      renderNowPlaying();
      renderLists();
    });
  }

  function handleResult(result, successMessage) {
    if (!result || result.ok === false) {
      ui.toast((result && result.error) || "That did not work.", "error");
      return refresh();
    }
    if (result.end) {
      ui.toast("End of playlist.", "ok");
    } else if (successMessage) {
      ui.toast(successMessage, "ok");
    }
    return refresh();
  }

  function run(action, successMessage) {
    return action().then(function (result) {
      return handleResult(result, successMessage);
    }).catch(function (error) {
      ui.toast(error.message || "Something went wrong.", "error");
    });
  }

  function queueSong(song) {
    run(function () { return api.addToUpNext(song.title); }, "Queued \"" + song.title + "\".");
  }

  function removeSong(song) {
    run(function () { return api.removeSong(song.title); }, "Removed \"" + song.title + "\".");
  }

  function bindNav() {
    document.querySelectorAll(".nav-item").forEach(function (item) {
      item.addEventListener("click", function () {
        showView(item.getAttribute("data-view"));
      });
    });
    $("menu-btn").addEventListener("click", function () {
      var open = !$("sidebar").classList.contains("is-open");
      $("sidebar").classList.toggle("is-open", open);
      $("nav-scrim").hidden = !open;
    });
    $("nav-scrim").addEventListener("click", function () {
      $("sidebar").classList.remove("is-open");
      $("nav-scrim").hidden = true;
    });
  }

  function bindPlayer() {
    $("btn-next").addEventListener("click", function () {
      run(function () { return api.next(); }, "Moved to the next playlist song.");
    });
    $("btn-prev").addEventListener("click", function () {
      run(function () { return api.previous(); }, "Moved to the previous playlist song.");
    });
    $("btn-play-next").addEventListener("click", function () {
      api.playNext().then(function (result) {
        var message = result && result.source === "queue" ? "Playing from Up Next." : "Playing next.";
        return handleResult(result, message);
      }).catch(function (error) {
        ui.toast(error.message || "Something went wrong.", "error");
      });
    });
    $("btn-back").addEventListener("click", function () {
      run(function () { return api.back(); }, "Restored the last history track.");
    });
    $("btn-repeat").addEventListener("click", function () {
      api.toggleRepeat().then(function (result) {
        if (!result || result.ok === false) {
          return handleResult(result);
        }
        return handleResult(result).then(function () {
          ui.toast(state.repeat ? "Repeat on." : "Repeat off.", "ok");
        });
      }).catch(function (error) {
        ui.toast(error.message || "Something went wrong.", "error");
      });
    });
  }

  function bindForms() {
    $("add-song-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var title = $("song-title").value.trim();
      var artist = $("song-artist").value.trim();
      setBusy(event.target, true);
      api.addSong(title, artist).then(function (result) {
        setBusy(event.target, false);
        if (!result.ok) {
          ui.toast(result.error, "error");
          return null;
        }
        event.target.reset();
        ui.toast("Added \"" + title + "\".", "ok");
        return refresh();
      }).catch(function (error) {
        setBusy(event.target, false);
        ui.toast(error.message || "Could not add that song.", "error");
      });
    });

    $("search-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var query = $("search-query").value.trim();
      var box = $("search-results");
      box.innerHTML = "";
      box.appendChild(ui.loadingState());
      var prefixPromise = api.prefixSearch(query);
      var exactPromise = query ? api.findSong(query) : Promise.resolve({ songs: [] });
      Promise.all([prefixPromise, exactPromise]).then(function (results) {
        var prefix = results[0];
        var exact = results[1];
        var rowOptions = {
          current: state.current,
          playing: state.playing,
          actions: playlistActions()
        };
        box.innerHTML = "";
        if (exact.songs && exact.songs.length) {
          box.appendChild(ui.el("p", "section-label", "Exact title match"));
          exact.songs.forEach(function (song, index) {
            box.appendChild(ui.songRow(song, index, rowOptions));
          });
          }
          box.appendChild(ui.el("p", "section-label", "Prefix matches"));
          var prefixSongs = prefix.songs || [];
        if (!prefixSongs.length) {
          box.appendChild(ui.emptyState("No titles start with that prefix."));
        } else {
          prefixSongs.forEach(function (song, index) {
            box.appendChild(ui.songRow(song, index, rowOptions));
          });
        }
      }).catch(function (error) {
        box.innerHTML = "";
        box.appendChild(ui.el("p", "state is-error", error.message));
      });
    });

    $("relation-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var a = $("artist-a").value.trim();
      var b = $("artist-b").value.trim();
      setBusy(event.target, true);
      run(function () { return api.addRelation(a, b); }, "Stored an undirected relation.")
        .then(function () { setBusy(event.target, false); });
    });

    $("recommend-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var artist = $("recommend-artist").value.trim();
      var box = $("recommend-results");
      box.innerHTML = "";
      box.appendChild(ui.loadingState());
      api.recommendArtists(artist).then(function (result) {
        box.innerHTML = "";
        if (!result.artists.length) {
          box.appendChild(ui.emptyState("No two-hop recommendations for that artist."));
          return;
        }
        result.artists.forEach(function (name) {
          box.appendChild(ui.el("span", "chip", name));
        });
      }).catch(function (error) {
        box.innerHTML = "";
        box.appendChild(ui.el("p", "state is-error", error.message));
      });
    });
  }

  document.querySelectorAll(".view").forEach(function (view) {
    if (view.getAttribute("data-view") !== "library") {
      view.hidden = true;
    }
  });

  bindNav();
  bindPlayer();
  bindForms();
  $("playlist-list").appendChild(ui.loadingState());
  refresh().catch(function (error) {
    ui.toast(error.message || "Could not load player state.", "error");
  });
}());
