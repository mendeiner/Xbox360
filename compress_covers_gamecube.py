"""
Fetch and compress GameCube cover images.
  - Source: github.com/libretro-thumbnails/Nintendo_-_GameCube, Named_Boxarts/<filename>.png.
    Same source family already used for GBA/Wii/N64.
  - The exact filename is read from covers_map.js (game id -> libretro-thumbnails filename,
    set verbatim when the catalog was cross-referenced against this same repo's file listing).
  - A number of source PNGs in this repo family are themselves redirect-pointer text files
    (case-insensitive filesystem collisions in the source repo, same quirk documented for
    Wii/N64 in CLAUDE.md) containing the real filename as plain text instead of image bytes.
    When a download isn't a valid image, this script checks for that case and follows the
    pointer.
  - Output: public/covers/gamecube/<gameId>.webp
  - Resize: max height 400px, keep aspect ratio
  - Format: WebP quality 80

Run from the game-tracker project root:
  python3 compress_covers_gamecube.py
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

COVERS_FILE = Path("src/data/gamecube/covers_map.js")
LIBRETRO_BASE = "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_GameCube/master/Named_Boxarts/{name}.png"
DEST = Path("public/covers/gamecube")
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

    # Redirect-pointer text file: tiny payload, not PNG magic bytes, looks like a filename.
    if len(data) < 200 and not data.startswith(b"\x89PNG"):
        try:
            pointer_name = data.decode("utf-8").strip()
        except UnicodeDecodeError:
            pointer_name = None
        if pointer_name and pointer_name.lower().endswith(".png"):
            redirect_url = LIBRETRO_BASE.format(name=urllib.request.quote(pointer_name[:-4]))
            try:
                with urllib.request.urlopen(redirect_url, timeout=15) as resp:
                    data = resp.read()
            except Exception as e:
                print(f"  MISSING game {game_id} (redirect {pointer_name!r}): {e}")
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
