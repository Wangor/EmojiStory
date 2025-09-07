import os
import subprocess
import tempfile
import math
from typing import List, Dict, Any

from flask import Flask, request, send_file, jsonify
import cairo
import gi
import uharfbuzz as hb

gi.require_version("Pango", "1.0")
gi.require_version("PangoCairo", "1.0")
from gi.repository import Pango, PangoCairo

app = Flask(__name__)

BASE_DIR = os.path.dirname(__file__)
FONT_DIR = os.path.join(BASE_DIR, "fonts")
FPS_DEFAULT = 30


def register_fonts() -> None:
    """Run fc-cache and validate fonts with HarfBuzz."""
    if not os.path.isdir(FONT_DIR):
        return
    subprocess.run(["fc-cache", "-f", FONT_DIR], check=True)
    for fname in os.listdir(FONT_DIR):
        if fname.lower().endswith((".ttf", ".otf")):
            path = os.path.join(FONT_DIR, fname)
            with open(path, "rb") as f:
                hb.Face(f.read())


register_fonts()


def font_file_for_family(family: str) -> str:
    result = subprocess.run(
        ["fc-match", "-f", "%{file}", family],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def shape_text(text: str, fontfile: str) -> None:
    with open(fontfile, "rb") as f:
        face = hb.Face(f.read())
    font = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf)


def hex_to_rgb(col: str) -> tuple[float, float, float]:
    col = col.lstrip("#")
    if len(col) == 6:
        r = int(col[0:2], 16) / 255.0
        g = int(col[2:4], 16) / 255.0
        b = int(col[4:6], 16) / 255.0
        return r, g, b
    return 0.0, 0.0, 0.0


def apply_ease(r: float, ease: str) -> float:
    if ease == "easeIn":
        return r * r
    if ease == "easeOut":
        return 1 - (1 - r) * (1 - r)
    if ease == "easeInOut":
        if r < 0.5:
            return 2 * r * r
        return 1 - pow(-2 * r + 2, 2) / 2
    return r


def sample_tracks(tracks: List[Dict[str, Any]], t: float, start: Dict[str, float]) -> Dict[str, float]:
    def interp(prop: str, default: float) -> float:
        prev_t = 0.0
        prev_v = start.get(prop, default)
        prev_ease = "linear"
        for kf in tracks:
            kt = float(kf.get("t", 0))
            kv = kf.get(prop, prev_v)
            ease = kf.get("ease", "linear")
            if t <= kt:
                if kt == prev_t:
                    return kv
                ratio = (t - prev_t) / (kt - prev_t)
                ratio = apply_ease(ratio, prev_ease)
                return prev_v + (kv - prev_v) * ratio
            prev_t, prev_v, prev_ease = kt, kv, ease
        return prev_v

    return {
        "x": interp("x", 0.0),
        "y": interp("y", 0.0),
        "scale": interp("scale", 1.0),
        "rotate": interp("rotate", 0.0),
    }


def render_actor(ctx: cairo.Context, actor: Dict[str, Any], t: float, width: int, height: int, emoji_font: str) -> None:
    props = sample_tracks(actor.get("tracks", []), t, actor.get("start", {}))
    x = props["x"] * width
    y = props["y"] * height
    scale = props["scale"]
    rotate = math.radians(props["rotate"])

    effects = actor.get("effects", [])
    loop = actor.get("loop")
    if "bounce" in effects:
        y -= abs(math.sin(t / 200.0 * math.pi)) * 0.05 * height

    ctx.save()
    ctx.translate(x, y)
    if loop == "float":
        ctx.translate(0, math.sin(t / 1000.0 * 2 * math.pi) * 0.02 * height)
    if rotate:
        ctx.rotate(rotate)
    if actor.get("flipX"):
        ctx.scale(-1, 1)
    if scale != 1.0:
        ctx.scale(scale, scale)

    fade = "fade-in" in effects
    if fade:
        ctx.push_group()

    if actor["type"] == "emoji":
        text = actor.get("emoji", "")
        fontfile = font_file_for_family(emoji_font)
        shape_text(text, fontfile)
        layout = PangoCairo.create_layout(ctx)
        layout.set_text(text, -1)
        desc = Pango.FontDescription(f"{emoji_font} 72")
        layout.set_font_description(desc)
        PangoCairo.update_layout(ctx, layout)
        PangoCairo.show_layout(ctx, layout)
    elif actor["type"] == "text":
        text = actor.get("text", "")
        font_size = actor.get("fontSize", 48)
        layout = PangoCairo.create_layout(ctx)
        layout.set_text(text, -1)
        desc = Pango.FontDescription(f"Sans {font_size}")
        layout.set_font_description(desc)
        color = actor.get("color", "#000000")
        r, g, b = hex_to_rgb(color)
        ctx.set_source_rgb(r, g, b)
        PangoCairo.update_layout(ctx, layout)
        PangoCairo.show_layout(ctx, layout)
    elif actor["type"] == "composite":
        for part in actor.get("parts", []):
            render_actor(ctx, part, t, width, height, emoji_font)

    if fade:
        pattern = ctx.pop_group()
        alpha = min(1.0, t / 300.0)
        ctx.set_source(pattern)
        ctx.paint_with_alpha(alpha)

    ctx.restore()


