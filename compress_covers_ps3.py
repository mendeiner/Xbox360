"""
Fetch and compress PS3 cover images.
  - Source: github.com/SvenGDK/PSMT-Covers, PS3/<serial>.JPG (mirrors aldostools/Resources),
    looked up via src/data/ps3/covers_map.js: game id -> NTSC-U serial.
  - Output: public/covers/ps3/<serial>.webp (named by serial, same convention as Xbox 360 --
    NOT by game id; the registry entry does not set `coversById`).
  - Resize: max height 400px, keep aspect ratio
  - Format: WebP quality 80

Run from the game-tracker project root:
  python3 compress_covers_ps3.py
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

COVERS_MAP_FILE = Path("src/data/ps3/covers_map.js")
SOURCE = "https://raw.githubusercontent.com/SvenGDK/PSMT-Covers/main/PS3/{serial}.JPG"
DEST = Path("public/covers/ps3")
MAX_H = 400
QUALITY = 80

DEST.mkdir(parents=True, exist_ok=True)

text = COVERS_MAP_FILE.read_text()
pairs = re.findall(r"(\d+):\s*'([^']+)'", text)
print(f"Found {len(pairs)} game id -> serial entries in {COVERS_MAP_FILE}")

serials = sorted({serial for _, serial in pairs})
done = skipped = errors = 0

for i, serial in enumerate(serials, 1):
    dest_path = DEST / f"{serial}.webp"
    if dest_path.exists():
        skipped += 1
        continue

    url = SOURCE.format(serial=urllib.request.quote(serial))
    data = None
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = resp.read()
    except Exception as e:
        print(f"  MISSING {serial}: {e}")
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
        print(f"  ERROR {serial}: {e}")
        errors += 1

    if i % 50 == 0 or i == len(serials):
        pct = i / len(serials) * 100
        print(f"  [{i}/{len(serials)}] {pct:.0f}%  done={done}  skip={skipped}  err={errors}")

print(f"\nDone. {done} downloaded+converted, {skipped} already existed, {errors} missing/errors.")

if done or skipped:
    sizes = [p.stat().st_size for p in DEST.glob("*.webp")]
    total_mb = sum(sizes) / 1024 / 1024
    avg_kb = (sum(sizes) / len(sizes)) / 1024 if sizes else 0
    print(f"Output: {len(sizes)} WebP files, avg {avg_kb:.0f} KB, total {total_mb:.1f} MB")
