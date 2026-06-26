"""
Fetch and compress Nintendo 3DS cover images.
  - Source: art.gametdb.com/3ds/cover/US/<id>.jpg (GameTDB's own art server, confirmed reachable
    and serving real covers for both retail and 3DSWare titles at the time this was written --
    unlike Wii's art.gametdb.com, which went unreachable mid-pipeline and had to fall back to
    libretro-thumbnails. If this source stops responding, that's the documented fallback to try).
  - The GameTDB id is read from covers_map.js (game id -> GameTDB id, e.g. 'A2AE').
  - Output: public/covers/3ds/<gameId>.webp -- named by game id (coversById: true), same
    convention as PS2/GBA/Wii/NSW/N64.
  - Resize: max height 400px, keep aspect ratio
  - Format: WebP quality 80

Run from the game-tracker project root:
  python3 compress_covers_3ds.py
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

COVERS_FILE = Path("src/data/3ds/covers_map.js")
GAMETDB_BASE = "https://art.gametdb.com/3ds/cover/US/{gtdb_id}.jpg"
DEST = Path("public/covers/3ds")
MAX_H = 400
QUALITY = 80
HEADERS = {"User-Agent": "Mozilla/5.0"}

DEST.mkdir(parents=True, exist_ok=True)

covers_text = COVERS_FILE.read_text()
entries = re.findall(r"(\d+):\s*'([^']*)'", covers_text)
print(f"Found {len(entries)} cover entries in {COVERS_FILE}")

done = skipped = errors = 0

for game_id, gtdb_id in entries:
    dest_path = DEST / f"{game_id}.webp"
    if dest_path.exists():
        skipped += 1
        continue

    url = GAMETDB_BASE.format(gtdb_id=gtdb_id)
    req = urllib.request.Request(url, headers=HEADERS)

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
    except Exception as e:
        print(f"  MISSING game {game_id} ({gtdb_id}): {e}")
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
        print(f"  ERROR game {game_id} ({gtdb_id}): {e}")
        errors += 1

print(f"\nDone: {done} downloaded, {skipped} already existed, {errors} missing/errors")
