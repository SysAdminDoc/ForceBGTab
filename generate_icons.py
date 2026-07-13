#!/usr/bin/env python3
"""ForceBGTab v0.1.0 icon generator.

Draws a flat two-tab emblem (a front tab dropping behind a dimmed back tab,
with a down-arrow) on a Catppuccin-base rounded tile. Outputs PNGs at the sizes
Chrome/Edge expect. Requires Pillow.
"""
from __future__ import annotations

import os

from PIL import Image, ImageDraw

SIZES = [16, 32, 48, 128, 512]
OUT_DIR = os.path.join(os.path.dirname(__file__), "icons")

# Catppuccin Mocha
BASE = (30, 30, 46, 255)
CRUST = (17, 17, 27, 255)
SURFACE2 = (88, 91, 112, 255)
MAUVE = (203, 166, 247, 255)
TEXT = (205, 214, 244, 255)


def rounded(draw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def draw_icon(size: int) -> Image.Image:
    # Supersample for crisp edges, then downscale.
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Background tile.
    pad = s * 0.06
    rounded(d, [pad, pad, s - pad, s - pad], radius=s * 0.2, fill=BASE)

    # Back tab (dimmed, offset up-left).
    tab_w = s * 0.44
    tab_h = s * 0.30
    bx = s * 0.20
    by = s * 0.22
    rounded(d, [bx, by, bx + tab_w, by + tab_h], radius=s * 0.05, fill=SURFACE2)

    # Front tab (mauve, offset down-right — it's the one going to the back).
    fx = s * 0.36
    fy = s * 0.40
    rounded(d, [fx, fy, fx + tab_w, fy + tab_h], radius=s * 0.05, fill=MAUVE)

    # Down-arrow on the front tab ("send to background / down").
    cx = fx + tab_w / 2
    top = fy + tab_h * 0.24
    bot = fy + tab_h * 0.78
    half = tab_w * 0.16
    stem = tab_w * 0.05
    d.rectangle([cx - stem, top, cx + stem, bot - half * 0.6], fill=CRUST)
    d.polygon(
        [(cx - half, bot - half), (cx + half, bot - half), (cx, bot)],
        fill=CRUST,
    )

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for size in SIZES:
        icon = draw_icon(size)
        path = os.path.join(OUT_DIR, f"{size}.png")
        icon.save(path)
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
