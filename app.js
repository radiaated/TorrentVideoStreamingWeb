import express from "express";
import torr from "./torr.js";

const app = express();
const port = 3000;

const activeTorrents = new Map();

app.get("/v", async (req, res) => {
  const magnetURI = req.originalUrl.split(/=(.*)/s)[1];

  if (!magnetURI) return res.status(400).send("Missing magnet URI");

  let tor = activeTorrents.get(magnetURI);

  if (!tor) {
    tor = new torr(magnetURI);
    await tor.initiate();
    activeTorrents.set(magnetURI, tor);
  }

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
  const start = parseInt(parts[0], 10);
  const end = parts[1]
    ? parseInt(parts[1], 10)
    : Math.min(start + 2 * 1024 * 1024, fileSize - 1);

  const chunkSize = end - start + 1;

  file.select(
    Math.floor(start / file._torrent.pieceLength),
    Math.floor(end / file._torrent.pieceLength),
    true
  );

  const stream = file.createReadStream({ start, end });

  const head = {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSize,
    "Content-Type": "video/mp4",
    "Cache-Control": "no-cache",
  };

  res.writeHead(206, head);

  stream.on("error", (err) => {
    console.error("Stream error:", err);
    res.end();
  });

  stream.on("close", () => {
    console.log("Stream closed.");
  });

  stream.pipe(res);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
