"""
Compress ALL Xbox 360 covers into public/covers/xbox360/{gameId}.webp
Priority order:
  1. Real Covers/{TitleId}.png  (the good ones — primary)
  2. covers/covers/{TitleId}/{imageId}.png  (covers_selected.js — fallback only)

Output is keyed by INTEGER GAME ID so GameCard never needs TitleId lookups.
Skips files that already exist (re-run safe).

Run from game-tracker project root:
  python3 compress_covers_selected.py
"""

import re, sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow not installed. Run: pip3 install Pillow")

BASE    = Path("/Users/vanessamilesi/Documents/BRUNO/XBOX/Xbox360")
DEST    = Path("public/covers/xbox360")
MAX_H   = 400
QUALITY = 82

DEST.mkdir(parents=True, exist_ok=True)

# ── Parse covers_map.js  (game_id → title_id) ────────────────────────────────
covers_map = {}
with open(BASE / "covers_map.js") as f:
    for line in f:
        m = re.match(r'\s*(\d+):\s*"([^"]+)"', line)
        if m:
            covers_map[int(m.group(1))] = m.group(2)

# ── Parse covers_selected.js  (game_id → relative path) ─────────────────────
covers_selected = {}
with open(BASE / "covers_selected.js") as f:
    for line in f:
        m = re.match(r'\s*(\d+):\s*"([^"]+)"', line)
        if m:
            covers_selected[int(m.group(1))] = m.group(2)

all_ids = sorted(set(list(covers_map.keys()) + list(covers_selected.keys())))
print(f"covers_map.js:      {len(covers_map)} entries")
print(f"covers_selected.js: {len(covers_selected)} entries")
print(f"Total unique games: {len(all_ids)}")
print(f"Output → {DEST.resolve()}\n")

def compress(src_path, dest_path):
    with Image.open(src_path) as img:
        w, h = img.size
        if h > MAX_H:
            new_h = MAX_H
            new_w = int(w * MAX_H / h)
            img = img.resize((new_w, new_h), Image.LANCZOS)
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGB")
        img.save(dest_path, "WEBP", quality=QUALITY, method=4)

done = skipped = used_fallback = errors = no_src = 0

for i, gid in enumerate(all_ids, 1):
    dest_path = DEST / f"{gid}.webp"

    if dest_path.exists():
        skipped += 1
        continue

    src = None

    # Priority 1 — Real Covers (the good ones)
    if gid in covers_map:
        candidate = BASE / "Real Covers" / f"{covers_map[gid]}.png"
        if candidate.exists():
            src = candidate

    # Priority 2 — covers_selected.js fallback (only if no Real Cover)
    if src is None and gid in covers_selected:
        candidate = BASE / covers_selected[gid]
        if candidate.exists():
            src = candidate
            used_fallback += 1

    if src is None:
        no_src += 1
        continue

    try:
        compress(src, dest_path)
        done += 1
    except Exception as e:
        print(f"  ERROR game {gid} ({src.name}): {e}")
        errors += 1

    if i % 300 == 0 or i == len(all_ids):
        pct = i / len(all_ids) * 100
        print(f"  [{i}/{len(all_ids)}] {pct:.0f}%  done={done}  fallback={used_fallback}  skip={skipped}  no_src={no_src}  err={errors}")

print(f"\nDone.")
print(f"  {done} compressed  ({done - used_fallback} from Real Covers, {used_fallback} fallback from covers/covers/)")
print(f"  {skipped} already existed, {no_src} with no source found, {errors} errors")

webp_files = list(DEST.glob("*.webp"))
if webp_files:
    sizes = [f.stat().st_size for f in webp_files]
    print(f"  Total output: {len(sizes)} files, avg {sum(sizes)/len(sizes)/1024:.0f} KB, {sum(sizes)/1024/1024:.0f} MB")
