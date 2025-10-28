import WebTorrent from "webtorrent";

const supportedVideoExtensions = [".webm", ".mkv", ".mp4", ".ogv", ".mov"];

const client = new WebTorrent();

const initializer = function (torrent) {
  this.torrent = torrent;
  this.video = torrent.files.find(function (file) {
    const ext = supportedVideoExtensions.find((ext) => file.name.endsWith(ext));
    if (ext) return true;
    return false;
  });

  this.subtitles = torrent.files.filter(function (file) {
    return file.name.endsWith(".srt") || file.name.endsWith(".vtt");
  });
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

  this.getVideo = function () {
    return this.video;
  };

  this.getSubtitle = function (subtitleName) {
    return new Promise((resolve) => {
      let interval = setInterval(() => {
        const subtitleFile = this.subtitles.find(
          (subtitle) => subtitle.name === subtitleName
        );

        if (subtitleFile && subtitleFile.progress === 1) {
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
