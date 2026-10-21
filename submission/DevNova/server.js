const http = require("http");
const fs = require("fs");
const path = require("path");

const Playlist = require("./playlist");
const MusicPlayer = require("./musicPlayer");
const SongSearchBST = require("./songSearch");
const ArtistGraph = require("./artistGraph");

const PORT = 3000;
const DURATION = 210;


const playlist = new Playlist();
const search = new SongSearchBST();
const graph = new ArtistGraph();


const songs = [
    { id: 1, title: "Yellow", artist: "Coldplay" },
    { id: 2, title: "Yesterday", artist: "The Beatles" },
    { id: 3, title: "Shape of You", artist: "Ed Sheeran" },
    { id: 4, title: "Blinding Lights", artist: "The Weeknd" },
    { id: 5, title: "Perfect", artist: "Ed Sheeran" },
    { id: 6, title: "Viva La Vida", artist: "Coldplay" },
    { id: 7, title: "Levitating", artist: "Dua Lipa" },
    { id: 8, title: "Someone Like You", artist: "Adele" }
];


songs.forEach(song => {
    playlist.addSong(song);
    search.addSong(song.title, song.id);
});


const player = new MusicPlayer(playlist);


graph.addRelation("Coldplay", "Ed Sheeran");
graph.addRelation("Ed Sheeran", "Adele");
graph.addRelation("Adele", "The Weeknd");
graph.addRelation("Coldplay", "Dua Lipa");
graph.addRelation("Dua Lipa", "The Weeknd");
graph.addRelation("The Beatles", "Adele");


let currentSong = playlist.getCurrentSong();
let playing = false;
let progress = 0;
let timer = null;

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

function startTimer() {
    stopTimer();

    timer = setInterval(() => {
        if (!playing) return;

        progress += 1;

        if (progress >= DURATION) {
            advance();
        }
    }, 1000);
}

function getSongById(id) {
    return playlist.getSongById(Number(id));
}


function startPlayback(song) {
    currentSong = song;
    player.currentSong = song;
    playing = true;
    progress = 0;
    startTimer();
}

function playSong(song) {
    if (!song) return false;

    if (currentSong && currentSong.id !== song.id) {
        player.saveToHistory(currentSong);
    }

    const node = playlist.songMap.get(song.id);
    if (node) playlist.current = node;

    startPlayback(song);
    return true;
}


function advance() {
    const next = player.playNext();

    if (next === "end" || !next) {
        playing = false;
        progress = DURATION;
        stopTimer();
        return;
    }

    startPlayback(next);
}

function publicState() {
    return {
        songs: playlist.getAllSongs(),
        currentSong,
        playing,
        repeat: playlist.repeat,
        progress,
        duration: DURATION,
        queue: player.upNext
            .map(id => getSongById(id))
            .filter(Boolean),
        history: [...player.history],
        recommendations: currentSong
            ? graph.recommendArtists(currentSong.artist)
            : []
    };
}

function sendJSON(res, data, statusCode = 200) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
    });

    res.end(JSON.stringify(data));
}

function handleAction(req, res) {
    let body = "";

    req.on("data", chunk => {
        body += chunk;
    });

    req.on("end", () => {
        try {
            const { action, id } = JSON.parse(body || "{}");

            switch (action) {
                case "play": {
                    const song = getSongById(id);

                    if (!song) {
                        return sendJSON(res, { error: "Song not found" }, 404);
                    }

                    playSong(song);
                    break;
                }

                case "toggle": {
                    if (playing) {
                        playing = false;
                        stopTimer();
                    } else if (currentSong) {
                        // Resume without resetting progress
                        if (progress >= DURATION) progress = 0;
                        playing = true;
                        startTimer();
                    }

                    break;
                }

                case "next": {
                    advance();
                    break;
                }

                case "previous": {
                    const prev = playlist.previous();

                    if (prev !== "start" && prev) {
                        if (currentSong && currentSong.id !== prev.id) {
                            player.saveToHistory(currentSong);
                        }
                        startPlayback(prev);
                    }

                    break;
                }

                case "queue": {
                    if (!player.addToUpNext(Number(id))) {
                        return sendJSON(res, { error: "Song not found" }, 404);
                    }

                    break;
                }

                case "repeat": {
                    playlist.toggleRepeat();
                    break;
                }

                case "seek": {
                    const requested = Number(id);

                    if (!Number.isFinite(requested)) {
                        return sendJSON(res, { error: "Invalid seek position" }, 400);
                    }

                    progress = Math.max(0, Math.min(DURATION, requested));

                    // If the slider reaches the end, finish the song
                    if (progress >= DURATION && playing) {
                        advance();
                    }

                    break;
                }

                case "back": {
                    const prev = player.back();

                    if (prev) {
                        startPlayback(prev);
                    }

                    break;
                }

                default:
                    return sendJSON(res, { error: "Unknown action" }, 400);
            }

            return sendJSON(res, publicState());
        } catch (error) {
            console.error("Action error:", error.message);
            return sendJSON(res, { error: "Invalid request" }, 400);
        }
    });
}

function serveStaticFile(req, res, pathname) {
    const requestedFile = pathname === "/"
        ? "index.html"
        : pathname.replace(/^\/+/, "");

    const publicDirectory = path.resolve(__dirname, "public");
    const filePath = path.resolve(publicDirectory, requestedFile);


    if (
        filePath !== publicDirectory &&
        !filePath.startsWith(publicDirectory + path.sep)
    ) {
        res.writeHead(403);
        return res.end("Forbidden");
    }

    const extension = path.extname(filePath).toLowerCase();

    const contentTypes = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".ico": "image/x-icon"
    };

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404, {
                "Content-Type": "text/plain; charset=utf-8"
            });

            return res.end("File not found");
        }

        res.writeHead(200, {
            "Content-Type": contentTypes[extension] || "application/octet-stream"
        });

        res.end(content);
    });
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });

        return res.end();
    }

    if (req.method === "GET" && url.pathname === "/api/state") {
        return sendJSON(res, publicState());
    }

    if (req.method === "GET" && url.pathname === "/api/search") {
        const query = url.searchParams.get("q") || "";
        const results = search.prefixSearchWithIds(query);

        return sendJSON(res, results);
    }

    if (req.method === "POST" && url.pathname === "/api/action") {
        return handleAction(req, res);
    }

    if (req.method === "GET") {
        return serveStaticFile(req, res, url.pathname);
    }

    res.writeHead(405, {
        "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("Method not allowed");
});

server.listen(PORT, () => {
    console.log(`TuneWave is running at http://localhost:${PORT}`);
});

process.on("SIGINT", () => {
    stopTimer();
    server.close(() => {
        process.exit(0);
    });
});
