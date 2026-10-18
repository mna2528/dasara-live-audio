
const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.join(__dirname, "public");
const AUDIO_DIR = path.join(ROOT, "audio");
const TRACKS_FILE = path.join(ROOT, "tracks.json");

function loadTracks() {
  try {
    const data = JSON.parse(fs.readFileSync(TRACKS_FILE, "utf8"));
    const tracks = Array.isArray(data) ? data : data.tracks;

    if (!Array.isArray(tracks)) return [];

    return tracks.filter(
      (track) =>
        track &&
        typeof track.title === "string" &&
        typeof track.file === "string"
    );
  } catch (error) {
    console.error("Could not load tracks.json:", error.message);
    return [];
  }
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  let pathname;

  try {
    pathname = decodeURIComponent(
      new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname
    );
  } catch {
    res.writeHead(400);
    return res.end("Bad request");
  }

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        ok: true,
        tracks: loadTracks().length,
        audioFolderExists: fs.existsSync(AUDIO_DIR)
      })
    );
  }

  let relative;

  if (pathname === "/" || pathname === "/player") {
    relative = "player.html";
  } else if (pathname === "/controller") {
    relative = "controller.html";
  } else {
    relative = pathname.replace(/^\/+/, "");
  }

  const target = path.resolve(ROOT, relative);

  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(target, (statError, stats) => {
    if (statError || !stats.isFile()) {
      res.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      return res.end("Not found: " + pathname);
    }

    fs.readFile(target, (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end("Could not read file");
      }

      res.writeHead(200, {
        "Content-Type":
          mime[path.extname(target).toLowerCase()] ||
          "application/octet-stream",
        "Cache-Control": path.extname(target).toLowerCase() === ".mp3"
          ? "no-cache"
          : "no-cache",
        "X-Content-Type-Options": "nosniff"
      });

      res.end(data);
    });
  });
});

const wss = new WebSocket.Server({ server });
const clients = new Set();

let state = {
  type: "state",
  trackIndex: 0,
  playing: false,
  updatedAt: Date.now()
};

function send(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcast(payload) {
  for (const client of clients) {
    send(client, payload);
  }
}

wss.on("connection", (ws, req) => {
  console.log("WebSocket connected:", req.headers["user-agent"]);
  clients.add(ws);

  send(ws, {
    type: "hello",
    tracks: loadTracks(),
    state,
    clientCount: clients.size
  });

  broadcast({ type: "clients", clientCount: clients.size });

  ws.on("message", (raw) => {
    let msg;

    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (!msg || typeof msg.type !== "string") return;

    if (msg.type === "getState") {
      return send(ws, {
        type: "hello",
        tracks: loadTracks(),
        state,
        clientCount: clients.size
      });
    }

    const tracks = loadTracks();
    if (!tracks.length) return;

    let nextIndex = state.trackIndex;

    if (msg.type === "next") {
      nextIndex = (state.trackIndex + 1) % tracks.length;
    } else if (msg.type === "previous") {
      nextIndex = (state.trackIndex - 1 + tracks.length) % tracks.length;
    } else if (
      msg.type === "select" &&
      Number.isInteger(msg.trackIndex) &&
      msg.trackIndex >= 0 &&
      msg.trackIndex < tracks.length
    ) {
      nextIndex = msg.trackIndex;
    } else if (!["play", "pause", "stop"].includes(msg.type)) {
      return;
    }

    state = {
      type: "state",
      trackIndex: nextIndex,
      playing:
        msg.type === "play"
          ? true
          : msg.type === "pause" || msg.type === "stop"
            ? false
            : state.playing,
      action: msg.type,
      commandId: String(msg.commandId || ""),
      updatedAt: Date.now()
    };

    broadcast({
      type: "command",
      command: msg.type,
      trackIndex: nextIndex,
      commandId: state.commandId,
      state
    });
  });

  ws.on("close", (code, reason) => {
  console.log(
    "WebSocket disconnected:",
    "code =", code,
    "reason =", reason.toString()
  );
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Live MP3 Controller running on http://localhost:${PORT}`);
  console.log(`Player:     http://localhost:${PORT}/player`);
  console.log(`Controller: http://localhost:${PORT}/controller`);
  console.log("Tracks loaded:", loadTracks().length);
  console.log("Audio folder:", AUDIO_DIR);
  console.log(
    "On your phones, replace localhost with this computer's local Wi-Fi IPv4 address."
  );
});
