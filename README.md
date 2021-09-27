# Stream to FiveM (GTAV)

Watch videos with friends in FiveM by playing from path/url or streaming with OBS.

## Install

1. Clone or download the required files
2. Optionally change any configuration in the .env file (see [Configuration](#configuration))
3. Start the resource

```
ensure video-stream
```

yarn should automatically build the resource on start, if install fails you can do so manually with `npm i` and remove the yarn dependency from `__resource.lua`. Note that __npm__ is required to manually install the dependencies. 

## Streaming

- Use the `/video-stream:set` command e.g. `/video-stream:set "https://example.com/video.mp4"` or `/video-stream:set D:\video.mp4`
- Publish stream with OBS to RTMP

```
Stream Type: Custom Streaming Server
URL: rtmp://localhost/live
Stream key: STREAM_NAME?secret=secret
```

![image](https://user-images.githubusercontent.com/15322107/120051014-450e0d00-c01f-11eb-8096-5a17716d7ede.png)

`/video-steam:set` without arguments stops the current playback.

## Configuration

```
PORT=3000 # The port the HTTP server should listen on (open this port)
RTMP_ENABLED=1 # Whether the RTMP server should be enabled
RTMP_PORT=1935 # Port the RTMP server should listen on
RTMP_SECRET=secret # Stream secret
STREAM_PATH=rtmp://localhost:1935/live/STREAM_NAME # The RTMP stream path

FFMPEG_PATH=c:\ffmpeg\ffmpeg.exe # (optional) path to the ffmpeg binary to use
```

It's recommended to disable the RTMP feature if you aren't intending to stream from OBS. At the very least change the `RTMP_SECRET`.

## Images

<img src="https://user-images.githubusercontent.com/15322107/120053908-27e03b00-c02d-11eb-8697-0a4da4d86e0e.png" height="250">

<img src="https://user-images.githubusercontent.com/15322107/120053907-26af0e00-c02d-11eb-82da-52131000e3c0.png" height="250">

## Contribution
This repository was intended as a proof of concept however any issues or pull requests are welcome.

## License
__MIT__


_Made with 🍂 and 🐌_
