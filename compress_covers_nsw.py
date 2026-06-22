"""
Fetch and compress NSW (Nintendo Switch) cover images.
  - Source: the RAWG API `background_image` URL captured per game in src/data/nsw/covers_map.js
    at catalog-build time (api.rawg.io, platform id 7). No GitHub covers repo for this console —
    RAWG itself is both the catalog and the cover-art source.
  - Output: public/covers/nsw/<gameId>.webp, looked up by game id (`coversById: true` on the
    registry entry), same convention as PS2.
  - Resize: max height 200px, WebP quality 40 — half PS2/PS3's usual 400px/q80, since this
    catalog is ~9x bigger than any other console's.

Run from the game-tracker project root:
  python3 compress_covers_nsw.py
"""

import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow not installed. Run: pip3 install Pillow")

COVERS_MAP_FILE = Path("src/data/nsw/covers_map.js")
DEST = Path("public/covers/nsw")
MAX_H = 200
QUALITY = 40
WORKERS = 16

DEST.mkdir(parents=True, exist_ok=True)

text = COVERS_MAP_FILE.read_text()
pairs = re.findall(r"(\d+):\s*'([^']+)'", text)
print(f"Found {len(pairs)} game id -> image URL entries in {COVERS_MAP_FILE}")

todo = [(gid, url) for gid, url in pairs if not (DEST / f"{gid}.webp").exists()]
print(f"{len(pairs) - len(todo)} already exist, fetching {len(todo)}")

def fetch_one(game_id, url):
    dest_path = DEST / f"{game_id}.webp"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        with Image.open(BytesIO(data)) as img:
            w, h = img.size
            if h > MAX_H:
                new_h = MAX_H
                new_w = int(w * MAX_H / h)
                img = img.resize((new_w, new_h), Image.LANCZOS)
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")
            img.save(dest_path, "WEBP", quality=QUALITY, method=4)
        return game_id, None
    except Exception as e:
        return game_id, str(e)

done = errors = 0
with ThreadPoolExecutor(max_workers=WORKERS) as pool:
    futures = {pool.submit(fetch_one, gid, url): gid for gid, url in todo}
    for i, fut in enumerate(as_completed(futures), 1):
        game_id, err = fut.result()
        if err:
            errors += 1
            print(f"  MISSING game {game_id}: {err}")
        else:
            done += 1
        if i % 100 == 0 or i == len(todo):
            print(f"  [{i}/{len(todo)}] done={done} err={errors}")

print(f"\nDone. {done} downloaded+converted, {len(pairs) - len(todo)} already existed, {errors} errors.")

sizes = [p.stat().st_size for p in DEST.glob("*.webp")]
if sizes:
    total_mb = sum(sizes) / 1024 / 1024
    avg_kb = (sum(sizes) / len(sizes)) / 1024
    print(f"Output: {len(sizes)} WebP files, avg {avg_kb:.0f} KB, total {total_mb:.1f} MB")
