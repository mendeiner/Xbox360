# Product

## Register

product

## Users

Bruno (the owner) and a small circle of friends he invites via code-gated signup. Each user tracks their own multi-console game collection (Xbox 360, PS2, PS3 today; SNES/N64/GameCube/Wii "coming soon"), marking games as played/beaten/100%/want-to-play, rating them, and finding archive.org download links for retail/XBLA/Kinect titles. A social layer (friends, activity feed, duels, polls, taste compatibility) lets the small group compare collections.

## Product Purpose

A personal, console-by-console game tracker that doubles as a personal gaming archive and a lightweight social space for a closed friend group. Success looks like: fast browsing of large catalogs (thousands of games per console), low-friction status/rating updates, and a dashboard that surfaces a user's full cross-console collection at a glance.

## Brand Personality

Retro-console, dark, utilitarian-cool. Think a game library shelf at night: dark surfaces, confident green accent (borrowed from Xbox's `#107C10`), dense information without clutter. Not flashy SaaS, not playful kids'-app — closer to a curated personal archive than a storefront.

## Anti-references

Generic SaaS auth templates (centered white card, blue gradient button, no personality). Bright/pastel "casual mobile game" aesthetics. Marketing-site flourishes (hero sections, big sales copy) — this is a tool, not a landing page.

## Design Principles

- Console pages are the template: new surfaces (like Login) should borrow the same dark surface palette, green accent, and typographic weight already established in `Xbox360.jsx`/`PS2.jsx`/`PS3.jsx`, `GameCard.jsx`, `Sidebar.jsx`, `Nav.jsx` — not invent a new visual language.
- Information density over whitespace-heavy minimalism — this app is built around browsing large catalogs.
- The product is for a known, small audience (Bruno + invited friends), so polish should favor coherence and personal identity over broad-appeal neutrality.
- Reuse the shared console-registry/component layer (`src/consoles/`) rather than forking UI per page.

## Accessibility & Inclusion

No formal WCAG target set; default to solid contrast on dark surfaces (the existing app already relies on light text on near-black backgrounds) and respect `prefers-reduced-motion` for any new motion work.
