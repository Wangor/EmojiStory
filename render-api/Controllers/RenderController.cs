using Microsoft.AspNetCore.Mvc;
using SkiaSharp;
using System.Diagnostics;
using System.Linq;
using VideoRendererApi.Models;

namespace VideoRendererApi.Controllers;

[ApiController]
[Route("[controller]")]
public class RenderController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Render([FromBody] AnimationRequest request, CancellationToken cancellationToken)
    {
        var tempDir = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
        Directory.CreateDirectory(tempDir);

        var totalFrames = (int)Math.Max(1,
            Math.Ceiling(request.Animation.Scenes.Sum(s => s.DurationMs) *
                         request.Animation.Fps / 1000.0));

        // Preload fonts if available
        var emojiTypeface = LoadTypeface(request.Animation.EmojiFont ?? "fonts/NotoColorEmoji.ttf");
        var textTypeface = LoadTypeface("fonts/NotoSans-Regular.ttf") ?? SKTypeface.Default;

        for (int i = 0; i < totalFrames; i++)
        {
            using var bmp = new SKBitmap(request.Width, request.Height);
            using var canvas = new SKCanvas(bmp);

            double timeMs = i * 1000.0 / request.Animation.Fps;
            var (scene, sceneStartMs) = FindScene(request.Animation, timeMs);
            double tScene = timeMs - sceneStartMs;

            canvas.Clear(ParseColor(scene.BackgroundColor) ?? SKColors.Black);

            // Draw background actors then scene actors ordered by Z
            foreach (var actor in scene.BackgroundActors)
            {
                DrawActor(canvas, actor, tScene, request, emojiTypeface, textTypeface);
            }

            foreach (var actor in scene.Actors.OrderBy(a => a.Z ?? 0))
            {
                DrawActor(canvas, actor, tScene, request, emojiTypeface, textTypeface);
            }

            using var img = SKImage.FromBitmap(bmp);
            using var data = img.Encode(SKEncodedImageFormat.Png, 100);
            var path = Path.Combine(tempDir, $"f_{i:D6}.png");
            await System.IO.File.WriteAllBytesAsync(path, data.ToArray(), cancellationToken);
        }

        var outputPath = Path.Combine(tempDir, "animation.mp4");
        var psi = new ProcessStartInfo
        {
            FileName = "ffmpeg",
            Arguments = $"-y -framerate {request.Animation.Fps} -i f_%06d.png -c:v libx264 -pix_fmt yuv420p animation.mp4",
            WorkingDirectory = tempDir,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };
        using var proc = Process.Start(psi);
        if (proc == null)
        {
            return StatusCode(500, "Failed to start ffmpeg");
        }
        await proc.WaitForExitAsync(cancellationToken);

        var bytes = await System.IO.File.ReadAllBytesAsync(outputPath, cancellationToken);
        return File(bytes, "video/mp4", "animation.mp4");
    }

    private static (Scene scene, double startMs) FindScene(Animation animation, double timeMs)
    {
        double accum = 0;
        foreach (var s in animation.Scenes)
        {
            if (timeMs < accum + s.DurationMs)
            {
                return (s, accum);
            }
            accum += s.DurationMs;
        }
        // fallback to last scene
        return (animation.Scenes.Last(), accum - animation.Scenes.Last().DurationMs);
    }

    private static void DrawActor(SKCanvas canvas, Actor actor, double tScene, AnimationRequest request, SKTypeface? emojiTypeface, SKTypeface textTypeface)
    {
        var (x, y, rot, scale) = Sample(actor, tScene);
        canvas.Save();
        canvas.Translate((float)(x * request.Width), (float)(y * request.Height));
        canvas.RotateDegrees((float)rot);

        float sx = (float)scale;
        bool flip = actor switch
        {
            EmojiActor ea => ea.FlipX == true,
            CompositeActor ca => ca.FlipX == true,
            _ => false
        };
        canvas.Scale(flip ? -sx : sx, sx);

        switch (actor)
        {
            case EmojiActor e:
                using (var paint = new SKPaint
                {
                    Typeface = emojiTypeface ?? SKTypeface.Default,
                    TextSize = 64f,
                    IsAntialias = true
                })
                {
                    canvas.DrawText(e.Emoji, 0, 0, paint);
                }
                break;
            case TextActor t:
                using (var paint = new SKPaint
                {
                    Typeface = textTypeface,
                    Color = ParseColor(t.Color) ?? SKColors.White,
                    TextSize = (float)(t.FontSize ?? 32),
                    IsAntialias = true
                })
                {
                    canvas.DrawText(t.Text, 0, 0, paint);
                }
                break;
        }

        canvas.Restore();
    }

    private static (double x, double y, double rot, double scale) Sample(Actor actor, double tMs)
    {
        var tracks = actor.Tracks.OrderBy(k => k.T).ToList();
        if (tracks.Count == 0)
        {
            return (
                actor.Start?.X ?? 0,
                actor.Start?.Y ?? 0,
                0,
                actor.Start?.Scale ?? 1
            );
        }

        if (tMs <= tracks[0].T)
        {
            var k = tracks[0];
            return (k.X, k.Y, k.Rotate ?? 0, k.Scale ?? actor.Start?.Scale ?? 1);
        }

        for (int i = 1; i < tracks.Count; i++)
        {
            var prev = tracks[i - 1];
            var next = tracks[i];
            if (tMs <= next.T)
            {
                double span = next.T - prev.T;
                double local = span <= 0 ? 0 : (tMs - prev.T) / span;
                double x = prev.X + (next.X - prev.X) * local;
                double y = prev.Y + (next.Y - prev.Y) * local;
                double rotPrev = prev.Rotate ?? 0;
                double rotNext = next.Rotate ?? rotPrev;
                double rot = rotPrev + (rotNext - rotPrev) * local;
                double scalePrev = prev.Scale ?? actor.Start?.Scale ?? 1;
                double scaleNext = next.Scale ?? scalePrev;
                double scale = scalePrev + (scaleNext - scalePrev) * local;
                return (x, y, rot, scale);
            }
        }

        var last = tracks[^1];
        return (
            last.X,
            last.Y,
            last.Rotate ?? 0,
            last.Scale ?? actor.Start?.Scale ?? 1
        );
    }

    private static SKColor? ParseColor(string? hex)
    {
        if (string.IsNullOrEmpty(hex)) return null;
        if (!hex.StartsWith('#')) hex = "#" + hex;
        return SKColor.TryParse(hex, out var c) ? c : null;
    }

    private static SKTypeface? LoadTypeface(string path)
    {
        var fullPath = Path.IsPathRooted(path)
            ? path
            : Path.Combine(AppContext.BaseDirectory, path);
        return System.IO.File.Exists(fullPath) ? SKTypeface.FromFile(fullPath) : null;
    }
}
