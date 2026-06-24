// Shared scene building blocks for the Year Recap story (round 2 — see plan parts G1-G4).
// Round 1 filled slides with abstract decoration (skylines, a podium, generic pixel-people) —
// rejected after user feedback because none of it said "video games" or "your games." The
// replacement vocabulary is two things only: (1) the player's own cover art, composed densely
// so nothing floats in blank space, and (2) `recapHud.jsx`'s franchise-flavored item icons.
// This file now only holds the cover-collage primitives + the always-on ambient backdrop;
// nothing here is an arbitrary shape.

// Full-bleed wall of covers — the default fill so a slide is never mostly black. Cycles through
// `covers` to fill a fixed tile grid (not a perfect seamless scroll), then applies a slow
// scale/translate breathing animation for continuous ambient motion without scroll-seam upkeep.
export function CoverWall({ covers = [], dim = 0.82, cols = 4, tileCount = 24, animated = true, className = 'absolute inset-0' }) {
  if (!covers.length) return null
  const tiles = Array.from({ length: tileCount }, (_, i) => covers[i % covers.length])
  return (
    <div className={`${className} overflow-hidden`} aria-hidden="true">
      <div
        className={`${animated ? 'recap-anim-wall-drift ' : ''}grid gap-1 blur-[1.5px]`}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: '25%', height: '110%', width: '110%' }}
      >
        {tiles.map((cover, i) => (
          <img key={i} src={cover} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
      {/* Slightly blurred + heavily dimmed: this is mood/texture, not something meant to be
          read — readable rows have their own opaque card background layered on top. Without
          this the wall's own cover logos/text compete with foreground content (verified via
          screenshot: card rows were nearly illegible at dim 0.72 with no blur). */}
      <div className="absolute inset-0" style={{ background: `rgba(4,19,10,${dim})` }} />
    </div>
  )
}

// Overlapping hand-of-cards spread — a small set of covers fanned out, for "here's the actual
// evidence" moments (top-rated reveal, hidden gem, vs face-off) where 3-5 specific games matter.
export function CoverFan({ covers = [], max = 5, color = 'currentColor', className = '' }) {
  const shown = covers.slice(0, max)
  if (!shown.length) return null
  const mid = (shown.length - 1) / 2
  return (
    // `width: '100%'` is load-bearing, not decorative: every child here is `position:absolute`,
    // so none of them contribute to this div's shrink-to-fit width inside a flex-col ancestor —
    // without an explicit width it collapses to 0, and Tailwind's base `img { max-width: 100% }`
    // reset then clamps every cover to 0px too (verified via computed styles: images rendered
    // at 4px instead of their w-16). `left-1/2` + a `calc(-50%, ...)` translate centers each
    // cover off that fixed-width box instead of relying on flex centering, which never applied
    // to absolutely positioned children anyway.
    <div className={`relative ${className}`} style={{ height: '7rem', width: '100%' }}>
      {shown.map((cover, i) => {
        const offset = i - mid
        return (
          <img
            key={i}
            src={cover}
            alt=""
            className="absolute top-0 left-1/2 w-16 aspect-[3/4] object-cover rounded border-2"
            style={{
              borderColor: color,
              transform: `translateX(calc(-50% + ${offset * 34}px)) rotate(${offset * 8}deg)`,
              zIndex: max - Math.abs(offset),
              boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
            }}
          />
        )
      })}
    </div>
  )
}

// Leaning stack of covers — a console's or a year's worth of games piled up, for slides about
// volume/loyalty rather than a single highlighted game.
export function CoverStack({ covers = [], max = 4, color = 'currentColor', className = '' }) {
  const shown = covers.slice(0, max)
  if (!shown.length) return null
  return (
    <div className={`relative ${className}`} style={{ width: '7rem', height: '9rem' }}>
      {shown.map((cover, i) => (
        <img
          key={i}
          src={cover}
          alt=""
          className="absolute inset-0 w-full h-full object-cover rounded border-2"
          style={{
            borderColor: color,
            transform: `translate(${i * 6}px, ${-i * 6}px) rotate(${(i - shown.length / 2) * -4}deg)`,
            zIndex: i,
            boxShadow: '0 4px 10px rgba(0,0,0,0.45)',
          }}
        />
      ))}
    </div>
  )
}

// Ranked horizontal row of covers — the building block for Top 5 / genre-ranking list rows.
export function CoverRow({ covers = [], max = 6, size = 'w-10', className = 'flex gap-1.5' }) {
  if (!covers.length) return null
  return (
    <div className={className}>
      {covers.slice(0, max).map((cover, i) => (
        <img key={i} src={cover} alt="" className={`${size} aspect-[3/4] object-cover rounded shrink-0`} />
      ))}
    </div>
  )
}

// Always-on full-bleed backdrop: a dimmed CoverWall of the slide's *own* games (so the fill is
// never abstract) plus a soft accent-color wash so corners are never flat black. Every slide
// drops this in as its first child. Falls back to wash-only when a stat genuinely has no
// covers of its own (rare — most round-2 fields carry their own `covers`/cover lists).
export function SceneBackdrop({ covers = [], accent = '#3ddc6a', className = 'absolute inset-0' }) {
  return (
    <div className={className} aria-hidden="true">
      {covers.length > 0 && <CoverWall covers={covers} />}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 30%, ${accent}33, transparent 70%)` }}
      />
    </div>
  )
}

// Particle/atmosphere layer — light shafts, dust, confetti. Kept from round 1: these are
// genuinely game-agnostic "mood" effects (every arcade cabinet has dust/light), not the
// abstract-shape problem the user flagged (which was specifically skylines/podiums/figures
// standing in for "a place" or "a person").
export function Particles({ kind = 'dust', density = 10, color = 'currentColor', className = 'absolute inset-0 overflow-hidden' }) {
  const items = Array.from({ length: density }, (_, i) => i)
  if (kind === 'confetti') {
    return (
      <div className={className} style={{ color }} aria-hidden="true">
        {items.map(i => (
          <span
            key={i}
            className="absolute top-0 recap-anim-confetti-fall"
            style={{
              left: `${(i * 53) % 100}%`,
              width: 5,
              height: 8,
              backgroundColor: 'currentColor',
              opacity: 0.5 + (i % 3) * 0.15,
              animationDelay: `${(i % 7) * 140}ms`,
              animationDuration: `${1800 + (i % 5) * 220}ms`,
            }}
          />
        ))}
      </div>
    )
  }
  if (kind === 'lightshaft') {
    return (
      <div className={className} style={{ color }} aria-hidden="true">
        {items.slice(0, Math.min(density, 4)).map(i => (
          <span
            key={i}
            className="absolute top-0 h-full recap-anim-lightshaft"
            style={{
              left: `${20 + i * 22}%`,
              width: '14%',
              background: 'linear-gradient(to bottom, currentColor, transparent)',
              opacity: 0.12,
              transform: 'skewX(-12deg)',
              animationDelay: `${i * 260}ms`,
            }}
          />
        ))}
      </div>
    )
  }
  // dust motes — slow drifting specks
  return (
    <div className={className} style={{ color }} aria-hidden="true">
      {items.map(i => (
        <span
          key={i}
          className="absolute rounded-full bg-current recap-anim-dust-drift"
          style={{
            left: `${(i * 31) % 100}%`,
            top: `${(i * 47) % 100}%`,
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            opacity: 0.25 + (i % 4) * 0.08,
            animationDelay: `${(i % 6) * 350}ms`,
            animationDuration: `${4000 + (i % 5) * 500}ms`,
          }}
        />
      ))}
    </div>
  )
}

// Small angled corner sticker — the box-art "rating stamp" motif, reused for the title slide's
// year tag, the boss-reveal MVP badge, and the trophy-case progress fraction.
// Default position clears YearRecapStory's persistent close button (top-2 right-2, ~36px) —
// top-3 right-3 would sit directly under it.
export function CornerSticker({ children, color = 'currentColor', className = 'absolute top-12 right-3' }) {
  return (
    <div
      className={`${className} recap-pixel text-[8px] px-2 py-1 -rotate-6 border-2 rounded`}
      style={{ color, borderColor: color, backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      {children}
    </div>
  )
}
