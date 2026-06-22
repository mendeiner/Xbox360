#!/usr/bin/env python3
"""
Second-pass matcher for NSW games still missing a cover after
swap_nsw_covers_final.py + fetch_missing_nsw_covers.py.

The first pass scored matches with raw SequenceMatcher ratio, which penalizes
title-length differences too harshly — it missed real matches like
"Pokémon Scarlet and Violet" -> "Pokémon Scarlet and Pokémon Violet Double Pack"
(extra words "Pokémon"/"Double Pack" tank the character-overlap ratio even
though it's clearly the same game).

This pass instead checks word-set CONTAINMENT: strip known edition/rerelease
words from both titles, then accept a candidate if every remaining word in
our title appears in the candidate, and the candidate's only extra word(s)
are non-numeric (numbers/roman numerals signal a different sequel/spinoff,
e.g. "Pikmin" -> "Pikmin 4", "Pac-Man" -> "Pac-Man 99" must NOT match).

Prints a review list (does not write files) — apply matches by hand after
eyeballing them, same as the first two passes.
"""
import json
import re
import unicodedata
from pathlib import Path

GAMES_FILE = Path("src/data/nsw/games.js")
TITLEDB_FILE = Path("public/covers/switch/switchtdb.txt")
LOCAL_COVERS_DIR = Path("public/covers/switch/coverM/US")
REPORT_FILE = Path("nsw_covers_swap_report.json")

EDITION_WORDS = {
    "remastered", "remaster", "definitive", "enhanced", "complete", "goty",
    "deluxe", "ultimate", "special", "anniversary", "edition", "cloud",
    "version", "redux", "directors", "cut", "double", "pack", "bundle",
    "collection", "plus", "hd", "trilogy",
}
ROMAN = {"i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"}
ARTICLE_SUFFIX_RE = re.compile(r"^(.*),\s*(the|a|an)$", re.IGNORECASE)


def normalize(title):
    title = unicodedata.normalize("NFKD", title)
    title = title.encode("ascii", "ignore").decode("ascii")
    title = re.sub(r"\(\d{4}\)\s*$", "", title)
    m = ARTICLE_SUFFIX_RE.match(title.strip())
    if m:
        title = f"{m.group(2)} {m.group(1)}"
    title = title.lower()
    title = re.sub(r"[™®]", "", title)
    title = re.sub(r"[^a-z0-9]+", " ", title)
    return re.sub(r"\s+", " ", title).strip()


def is_numeric_token(t):
    return t.isdigit() or t in ROMAN


def core_tokens(norm_title):
    return {t for t in norm_title.split() if t not in EDITION_WORDS}


def load_titledb():
    have_local = {p.stem for p in LOCAL_COVERS_DIR.glob("*.jpg")}
    entries = []
    for line in TITLEDB_FILE.read_text(encoding="utf-8", errors="replace").splitlines():
        if " = " not in line or line.startswith("TITLES"):
            continue
        code, title = line.split(" = ", 1)
        code = code.strip()
        entries.append((core_tokens(normalize(title)), code, title.strip(), code in have_local))
    return entries


def main():
    titledb = load_titledb()
    report = json.loads(REPORT_FILE.read_text())

    word_index = {}
    for i, (tokens, code, orig, has_file) in enumerate(titledb):
        for w in tokens:
            word_index.setdefault(w, []).append(i)

    results = []
    for m in report["missing"]:
        gid, title = m["id"], m["title"]
        q_tokens = core_tokens(normalize(title))
        if not q_tokens:
            continue
        candidate_idxs = set()
        for w in q_tokens:
            candidate_idxs.update(word_index.get(w, ()))

        accepted = []
        for idx in candidate_idxs:
            c_tokens, code, orig, has_file = titledb[idx]
            if not q_tokens.issubset(c_tokens):
                continue
            extra = c_tokens - q_tokens
            if any(is_numeric_token(e) for e in extra):
                continue
            if len(extra) > 1:
                continue
            accepted.append((len(extra), code, orig, has_file))

        if accepted:
            accepted.sort(key=lambda x: (x[0], not x[3]))
            results.append((gid, title, accepted))

    print(f"{len(results)} of {len(report['missing'])} missing games have a token-containment candidate\n")
    for gid, title, accepted in results:
        best = accepted[0]
        print(f"{gid}\t{title}\t->\t{best[2]}\t{best[1]}\t{'yes' if best[3] else 'NO_FILE'}\textra_count={best[0]}")


if __name__ == "__main__":
    main()