def render_scene(ctx: cairo.Context, scene: Dict[str, Any], t: float, width: int, height: int, emoji_font: str) -> None:
    effects = scene.get("effects", [])
    fade = "fade-in" in effects
    bounce = "bounce" in effects
    if fade:
        ctx.push_group()

    ctx.save()
    if bounce:
        offset = abs(math.sin(t / 200.0 * math.pi)) * 0.05 * height
        ctx.translate(0, -offset)

    bg = scene.get("backgroundColor")
    if bg:
        r, g, b = hex_to_rgb(bg)
        ctx.set_source_rgb(r, g, b)
        ctx.rectangle(0, 0, width, height)
        ctx.fill()

    for actor in sorted(scene.get("backgroundActors", []), key=lambda a: a.get("z", 0)):
        render_actor(ctx, actor, t, width, height, emoji_font)
    for actor in sorted(scene.get("actors", []), key=lambda a: a.get("z", 0)):
        render_actor(ctx, actor, t, width, height, emoji_font)

    caption = scene.get("caption")
    if caption:
        layout = PangoCairo.create_layout(ctx)
        layout.set_text(caption, -1)
        desc = Pango.FontDescription("Sans 32")
        layout.set_font_description(desc)
        PangoCairo.update_layout(ctx, layout)
        tw, th = layout.get_pixel_size()
        ctx.set_source_rgb(0, 0, 0)
        ctx.move_to((width - tw) / 2, height - th - 20)
        PangoCairo.show_layout(ctx, layout)

    ctx.restore()

    if fade:
        pattern = ctx.pop_group()
        alpha = min(1.0, t / 300.0)
        ctx.set_source(pattern)
        ctx.paint_with_alpha(alpha)


def render_animation(animation: Dict[str, Any], width: int, height: int, fps: int, out_path: str) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "bgra",
        "-s",
        f"{width}x{height}",
        "-r",
        str(fps),
        "-i",
        "-",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        out_path,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    emoji_font = animation.get("emojiFont", "Noto Color Emoji")
    for scene in animation.get("scenes", []):
        duration_ms = scene.get("duration_ms", 1000)
        frame_count = max(1, int(fps * duration_ms / 1000))
        for frame in range(frame_count):
            t = frame * 1000 / fps
            surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, height)
            ctx = cairo.Context(surface)
            render_scene(ctx, scene, t, width, height, emoji_font)
            proc.stdin.write(surface.get_data())
    proc.stdin.close()
    proc.wait()


@app.post("/render")
def render_endpoint():
    data = request.get_json(force=True)
    if "animation" not in data:
        return jsonify({"error": "animation payload required"}), 400

    width = int(data.get("width", 512))
    height = int(data.get("height", 512))
    fps = int(data.get("fps", FPS_DEFAULT))

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        out_path = tmp.name

    render_animation(data["animation"], width, height, fps, out_path)

    return send_file(out_path, mimetype="video/mp4", as_attachment=True, download_name="animation.mp4")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
