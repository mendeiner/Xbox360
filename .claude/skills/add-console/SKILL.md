---
name: add-console
description: Onboard a brand-new console into the game-tracker app (games catalog, covers, archive.org download links, trailers, registry wiring, page, routing, dashboard integration). Use when the user names a console to add (e.g. "/add-console ps3", "add PS3 support", "let's do SNES next").
---

# Add a new console to game-tracker

This codebase has one console-agnostic core (`src/consoles/registry.js`, `dl.js`,
`useConsolePage.js`) and a repeatable per-console onboarding process. Xbox 360 and
PS2 are done; this skill is the exact, gotcha-tested checklist for the next one
(PS3, SNES, N64, GameCube, Wii, ...). **Follow every phase in order. Do not skip
the verification steps — every bug found while building PS2 was caught by them,
not by code review.**

The console name passed to this skill (e.g. `ps3`) becomes: the folder under
`src/data/<console>/`, the registry key `CONSOLES.<console>`, the route
`/<console>`, and the page `src/pages/<Console>.jsx`. Use lowercase for the
folder/key/route, PascalCase for the page filename.

## Golden rule, repeated because it matters

**Never fabricate data.** Not a game title, not a serial, not a cover filename,
not an archive.org identifier, not a YouTube video id, not a Metacritic score.
Every fact written into the repo must trace back to something you actually
fetched/read (a real file listing, a real database, a real API response). If you
can't verify it, leave the field out — that's what PS2's missing S–Z download
links and empty `score` fields already do, and it's the correct, honest state.

## Phase 0 — Scope the console with the user

Before writing anything, ask (use AskUserQuestion, batch these):
1. **Region/release standard** — which region's serials/releases are canonical
   (PS2 used NTSC-U). This is the join key for covers and downloads, so it must
   be locked in before Phase 2.
2. **Hardware/format quirks** — does this console have anything like PS2's
   EyeToy (a boolean flag, `camera: true`, not a `type` split) or Xbox 360's
   XBLA/Kinect (an actual second/third `type` value)? Ask, don't assume.
3. **Starting catalog size** — start with a few hundred well-known titles
   (PS2 started at 207) and grow later, or does the user want to supply the
   list themselves?
4. **Covers source** — does the user have a specific GitHub repo / source in
   mind (like `xlenore/ps2-covers`)? If not, you'll need to find one in Phase 2
   and confirm it with the user before downloading anything at scale.

Write the answers down (they drive every later phase) and re-read the PS2
plan file referenced in this repo's git history / CLAUDE.md if you need the
fuller worked example.

## Phase 1 — Research and compile a verified game list

1. Find at least one **ground-truth title database** for this console — for
   PS2 it was PCSX2's `RedumpDatabase.yaml`; for other consoles, look for the
   relevant emulator's bundled redump/no-intro database, or No-Intro/Redump's
   own dat files. This is your serial↔title source of truth.
2. Find the **covers source's actual file listing** (e.g. via the GitHub API
   recursive tree endpoint `api.github.com/repos/<owner>/<repo>/git/trees/<sha>?recursive=1`)
   — this tells you which titles can actually get cover art, which should bound
   your initial catalog choice (don't add 300 games if only 150 have covers
   available).
3. Cross-reference: only games present in **both** the title database and the
   covers listing make it into the initial catalog. Your own knowledge is a
   *candidate generator only* — every entry must be confirmed against these two
   real sources before it's written to `games.js`.
4. Use fuzzy word-set matching (normalize, lowercase, strip punctuation,
   intersection-over-union ≥ ~0.85), not substring matching — title order
   varies ("Getaway, The" vs "The Getaway"). Watch for:
   - Apostrophes dropped entirely in Redump-style naming conventions.
   - Spelling variants (build an explicit alias dict as you find them, e.g.
     `{'okami': 'ookami'}`).
   - False positives that score deceptively high — **sort matches by score
     ascending and manually spot-check the bottom of the list**; that's how
     every wrong PS2 binding (Onimusha 3→SSX3, Dynasty Warriors 4→...Empires,
     etc.) was actually caught.
5. Save your intermediate research (serial/title/genre tuples, match lists) to
   `/tmp/` as you go — these are scratch files, not repo artifacts, but you'll
   need them across multiple steps in this same session.

