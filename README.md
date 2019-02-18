## Broadcast from OBS to FiveM (GTAV)

# INSTALL

```
start video-stream
```

- Publish stream with `OBS` to RTMP
```
Stream Type: Custom Streaming Server
URL: rtmp://localhost/live
Stream key: STREAM_NAME?secret=secret
```

- Fix url in `/video-stream/client/client.lua`

Type `/video-stream` to start streaming

The DUI object is located at the Altruist Camp

# Contribute

## Issues
### POC
There's noticeable lag between the audio and video when viewed in game.

It may never perform well and is likely to be abandoned.

# LICENSE
__MIT__


_Made with 🍂 and 🐌_
