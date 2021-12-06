# Stream videos with FiveM (GTAV)

Watch videos with friends in FiveM by playing from path/url or streaming with OBS.

## Install

1. Clone or download the required files
2. Edit the `.env` file (see [Configuration](#configuration))
3. Start the resource

```
ensure video-stream
```
When started, the yarn resource should automatically install the required dependencies. If the installation fails you can do so manually with `npm i` and remove the yarn dependency from `fxmanifest.lua`. Note that npm is required to manually install the dependencies. 


## Streaming

The `/video-stream` command will teleport your player to the cinema.

The `/video-stream:set` command can play videos by path/url
- `/video-stream:set "https://example.com/video.mp4"`
- `/video-stream:set D:\video.mp4`
- `/video-steam:set` without arguments stops playback.

To publish to the optional RTMP server configure OBS and _Start Streaming_.

```
Service: Custom Streaming Server
Server: rtmp://localhost/live
Stream key: STREAM_NAME?secret=secret
```

![image](https://user-images.githubusercontent.com/15322107/120051014-450e0d00-c01f-11eb-8096-5a17716d7ede.png)


## Configuration

```
PORT=3000 # The port the HTTP and WebSocket server should listen on (open this port)
RTMP_ENABLED=1 # Whether the RTMP server should be enabled (optional*)
RTMP_PORT=1935 # The port the RTMP server should listen on (open this port*)
RTMP_SECRET=secret # A secret required to publish videos to the RTMP server
STREAM_PATH=rtmp://localhost:1935/live/STREAM_NAME # The RTMP stream path
FFMPEG_PATH=c:\ffmpeg\ffmpeg.exe # The path to a custom ffmpeg binary (optional)
```
It's recommended to disable the RTMP feature if you aren't intending to stream from OBS. At the very least change the `RTMP_SECRET`

## Demo
[![Click to view video](http://img.youtube.com/vi/FxtIwBUKkUg/0.jpg)](http://www.youtube.com/watch?v=FxtIwBUKkUg "Click to view video")

## Images

<img src="https://user-images.githubusercontent.com/15322107/120053908-27e03b00-c02d-11eb-8697-0a4da4d86e0e.png" height="250">

<img src="https://user-images.githubusercontent.com/15322107/120053907-26af0e00-c02d-11eb-82da-52131000e3c0.png" height="250">

## Contribution
This repository was intended as a proof of concept however any issues or pull requests are welcome.


## License
__MIT__

_Made with 🍂 and 🐌_
