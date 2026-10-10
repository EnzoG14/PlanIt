"""Generate the geometric PlanIt mark at 4x resolution with Pillow.

Run with a Python environment containing Pillow. No runtime app dependency.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "public" / "icons"
ROOT.mkdir(parents=True, exist_ok=True)

for filename, size, maskable in [
    ("pwa-192.png", 192, False),
    ("pwa-512.png", 512, False),
    ("pwa-maskable.png", 512, True),
]:
    scale = 4
    image = Image.new("RGB", (512 * scale, 512 * scale), "#215c50")
    draw = ImageDraw.Draw(image)
    def box(coords):
        return tuple(round(c * scale) for c in coords)
    # Same geometry as favicon.svg; an opaque background fills the maskable canvas.
    ink = "#e3eccd"
    draw.rectangle(box((166, 130, 220, 382)), fill=ink)
    draw.rectangle(box((220, 130, 268, 286)), fill=ink)
    draw.ellipse(box((190, 130, 346, 286)), fill=ink)
    draw.rectangle(box((220, 184, 268, 232)), fill="#215c50")
    draw.ellipse(box((244, 184, 292, 232)), fill="#215c50")
    draw.ellipse(box((299, 328, 353, 382)), fill=ink)
    image.resize((size, size), Image.Resampling.LANCZOS).save(ROOT / filename)
    print(f"{filename}: {size}x{size}, opaque; maskable={maskable}")
