import WebTorrent from "webtorrent";
import getExtensionFromFileName from "../helper/getExtensionFromFileName.js";

const supportedVideoExtensions = ["webm", "mkv", "mp4", "ogv", "mov"];

const client = new WebTorrent();

const initializer = function (torrent) {
  this.torrent = torrent;

  let video = null;
  let subtitles = [];

  torrent.files.forEach((file) => {
    file.deselect();
    const fileExtension = getExtensionFromFileName(file.name);

    if (fileExtension) {
      if (supportedVideoExtensions.includes(fileExtension)) {
        video = file;
      } else if (file.name.endsWith(".srt") || file.name.endsWith(".vtt")) {
        subtitles.push(file);
      }
    }
  });

  this.video = video;
  this.subtitles = subtitles;
};

export const cleanupTorrent = () => {
  console.log("Cleaning up torrent before exiting...");
  client.torrents.forEach(async (torrent) => {
    await client.remove(torrent);
    client.destroy();
  });
};

export default function TorrentMedia(magnetURI) {
  this.magnetURI = magnetURI;

  this.video = null;
  this.subtitles = null;
  this.torrent = null;

  this.initiate = function () {
    return new Promise(async (resolve, reject) => {
      const torrent = await client.get(this.magnetURI);

      if (torrent) {
        console.log("Client is retrieving:", torrent.infoHash);

        initializer.call(this, torrent);

        resolve();
      } else {
        client.add(this.magnetURI, (torrent) => {
          console.log("Client is downloading:", torrent.infoHash);
          initializer.call(this, torrent);

          resolve();
        });
      }
    });
  };

  this.getMovieMeta = function () {
    return {
      video: this.video.name,
      subtitles: this.subtitles.map((sub) => sub.name),
    };
  };

  this.getStreamableVideo = function (start, end) {
    this.video.select();
    if (!this.video) {
      return;
    }

    const fileSize = this.video.length;

    const endByte = Math.min(end, fileSize - 1);

    const stream = this.video.createReadStream({ start, end: endByte });

    const chunkSize = endByte - start + 1;

    return {
      stream,
      start,
      end: endByte,
      fileName: this.video.name,
      fileSize,
      chunkSize,
    };
  };

  this.getSubtitle = function (subtitleName) {
    return new Promise((resolve) => {
      const subtitleFile = this.subtitles.find(
        (subtitle) => subtitle.name === subtitleName
      );
      if (subtitleFile) {
        subtitleFile.select();
      }
      const interval = setInterval(() => {
        if (subtitleFile.progress === 1) {
          clearInterval(interval);
          resolve(subtitleFile);
        }
      }, 500);
    });
  };

  this.destroy = async function () {
    const torrent = await client.get(this.magnetURI);

    if (torrent) await client.remove(torrent);
  };
}
