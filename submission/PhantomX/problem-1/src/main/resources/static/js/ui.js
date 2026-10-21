(function (global) {
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text) { node.textContent = text; }
    return node;
  }

  function button(label, className, onClick) {
    var node = el("button", className, label);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  }

  function emptyState(message) {
    return el("p", "empty", message);
  }

  function loadingState() {
    return el("p", "state", "Loading…");
  }

  function toast(message, type) {
    var region = document.getElementById("toasts");
    var node = el("div", "toast " + (type || "ok"), message);
    region.appendChild(node);
    window.setTimeout(function () {
      if (node.parentNode) { node.parentNode.removeChild(node); }
    }, 2800);
  }

  function fillList(container, items, renderItem, emptyMessage) {
    container.innerHTML = "";
    if (!items || !items.length) {
      container.appendChild(emptyState(emptyMessage));
      return;
    }
    items.forEach(function (item, index) {
      container.appendChild(renderItem(item, index));
    });
  }

  function songRow(song, index, options) {
    var row = el("article", "song-row");
    var current = options.current || {};
    var playing = options.playing || {};
    var isPlaying = song.id === playing.id;
    var isCurrent = song.id === current.id;
    if (isPlaying) { row.classList.add("is-playing"); }
    if (isCurrent) { row.classList.add("is-current"); }

    row.appendChild(el("span", "song-index", String(index + 1)));
    var copy = el("div", "song-copy");
    copy.appendChild(el("p", "song-title", song.title));
    copy.appendChild(el("p", "song-artist", song.artist || "Unknown artist"));
    row.appendChild(copy);

    var flags = el("div", "row-flags");
    if (isPlaying) { flags.appendChild(el("span", "badge playing", "Playing")); }
    if (isCurrent) { flags.appendChild(el("span", "badge current", "Cursor")); }
    if (flags.childNodes.length) { row.appendChild(flags); }

    if (options.actions) {
      var actions = el("div", "row-actions");
      options.actions.forEach(function (action) {
        actions.appendChild(button(action.label, action.className || "btn ghost", function () {
          action.onClick(song);
        }));
      });
      row.appendChild(actions);
    }
    return row;
  }

  global.TuneWaveUi = {
    el: el,
    button: button,
    emptyState: emptyState,
    loadingState: loadingState,
    toast: toast,
    fillList: fillList,
    songRow: songRow
  };
}(window));
