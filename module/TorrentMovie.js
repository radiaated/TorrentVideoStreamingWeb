import WebTorrent from "webtorrent";

const client = new WebTorrent();

const initializer = function (torrent) {
  this.torrent = torrent;
  this.video = torrent.files.find(function (file) {
    return file.name.endsWith(".mp4");
  });

  this.subtitles = torrent.files.filter(function (file) {
    return file.name.endsWith(".srt");
  });
};

export default function TorrentMovie(magnetURI) {
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

  // WIP
  this.getSubtitles = function (subtitleName) {
    return new Promise((resolve) => {
      let interval = setInterval(() => {
        const downloadedFiles = this.subtitles.filter(
          (subtitle) => subtitle.progress === 1
        );
        if (downloadedFiles.length === this.subtitles.length) {
          clearInterval(interval);
          resolve(subtitleFile);
        }
      }, 5000);
    });
  };

  // WIP
  this.destroy = function () {
    client.remove(this.torrent);
  };
}
