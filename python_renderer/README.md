# Python Emoji Renderer API

This folder contains a minimal Flask server that renders emoji/text animations to MP4 using native libraries:

- **pycairo** for drawing
- **PyGObject (Pango/PangoCairo)** for text layout
- **uharfbuzz** for glyph shaping validation

## Requirements

System packages are needed for Cairo, Pango and HarfBuzz:

```bash
apt-get update && apt-get install -y \
  libcairo2 libcairo2-dev \
  libpango1.0-dev \
  libharfbuzz-dev \
  ffmpeg fontconfig
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

## Fonts

Place any emoji font files (`.ttf`/`.otf`) in the `fonts/` directory. They will be registered at server start and are then usable via their font family name.

## Run

```bash
python server.py
```

The API exposes one endpoint:

The `/render` endpoint accepts a JSON payload matching the TypeScript
`animationSchema` used by the web client's `AnimationTypes.ts`. It supports
emoji, text and composite actors, keyframe easing, optional `fade-in` and
`bounce` effects, and caption text. A minimal example:

```http
POST /render
{
  "animation": {
    "title": "Sample",
    "description": "Demo",
    "fps": 30,
    "emojiFont": "Noto Color Emoji",
    "scenes": [
      {
        "id": "scene-1",
        "duration_ms": 1000,
        "backgroundActors": [],
        "actors": [
          {
            "id": "actor-1",
            "type": "emoji",
            "emoji": "🎬",
            "start": {"x": 0.1, "y": 0.1, "scale": 1},
            "tracks": [
              {"t": 0, "x": 0.1, "y": 0.1},
              {"t": 1000, "x": 0.8, "y": 0.5}
            ]
          }
        ]
      }
    ]
  },
  "width": 512,
  "height": 512,
  "fps": 30
}
```

The server renders each scene with keyframe interpolation (linear or eased)
just like the `EmojiPlayer` component and returns a rendered `animation.mp4`
file.

### Sample payload

A ready-to-use request body is provided in
[`sample_animation.json`](./sample_animation.json). Render it by running the
server and posting the JSON file:

```bash
curl -X POST http://localhost:5000/render \
  -H 'Content-Type: application/json' \
  --data @sample_animation.json \
  --output demo.mp4
```

This will produce `demo.mp4` in the current directory using the default
**Noto Color Emoji** font.
