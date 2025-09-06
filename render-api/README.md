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
    "emojiFont": "TwemojiMozilla.ttf"
  }
}
```

The service renders each actor to a frame using SkiaSharp and encodes the sequence with `ffmpeg`. The resulting MP4 is returned as `video/mp4`.

Place the required typefaces in the `render-api/fonts` folder—**system fonts are never used.** Set `emojiFont` to a filename in this directory (e.g., `NotoColorEmoji.ttf`); if omitted, the API looks for common emoji font names in the same folder. Text rendering expects `NotoSans-Regular.ttf` in this directory. File names are resolved relative to `fonts`, so you can omit the path. If a font cannot be found, the API returns an error instead of falling back to a default font.

> Requires .NET 8 SDK and `ffmpeg` to be installed on the host.
