import express from "express";
import cors from "cors";
import srt2vtt from "srt-to-vtt";
import mime from "mime-types";

import TorrentMedia from "./module/TorrentMedia.js";
import parseQueryWithMangetURI from "./helper/parseQueryWithMangetURI.js";
import { cleanupTorrent } from "./module/TorrentMedia.js";

const app = express();

app.use(cors());

const port = 3000;

app.get("/metadata", async (req, res) => {
  const query = parseQueryWithMangetURI(req.query);

  if (!query.magnetURI) return res.status(400).send("Missing magnet URI");

  const tor = new TorrentMedia(query.magnetURI);
  await tor.initiate();

  return res.send(tor.getMovieMeta());
});

app.get("/subtitle", async (req, res) => {
  const query = parseQueryWithMangetURI(req.query);

  if (!query && query.magnetURI)
    return res.status(400).send("Missing magnet URI");

  const tor = new TorrentMedia(query.magnetURI);
  await tor.initiate();

  const file = await tor.getSubtitle(query.subtitle);
  let stream = file.createReadStream();

  // Convert SRT stream to VTT stream
  if (file.name.endsWith(".srt")) {
    stream = stream.pipe(srt2vtt());
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.name.replace(/\.srt$/i, ".vtt")}"`
    );
  } else {
    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
  }

  res.setHeader("Content-Type", "text/vtt");

  // Note: we cannot set Content-Length reliably after conversion
  stream.pipe(res);
});

app.get("/stream", async (req, res) => {
  const query = parseQueryWithMangetURI(req.query);

  if (!query && query.magnetURI)
    return res.status(400).send("Missing magnet URI");

  const tor = new TorrentMedia(query.magnetURI);
  await tor.initiate();

  const file = tor.video;

  if (!file) {
    return res.status(404).send("No video file found.");
  }

  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range header");
    return;
  }

  const fileSize = file.length;
  const parts = range.replace(/bytes=/, "").split("-");

  const start = parseInt(parts[0]);

  const defaultChunkSize = 2 * 1024 * 1024; // 2MB

  const end = parts[1]
    ? parseInt(parts[1])
    : Math.min(start + defaultChunkSize, fileSize - 1);

  const chunkSizeToSend = end - start + 1;

  file.select(
    Math.floor(start / file._torrent.pieceLength),
    Math.floor(end / file._torrent.pieceLength),
    true
  );

  const stream = file.createReadStream({ start, end });

  const head = {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSizeToSend,
    "Content-Type": mime.lookup(file.name),
    "Cache-Control": "no-cache",
  };

  res.writeHead(206, head);

  stream.pipe(res);

  stream.on("error", () => {
    res.end();
  });
});

app.get("/destroy", async (req, res) => {
  const query = parseQueryWithMangetURI(req.query);

  if (!query && query.magnetURI)
    return res.status(400).send("Missing magnet URI");

  const tor = new TorrentMedia(query.magnetURI);

  tor.destroy();

  return res.send({ message: "Successfully destoryed" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

async function cleanUpServer(eventType) {
  console.log("Closing with event: " + eventType);

  await cleanupTorrent();

  process.exit(0);
}

[
  `exit`,
  `SIGINT`,
  `SIGUSR1`,
  `SIGUSR2`,
  `uncaughtException`,
  `SIGTERM`,
].forEach((eventType) => {
  process.on(eventType, cleanUpServer.bind(null, eventType));
});
