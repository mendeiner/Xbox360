"""
Compress Xbox 360 cover images.
  - Source: Xbox360/Real Covers/*.png  (1.4 GB, ~569 KB avg)
  - Output: public/covers/xbox360/*.webp  (~70-100 KB avg, 2x retina safe)
  - Resize: max height 400px, keep aspect ratio
  - Format: WebP quality 80

Run from the game-tracker project root:
  python3 compress_covers.py
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow not installed. Run: pip3 install Pillow")

SRC  = Path("/Users/vanessamilesi/Documents/BRUNO/XBOX/Xbox360/Real Covers")
DEST = Path("public/covers/xbox360")
MAX_H = 400
QUALITY = 80

DEST.mkdir(parents=True, exist_ok=True)

files = sorted(SRC.glob("*.png"))
total = len(files)
done  = 0
skipped = 0
errors  = 0

print(f"Found {total} PNG files in source folder.")
print(f"Output → {DEST.resolve()}\n")

for i, src_path in enumerate(files, 1):
    stem     = src_path.stem          # e.g. "4D5307E6"
    dest_path = DEST / f"{stem}.webp"

    if dest_path.exists():
        skipped += 1
        continue

    try:
        with Image.open(src_path) as img:
            w, h = img.size
            if h > MAX_H:
                new_h = MAX_H
                new_w = int(w * MAX_H / h)
                img = img.resize((new_w, new_h), Image.LANCZOS)
            # Convert RGBA → RGB if needed (WebP supports RGBA but avoids issues)
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")
            img.save(dest_path, "WEBP", quality=QUALITY, method=4)
        done += 1
    except Exception as e:
        print(f"  ERROR {src_path.name}: {e}")
        errors += 1

    if i % 100 == 0 or i == total:
        pct = i / total * 100
        print(f"  [{i}/{total}] {pct:.0f}%  done={done}  skip={skipped}  err={errors}")

print(f"\nDone. {done} converted, {skipped} already existed, {errors} errors.")

if done > 0:
    sizes = [dest_path.stat().st_size for dest_path in DEST.glob("*.webp")]
    total_mb = sum(sizes) / 1024 / 1024
    avg_kb   = (sum(sizes) / len(sizes)) / 1024 if sizes else 0
    print(f"Output: {len(sizes)} WebP files, avg {avg_kb:.0f} KB, total {total_mb:.0f} MB")
