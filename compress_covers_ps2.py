"""
Fetch and compress PS2 cover images.
  - Sources, tried in order: github.com/xlenore/ps2-covers, covers/default/<serial>.jpg, then
    github.com/SvenGDK/PSMT-Covers, PS2/<serial>.jpg or .png (the latter has far broader NTSC-U
    coverage and is what backs the full-catalog import done in games.js) — looked up via
    src/data/ps2/covers_map.js: game id -> NTSC-U serial.
  - Output: public/covers/ps2/<gameId>.webp
  - Resize: max height 400px, keep aspect ratio
  - Format: WebP quality 80

Run from the game-tracker project root:
  python3 compress_covers_ps2.py
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

COVERS_MAP_FILE = Path("src/data/ps2/covers_map.js")
GAMES_FILE = Path("src/data/ps2/games.js")
# {serial}-keyed sources first (cheap lookup); libretro-thumbnails is {title}-keyed (USA region
# guess, " (USA)" suffix) and only consulted as a last resort since title formatting must match
# exactly — covers ~80% of titles when it's reached.
SOURCES = [
    "https://raw.githubusercontent.com/xlenore/ps2-covers/main/covers/default/{serial}.jpg",
    "https://raw.githubusercontent.com/SvenGDK/PSMT-Covers/main/PS2/{serial}.jpg",
    "https://raw.githubusercontent.com/SvenGDK/PSMT-Covers/main/PS2/{serial}.png",
]
LIBRETRO_BASE = "https://raw.githubusercontent.com/libretro-thumbnails/Sony_-_PlayStation_2/master/Named_Boxarts/{title} (USA).png"
DEST = Path("public/covers/ps2")
MAX_H = 400
QUALITY = 80

DEST.mkdir(parents=True, exist_ok=True)

text = COVERS_MAP_FILE.read_text()
pairs = re.findall(r"(\d+):\s*'([^']+)'", text)
print(f"Found {len(pairs)} game id -> serial entries in {COVERS_MAP_FILE}")

games_text = GAMES_FILE.read_text()
titles_by_id = {
    m.group(1): m.group(2).replace("\\'", "'")
    for m in re.finditer(r"\{ id: (\d+), title: '((?:[^'\\]|\\.)*)'", games_text)
}

done = skipped = errors = 0

for i, (game_id, serial) in enumerate(pairs, 1):
    dest_path = DEST / f"{game_id}.webp"
    if dest_path.exists():
        skipped += 1
        continue

    data = None
    last_err = None
    for tmpl in SOURCES:
        url = tmpl.format(serial=urllib.request.quote(serial))
        try:
            with urllib.request.urlopen(url, timeout=15) as resp:
                data = resp.read()
            break
        except urllib.error.HTTPError as e:
            last_err = e
        except Exception as e:
            last_err = e

    if data is None and game_id in titles_by_id:
        url = LIBRETRO_BASE.format(title=urllib.request.quote(titles_by_id[game_id].replace(':', ' -')))
        try:
            with urllib.request.urlopen(url, timeout=15) as resp:
                data = resp.read()
        except Exception as e:
            last_err = e

    if data is None:
        print(f"  MISSING {serial} (game {game_id}): {last_err}")
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
        print(f"  ERROR {serial} (game {game_id}): {e}")
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
