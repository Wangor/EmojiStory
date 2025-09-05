using Microsoft.AspNetCore.Mvc;
using SkiaSharp;
using System.Diagnostics;
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

        for (int i = 0; i < request.TotalFrames; i++)
        {
            using var bmp = new SKBitmap(request.Width, request.Height);
            using var canvas = new SKCanvas(bmp);
            canvas.Clear(SKColors.Black);

            using var paint = new SKPaint { Color = SKColors.White, TextSize = 48, IsAntialias = true };
            canvas.DrawText($"Frame {i}", 10, 60, paint);

            using var img = SKImage.FromBitmap(bmp);
            using var data = img.Encode(SKEncodedImageFormat.Png, 100);
            var path = Path.Combine(tempDir, $"f_{i:D6}.png");
            await System.IO.File.WriteAllBytesAsync(path, data.ToArray(), cancellationToken);
        }

        var outputPath = Path.Combine(tempDir, "animation.mp4");
        var psi = new ProcessStartInfo
        {
            FileName = "ffmpeg",
            Arguments = "-y -framerate 30 -i f_%06d.png -c:v libx264 -pix_fmt yuv420p animation.mp4",
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
}
