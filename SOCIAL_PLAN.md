# Social Layer for Game Tracker

## Context

The game-tracker app currently tracks one user's own status per game (`game_statuses`) with zero visibility into friends' activity. The Supabase schema already has `friendships` and `activities` tables plus `getFriends()`/`getRecentActivity()` in `db.js`, but **none of it is wired to any UI** — it's dead infrastructure. The user (and ~10 friends) want a private social layer on top of the existing tracker: a friend activity feed (opt-in per post, to prevent backfill spam), comments + multi-reaction system, a cross-console "best games of all time" community ranking built from everyone's personal Top 10 lists, achievements/gamification, a Messenger-style friend list, notifications, and a Spotify-Wrapped-style yearly recap folded into `/dashboard`. Visually, the social section should depart from the rest of the app's soft rounded-corner / radial-glow look — sharper corners, oversized bold type for key numbers, a new coral/red accent — taking cues from the user's own brand site (brunoedita.com.br: navy-leaning dark, heavy geometric type, small red tag-badges, vertical glow-bordered media cards) without copying its literal colors.

User-confirmed decisions baked into this plan:
- Achievement definitions are hardcoded in JS (no DB table for definitions), only unlocks persist to Supabase.
- Top 10 reordering uses real drag-and-drop (user chose this over simpler steppers) — needs a small DnD dependency since none exists.
- `/home` absorbs `/dashboard`: the page becomes Year Recap (top) → console-picker tiles (existing `Home.jsx` content) → "my marked games" grid (existing `Dashboard.jsx` content), all stacked on one page. `/dashboard` route is removed; `Dashboard.jsx`'s body merges into `Home.jsx` rather than the reverse, since `/home` is the canonical post-login landing route in `App.jsx`.
- No friend-request UI for now — friendships are added manually via the Supabase SQL editor (fixed ~10-person group).

## Architectural decisions

- **New file `src/lib/social.js`**, not more additions to `db.js`. `db.js` is already a flat bag of unrelated domains; social adds ~20 more functions, deserves its own module. No mock-mode support in v1 — mock mode exists to let the `mock-user` test session use single-player tracking; the social layer is inherently multiplayer and mock mode buys nothing here.
- **Every new table references games as `(console, game_id)` together, never bare `game_id`** — `game_id` is only unique within a console (mirrors the existing `game_statuses` composite key). Getting this wrong silently corrupts cross-console rankings/top10s.
- **New cross-cutting accent color** `social` in `tailwind.config.js` (coral/red, e.g. `#FF4D4D`/`#FF7A7A` light) — used only in social-section chrome, never injected into console pages.
- **Visual fork, not redesign**: new `src/components/social/` components use `rounded-sm`/`rounded-none` (vs. existing `rounded-lg/xl/2xl`) and avoid the `accentRgba(...)` radial-gradient glow pattern from `GameCard`/`GameModal`. Existing console-page components are untouched.
- Add `@dnd-kit/core` + `@dnd-kit/sortable` as new dependencies for Top 10 drag-and-drop — lightweight, touch-friendly, no other DnD library exists in the project.

## New Supabase schema (append to `supabase/schema.sql`)

All new tables: `uuid primary key default gen_random_uuid()` where applicable, RLS enabled immediately, friend-read policies reuse the existing `activities_friend_read`-style `exists (... friendships ... status='accepted' ...)` pattern verbatim.

