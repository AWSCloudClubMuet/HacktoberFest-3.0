/**
 * REST client for the TuneWave Spring Boot API.
 */
(function (global) {
  var BASE = "/api";

  function request(path, options) {
    return fetch(BASE + path, options).then(function (response) {
      return response.json().then(function (body) {
        if (!response.ok) {
          throw new Error((body && body.error) || "Request failed.");
        }
        return body;
      });
    });
  }

  global.TuneWaveApi = {
    useMock: false,

    getState: function () {
      return request("/player");
    },

    addSong: function (title, artist) {
      return request("/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title, artist: artist })
      });
    },

    removeSong: function (title) {
      return request("/songs?title=" + encodeURIComponent(title), { method: "DELETE" });
    },

    next: function () {
      return request("/player/next", { method: "POST" });
    },

    previous: function () {
      return request("/player/previous", { method: "POST" });
    },

    toggleRepeat: function () {
      return request("/player/repeat", { method: "POST" });
    },

    addToUpNext: function (title) {
      return request("/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title })
      });
    },

    playNext: function () {
      return request("/player/play-next", { method: "POST" });
    },

    back: function () {
      return request("/player/back", { method: "POST" });
    },

    findSong: function (title) {
      return request("/search?title=" + encodeURIComponent(title));
    },

    prefixSearch: function (prefix) {
      return request("/search/prefix?q=" + encodeURIComponent(prefix || ""));
    },

    addRelation: function (artistA, artistB) {
      return request("/artists/relations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistA: artistA, artistB: artistB })
      });
    },

    recommendArtists: function (artist) {
      return request("/artists/recommendations?artist=" + encodeURIComponent(artist));
    }
  };
}(window));
