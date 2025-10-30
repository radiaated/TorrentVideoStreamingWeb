# Torrent Video Streaming Web

A [WebTorrent](npmjs.com/package/webtorrent) wrapper that serves video and subtitle from torrent in the form of API.

### Setup

1. Git clone and move to the working diectory

```bash
git clone https://github.com/radiaated/TorrentVideoStreamingWeb
cd TorrentVideoStreamingWeb
```

2. Install npm dependencies

```bash
npm i
```

3. Run Express server

```bash
node app.js
```

### API

#### Get torrent metadata

It can be used to initate the addition of torrent to WebTorrent client

```
    http://localhost:3000/metadata?uri=<magnetURI>
```

Returns the JSON response with names of video and subtitle files

#### Get subtitle file by file name

```
    http://localhost:3000/subtitle?uri=<magnetURI>&subtitle=<subtitle_name>
```

Returns the subtitle file of type `ReadableStream`

#### Stream video

```
    http://localhost:3000/stream?uri=<magnetURI>
```

---

HAPPY HACKING
