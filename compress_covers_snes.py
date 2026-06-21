"""
Fetch and compress SNES cover images.
  - Source: github.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System,
    Named_Boxarts/<exact No-Intro title> (USA).png — looked up via src/data/snes/covers_map.js
    (game id -> cover filename, already resolved to the real filename incl. region tag).
  - Output: public/covers/snes/<gameId>.webp (named by game id, like PS2 — NOT by the source
    filename, so registry.js sets `coversById: true` for snes, same as PS2).
  - Resize: max height 400px, keep aspect ratio
  - Format: WebP quality 80

Run from the game-tracker project root:
  python3 compress_covers_snes.py
"""

import re
import sys
import urllib.request
import urllib.error
from io import BytesIO
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow not installed. Run: pip3 install Pillow")

COVERS_MAP_FILE = Path("src/data/snes/covers_map.js")
BASE_URL = "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/{file}"
DEST = Path("public/covers/snes")
MAX_H = 400
QUALITY = 80

DEST.mkdir(parents=True, exist_ok=True)

text = COVERS_MAP_FILE.read_text()
pairs = re.findall(r"(\d+):\s*'((?:[^'\\]|\\.)*)'", text)
pairs = [(gid, f.replace("\\'", "'")) for gid, f in pairs]
print(f"Found {len(pairs)} game id -> cover filename entries in {COVERS_MAP_FILE}")

done = skipped = errors = 0

for i, (game_id, cover_file) in enumerate(pairs, 1):
    dest_path = DEST / f"{game_id}.webp"
    if dest_path.exists():
        skipped += 1
        continue

    url = BASE_URL.format(file=urllib.request.quote(cover_file))
    data = None
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = resp.read()
    except Exception as e:
        print(f"  MISSING {cover_file} (game {game_id}): {e}")
        errors += 1
        continue

    try:
        with Image.open(BytesIO(data)) as img:
            w, h = img.size
            if h > MAX_H:
                new_h = MAX_H
                new_w = int(w * MAX_H / h)
                img = img.resize((new_w, new_h), Image.LANCZOS)
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")
            img.save(dest_path, "WEBP", quality=QUALITY, method=4)
        done += 1
    except Exception as e:
        print(f"  ERROR {cover_file} (game {game_id}): {e}")
        errors += 1

    if i % 25 == 0 or i == len(pairs):
        pct = i / len(pairs) * 100
        print(f"  [{i}/{len(pairs)}] {pct:.0f}%  done={done}  skip={skipped}  err={errors}")

print(f"\nDone. {done} downloaded+converted, {skipped} already existed, {errors} missing/errors.")

if done or skipped:
    sizes = [p.stat().st_size for p in DEST.glob("*.webp")]
    total_mb = sum(sizes) / 1024 / 1024
    avg_kb = (sum(sizes) / len(sizes)) / 1024 if sizes else 0
    print(f"Output: {len(sizes)} WebP files, avg {avg_kb:.0f} KB, total {total_mb:.1f} MB")
