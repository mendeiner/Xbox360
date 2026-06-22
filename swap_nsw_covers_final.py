#!/usr/bin/env python3
"""
Replace NSW (Switch) covers with GameTDB portrait box-art, matched by title
via public/covers/switch/switchtdb.txt (GameTDB code -> title database).

Source covers: public/covers/switch/coverM/US/<CODE>.jpg (352x570 portrait)
Title DB:      public/covers/switch/switchtdb.txt  ("<CODE> = <Title>" per line)
Catalog:       src/data/nsw/games.js (NSW_GAMES, {id, title, ...})
Output:        public/covers/nsw/<id>.webp (overwritten in place)

Matched games get their cover replaced. Unmatched games have their existing
cover REMOVED (so the UI falls back to a placeholder instead of showing a
stale landscape RAWG image). A report of unmatched/low-confidence titles is
written to nsw_covers_swap_report.json.

Run from the game-tracker project root: python3 swap_nsw_covers_final.py
"""
import json
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

from PIL import Image

GAMES_FILE = Path("src/data/nsw/games.js")
TITLEDB_FILE = Path("public/covers/switch/switchtdb.txt")
COVERS_SRC_DIR = Path("public/covers/switch/coverM/US")
DEST_DIR = Path("public/covers/nsw")
REPORT_FILE = Path("nsw_covers_swap_report.json")

TARGET_H = 300
WEBP_QUALITY = 80
MATCH_THRESHOLD = 0.88

ARTICLE_SUFFIX_RE = re.compile(r"^(.*),\s*(the|a|an)$", re.IGNORECASE)


def normalize(title):
    title = unicodedata.normalize("NFKD", title)
    title = title.encode("ascii", "ignore").decode("ascii")
    title = re.sub(r"\(\d{4}\)\s*$", "", title)  # drop trailing "(YYYY)"
    m = ARTICLE_SUFFIX_RE.match(title.strip())
    if m:
        title = f"{m.group(2)} {m.group(1)}"
    title = title.lower()
    title = re.sub(r"[™®]", "", title)
    title = re.sub(r"[^a-z0-9]+", " ", title)
    return re.sub(r"\s+", " ", title).strip()


def load_games():
    text = GAMES_FILE.read_text()
    games = []
    for match in re.finditer(r"\{\s*id:\s*(\d+),\s*title:\s*'((?:[^'\\]|\\.)*)'", text):
        gid = int(match.group(1))
        title = match.group(2).replace("\\'", "'")
        games.append((gid, title))
    return games


def load_titledb():
    available_codes = {p.stem for p in COVERS_SRC_DIR.glob("*.jpg")}
    entries = []  # (norm_title, code, original_title)
    for line in TITLEDB_FILE.read_text(encoding="utf-8", errors="replace").splitlines():
        if " = " not in line or line.startswith("TITLES"):
            continue
        code, title = line.split(" = ", 1)
        code = code.strip()
        if code not in available_codes:
            continue
        entries.append((normalize(title), code, title))
    return entries


def main():
    games = load_games()
    print(f"Loaded {len(games)} NSW games")

    titledb = load_titledb()
    exact_index = {}
    for norm, code, orig in titledb:
        exact_index.setdefault(norm, (code, orig))
    print(f"Loaded {len(titledb)} GameTDB entries with on-disk covers "
          f"({len(exact_index)} unique normalized titles)")

    # Word -> candidate indices, to avoid scoring every title against every
    # other title (1789 x ~18900 SequenceMatcher calls would be far too slow).
    word_index = {}
    for i, (norm, code, orig) in enumerate(titledb):
        for word in set(norm.split()):
            if len(word) >= 3:
                word_index.setdefault(word, []).append(i)

    DEST_DIR.mkdir(parents=True, exist_ok=True)

    matched = []      # (id, title, code, score)
    low_conf = []      # same shape, below threshold but reported for visibility
    unmatched = []     # (id, title)

    for gid, title in games:
        norm = normalize(title)
        if norm in exact_index:
            code, orig = exact_index[norm]
            matched.append((gid, title, code, 1.0, orig))
            continue

        candidate_idxs = set()
        for word in set(norm.split()):
            if len(word) >= 3:
                candidate_idxs.update(word_index.get(word, ()))

        best_score, best_code, best_orig = 0.0, None, None
        for idx in candidate_idxs:
            cand_norm, code, orig = titledb[idx]
            score = SequenceMatcher(None, norm, cand_norm).ratio()
            if score > best_score:
                best_score, best_code, best_orig = score, code, orig

        if best_score >= MATCH_THRESHOLD:
            matched.append((gid, title, best_code, best_score, best_orig))
        elif best_score >= 0.75:
            low_conf.append((gid, title, best_code, best_score, best_orig))
        else:
            unmatched.append((gid, title))

    print(f"Matched: {len(matched)}, low-confidence: {len(low_conf)}, unmatched: {len(unmatched)}")

    converted = 0
    convert_errors = []
    for gid, title, code, score, orig in matched:
        src = COVERS_SRC_DIR / f"{code}.jpg"
        dest = DEST_DIR / f"{gid}.webp"
        try:
            with Image.open(src) as img:
                w, h = img.size
                new_w = int(w * TARGET_H / h)
                img = img.resize((new_w, TARGET_H), Image.LANCZOS)
                if img.mode not in ("RGB", "RGBA"):
                    img = img.convert("RGB")
                img.save(dest, "WEBP", quality=WEBP_QUALITY, method=4)
            converted += 1
        except Exception as e:
            convert_errors.append({"id": gid, "title": title, "error": str(e)})

    removed = 0
    missing_report = []
    unresolved = [(gid, title) for gid, title, *_ in low_conf] + unmatched
    for gid, title in unresolved:
        missing_report.append({"id": gid, "title": title})
        dest = DEST_DIR / f"{gid}.webp"
        if dest.exists():
            dest.unlink()
            removed += 1

    report = {
        "total_games": len(games),
        "covers_converted": converted,
        "convert_errors": convert_errors,
        "covers_removed_no_match": removed,
        "missing": missing_report,
        "missing_count": len(missing_report),
        "match_threshold": MATCH_THRESHOLD,
    }
    REPORT_FILE.write_text(json.dumps(report, indent=2, ensure_ascii=False))

    print(f"\nConverted {converted} covers, {len(convert_errors)} conversion errors")
    print(f"Removed {removed} stale covers for unmatched/low-confidence games")
    print(f"Report written to {REPORT_FILE} ({len(missing_report)} missing entries)")


if __name__ == "__main__":
    main()
