namespace VideoRendererApi.Models;

public class AnimationRequest
{
    public int Width { get; set; } = 720;
    public int Height { get; set; } = 480;
    public Animation Animation { get; set; } = new();
}
