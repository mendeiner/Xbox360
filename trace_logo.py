#!/usr/bin/env python3
"""Vectorize a single-color logo PNG (artwork on a transparent background) into a clean SVG.

Reusable dev tool (not part of the build) for turning downloaded PNG console logos into the
SVGs Nav.jsx / the console registry expect. Requires Pillow + vtracer (`pip install vtracer`).

    python3 trace_logo.py input.png public/logos/<id>.svg
    python3 trace_logo.py input.png out.svg --fill "#107C10"   # keep/force a brand color
    python3 trace_logo.py input.png out.svg --threshold 90     # alpha cutoff for foreground

What it does: crops away the transparent margin (so the logo fills its own viewBox — best for the
object-contain sizing the flyout uses), traces the shape with vtracer, drops any full-canvas
background path, recolors the paths to solid white (default; the menu is dark), and writes an SVG
whose viewBox is the cropped artwork. Also writes a <out>.qa.png next to it so you can eyeball it.
"""
import sys, os, re, tempfile, argparse
from PIL import Image
import vtracer

ap = argparse.ArgumentParser()
ap.add_argument("input")
ap.add_argument("output")
ap.add_argument("--fill", default="#ffffff", help="path color (default white)")
ap.add_argument("--threshold", type=int, default=110, help="alpha cutoff 0-255 for foreground")
args = ap.parse_args()

im = Image.open(args.input).convert("RGBA")
alpha = im.getchannel("A")
bb = alpha.getbbox()
if bb is None:
    sys.exit("image is fully transparent")
im = im.crop(bb)
alpha = im.getchannel("A")
lum = im.convert("L")
W, H = im.size

# Figure out the foreground (the artwork) robustly across three PNG shapes we see in practice:
#   - white/black art on a transparent bg  -> foreground = opaque pixels (key on alpha)
#   - dark ink on an opaque LIGHT bg        -> foreground = the dark pixels (light bg + white
#                                              knockouts, e.g. Xbox "XBOX", become holes)
#   - light art on an opaque DARK bg        -> foreground = the light pixels
corners = [im.getpixel(p) for p in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]]
opaque_corners = [c for c in corners if c[3] > 200]
if opaque_corners:
    bg_lum = sum(0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] for c in opaque_corners) / len(opaque_corners)
    a_px, l_px = alpha.load(), lum.load()
    mask = Image.new("L", (W, H), 255)  # white = background for the binary trace
    m_px = mask.load()
    for y in range(H):
        for x in range(W):
            if a_px[x, y] <= 128:
                continue
            dark = l_px[x, y] < 128
            fg = dark if bg_lum > 128 else (not dark)  # ink opposite the bg brightness
            if fg:
                m_px[x, y] = 0  # black = foreground
else:
    mask = alpha.point(lambda v: 0 if v > args.threshold else 255)
rgb = Image.merge("RGB", (mask, mask, mask))
tmp_png = os.path.join(tempfile.gettempdir(), "trace_in.png")
tmp_svg = os.path.join(tempfile.gettempdir(), "trace_out.svg")
rgb.save(tmp_png)
vtracer.convert_image_to_svg_py(
    tmp_png, tmp_svg, colormode="binary", mode="spline",
    filter_speckle=4, corner_threshold=60, path_precision=6,
)
raw = open(tmp_svg, encoding="utf-8").read()

# Pull out every <path d="..."> and drop only a genuine background rectangle: something that
# spans essentially the whole canvas AND is described by very few points (a real logo that fills
# the canvas is made of many points, so this won't eat actual artwork like GBA's outer border).
paths = re.findall(r'<path[^>]*\bd="([^"]+)"', raw)
kept = []
for d in paths:
    nums = [float(x) for x in re.findall(r"-?\d+\.?\d*", d)]
    xs, ys = nums[0::2], nums[1::2]
    if not xs or not ys:
        continue
    span = (max(xs) - min(xs)) * (max(ys) - min(ys))
    npts = len(nums) // 2
    if span > 0.985 * W * H and min(xs) < 1 and min(ys) < 1 and npts < 12:
        continue  # rectangular full-canvas background
    kept.append(d)

body = "\n".join(f'  <path fill="{args.fill}" d="{d}"/>' for d in kept)
svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
    f'width="{W}" height="{H}">\n{body}\n</svg>\n'
)
with open(args.output, "w", encoding="utf-8") as f:
    f.write(svg)

# QA render: the traced foreground mask as white artwork on a dark pill background — a faithful
# proxy of how the final white SVG will read on the flyout menu (no SVG renderer needed).
qa = os.path.splitext(args.output)[0] + ".qa.png"
fg = mask.point(lambda v: 255 if v == 0 else 0)  # foreground -> white
art = Image.new("RGBA", (W, H), (255, 255, 255, 0))
art.putalpha(fg)
bg = Image.new("RGBA", (W, H), (26, 26, 26, 255))
bg.alpha_composite(art)
bg.convert("RGB").save(qa)
print("wrote", args.output, f"({len(svg)} bytes, {len(kept)} paths, {W}x{H}) + QA", qa)
