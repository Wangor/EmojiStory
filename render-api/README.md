# VideoRendererApi

ASP.NET Core Web API that accepts animation info and returns a generated MP4 file.

## Usage

POST `/render` with JSON body matching `AnimationRequest`:

```json
{
  "width": 720,
  "height": 480,
  "animation": {
    "fps": 30,
    "scenes": [
      {
        "id": "scene-1",
        "duration_ms": 2000,
        "backgroundColor": "#000000",
        "actors": [
          {
            "id": "actor-1",
            "type": "emoji",
            "emoji": "😀",
            "tracks": [
              { "t": 0, "x": 0.1, "y": 0.8 },
              { "t": 2000, "x": 0.9, "y": 0.2 }
            ]
          },
          {
            "id": "text-1",
            "type": "text",
            "text": "Hello",
            "tracks": [ { "t": 0, "x": 0.5, "y": 0.1 } ]
          }
        ]
      }
    ],
    "emojiFont": "fonts/NotoColorEmoji.ttf"
  }
}
```

The service renders each actor to a frame using SkiaSharp and encodes the sequence with `ffmpeg`. The resulting MP4 is returned as `video/mp4`.

Place any fonts your animation requires in the `fonts/` folder. By default the API tries `fonts/NotoColorEmoji.ttf` for emoji and `fonts/NotoSans-Regular.ttf` for text. If these files are missing, SkiaSharp falls back to its built-in typeface and emoji may render as empty rectangles.

> Requires .NET 8 SDK and `ffmpeg` to be installed on the host.
