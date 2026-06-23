"""
Fetch and compress Wii cover images.
  - Source: github.com/libretro-thumbnails/Nintendo_-_Wii, Named_Boxarts/<filename>.png.
    GameTDB's own art server (art.gametdb.com) was the originally planned source but became
    unreachable mid-pipeline (likely a rate-limit after an earlier verification pass) and never
    recovered in-session, so this GitHub mirror was used instead -- see the note in games.js.
  - The exact filename is read from covers_map.js (game id -> libretro-thumbnails filename,
    set verbatim when the catalog was cross-referenced against this same repo's file listing).
  - Output: public/covers/wii/<gameId>.webp
  - Resize: max height 400px, keep aspect ratio
  - Format: WebP quality 80

Run from the game-tracker project root:
  python3 compress_covers_wii.py
"""

import re
import sys
import urllib.request
from io import BytesIO
from pathlib import Path

try:
    from PIL import Image, ImageFile
except ImportError:
    sys.exit("Pillow not installed. Run: pip3 install Pillow")

ImageFile.LOAD_TRUNCATED_IMAGES = True

COVERS_FILE = Path("src/data/wii/covers_map.js")
LIBRETRO_BASE = "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Wii/master/Named_Boxarts/{name}.png"
DEST = Path("public/covers/wii")
MAX_H = 400
QUALITY = 80

DEST.mkdir(parents=True, exist_ok=True)

covers_text = COVERS_FILE.read_text()
entries = re.findall(r"(\d+):\s*'((?:[^'\\]|\\.)*)'", covers_text)
print(f"Found {len(entries)} cover entries in {COVERS_FILE}")

done = skipped = errors = 0

for game_id, raw_name in entries:
    dest_path = DEST / f"{game_id}.webp"
    if dest_path.exists():
        skipped += 1
        continue

    fname = raw_name.replace("\\'", "'")
    url = LIBRETRO_BASE.format(name=urllib.request.quote(fname))

    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = resp.read()
    except Exception as e:
        print(f"  MISSING game {game_id} ({fname!r}): {e}")
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
        print(f"  ERROR game {game_id} ({fname!r}): {e}")
        errors += 1

print(f"\nDone: {done} downloaded, {skipped} already existed, {errors} missing/errors")
