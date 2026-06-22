"""
Fetch and compress GBA cover images.
  - Source: github.com/libretro-thumbnails/Nintendo_-_Game_Boy_Advance, Named_Boxarts/<No-Intro
    filename>.png. Filenames follow the No-Intro convention but with every literal "&" in the
    title swapped for "_" (confirmed quirk of this specific thumbnails repo -- archive.org and
    the No-Intro dat itself keep the literal "&").
  - The exact No-Intro filename (minus ".zip") is recovered from each game's `dl.file` in
    games.js, since that field was set verbatim from the same No-Intro dat this catalog was
    built from. The handful of games with no `dl` (no archive.org download confirmed) fall back
    to a small hardcoded table below -- there is no other place that records their full
    region-tagged No-Intro name.
  - Output: public/covers/gba/<gameId>.webp
  - Resize: max height 400px, keep aspect ratio
  - Format: WebP quality 80

Run from the game-tracker project root:
  python3 compress_covers_gba.py
"""

import re
import sys
import urllib.request
import urllib.error
from io import BytesIO
from pathlib import Path

try:
    from PIL import Image, ImageFile
except ImportError:
    sys.exit("Pillow not installed. Run: pip3 install Pillow")

# A couple of source PNGs in the thumbnails repo have a non-fatal corrupt chunk; tolerate it.
ImageFile.LOAD_TRUNCATED_IMAGES = True

GAMES_FILE = Path("src/data/gba/games.js")
LIBRETRO_BASE = "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Game_Boy_Advance/master/Named_Boxarts/{name}.png"
DEST = Path("public/covers/gba")
MAX_H = 400
QUALITY = 80

# Games with no archive.org-confirmed `dl.file`, so their full No-Intro name (region tags
# included) isn't recorded anywhere else in the repo. Recovered by hand from the same
# libretro-database No-Intro dat used to build the catalog.
NO_DL_FULLNAMES = {
    'Mega Man & Bass': 'Mega Man & Bass (USA)',
    'Mega Man Zero': 'Mega Man Zero (USA, Europe)',
    'Mega Man Zero 2': 'Mega Man Zero 2 (USA)',
    'Mega Man Zero 3': 'Mega Man Zero 3 (USA)',
    'Mega Man Zero 4': 'Mega Man Zero 4 (USA)',
}

DEST.mkdir(parents=True, exist_ok=True)

games_text = GAMES_FILE.read_text()
entries = re.findall(
    r"\{ id: (\d+), title: '((?:[^'\\]|\\.)*)'.*?(?:dl: \{ part: 'p1', file: '((?:[^'\\]|\\.)*)' \})?\s*\},",
    games_text,
)
print(f"Found {len(entries)} games in {GAMES_FILE}")

done = skipped = errors = 0

for game_id, raw_title, dl_file in entries:
    dest_path = DEST / f"{game_id}.webp"
    if dest_path.exists():
        skipped += 1
        continue

    title = raw_title.replace("\\'", "'")
    if dl_file:
        fullname = dl_file.replace("\\'", "'")[:-4]  # strip .zip
    elif title in NO_DL_FULLNAMES:
        fullname = NO_DL_FULLNAMES[title]
    else:
        print(f"  NO SOURCE NAME for game {game_id} ({title!r}) -- skipping")
        errors += 1
        continue

    boxart_name = fullname.replace('&', '_')
    url = LIBRETRO_BASE.format(name=urllib.request.quote(boxart_name))

    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = resp.read()
    except Exception as e:
        print(f"  MISSING game {game_id} ({title!r}): {e}")
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
        print(f"  ERROR game {game_id} ({title!r}): {e}")
        errors += 1

print(f"\nDone: {done} downloaded, {skipped} already existed, {errors} missing/errors")
