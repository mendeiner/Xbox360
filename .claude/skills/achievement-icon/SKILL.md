---
name: achievement-icon
description: Draw a matching SVG glyph whenever a new achievement is added to ACHIEVEMENTS in src/lib/social.js. Use when the user adds/edits an achievement definition, or asks for "an icon for this achievement".
---

# Achievement icon design

Every achievement in `ACHIEVEMENTS` (`src/lib/social.js`) needs a matching glyph in the
`GLYPHS` map in `src/components/social/AchievementIcon.jsx`. If a new achievement is
added without one, `AchievementIcon` silently renders nothing (`if (!make) return null`).

## Design language (don't deviate without the user asking)

- **Medallion frame**: every icon sits in a solid circle, `fill` = `TIER_BG[tier]`
  (dark tier-tinted background), `stroke` = `TIER_RING[tier]` (bronze/silver/gold).
  This is rendered once by the `AchievementIcon` wrapper — glyphs only draw the
  inner content, viewBox `0 0 32 32`, centered around `(16, 16)`.
- **One clear object, not an abstract icon-font glyph.** Pick a concrete thing the
  achievement metaphorically *is* — a trophy, a shield, a megaphone, a lightning bolt —
  not a checkmark-in-a-circle or other generic dashboard icon. Steam/Xbox/PSN
  achievement icons are the reference point, not Heroicons/Feather/Material icons.
- **Two-tone shading, not flat silhouette.** Use the `TwoTone` helper (already in the
  file) to split the main shape into a light half + dark half via a `clipPath` —
  this fakes a single light source and is what makes the icon read as an object
  with weight rather than a flat glyph. Reserve flat white/colored fills for small
  secondary marks (dots, sparkles, stripes) layered on top.
- **Dynamism via asymmetry, not decoration.** A slight `rotate(±4 to ±6, 16, 16)` on
  the whole glyph group, or a pose/silhouette that isn't perfectly symmetric (e.g. the
  runner's leaning stride, the star's two elongated diagonal arms), reads as
  "designed" rather than "generated." Don't rotate everything identically — vary it
  per icon the way the existing set does.
- **Every extra mark must mean something.** Before adding a detail, name what it
  represents (e.g. chevron stripes on Veterano = service rank, a checkered flag on
  Maratonista+ = finished the full run, a sparkle on a `_plus` tier achievement =
  upgraded/intensified). If you can't name it, cut it — the user has explicitly
  flagged "random" decorative elements (unexplained rivets/straps, an oddly jagged
  star outline) as a problem before. Reuse an existing shape family (e.g. the same
  shield path for `completionist` and `veterano`) when the metaphor genuinely
  overlaps — that's intentional consistency, not laziness.
- **Bronze/silver/gold tiers don't change the glyph design**, only the medallion's
  ring/background color (handled automatically by the wrapper) — `_plus` variants of
  an achievement (e.g. `completionist` → `completionist_plus`) should reuse the base
  glyph and add exactly one small meaningful accent, not redesign the whole icon.

## Steps to add a new achievement's icon

1. Read the achievement's `id`, `label`, `description`, and `tier` from
   `src/lib/social.js`.
2. Decide the one concrete object that represents it (see design language above).
3. Add an entry to `GLYPHS` in `src/components/social/AchievementIcon.jsx`, keyed by
   the achievement's `id`. The function receives `bg` (the tier's dark background
   color) for any cutout/stroke that needs to "engrave" into a light shape (see how
   `completionist`'s checkmark or `veterano`'s chevrons use it).
4. Preview before committing — don't eyeball raw path coordinates blind. Use this
   pattern (already proven in this session):
   ```bash
   npx esbuild src/components/social/AchievementIcon.jsx --bundle --format=esm \
     --loader:.jsx=jsx --jsx=automatic --outfile=/tmp/AchievementIcon.bundle.js --external:react
   ```
   then serve `/tmp` with `python3 -m http.server 8743` and load an HTML file that
   imports the bundle via an import-map (`react`, `react/jsx-runtime`,
   `react-dom/client` from `https://esm.sh/...`) and renders
   `<AchievementIcon id="..." tier="..." />` at a larger size (e.g. 64-80px) inside a
   dark badge mockup. Screenshot it with Playwright
   (`./node_modules/playwright`, already a project dependency) and open the PNG with
   `open <path>.png` so the user can actually see it (copy it into the repo root
   temporarily if showing in chat — markdown image embeds from outside the project
   directory don't render reliably for the user).
5. Once approved, wire nothing else — `AchievementBadge.jsx` and
   `AchievementFeedCard.jsx` already render `<AchievementIcon id={achievement.id}
   tier={achievement.tier} />` generically for every achievement in the list.

## Known sizing conventions

- `AchievementBadge.jsx` (Profile → Conquistas tab): `w-9 h-9`, grayscale when locked.
- `AchievementFeedCard.jsx` (activity feed unlock card): `w-16 h-16` — this was
  tuned interactively (40px → 64px → 80px → 48px → 64px) and landed on 64px as the
  right size for that card's layout. Don't re-litigate this size without being asked.
