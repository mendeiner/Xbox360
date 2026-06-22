"""
Pre-fetch trailer video IDs for a console's catalog via yt-dlp (no YouTube Data API
quota involved, unlike the live in-app search in GameModal.jsx which uses YT_KEY).

Reads game id/title from src/data/<console>/games.js, runs a YouTube search per game
("<title> <console label> trailer"), and writes id -> videoId into
src/data/<console>/trailers_data.js. Safe to re-run: already-cached ids are skipped,
so it only fetches new/missing games (e.g. after adding more titles to a console, or
when standing up a brand-new console's catalog).

Run from the game-tracker project root:
  python3 fetch_trailers.py ps2
  python3 fetch_trailers.py xbox360
  python3 fetch_trailers.py ps3 --suffix "PS3 trailer"
"""

import argparse
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

TIMEOUT_S = 25

parser = argparse.ArgumentParser()
parser.add_argument("console", help="console folder name under src/data/, e.g. ps2, xbox360")
parser.add_argument("--suffix", default=None, help='search suffix, default "<console> trailer"')
parser.add_argument("--workers", type=int, default=8, help="concurrent yt-dlp searches (default 8)")
args = parser.parse_args()

WORKERS = args.workers

console_dir   = Path(f"src/data/{args.console}")
games_file    = console_dir / "games.js"
trailers_file = console_dir / "trailers_data.js"
suffix        = args.suffix or f"{args.console} trailer"

if not games_file.exists():
    raise SystemExit(f"{games_file} not found")

text = games_file.read_text()
entries = re.findall(r"\{\s*id:\s*(\d+),\s*title:\s*'((?:[^'\\]|\\.)*)'", text)
games = [(int(i), t.replace("\\'", "'")) for i, t in entries]
print(f"Found {len(games)} games in {games_file}")

existing = {}
if trailers_file.exists():
    m = re.search(r"\{.*\}", trailers_file.read_text(), re.S)
    if m:
        existing = json.loads(m.group(0))
print(f"{len(existing)} already cached, skipping those")

def fetch_one(game_id, title):
    key = str(game_id)
    if key in existing:
        return game_id, title, existing[key], "cached"
    query = f"ytsearch1:{title} {suffix}"
    try:
        res = subprocess.run(
            ["yt-dlp", query, "--print", "%(id)s", "--no-warnings", "--skip-download", "--quiet"],
            capture_output=True, text=True, timeout=TIMEOUT_S,
        )
        vid = res.stdout.strip().splitlines()[0] if res.stdout.strip() else None
        if vid and re.fullmatch(r"[\w-]{11}", vid):
            return game_id, title, vid, "ok"
        return game_id, title, None, f"no-match ({res.stderr.strip()[:80]})"
    except subprocess.TimeoutExpired:
        return game_id, title, None, "timeout"
    except Exception as e:
        return game_id, title, None, f"error: {e}"

def write(results):
    trailers_file.write_text(
        f"// game id -> cached YouTube video ID, pre-fetched via yt-dlp search (fetch_trailers.py {args.console}).\n"
        "// GameModal.jsx merges this with a localStorage cache and falls back to a live search\n"
        "// for any id not listed here. Re-run this script after adding new games to backfill them.\n"
        f"export const TRAILERS = {json.dumps(results, indent=2, sort_keys=True)}\n"
    )

results = dict(existing)
ok = fail = 0
to_fetch = [(i, t) for i, t in games if str(i) not in existing]
print(f"Fetching {len(to_fetch)} new trailers with {WORKERS} workers...")

with ThreadPoolExecutor(max_workers=WORKERS) as pool:
    futures = {pool.submit(fetch_one, i, t): (i, t) for i, t in to_fetch}
    done = 0
    for fut in as_completed(futures):
        game_id, title, vid, status = fut.result()
        done += 1
        if vid:
            results[str(game_id)] = vid
            ok += 1
        else:
            fail += 1
        print(f"  [{done}/{len(to_fetch)}] {title!r} -> {vid or 'MISS'} ({status})")
        if done % 20 == 0:
            write(results)

write(results)
print(f"\nDone. {ok} found, {fail} missing this run, {len(results)} total cached -> {trailers_file}")
if fail:
    print("Missing titles likely hit age-restricted/blocked top results — re-run with a more")
    print("specific --suffix, or manually pick an id from `yt-dlp ytsearch5:'<title> trailer'`.")
