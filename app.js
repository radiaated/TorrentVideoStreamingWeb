import express from "express";
import TorrentMovie from "./module/TorrentMovie.js";

const app = express();
const port = 3000;

app.get("/metadata", async (req, res) => {
  const magnetURI = req.originalUrl.split(/=(.*)/s)[1];

  if (!magnetURI) return res.status(400).send("Missing magnet URI");

  const tor = new TorrentMovie(magnetURI);
  await tor.initiate();

  return res.send(tor.getMovieMeta());
});

// WIP
app.get("/subtitle", async (req, res) => {
  const magnetURI = req.originalUrl.split(/=(.*)/s)[1];

  if (!magnetURI) return res.status(400).send("Missing magnet URI");

  const tor = new TorrentMovie(magnetURI);
  await tor.initiate();

  tor;

  return res.send(tor.getMovieMeta());
});

app.get("/stream", async (req, res) => {
  const magnetURI = req.originalUrl.split(/=(.*)/s)[1];

  if (!magnetURI) return res.status(400).send("Missing magnet URI");

  const tor = new TorrentMovie(magnetURI);
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

  // file.select(
  //   Math.floor(start / file._torrent.pieceLength),
  //   Math.floor(end / file._torrent.pieceLength),
  //   true
  // );

  const stream = file.createReadStream({ start, end });

  const head = {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSizeToSend,
    "Content-Type": "video/mp4",
    "Cache-Control": "no-cache",
  };

  res.writeHead(206, head);

  stream.on("error", (err) => {
    console.error("Stream error:", err);
    res.end();
  });

  stream.pipe(res);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
