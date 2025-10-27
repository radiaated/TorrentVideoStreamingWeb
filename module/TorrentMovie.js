import WebTorrent from "webtorrent";

const client = new WebTorrent();

export default function TorrentMovie(magnetURI) {
  this.magnetURI = magnetURI;

  this.video = null;
  this.subtitles = null;

  this.initiate = function () {
    return new Promise((resolve, reject) => {
      client.add(this.magnetURI, (torrent) => {
        console.log("Client is downloading:", torrent.infoHash);

        this.video = torrent.files.find(function (file) {
          return file.name.endsWith(".mp4");
        });

        this.subtitles = torrent.files.filter(function (file) {
          return file.name.endsWith(".srt");
        });
        resolve();
      });
    });
  };
}