1. **`feed_posts`** — `id, user_id, console, game_id, action (check in joguei/zerado/cem_porcento), rating (nullable snapshot), created_at`. Separate from `activities` (which stays unused/legacy) since feed posts need an explicit opt-in semantic that `activities` was never designed for. RLS: own full access + friend read.
2. **`post_comments`** — `id, post_id → feed_posts, user_id, body (≤1000 chars), created_at`. RLS: read if can-read-parent-post; insert own; delete own OR post owner (moderation on your own wall).
3. **`post_reactions`** — `post_id, user_id, reaction (check in 8 fixed values: fire/laugh/mind_blown/skull/clap/100/goat/same), created_at`, PK `(post_id, user_id)` — one reaction per user per post, upsert to change, same-value-again removes it. Fixed custom glyph set (not a generic emoji picker) is the deliberate "not AI slop" choice.
4. **`top10_entries`** — `user_id, position (1-10), console, game_id, created_at`, PK `(user_id, position)`. Save = delete-all-mine + bulk-reinsert at new positions (simple at N=10, no granular shift logic needed). RLS: own full access; **authenticated read-all** (`using (true)`) — needed so the community ranking aggregation doesn't require per-row friendship joins, and Top 10s are meant to be seen on profiles anyway (achievements parallel).
5. **`achievements` table is skipped** (per user decision) — definitions live in `social.js` as a JS constant, mirroring how `registry.js` holds filter taxonomies.
6. **`user_achievements`** — `user_id, achievement_id (text, matches a JS-defined id), unlocked_at`, PK `(user_id, achievement_id)`. RLS: own write; authenticated read-all (visible on profiles/friends, no sensitive data).
7. **`notifications`** — `id, user_id (recipient), actor_id, type (check in comment/reaction/achievement), post_id (nullable → feed_posts), read (bool), created_at`. RLS: recipient-only select/update; insert allowed where `actor_id = auth.uid()` (no restriction on recipient, since you're notifying someone else). Populated via explicit inserts from `social.js` write paths, not triggers.
8. **`game_statuses.updated_at`** — add column (`timestamptz default now()`) + `before update` trigger to bump it. Required for: Year Recap ("beaten this year"), the "Velocista" achievement, and a future "recently played" rail. Without this, there is no per-flag timestamp at all today.

**Community ranking ("best of all time") — no new table.** Pure aggregate query over `top10_entries`: Borda-count points (`position 1 → 10 points ... position 10 → 1 point`), `group by (console, game_id)`, `order by sum(points) desc, count(distinct user_id) desc`. Chosen over averaging `game_statuses.rating` (small-N bias, per-console population skew, opaque to users) and over a separate up/down-vote table (doesn't map to anything users already do). Reuses the Top 10 lists everyone is already building for their own profile — same mechanic real "Top 100 of all time" community lists use (aggregated ranked ballots).

**"Last comments" / community pulse — no new table.** Just a query: `post_comments` ordered by `created_at desc`, joined to `feed_posts` + both profiles, filtered to friend-visible posts.

## `src/lib/social.js` — function inventory

- **Feed**: `createFeedPost(console, gameId, action, rating)`, `getFeedPosts(friendIds, {limit, before})`, `getRecentComments(friendIds, limit)`.
- **Comments**: `addComment(postId, body)` (+ notifies post owner unless self), `deleteComment(commentId)`, `getComments(postId)`.
- **Reactions**: `setReaction(postId, reaction)` (upsert/toggle-off, notifies unless self), `getReactionSummary(postId)`.
- **Friends**: move `getFriends(userId)` here from `db.js` (delete the unused `getRecentActivity` from `db.js` entirely — superseded by `getFeedPosts`).
- **Top 10**: `getTop10(userId)`, `saveTop10(list)` (delete-then-bulk-insert).
- **Community ranking**: `getCommunityRanking(limit=50)` — DB-only, no registry import (join to static game data happens in the calling component, same split `collection.js` already establishes).
- **Achievements**: `ACHIEVEMENTS` (JS constant, see list below), `getUserAchievements(userId)`, `checkAndUnlockAchievements(userId)` — runs count queries against existing+new tables, upserts newly-met `user_achievements`, returns newly-unlocked subset for a toast. Called opportunistically after `setFlag`, `setRating`, `addComment`, `saveTop10`.
- **Notifications**: `getUnreadCount(userId)`, `getNotifications(userId, limit)`, `markAllRead(userId)`, internal `notify(recipientId, actorId, type, postId)`. **Polling, not realtime** — `setInterval(~45s)` inside a `useNotifications()` hook, plus fetch on mount and on `visibilitychange`. Right call at 10 users: trivial query load, avoids realtime connection-lifecycle complexity (reconnect-on-focus, cleanup, doesn't fit the `mock-user` fake-session case) for no real benefit at this scale.

**`src/lib/collection.js` additions** (need registry access, so belong here not in `social.js`): `getProfileStats(userId)` (cross-console joguei/zerado/cem_porcento/quero sums), `getYearInReview(userId, year)` (genre breakdown, top-rated game of year via `updated_at`, consoles touched — no "hours played," no time-tracking infra exists or is in scope).

## Activity opt-in UX (the anti-spam requirement)

Triggers only on `joguei`/`zerado`/`cem_porcento` transitioning to `true` (never on `quero`, never on un-checking, never on rating-only changes). **Default is always share=off** — this is the only choice that actually prevents backfill-spam; an opt-in tap, not a pre-checked box.

- **`GameModal.jsx`** (has room): after the pill activates, a one-line inline strip appears below the Status section — "Compartilhar no feed?" with explicit Sim/Não buttons.
- **`GameCard.jsx`** (hover pills, no room): the status write happens immediately as it does today (don't regress the fast in-grid flagging flow), and a small coral-dot share icon appears next to the pill for ~4 seconds — tap to share, ignore to skip silently, no nag.
- No "share my whole history" bulk action — intentionally absent, since that's the exact spam scenario being guarded against.

## Component/page architecture

New `src/components/social/` directory, new pages in `src/pages/`:

- **`Feed.jsx`** (`/feed`) — `FeedPostCard` list + "Last Comments" rail + hosts `FriendSidebar`.
- **`Profile.jsx`** (`/u/:username`) — see layout below.
- **`Rankings.jsx`** (`/rankings`) — community best-of-all-time, `RankingRow` per entry with oversized rank numerals.
- **`FeedPostCard.jsx`** — new component, NOT an adaptation of `GameCard` (different job: read-mostly social object vs. status-editing control). Embeds a read-only thumbnail using existing `coverSrc`/`accentColor` helpers for visual consistency, but is its own component.
- **`ReactionPicker.jsx`** — 8 fixed glyphs as a horizontal row of small hard-corner (`rounded-sm`) buttons, filled with the new `social` accent when active. Not a popover emoji picker.
- **`CommentThread.jsx`** — comment list + inline add box.
- **`FriendSidebar.jsx`** — persistent collapsible panel on desktop (fixed right rail), slide-out drawer on mobile via a `Nav.jsx` icon. Clicking a friend navigates to `/u/:username` (no DM, confirmed out of scope).
- **`Top10Editor.jsx`** — drag-and-drop via `@dnd-kit/sortable`, 10 slots, oversized rank numeral per row, empty slots open an inline cross-console game search (reuse `readyConsoles()` + each console's `games` array).
- **`AchievementBadge.jsx`** — tiered (bronze/silver/gold) styling, locked achievements shown grayed-out (Xbox/Steam convention, aspirational).
- **`NotificationBell.jsx`** — lives in `Nav.jsx`, dropdown panel, backed by the polling hook above.
- **`RankingRow.jsx`** — oversized bold numeral treatment, the primary home for the brand-reference "big bold display type" direction.

`src/hooks/useNotifications.js` and `src/hooks/useFriends.js` — new `src/hooks/` directory (none exists yet), justified since both are consumed in multiple places.

## Top 10 reorder (drag-and-drop)

`@dnd-kit/core` + `@dnd-kit/sortable` (new deps) — touch- and mouse-friendly out of the box, avoids hand-rolling pointer-event tracking for cross-device drag. Each of the 10 rows: cover thumbnail + title + oversized rank numeral, draggable via `@dnd-kit/sortable`'s `useSortable` hook. Empty slot → inline search/picker over all `readyConsoles()` games by title.

## Profile page layout (`/u/:username`)

1. Header: avatar (file upload → new public Supabase Storage bucket `avatars`, path `avatars/{user_id}.{ext}`, new `profiles.avatar_url text` column), display name, username, **no follower/following counts** — instead one big bold "total games tracked" vanity stat.
2. Stats row: joguei/zerado/cem_porcento/quero counts, summed across all `readyConsoles()`.
3. **Top 10 showcase** — most visual weight on the page, directly below stats, oversized rank numerals over covers.
4. Achievements strip — unlocked badges, locked ones grayed-out.
5. Genre breakdown — small bar/donut from registry `genre[]` arrays on the user's completed games.
6. Recently active — last 5-10 `feed_posts` by this user, `FeedPostCard` in compact mode.

## Achievements starter set (hardcoded in `social.js`)

All derivable from existing + newly-added tables, no new tracking infra:

1. Primeira Platina (bronze) — first `cem_porcento`.
2. Completionist (silver) — 10 `cem_porcento`.
3. Completionist+ (gold) — 25 `cem_porcento`.
4. Maratonista (bronze) — flags set across 3+ consoles.
5. Maratonista+ (gold) — across all `ready` consoles (computed dynamically, not hardcoded count).
6. Crítico (bronze) — 10 games rated.
7. Crítico+ (silver) — 50 games rated.
8. Curador (bronze) — saved a Top 10 list.
9. Influente (silver) — one of your Top 10 picks lands in the community top-5.
10. Comentarista (bronze) — 25 comments posted.
11. Popular (silver) — a single post receives 10+ combined reactions.
12. Social (bronze) — first feed share.
13. Quero Tudo (bronze) — 20+ games marked `quero`.
14. Velocista (silver) — 5+ games marked zerado/cem_porcento within one calendar month (needs `updated_at`).
15. Veterano (gold) — account 1+ year old AND 50+ total status flags set.

## `/home` resolution (supersedes the original `/dashboard` plan)

Per updated user decision: **`/home` becomes the single landing page, stacking three sections, top to bottom:**
1. `<YearRecap />` (new) — big headline stat ("X jogos zerados em 2026"), most-played genre, top-rated game of the year, consoles touched this year, year-selector (default current year). Pulls from `getYearInReview()` in `collection.js`. No "hours played" claim — not trackable. Best home for the oversized-type brand direction as a seasonal showpiece.
2. Console picker tiles — existing `Home.jsx` body (Xbox 360/PS2/PS3/SNES/"Em breve" cards, invite code section), untouched.
3. "My marked games" grid — existing `Dashboard.jsx` body (`getCollection()`-driven, grouped by console), untouched, merged into `Home.jsx`.

`Dashboard.jsx` is deleted; its body moves into `Home.jsx` as a third section. `/dashboard` route is removed from `App.jsx` entirely (not redirected — no external links depend on it).

## Routing changes (`src/App.jsx`)

All new routes behind `PrivateRoute` (unlike console pages, the social layer requires a known/friended user):
- `/feed` → `Feed.jsx`
- `/u/:username` → `Profile.jsx`
- `/rankings` → `Rankings.jsx`
- `/home` — body extended per above (Recap + console picker + games grid); `/dashboard` route removed.

`Nav.jsx` gains: a "Feed" link, `NotificationBell`, a friend-sidebar toggle icon for mobile.

## Build order

1. **Schema migration** — append all new SQL (feed_posts, post_comments, post_reactions, top10_entries, user_achievements, notifications, `game_statuses.updated_at` + trigger) to `supabase/schema.sql`, run once in the Supabase SQL editor.
2. **`social.js` full data layer** + `collection.js` additions — write and manually smoke-test every function against the live schema (no test framework in this repo; manual verification via the running app is the existing norm).
3. **Friends + Top 10 + Profile page** — `Profile.jsx`, `Top10Editor.jsx` (incl. installing `@dnd-kit`), stats section. Self-contained, no feed dependency. Validates the new sharp-corner visual language before it spreads.
4. **Community Rankings page** — trivial once step 3's Top 10 data exists; ship early since the user called this the most important feature.
5. **Feed core** — opt-in UX changes to `GameCard.jsx`/`GameModal.jsx` first (small isolated diff), then `Feed.jsx` + `FeedPostCard` + `CommentThread` + `ReactionPicker` together.
6. **Last Comments / community pulse** — thin layer on step 5's tables.
7. **Friend sidebar** — depends only on existing `getFriends` + step 3's profile route as the click-through destination.
8. **Notifications** — depends on step 5 generating comment/reaction events; additive chrome, built last among "always-on" features.
9. **Achievements** — depends on most other tables existing for meaningful unlock conditions; wire `checkAndUnlockAchievements` into `setFlag`/`setRating`/`addComment`/`saveTop10`.
10. **Year Recap + Home/Dashboard merge** — last; needs `updated_at` from step 1 plus data that's been accumulating since day one. Merge `Dashboard.jsx`'s body into `Home.jsx`, add `<YearRecap />` above both, delete `Dashboard.jsx`, remove the `/dashboard` route.

## Critical files

- `supabase/schema.sql` — all new tables/policies/trigger
- `src/lib/social.js` — new, full social data layer
- `src/lib/collection.js` — add `getProfileStats`, `getYearInReview`
- `src/lib/db.js` — remove unused `getRecentActivity`, move `getFriends` out
- `src/App.jsx` — new routes, remove `/dashboard`
- `src/components/xbox360/GameCard.jsx`, `GameModal.jsx` — opt-in share UX
- `src/pages/Home.jsx` — gains `<YearRecap />` section + the merged-in `Dashboard.jsx` games grid
- `src/pages/Dashboard.jsx` — deleted once its body is merged into `Home.jsx`
- `src/consoles/registry.js` — read-only reuse (`readyConsoles()`, `getConsole()`)
- `tailwind.config.js` — add `social` accent color
- `package.json` — add `@dnd-kit/core`, `@dnd-kit/sortable`

## Verification

- Run the SQL migration in Supabase's SQL editor against the real project; confirm no errors, then spot-check RLS by querying as different test users (or via the `mock-user` path where applicable, noting mock mode doesn't cover social tables).
- `npm run dev`, manually exercise each vertical slice end-to-end: mark a game → opt-in share → see post in `/feed` → comment/react from a second account → check notification bell → build a Top 10 → confirm it appears in `/rankings` aggregate → unlock at least one achievement → check `/dashboard` shows the Year Recap above the existing grid without disturbing it.
- `npm run lint` after each slice.
