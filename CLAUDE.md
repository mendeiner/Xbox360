# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal multi-console game-tracking web app (React + Vite + Tailwind + Supabase), in Portuguese (pt-BR UI). Users mark games as `joguei` (played) / `zerado` (beaten) / `cem_porcento` (100%) / `quero` (want to play), rate them, and find archive.org download links for retail/XBLA/Kinect titles. Xbox 360, PS2 and PS3 are implemented; remaining consoles (SNES, N64, GameCube, Wii) are listed on the home screen as "Em breve" (coming soon) placeholders. A cross-console `/dashboard` (`src/pages/Dashboard.jsx`) shows a logged-in user's marked games from every `ready` console grouped by console.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # eslint .
```

There is no test suite configured.

### Cover image pipeline (one-off, not part of the build)

`compress_covers.py` / `compress_covers_selected.py` read PNGs from a local source folder outside the repo (`/Users/vanessamilesi/Documents/BRUNO/XBOX/Xbox360/Real Covers`) and write resized WebP files into `public/covers/xbox360/`, named by `covers_map.js` title IDs. Run with `python3 compress_covers.py` from the repo root; requires Pillow. Only needed when adding/updating cover art.

`compress_covers_ps2.py` does the same for PS2, downloading JPGs from `github.com/xlenore/ps2-covers` (keyed by NTSC-U serial via `src/data/ps2/covers_map.js`) and writing `public/covers/ps2/<gameId>.webp` — **named by game id, not by serial** (unlike Xbox 360's hex-title-id scheme). This is why PS2's registry entry sets `coversById: true`, which tells `coverSrc()` in `consoles/dl.js` to build the cover path from `game.id` directly instead of looking up `console.covers[game.id]`. If you add a covers pipeline for a future console, decide up front whether its output files are named by game id or by the covers-map value, and set `coversById` accordingly — a mismatch here silently 404s every cover.

### Trailer pre-fetch pipeline (one-off, not part of the build)

`fetch_trailers.py <console> [--suffix "..."]` pre-fetches YouTube trailer video IDs for an entire console's catalog via `yt-dlp` (a YouTube search per game, no API quota involved) and writes them into `src/data/<console>/trailers_data.js`. Safe to re-run — already-cached ids are skipped, so it only backfills new/missing games. This is what `GameModal.jsx`'s live search (via the quota-limited `YT_KEY` YouTube Data API) falls back to only when a game has no pre-seeded id. Run this once after standing up a new console's `games.js` (e.g. `python3 fetch_trailers.py ps3 --suffix "PS3 trailer"`), and again any time more games are added to an existing console's catalog. Occasionally the top search result is age-restricted/blocked and yt-dlp returns nothing for that game — when that happens, manually pick an alternate id from `yt-dlp "ytsearch5:<title> trailer" --print "%(id)s" --no-warnings --skip-download --quiet` and hand-edit it into the console's `trailers_data.js`.

### `launcher.py`

A standalone Tkinter desktop helper (not part of the app) that runs `git add/commit/push` and opens the deployed Vercel URL. Unrelated to the React app's runtime.

## Environment

Supabase project credentials go in `.env` (see `.env.example`):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
Schema/RLS policies live in `supabase/schema.sql` — run the whole file once in the Supabase SQL editor to provision a new project. No migration tooling; schema changes are made by hand-editing that file and re-applying.

## Architecture

### Auth & data access layering

- `src/lib/supabase.js` — Supabase client singleton.
- `src/lib/db.js` — all data access goes through here (statuses, profiles, friendships, invites, activities). Has a **mock mode**: `setMockMode(true)` redirects `getMyStatuses`/`setFlag`/`setRating` to `localStorage` instead of Supabase, keyed `mock_statuses_<console>`. This backs the "Entrar como Teste" / `[DEV] Entrar como Bruno` dev login path (see below) so the UI is explorable without a Supabase project.
- `src/contexts/AuthContext.jsx` — wraps Supabase auth session state and exposes `{ user, profile, loading, signOut, mockLogin }` via `useAuth()`. `mockLogin()` flips on mock mode and fakes a `{ id: 'mock-user' }` session; `signOut()` special-cases that id to just clear local state instead of calling `supabase.auth.signOut()`.
- Real signup flow (`Login.jsx`): requires a valid, non-exhausted invite code (`invites` table, validated via `validateInvite`/`useInvite` in `db.js`) before calling `supabase.auth.signUp`, then creates a `profiles` row.

Components/pages key off `user?.id === 'mock-user'` (e.g. the "TESTE" badge in `Nav.jsx`) to indicate test sessions.

### Supabase schema (`supabase/schema.sql`)

Tables: `profiles`, `game_statuses` (composite PK `user_id, console, game_id`), `activities`, `friendships`, `invites`. RLS policies allow each user full access to their own `game_statuses`/`activities`, and read access to an accepted friend's rows. `increment_invite_use` RPC and an `on_auth_user_created` trigger (auto-creates a profile row from the email local-part) are defined as SQL functions in the same file.

### Console registry (`src/consoles/`) — shared core across consoles

Xbox 360 was the first console implemented; PS2 (and later consoles) reuse this layer instead of forking `GameCard`/`GameModal`/`Sidebar` per console.
- `registry.js` — one entry per console (`CONSOLES.xbox360`, eventually `CONSOLES.ps2`, ...) holding everything that used to be hardcoded in components: `games`/`covers`/`dlc`/`trailers` data refs, `partIds`/`partNames`/`dlTypeLabel` (archive.org slug mapping), `types`/`typeMap` (badge labels), `specialFilters`/`filterGroups` (Sidebar's filter taxonomy), `trailerSearchSuffix`/`trailerCacheKey`, `coverPrefix`, `ready`. `getConsole(id)` looks up an entry.
- `dl.js` — console-agnostic helpers: `buildDlEntries(dl)` (normalizes single-file/multi-file/multi-disc `dl` shapes), `dlFileUrl`/`dlPageUrl` (archive.org URL builders, parameterized by a console's `partIds`), `dlLink` (first resolvable link, used by the compact card), `coverSrc(game, console)`, `typeLabel`/`typeBadge`.
- `useConsolePage.js` — shared hook for a console's catalog page: status loading (via `getMyStatuses`), `inc`/`exc` filter-set toggling, `gameHas()`/`passes()` filter matching (genre/type/dl/localMP/online/status flags), `filteredGames`/`collectionGames`/`stats`, and prev/next modal navigation state (`openGame`/`closeGame`/`goPrev`/`goNext`/`selected`). Also exports `useDragScroll()` (click-and-drag horizontal scrolling for row strips, suppresses the click a drag would otherwise fire).
- `GameCard.jsx`/`GameModal.jsx`/`Sidebar.jsx` take a `consoleId` (default `'xbox360'`) or explicit `groups`/`special` props and read everything console-specific from the registry — they no longer hardcode Xbox 360 constants.

### Xbox 360 page (`src/pages/Xbox360.jsx`) — the core feature, and the template for new consoles

This is the most complex file in the app. Key pieces:
- `XBOX360_GAMES` (`src/data/xbox360/games.js`) — static array of ~2700 lines of plain JSON-like game objects (`id`, `title`, `year`, `genre[]`, `type: 'retail'|'arcade'|'kinect'`, `dl`, `localMP`, `players`, `online`, optional `score` — Metacritic score, 0-100, not yet backfilled for most games). This is hand-maintained data, not fetched from a DB. Wired into `registry.js` as `CONSOLES.xbox360.games`.
- `COVERS` (`src/data/xbox360/covers_map.js`) — maps `game.id` → archive.org-style cover title ID, used to build `/covers/xbox360/<id>.webp` paths against files produced by the compress_covers scripts.
- `DLC_DATA` (`src/data/xbox360/dlc_data.js`) — maps `game.id` → array of DLC entries (`{ title, dl }`), shown in the game modal.
- `TRAILERS` (`src/data/xbox360/trailers_data.js`) — maps `game.id` → cached YouTube video ID, pre-seeded data merged with a `localStorage` cache in `GameModal.jsx`.
- **Default view** is curated horizontal "rows" (`ROWS` const, defined per-page — Em Destaque, Com Download, genre rows, year-range rows, etc.), each independently filtering the console's games. As soon as the user types in search or sets an include/exclude filter (`Sidebar.jsx`), the page switches to a flat grid (`isGrid` flag) instead of rows. The filter/sort pipeline itself lives in `useConsolePage` (see above); `ROWS`/`FEATURED` curation is the one part each console's page still defines itself.
- `game.dl` can be a single `{part, file}`, a `{part, files: [...]}` (multi-file), or `{discs: [{part, file}, ...]}` (multi-disc, different parts per disc) — normalized by `buildDlEntries()` in `consoles/dl.js`.
- Game status changes (`joguei`/`zerado`/`cem_porcento` are mutually exclusive; `quero` is independent) are written optimistically to local state then persisted via `setFlag()`/`setRating()` in `db.js`, in both `GameCard.jsx` (hover pills) and `GameModal.jsx` (detail view pills + star rating).

### PS2 (`src/pages/PS2.jsx`) and future consoles

Mirrors `Xbox360.jsx`'s structure exactly (built on the same `useConsolePage('ps2')` hook), with its own `ROWS`/`FEATURED` curation. `src/data/ps2/` follows the same four-file shape as `src/data/xbox360/` (`games.js`, `covers_map.js`, `dlc_data.js`, `trailers_data.js`), keyed by NTSC-U serial instead of a hex title-id for covers (see `coversById` above). `partIds`/`partNames` in the PS2 registry entry point at two archive.org Redump-USA collections (`ps2usaredump1`, `ps2usaredump1_20200816_1458`) that only cover titles alphabetically A–R; titles outside that range simply have no `dl` field rather than a guessed one. This is the template to follow for PS3/etc: a new `src/data/<console>/*`, a thin page file, a registry entry, and console-specific covers/trailer/download pipeline runs.

### PS3 (`src/pages/PS3.jsx`)

Same `useConsolePage('ps3')` template as PS2. Two things differ from PS2's pattern, worth knowing before extending it:
- **Type split**: PS3 has a real `retail`/`psn` type distinction (Blu-ray disc vs PSN digital), like Xbox 360's retail/arcade/kinect rather than PS2's everything-is-retail. `localMP`/`players`/`online` are derived programmatically from GameTDB's `<input>`/`<wi-fi>` tags (real data, not hand-entered).
- **Covers convention**: cover files are named by serial, same as Xbox 360 (`coversById` is *not* set), not by game id like PS2.
- **Catalog source**: built from GameTDB's `ps3tdb.xml` (gametdb.com/ps3tdb.zip) cross-referenced against `SvenGDK/PSMT-Covers` (mirrors `aldostools/Resources`) for confirmed cover availability. That source data has two known quirks worth remembering if the catalog is ever regenerated: titles are sometimes alphabetized GameTDB-style (`"Last of Us, The"`) and need reordering back to natural form, and the `<date year>` field is frequently a database-edit timestamp rather than the real release year (spot-checked: wrong on the majority of sampled titles) — `year` in `games.js` is taken as-is per explicit instruction, so treat it as low-confidence, not verified.
- **No `dl` field yet** — archive.org download links were not researched for PS3 (`partIds`/`partNames` are empty in the registry); every game has a confirmed cover but no download source. This is a known, deliberate gap, not a bug.

### NSW (`src/pages/NSW.jsx`)

Breaks from the PS2/PS3 pattern in one fundamental way: there is no redump/no-intro ground-truth database or archive.org ROM scene for Switch cartridges, so RAWG (api.rawg.io, platform id 7) is the catalog *and* cover-art source directly, rather than enrichment-only the way `rawg_enrich.mjs` uses it for the other consoles.
- **Catalog**: RAWG's full Switch platform listing (5,781 games) filtered to `added >= 200` (RAWG's community-engagement counter) to exclude obscure/unrated eShop shovelware, leaving 1,789 titles. Note RAWG's `added`/`released` are aggregated at the *game* level across all of a title's platforms, not Switch-specific — a game ported from an older platform shows that platform's original release year, not its Switch port date (e.g. NES-era titles show their 1980s year). Treat `year` as "the game's original release," not "when it came to Switch."
- **No `dl` field, ever** — `partIds`/`partNames` are intentionally empty and will stay that way; Switch carts aren't a realistic archive.org/redump source the way retail discs and old ROMs are. This is a permanent gap, not a "not yet."
- **No retail/digital type split** — checked both RAWG (genres/tags/stores/platforms, at list and detail level) and `blawar/titledb` (the Switch eShop title database, ~36k entries) directly; neither carries a physical-cart-vs-digital-only flag. Every game uses a single `type: 'retail'` value, same pattern as PS2/SNES, rather than guessing.
- **Covers**: `compress_covers_nsw.py` downloads each game's RAWG `background_image` URL (captured in `covers_map.js` at catalog-build time) and resizes to half PS2/PS3's usual size/quality (200px height, WebP q40) given the catalog is ~9x bigger than any other console. `coversById: true`, same convention as PS2.
- **No `localMP`/`players`/`online` flags** — not verifiable from RAWG without guessing, so `specialFilters` is empty.

### Cross-console dashboard (`src/pages/Dashboard.jsx`, `src/lib/collection.js`)

`getCollection()` in `collection.js` iterates every `ready` console in the registry, fetches the current user's statuses via `getMyStatuses`, and joins them against that console's static `games` data, keeping only games with at least one status flag set. `Dashboard.jsx` (behind `PrivateRoute` at `/dashboard`) renders the result grouped by console, reusing `GameCard`/`GameModal` directly (each passed that entry's own `consoleId`) rather than building separate card UI — so a new console shows up on the dashboard automatically once it's registered with `ready: true`, no dashboard code changes required.

### Routing (`src/App.jsx`)

`/` → `Login` (or redirect to `/home` if authed) · `/home` → `Home` (console picker, behind `PrivateRoute`) · `/xbox360` → `Xbox360` · `/ps2` → `PS2` · `/ps3` → `PS3` · `/snes` → `SNES` · `/nsw` → `NSW` · `/dashboard` → `Dashboard` (behind `PrivateRoute`). Note the console pages are **not** wrapped in `PrivateRoute`, so each page itself has to handle the no-`user` case (it does, by skipping the status fetch and disabling write actions). NSW is registered with `ready: false` until its data/covers/trailers pipelines have been spot-checked further — flip it once satisfied (see `add-console` skill Phase 9/10).

### Styling

Tailwind only, no CSS modules. Custom per-console brand colors and `surface-*` dark palette are defined in `tailwind.config.js` (`xbox`, `ps`, `snes`, `n64`, `gcube`, `wii`). Xbox 360 UI components mostly use raw hex literals (`bg-[#1a1a1a]`, `border-[#107C10]`) rather than the `xbox` token directly — match existing style when touching these files rather than refactoring to tokens.

## Known rough edges

- `GameModal.jsx` has a YouTube Data API key hardcoded in source (`YT_KEY`) for trailer search — be aware when editing that file; don't add further secrets to source.