Decide the per-game schema now: `id`, `title`, `year`, `genre: []`,
`type` (defaults to `'retail'` unless this console has a real second
storefront/format), plus whatever boolean flags Phase 0 surfaced
(`camera`, `localMP`+`players`, `online`), and leave `score` (Metacritic, 0-100)
present but `undefined` on every entry — do not backfill it unless asked.

## Phase 2 — Decide and document the cover-file naming convention

**This is the single bug most likely to recur.** There are two valid
conventions in this codebase and you must pick one *consciously*, not by
accident:
- **Xbox 360's convention**: cover files are named by the *value* in
  `covers_map.js` (a hex title-id). `coverSrc()` in `consoles/dl.js` does
  `console.covers[game.id]` to get the filename.
- **PS2's convention**: cover files are named by the **game id itself**
  (because the download script saved them that way), even though
  `covers_map.js` still maps id→serial for reference. This requires the
  registry entry to set `coversById: true`, which tells `coverSrc()` to use
  `game.id` directly instead of `console.covers[game.id]`.

Before writing the covers script, **decide which convention this console will
use** and write it down in a comment in the script. If you write a script that
saves files named by id, you **must** set `coversById: true` on the registry
entry, or every cover will silently 404 (exactly what happened with PS2 the
first time — caught only by checking actual HTTP status codes in a browser,
not by visual inspection).

1. Confirm the covers source with the user (or find a real one — search GitHub
   for `<console> covers` repos, inspect their actual structure/serial scheme
   before committing to it).
2. Write `compress_covers_<console>.py` (copy `compress_covers_ps2.py` as a
   template): reads `covers_map.js`, downloads from the real source URL,
   resizes to max height 400px, converts to WebP quality 80, saves to
   `public/covers/<console>/`.
3. Run it. Expect a small number of misses (a missing cover in the source repo
   is a real, documentable gap — not a bug to chase, same as PS2's missing
   Gran Turismo 3 cover).

## Phase 3 — Data files

Create `src/data/<console>/`:
- `games.js` — `export const <CONSOLE>_GAMES = [...]` from Phase 1's verified list.
- `covers_map.js` — `export const COVERS = { <id>: '<serial-or-key>', ... }`.
- `dlc_data.js` — `export const DLC_DATA = {}` (empty stub, same as PS2 started).
- `trailers_data.js` — `export const TRAILERS = {}` (filled in Phase 7, not now).

## Phase 4 — Registry entry

