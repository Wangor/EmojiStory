# VideoRendererApi

ASP.NET Core Web API that accepts animation info and returns a generated MP4 file.

## Usage

POST `/render` with JSON body:

```json
{
  "width": 1280,
  "height": 720,
  "totalFrames": 10
}
```

The service generates simple frames using SkiaSharp and encodes them with `ffmpeg`. The resulting MP4 is returned as `video/mp4`.

> Requires .NET 8 SDK and `ffmpeg` to be installed on the host.
