## Broadcast from OBS to FiveM (GTAV)

# INSTALL

- `cd video-stream && npm i`

- Add resource to __config__
```
start video-stream
start video-dui
```

- Run RTMP server
`node rtmp.js`

- Publish stream with `OBS` to RTMP
```
Stream Type: Custom Streaming Server
URL: rtmp://localhost/live
Stream key: STREAM_NAME?secret=secret
```

- Fix urls in `video-dui/client.lua`

- __Start__ and join server

Type `/video-stream` to start streaming

The DUI object is located at the Altruist Camp

# Contribute

## Issues
### POC
There's noticeable lag between the audio and video when viewed in game.

It may never perform well and is likely to be abandoned.

## IDEA

`video-stream`
Add a route for push or to announce media from RTMP.


# LICENSE
__MIT__


_Made with 🍂 and 🐌_