Add a `CONSOLES.<console>` entry in `src/consoles/registry.js`:
- `id`, `label`, **`accentColor`** (a real, distinct brand hex — this is the
  single most visible thing if you get it wrong; PS2 accidentally inherited
  Xbox green the first time because the *data layer* was generalized but the
  *visual* layer wasn't — see Phase 8's regression check), `coverPrefix:
  '/covers/<console>'`, `ready: true` (only flip this once Phases 1–6 are
  actually done — don't make a half-built console visible).
- `games`/`covers`/`dlc`/`trailers` imports from Phase 3.
- `coversById` per the Phase 2 decision.
- `partIds`/`partNames`: leave as `{}` until Phase 7 confirms real archive.org
  identifiers — never pre-fill guessed slugs.
- `types`/`typeMap`: usually just `['retail']` unless Phase 0 said otherwise.
- `trailerSearchSuffix: '<Console> trailer'`, `trailerCacheKey: '<console>_trailers'`.
- `specialFilters`/`filterGroups`: copy PS2's shape, adjust the genre/sport
  lists to genres actually present in this console's `games.js` (grep the
  `genre:` arrays you just wrote — don't list genres that don't exist in the
  data, and don't omit ones that do).

## Phase 5 — Page component

Create `src/pages/<Console>.jsx`, copying `src/pages/PS2.jsx` structure
exactly: `useConsolePage('<console>')`, a `FEATURED` title list, a `ROWS` array
(Em Destaque, Com Download, genre rows, year-band rows — base these on what's
actually common/well-represented in this console's catalog, not a copy-paste
of PS2's specific rows), header icon/colors using the registry's
`accentColor`.

## Phase 6 — Routing and Home

1. `src/App.jsx` — add `import <Console> from './pages/<Console>'` and
   `<Route path="/<console>" element={<<Console> />} />`, **not** wrapped in
   `PrivateRoute` (the page handles the no-`user` case itself, matching
   Xbox 360/PS2 — don't diverge by habit).
2. `src/pages/Home.jsx` — flip the console's `ready: false` → `true` in the
   `CONSOLES` array, and add a `getConsoleCounts('<console>', user.id)` call
   alongside the existing ones.
3. No Supabase schema change needed — `game_statuses.console` is free-text.

## Phase 7 — Download links (archive.org)

1. Search archive.org for this console's redump/retail collections. Open
   candidate items' `/metadata/<identifier>` endpoint — it **always returns
   HTTP 200**, so check for the `metadata` key's presence to know if the item
   really exists, and read the `files` array for actual filenames (don't guess
   naming patterns from the item title).
2. **Do not use HEAD or direct GET requests to `/download/<id>/<file>` to
   verify a link works** — many archive.org items require a logged-in session
   for direct file downloads and will return 401/500 even for files that
   genuinely exist. Verify existence via the no-login `/metadata/<id>` file
   listing instead; that's the correct (and only reliable) check.
3. Fuzzy-match this console's `games.js` titles against the combined file
   listing (same method as Phase 1: word-set IoU ≥0.85, sort ascending and
   spot-check the low-confidence tail, watch for apostrophe-dropping and
   franchise-expansion false positives like "Game 4" matching "Game 4 -
   Subtitle.7z" when only the subtitled version actually exists).
4. Once confirmed, fill in `partIds`/`partNames` in the registry (Phase 4) with
   the real identifiers, and add `dl: { part: '<p>', file: '<exact filename>' }`
   only to the games you actually confirmed. Leave everything else without a
   `dl` field — a documented gap, not a bug.
5. Re-verify the full final list against the metadata file listing one more
   time before considering this phase done (a one-line Python loop checking
   every `(part, file)` pair is `in` that part's file set).

## Phase 8 — Trailers

Run the existing generalized script — do not write a new one:
```bash
python3 fetch_trailers.py <console> --suffix "<Console> trailer"
```
This pre-fetches every game's trailer via `yt-dlp` (no API quota) into
`src/data/<console>/trailers_data.js`. It's idempotent — safe to re-run later
after adding more games, it only fetches what's missing. If a handful of
titles come back MISS (usually an age-restricted top result), pick an
alternate manually:
```bash
yt-dlp "ytsearch5:<title> trailer" --print "%(id)s" --no-warnings --skip-download --quiet
```
and hand-edit that id into `trailers_data.js`.

## Phase 9 — Verification (do not skip any of these)

1. `npm run build` and `npm run lint` — compare the lint error count/list
   against the pre-change baseline (`git stash` the new console's files if
   needed) so you can tell a genuinely new error from a pre-existing one.
2. Start (or reuse) the dev server, log in via the mock/test login path, and
   actually look at the rendered page — don't just trust the code:
   - Rows render by default; search/filter switches to grid.
   - **Open a cover image's `src` and confirm it resolves with HTTP 200** (not
     just "an `<img>` tag exists" — a 404'ing image still renders an `<img>`
     tag). This is exactly the check that would have caught the PS2 covers bug
     immediately.
   - Open a game card's modal: cover, status pills (and that `joguei`'s active
     state renders in *this console's* accent color, not green), star rating,
     genre tags colored correctly, a trailer iframe loads (check its `src`
     attribute has a real video id), and the download section shows a working
     link if `dl` is set.
   - Sidebar filter groups render and +/- toggles actually change the grid.
   - Prev/next modal navigation moves between games in the current list.
3. Visit `/dashboard` and confirm the new console gets its own grouped
   section automatically (no dashboard code changes should have been needed —
   if you find yourself editing `Dashboard.jsx` or `collection.js` for a new
   console, something upstream isn't actually generic yet).
4. Regression-check the *other* already-shipped consoles too — a shared
   component change for the new console (anything touching `GameCard.jsx`,
   `GameModal.jsx`, `Sidebar.jsx`, `dl.js`, `useConsolePage.js`) can silently
   leak into Xbox 360/PS2's rendering (this happened once: PS2 briefly
   inherited Xbox 360's green accent color because only data, not the visual
   layer, had been parameterized). Screenshot or click through at least one
   other console after any shared-file edit.

## Phase 10 — Cleanup

- Delete any throwaway one-off test/check scripts you created in the repo root
  during verification (keep only the reusable pipeline scripts:
  `compress_covers_<console>.py`, and the shared `fetch_trailers.py`).
- Update `CLAUDE.md`'s architecture section with anything genuinely new about
  this console (only if it deviates from the established pattern — don't
  restate what's already generic).
- Don't flip `ready: true` (Phase 4) until you've actually done Phase 9.
