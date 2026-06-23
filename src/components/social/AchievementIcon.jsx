// Steam-style achievement medallions: one clear silhouette object per achievement (trophy,
// shield, star, megaphone...) rendered with a two-tone light/dark split — like a single light
// source hitting embossed metal/gem — instead of a flat one-color glyph. Every extra mark
// (rivet, chevron, sparkle) maps to something the achievement actually means; nothing decorative
// for its own sake. Not console logos.
const TIER_RING = { bronze: '#cd9a66', silver: '#d1d5db', gold: '#f4d873' }
const TIER_BG = { bronze: '#3d2a18', silver: '#2b2f3a', gold: '#3a2e10' }

// Renders a shape twice: once in `light`, then a `dark` rect clipped to the same shape to cover
// roughly half of it — the cheapest way to fake directional lighting in flat SVG.
function TwoTone({ clipId, tag, shapeProps, light, dark, darkRect }) {
  const Tag = tag
  return (
    <>
      <clipPath id={clipId}>
        <Tag {...shapeProps} />
      </clipPath>
      <Tag {...shapeProps} fill={light} />
      <rect {...darkRect} fill={dark} clipPath={`url(#${clipId})`} />
    </>
  )
}

const SHIELD_D = 'M11 9C9.5 9 9 9.6 9 11V15.5C9 21 12 25.5 16.5 28C21 25.5 24 21 24 15.5V11C24 9.6 23.5 9 22 9C19 9 13.8 9 11 9Z'

const GLYPHS = {
  primeira_platina: () => (
    <g transform="rotate(4 16 16)">
      <TwoTone clipId="cupClip" tag="path" shapeProps={{ d: 'M11 9h10v1.8c0 3.8-2.1 6.2-5 6.2s-5-2.4-5-6.2V9Z' }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 16, y: 7, width: 6, height: 11 }} />
      <path d="M11 10c-1.8 0-2.8 1-2.8 2.6 0 1.7 1.3 2.9 3 2.7" fill="none" stroke="#cfcfcf" strokeWidth="1.3" />
      <path d="M21 10c1.8 0 2.8 1 2.8 2.6 0 1.7-1.3 2.9-3 2.7" fill="none" stroke="#9c9c9c" strokeWidth="1.3" />
      <rect x="14.6" y="17" width="2.8" height="3" fill="#cfcfcf" />
      <rect x="12" y="20.3" width="8" height="2" rx="0.6" fill="#9c9c9c" />
    </g>
  ),
  completionist: (bg) => (
    <g transform="rotate(-6 16 16)">
      <TwoTone clipId="shieldClip-completionist" tag="path" shapeProps={{ d: SHIELD_D }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16.5, y: 8, width: 9, height: 21 }} />
      <path d="M11.5 19.4 14.9 18 23.7 6.7" stroke="#2a2a2a" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 18.6 14.5 17.2 23.3 5.8" stroke="#ffd84d" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  completionist_plus: () => (
    <g transform="rotate(-6 16 16)">
      <TwoTone clipId="shieldClip-completionist-plus" tag="path" shapeProps={{ d: SHIELD_D }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16.5, y: 8, width: 9, height: 21 }} />
      <path d="M11.5 19.4 14.9 18 23.7 6.7" stroke="#2a2a2a" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 18.6 14.5 17.2 23.3 5.8" stroke="#ffd84d" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 4.5 25.7 6.1 27.5 6.4 26.2 7.6 26.5 9.4 25 8.5 23.5 9.4 23.8 7.6 22.5 6.4 24.3 6.1Z" fill="#ffd84d" />
    </g>
  ),
  maratonista: () => (
    <>
      <path d="M5.5 21.5 9 20.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <path d="M6 18 9.5 17.3" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
      <circle cx="19" cy="9.5" r="1.7" fill="white" />
      <path d="M19 11.5 13 14 15 16.5" stroke="white" strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 11.5 16.5 18 12 21" stroke="white" strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 11.5 21.5 16.5 25 19" stroke="white" strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  maratonista_plus: () => (
    <>
      <circle cx="17" cy="9" r="1.7" fill="white" />
      <path d="M17 11 11 13.5 13 16" stroke="white" strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 11 14.5 17.5 10 20.5" stroke="white" strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 11 19.5 16 23 18.5" stroke="white" strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 7 24 21" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M24 7h4v2.3h-2v2.3h2v2.3h-4Z" fill="white" />
    </>
  ),
  critico: () => (
    <g transform="rotate(3 16 16)">
      <TwoTone clipId="starClip-critico" tag="polygon"
        shapeProps={{ points: '16,3 19.5,11 27,12 21.3,17.5 23,25.5 16,21.3 8,26 10.3,17.5 5,12 12.5,11' }}
        light="#ffd84d" dark="#c08a1f" darkRect={{ x: 16, y: 0, width: 16, height: 32 }} />
    </g>
  ),
  critico_plus: () => (
    <g transform="rotate(3 16 16)">
      <TwoTone clipId="starClip-critico-plus" tag="polygon"
        shapeProps={{ points: '16,3 19.5,11 27,12 21.3,17.5 23,25.5 16,21.3 8,26 10.3,17.5 5,12 12.5,11' }}
        light="#ffd84d" dark="#c08a1f" darkRect={{ x: 16, y: 0, width: 16, height: 32 }} />
      <line x1="16" y1="-2" x2="16" y2="1" stroke="#ffd84d" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="14.5" x2="4" y2="14.5" stroke="#ffd84d" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="14.5" x2="31" y2="14.5" stroke="#ffd84d" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),
  curador: (bg) => (
    <>
      <TwoTone clipId="medalClip" tag="circle" shapeProps={{ cx: 16, cy: 12.5, r: 5 }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 16, y: 6, width: 6, height: 13 }} />
      <path d="M13 17 9.5 25.5 13.5 23.3 16 26.5 18.5 23.3 22.5 25.5 19 17Z" fill="#cfcfcf" />
      <path d="M16 10.3 16.9 12.1 18.9 12.4 17.4 13.8 17.8 15.7 16 14.7 14.2 15.7 14.6 13.8 13.1 12.4 15.1 12.1Z" fill={bg} />
    </>
  ),
  influente: () => (
    <>
      <TwoTone clipId="megaphoneClip" tag="path" shapeProps={{ d: 'M5 13.5v5h3l11 4.8V8.7l-11 4.8Z' }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 12, y: 6, width: 8, height: 20 }} />
      <path d="M22 12.5c2 1.6 2 7.4 0 9" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M25 10.5c3 2.6 3 10.4 0 13" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </>
  ),
  comentarista: (bg) => (
    <>
      <TwoTone clipId="bubbleClip" tag="path"
        shapeProps={{ d: 'M8 10.5a2.6 2.6 0 0 1 2.6-2.6h10.8a2.6 2.6 0 0 1 2.6 2.6v7.4a2.6 2.6 0 0 1-2.6 2.6h-8.4l-4.4 4.2v-4.2h-0.4a2.6 2.6 0 0 1-2.6-2.6Z' }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 16, y: 6, width: 9, height: 16 }} />
      <circle cx="12.5" cy="14.2" r="1.1" fill={bg} />
      <circle cx="16" cy="14.2" r="1.1" fill={bg} />
      <circle cx="19.5" cy="14.2" r="1.1" fill={bg} />
    </>
  ),
  popular: () => (
    <>
      <TwoTone clipId="heartClip-popular" tag="path"
        shapeProps={{ d: 'M16 25.5C16 25.5 6.8 19.4 6.8 12.8 6.8 9.1 9.7 7 12.6 8.6 14.1 9.4 16 11.5 16 11.5S17.9 9.4 19.4 8.6C22.3 7 25.2 9.1 25.2 12.8 25.2 19.4 16 25.5 16 25.5Z' }}
        light="#ff8b8b" dark="#cc4d4d" darkRect={{ x: 16, y: 6, width: 10, height: 20 }} />
      <path d="M8.5 4.5c0 1.6 1 2.6 2.6 2.6-1.6 0-2.6 1-2.6 2.6 0-1.6-1-2.6-2.6-2.6 1.6 0 2.6-1 2.6-2.6Z" fill="#ffd84d" />
      <path d="M23 6c0 1.2.8 2 2 2-1.2 0-2 .8-2 2 0-1.2-.8-2-2-2 1.2 0 2-.8 2-2Z" fill="#ffd84d" />
    </>
  ),
  social: () => (
    <>
      <TwoTone clipId="nodeClip-1" tag="circle" shapeProps={{ cx: 22.5, cy: 8.5, r: 2.6 }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 22.5, y: 5, width: 4, height: 7 }} />
      <TwoTone clipId="nodeClip-2" tag="circle" shapeProps={{ cx: 22.5, cy: 23.5, r: 2.6 }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 22.5, y: 20, width: 4, height: 7 }} />
      <TwoTone clipId="nodeClip-3" tag="circle" shapeProps={{ cx: 9, cy: 16, r: 3 }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 9, y: 12, width: 4, height: 8 }} />
      <path d="M20.3 9.7 11.5 14.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M11.5 17.5 20.3 22.3" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  quero_tudo: () => (
    <>
      <TwoTone clipId="heartClip-wishlist" tag="path"
        shapeProps={{ d: 'M8.5 13.8c0-2.1 1.7-3.3 3.4-3.3 1.2 0 2.3.7 2.9 1.7.6-1 1.7-1.7 2.9-1.7 1.7 0 3.4 1.2 3.4 3.3 0 3-5.1 6-6.3 6.6-1.2-.6-6.3-3.6-6.3-6.6Z' }}
        light="#ff8b8b" dark="#cc4d4d" darkRect={{ x: 15.4, y: 10, width: 4.6, height: 11 }} />
      <rect x="21.5" y="10.3" width="5.5" height="2" rx="0.6" fill="white" />
      <rect x="21.5" y="14.3" width="5.5" height="2" rx="0.6" fill="white" opacity="0.75" />
      <rect x="21.5" y="18.3" width="3.5" height="2" rx="0.6" fill="white" opacity="0.5" />
    </>
  ),
  velocista: () => (
    <g transform="rotate(-4 16 16)">
      <TwoTone clipId="boltClip" tag="polygon"
        shapeProps={{ points: '18.5,4 9,18.5 14.5,18.5 13,28.5 23.5,13.5 17,13.5 19.5,4' }}
        light="#ffd84d" dark="#c08a1f" darkRect={{ x: 16, y: 0, width: 16, height: 32 }} />
      <path d="M3.5 12.5 7.5 12.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3.5 17.5 6.5 17.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  ),
  veterano: (bg) => (
    <g transform="rotate(-4 16 16)">
      <TwoTone clipId="shieldClip-veterano" tag="path" shapeProps={{ d: SHIELD_D }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16.5, y: 8, width: 9, height: 21 }} />
      <path d="M9.5 14 16.5 17 23.5 14" stroke={bg} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.8 17.8 16.5 20.6 23.2 17.8" stroke={bg} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 21.6 16.5 23.8 21.5 21.6" stroke={bg} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
}

// ── Shared builders for the 100-achievement expansion ──────────────────────────────────────
// Families share one silhouette (the metaphor) and tiers/variants add exactly one accent mark,
// the same convention as completionist -> completionist_plus above.

// Zerado_* milestones: a checkered finish flag — "you crossed the line."
function flagGlyph() {
  return (
    <g transform="rotate(-5 16 16)">
      <path d="M11 7v19" stroke="#cfcfcf" strokeWidth="1.7" strokeLinecap="round" />
      <TwoTone clipId="flagClip" tag="path" shapeProps={{ d: 'M11 7.5h12l-3 3.2 3 3.2H11Z' }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 17.5, y: 7, width: 6.5, height: 7 }} />
      <path d="M13 8.7h2v2h-2Zm4 0h2v2h-2Zm-4 4h2v2h-2Zm4 0h2v2h-2Z" fill="#2a2a2a" opacity="0.65" />
    </g>
  )
}

// Jogou_* milestones: a footpath of steps — distance covered, not a single win.
function footstepsGlyph() {
  return (
    <g transform="rotate(6 16 16)">
      <ellipse cx="11.5" cy="22" rx="2.3" ry="3.2" fill="#e7e7e7" transform="rotate(-15 11.5 22)" />
      <ellipse cx="16.5" cy="16" rx="2.3" ry="3.2" fill="#cfcfcf" transform="rotate(-15 16.5 16)" />
      <ellipse cx="21.5" cy="10" rx="2.3" ry="3.2" fill="#9c9c9c" transform="rotate(-15 21.5 10)" />
    </g>
  )
}

// Shield + N small stars: reuses completionist's shield, escalating star count = the tier ladder.
function shieldStarsGlyph(count) {
  const stars = [[24, 5.5], [27, 9], [25.5, 13]].slice(0, count)
  return () => (
    <g transform="rotate(-6 16 16)">
      <TwoTone clipId={`shieldClip-stars-${count}`} tag="path" shapeProps={{ d: SHIELD_D }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16.5, y: 8, width: 9, height: 21 }} />
      <path d="M11.5 19.4 14.9 18 23.7 6.7" stroke="#2a2a2a" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 18.6 14.5 17.2 23.3 5.8" stroke="#ffd84d" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {stars.map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 1.8} L${x + 1.1} ${y + 0.6} L${x + 2.4} ${y + 0.7} L${x + 1.3} ${y + 1.9} L${x + 1.7} ${y + 3.2} L${x} ${y + 2.2} L${x - 1.7} ${y + 3.2} L${x - 1.3} ${y + 1.9} L${x - 2.4} ${y + 0.7} L${x - 1.1} ${y + 0.6}Z`} fill="#ffd84d" />
      ))}
    </g>
  )
}

// Wishlist heart + queue lines, one extra line for the higher tier (reuses quero_tudo's shape).
function heartQueueGlyph(extraLine) {
  return () => (
    <>
      <TwoTone clipId={`heartClip-${extraLine ? 'x' : 'o'}`} tag="path"
        shapeProps={{ d: 'M8.5 13.8c0-2.1 1.7-3.3 3.4-3.3 1.2 0 2.3.7 2.9 1.7.6-1 1.7-1.7 2.9-1.7 1.7 0 3.4 1.2 3.4 3.3 0 3-5.1 6-6.3 6.6-1.2-.6-6.3-3.6-6.3-6.6Z' }}
        light="#ff8b8b" dark="#cc4d4d" darkRect={{ x: 15.4, y: 10, width: 4.6, height: 11 }} />
      <rect x="21.5" y="9.3" width="5.5" height="2" rx="0.6" fill="white" />
      <rect x="21.5" y="13.3" width="5.5" height="2" rx="0.6" fill="white" opacity="0.85" />
      <rect x="21.5" y="17.3" width="5.5" height="2" rx="0.6" fill="white" opacity="0.65" />
      {extraLine && <rect x="21.5" y="21.3" width="3.5" height="2" rx="0.6" fill="white" opacity="0.45" />}
    </>
  )
}

// Star with N lightning-ray pairs around it — escalating "review" badge family.
function starBurstGlyph(rayPairs, { filled = true, dim = false } = {}) {
  const rays = []
  for (let i = 0; i < rayPairs; i++) {
    const a = 4 + i * 7
    rays.push(<line key={`l${i}`} x1={1 + i} y1={14.5 - a / 4} x2={4 + i} y2={14.5 - a / 4} stroke="#ffd84d" strokeWidth="1.4" strokeLinecap="round" />)
    rays.push(<line key={`r${i}`} x1={28 - i} y1={14.5 - a / 4} x2={31 - i} y2={14.5 - a / 4} stroke="#ffd84d" strokeWidth="1.4" strokeLinecap="round" />)
  }
  return () => (
    <g transform="rotate(3 16 16)">
      {filled ? (
        <TwoTone clipId={`starClip-${rayPairs}-${dim ? 'd' : 'f'}`} tag="polygon"
          shapeProps={{ points: '16,3 19.5,11 27,12 21.3,17.5 23,25.5 16,21.3 8,26 10.3,17.5 5,12 12.5,11' }}
          light="#ffd84d" dark="#c08a1f" darkRect={{ x: 16, y: 0, width: 16, height: 32 }} />
      ) : (
        <polygon points="16,3 19.5,11 27,12 21.3,17.5 23,25.5 16,21.3 8,26 10.3,17.5 5,12 12.5,11"
          fill="none" stroke="#9c9c9c" strokeWidth="1.6" opacity={dim ? 0.7 : 1} />
      )}
      {rays}
    </g>
  )
}

// One reusable concrete object per genre — the design language's "pick a thing it is."
const GENRE_GLYPHS = {
  acao: () => (
    <g transform="rotate(-8 16 16)">
      <TwoTone clipId="swordClip" tag="path" shapeProps={{ d: 'M15 5.5h2v15h-2Z' }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 5, width: 2, height: 16 }} />
      <path d="M11 11h10v2H11Z" fill="#cfcfcf" />
      <path d="M13 20.5h6v2.5l-3 1.5-3-1.5Z" fill="#9c6b3f" />
    </g>
  ),
  aventura: () => (
    <>
      <TwoTone clipId="compassClip" tag="circle" shapeProps={{ cx: 16, cy: 16, r: 9 }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 7, width: 9, height: 18 }} />
      <circle cx="16" cy="16" r="9" fill="none" stroke="#2a2a2a" strokeWidth="1.2" opacity="0.4" />
      <path d="M19.5 12.5 17 17l-4.5 2.5L15 15Z" fill="#cc4d4d" />
    </>
  ),
  rpg: () => (
    <g transform="rotate(-6 16 16)">
      <TwoTone clipId="rpgClip" tag="path" shapeProps={{ d: 'M14.5 6h3v12h-3Z' }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 6, width: 2, height: 13 }} />
      <path d="M11.5 11h9v2h-9Z" fill="#cfcfcf" />
      <circle cx="16" cy="22" r="3.4" fill="#7c5cff" />
      <circle cx="16" cy="22" r="1.4" fill="#2a2a2a" opacity="0.5" />
    </g>
  ),
  jrpg: () => (
    <g transform="rotate(-10 16 16)">
      <TwoTone clipId="jrpgClip" tag="path" shapeProps={{ d: 'M9 19.5c2-7 5-12 12-13.5-1 3-1 5 1 6.5-3 1.5-6.5 4.5-9.5 9.5Z' }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 5, width: 8, height: 16 }} />
      <circle cx="22.5" cy="6.5" r="1.6" fill="#ff8b8b" />
    </g>
  ),
  fps: () => (
    <>
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="#cfcfcf" strokeWidth="1.8" />
      <line x1="16" y1="4.5" x2="16" y2="9" stroke="#cfcfcf" strokeWidth="1.8" />
      <line x1="16" y1="23" x2="16" y2="27.5" stroke="#cfcfcf" strokeWidth="1.8" />
      <line x1="4.5" y1="16" x2="9" y2="16" stroke="#cfcfcf" strokeWidth="1.8" />
      <line x1="23" y1="16" x2="27.5" y2="16" stroke="#cfcfcf" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="1.8" fill="#cc4d4d" />
    </>
  ),
  plataforma: () => (
    <g transform="rotate(-6 16 16)">
      <rect x="6" y="22" width="9" height="3" fill="#9c9c9c" />
      <rect x="17" y="14" width="9" height="3" fill="#cfcfcf" />
      <TwoTone clipId="jumpClip" tag="circle" shapeProps={{ cx: 13.5, cy: 17, r: 3 }}
        light="#ffd84d" dark="#c08a1f" darkRect={{ x: 13.5, y: 14, width: 4, height: 6 }} />
      <path d="M13.5 17 21.5 14.5" stroke="#cfcfcf" strokeWidth="1.4" strokeDasharray="1.5 1.5" fill="none" />
    </g>
  ),
  estrategia: () => (
    <g transform="rotate(-5 16 16)">
      <TwoTone clipId="pawnClip" tag="path" shapeProps={{ d: 'M13.5 9a2.5 2.5 0 1 1 5 0c0 1.1-.6 1.8-1.3 2.4 1.6.7 2.6 2.4 2.6 4.6H12.2c0-2.2 1-3.9 2.6-4.6-.7-.6-1.3-1.3-1.3-2.4Z' }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 6, width: 5, height: 11 }} />
      <path d="M11 17h10v2.3H11Z" fill="#cfcfcf" />
      <path d="M10 21h12v2.3H10Z" fill="#9c9c9c" />
    </g>
  ),
  puzzle: () => (
    <TwoTone clipId="puzzleClip" tag="path"
      shapeProps={{ d: 'M9 9h6v-1a2 2 0 1 1 4 0v1h6v6h-1a2 2 0 1 0 0 4h1v6h-6v-1a2 2 0 1 0-4 0v1H9v-6h1a2 2 0 1 0 0-4H9Z' }}
      light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 7, width: 9, height: 18 }} />
  ),
  terror: () => (
    <>
      <TwoTone clipId="skullClip" tag="path"
        shapeProps={{ d: 'M16 7c-4.4 0-7 3-7 6.8 0 2.4 1.2 4 2.4 5v3.2h3v-2h1.2v2h1v-2h1.2v2h3v-3.2c1.2-1 2.4-2.6 2.4-5C23 10 20.4 7 16 7Z' }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 16, y: 6, width: 7, height: 17 }} />
      <circle cx="13" cy="14" r="1.4" fill="#1a1a1a" />
      <circle cx="19" cy="14" r="1.4" fill="#1a1a1a" />
    </>
  ),
  corrida: flagGlyph,
  luta: () => (
    <g transform="rotate(-10 16 16)">
      <TwoTone clipId="fistClip" tag="path"
        shapeProps={{ d: 'M11 14a2 2 0 0 1 4 0v-2.5a1.8 1.8 0 0 1 3.6 0V11a1.8 1.8 0 0 1 3.6 0v1a1.8 1.8 0 0 1 3.4.6v3.4c0 3.6-2.6 6-6 6h-2c-3.5 0-6.6-2.6-6.6-6Z' }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 18.5, y: 9, width: 8, height: 13 }} />
    </g>
  ),
  esportes: () => (
    <TwoTone clipId="ballClip" tag="circle" shapeProps={{ cx: 16, cy: 16, r: 8.5 }}
      light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 7.5, width: 8.5, height: 17 }}
    />
  ),
  simulacao: () => (
    <g transform="rotate(-4 16 16)">
      <path d="M9 16 16 9l7 7v9H9Z" fill="#cfcfcf" />
      <path d="M9 16 16 9l7 7" stroke="#9a9a9a" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="19" width="4" height="6" fill="#3d2a18" />
    </g>
  ),
  tiro: () => (
    <>
      <circle cx="16" cy="16" r="9" fill="none" stroke="#cfcfcf" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="5.5" fill="none" stroke="#9c9c9c" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="2" fill="#cc4d4d" />
    </>
  ),
  sandbox: () => (
    <g transform="rotate(-4 16 16)">
      <TwoTone clipId="cubeTopClip" tag="path" shapeProps={{ d: 'M16 6 24 10.5 16 15 8 10.5Z' }}
        light="#e7e7e7" dark="#cfcfcf" darkRect={{ x: 16, y: 4, width: 8, height: 12 }} />
      <path d="M8 10.5 16 15v9L8 19.5Z" fill="#9c9c9c" />
      <path d="M24 10.5 16 15v9l8-4.5Z" fill="#777" />
    </g>
  ),
}

// One reusable concrete object per console family, escalating to a laurel sprig for the 15-game tier.
function laurel() {
  return (
    <>
      <path d="M6 25c2-3 3-7 3-11" stroke="#ffd84d" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M7 16c1 1 1 2.5 0 4M7.5 19c1 .6 1.8 1.8 1.6 3.2M8.5 22c1 .2 2 1 2.2 2.4" stroke="#ffd84d" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </>
  )
}
function discGlyph(master) {
  return () => (
    <g transform="rotate(-5 16 16)">
      <TwoTone clipId={`discClip-${master ? 'm' : 'b'}`} tag="circle" shapeProps={{ cx: 16, cy: 14, r: 8 }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 6, width: 8, height: 16 }} />
      <circle cx="16" cy="14" r="2.4" fill="#1a1a1a" />
      {master && laurel()}
    </g>
  )
}
function cartridgeGlyph(master) {
  return () => (
    <g transform="rotate(-4 16 16)">
      <TwoTone clipId={`cartClip-${master ? 'm' : 'b'}`} tag="path" shapeProps={{ d: 'M11 7h8l3 4v13H11Z' }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 6, width: 6, height: 18 }} />
      <rect x="13" y="13" width="6" height="4" fill="#3d2a18" />
      {master && laurel()}
    </g>
  )
}
function cardGlyph(master) {
  return () => (
    <g transform="rotate(5 16 16)">
      <TwoTone clipId={`cardClip-${master ? 'm' : 'b'}`} tag="rect" shapeProps={{ x: 11, y: 8, width: 10, height: 16, rx: 1.6 }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 8, width: 5, height: 16 }} />
      <circle cx="16" cy="16" r="2" fill="#3d2a18" />
      {master && laurel()}
    </g>
  )
}

// Era badges.
function crtGlyph() {
  return (
    <g transform="rotate(-4 16 16)">
      <TwoTone clipId="crtClip" tag="path" shapeProps={{ d: 'M8 9h13a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8Z' }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 9, width: 6, height: 14 }} />
      <circle cx="14" cy="16" r="4" fill="#1a1a1a" />
      <rect x="6" y="13" width="2" height="6" fill="#cfcfcf" />
    </g>
  )
}
function chipGlyph() {
  return (
    <g transform="rotate(4 16 16)">
      <rect x="11" y="11" width="10" height="10" fill="#cfcfcf" />
      <rect x="13" y="13" width="6" height="6" fill="#1a1a1a" />
      <path d="M14 11V8M18 11V8M14 24v-3M18 24v-3M11 14H8M11 18H8M24 14h-3M24 18h-3" stroke="#9c9c9c" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  )
}
function hourglassGlyph() {
  return (
    <g transform="rotate(0 16 16)">
      <TwoTone clipId="hourglassClip" tag="path" shapeProps={{ d: 'M10 7h12l-5 9 5 9H10l5-9Z' }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 7, width: 6, height: 18 }} />
      <rect x="9" y="6" width="14" height="2" fill="#cfcfcf" />
      <rect x="9" y="24" width="14" height="2" fill="#9c9c9c" />
    </g>
  )
}

// Trophy with laurel — "acclaimed" family (reuses primeira_platina's cup, adds leaves).
function laurelTrophyGlyph(leaves) {
  return () => (
    <g transform="rotate(3 16 16)">
      <TwoTone clipId={`laurelCupClip-${leaves}`} tag="path" shapeProps={{ d: 'M11 9h10v1.8c0 3.8-2.1 6.2-5 6.2s-5-2.4-5-6.2V9Z' }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 16, y: 7, width: 6, height: 11 }} />
      <rect x="14.6" y="17" width="2.8" height="3" fill="#cfcfcf" />
      <rect x="12" y="20.3" width="8" height="2" rx="0.6" fill="#9c9c9c" />
      {leaves >= 1 && <path d="M9 12c1.4 0 2.4.8 2.6 2.2" stroke="#ffd84d" strokeWidth="1.3" fill="none" strokeLinecap="round" />}
      {leaves >= 2 && <path d="M23 12c-1.4 0-2.4.8-2.6 2.2" stroke="#ffd84d" strokeWidth="1.3" fill="none" strokeLinecap="round" />}
    </g>
  )
}

function survivorGlyph() {
  return (
    <g transform="rotate(-6 16 16)">
      <TwoTone clipId="bandageShield" tag="path" shapeProps={{ d: SHIELD_D }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16.5, y: 8, width: 9, height: 21 }} />
      <path d="M9.5 16h14" stroke="#cc4d4d" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11 13.5 22 18.5" stroke="#2a2a2a" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
    </g>
  )
}

function controllersGlyph(online) {
  return () => (
    <>
      <TwoTone clipId={`padClip-${online ? 'o' : 'l'}`} tag="path"
        shapeProps={{ d: 'M9 17a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4l1 5a2 2 0 0 1-3.4 1.6L18 21H14l-2.6 2.6A2 2 0 0 1 8 22Z' }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 13, width: 8, height: 12 }} />
      <circle cx="12.5" cy="18.5" r="0.9" fill="#2a2a2a" />
      <circle cx="19.5" cy="18.5" r="0.9" fill="#2a2a2a" />
      {online && <path d="M22 9.5c2 1.4 2 6 0 7.4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />}
    </>
  )
}

function moonGlyph() {
  return (
    <TwoTone clipId="moonClip" tag="path" shapeProps={{ d: 'M21 8a9 9 0 1 0 0 16 7.5 7.5 0 0 1 0-16Z' }}
      light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 7, width: 8, height: 18 }} />
  )
}
function calendarGlyph(weekendAccent) {
  return () => (
    <g transform="rotate(-3 16 16)">
      <TwoTone clipId={`calClip-${weekendAccent ? 'w' : 'p'}`} tag="rect" shapeProps={{ x: 8, y: 9, width: 16, height: 14, rx: 1.4 }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 9, width: 8, height: 14 }} />
      <rect x="8" y="9" width="16" height="3.5" fill="#1a1a1a" opacity="0.4" />
      {weekendAccent
        ? <><rect x="18.5" y="17" width="4" height="4" fill="#cc4d4d" /><rect x="13" y="17" width="4" height="4" fill="#9c9c9c" /></>
        : <path d="M12 19.5 14.5 22 21 15" stroke="#2a2a2a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  )
}

function speechBubble(dots) {
  return () => (
    <>
      <TwoTone clipId={`bubbleClip2-${dots}`} tag="path"
        shapeProps={{ d: 'M8 10.5a2.6 2.6 0 0 1 2.6-2.6h10.8a2.6 2.6 0 0 1 2.6 2.6v7.4a2.6 2.6 0 0 1-2.6 2.6h-8.4l-4.4 4.2v-4.2h-0.4a2.6 2.6 0 0 1-2.6-2.6Z' }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 16, y: 6, width: 9, height: 16 }} />
      {Array.from({ length: dots }).map((_, i) => (
        <circle key={i} cx={12.5 + i * 3.5} cy={14.2} r="1.1" fill="#1a1a1a" opacity="0.55" />
      ))}
    </>
  )
}

function reactionHand(spark) {
  return () => (
    <g transform="rotate(-6 16 16)">
      <TwoTone clipId={`handClip-${spark ? 's' : 'p'}`} tag="path"
        shapeProps={{ d: 'M13 24V14a1.6 1.6 0 0 1 3.2 0v3.5l1-7a1.5 1.5 0 0 1 3 .4l-.6 6.6 1-1a1.5 1.5 0 0 1 2.4 1.7l-2 6.8Z' }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 6, width: 8, height: 18 }} />
      {spark && <path d="M9 9c0 1.3.8 2.1 2.1 2.1-1.3 0-2.1.8-2.1 2.1 0-1.3-.8-2.1-2.1-2.1 1.3 0 2.1-.8 2.1-2.1Z" fill="#ffd84d" />}
    </g>
  )
}

function quillScroll(double) {
  return () => (
    <g transform="rotate(-5 16 16)">
      <TwoTone clipId={`scrollClip-${double ? 'd' : 's'}`} tag="rect" shapeProps={{ x: 9, y: 16, width: 14, height: 7, rx: 2 }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 16, width: 7, height: 7 }} />
      <path d="M12 18h8M12 20.5h5" stroke="#1a1a1a" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
      <path d="M22 7 9 20" stroke="#cfcfcf" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 7 24 6l1 1-1.5 2Z" fill="#9c9c9c" />
      {double && <rect x="9" y="9" width="10" height="5" rx="1.6" fill="#777" opacity="0.7" />}
    </g>
  )
}

function crossedSwords(crown) {
  return () => (
    <g transform="rotate(0 16 16)">
      <path d="M8 9 23 22" stroke="#cfcfcf" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 9 9 22" stroke="#9c9c9c" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 9 5.5 7M24 9 26.5 7" stroke="#777" strokeWidth="1.8" strokeLinecap="round" />
      {crown && <path d="M13 6h6l-1 3h-4Z" fill="#ffd84d" />}
    </g>
  )
}

function ballotBox(checks) {
  return () => (
    <g transform="rotate(0 16 16)">
      <TwoTone clipId={`ballotClip-${checks}`} tag="path" shapeProps={{ d: 'M8 14h16v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 8 23Z' }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 14, width: 8, height: 10.5 }} />
      <path d="M13 14 16 8l3 6Z" fill="#cfcfcf" />
      {Array.from({ length: checks }).map((_, i) => (
        <path key={i} d={`M${11.5 + i * 4.5} 19 L${12.7 + i * 4.5} 20.4 L${15 + i * 4.5} 17.6`} stroke="#1a1a1a" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      ))}
    </g>
  )
}

function portraitFrame() {
  return (
    <>
      <TwoTone clipId="frameClip" tag="rect" shapeProps={{ x: 8, y: 7, width: 16, height: 18, rx: 1.4 }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 7, width: 8, height: 18 }} />
      <circle cx="16" cy="14" r="3" fill="#1a1a1a" opacity="0.55" />
      <path d="M10 23c1-3 3-4.5 6-4.5s5 1.5 6 4.5Z" fill="#1a1a1a" opacity="0.55" />
    </>
  )
}
function nameBanner() {
  return (
    <g transform="rotate(-3 16 16)">
      <TwoTone clipId="bannerClip" tag="path" shapeProps={{ d: 'M7 12h18v6l-2.5 2 2.5 2v1H7v-1l2.5-2L7 18Z' }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 12, width: 9, height: 11 }} />
      <path d="M10 16.5h12" stroke="#1a1a1a" strokeWidth="1.3" opacity="0.4" strokeLinecap="round" />
    </g>
  )
}

function stackedMedals(count) {
  const offsets = [0, 1, 2].slice(0, count)
  return () => (
    <g transform="rotate(-4 16 16)">
      {offsets.map((o, i) => (
        <TwoTone key={i} clipId={`medalStack-${count}-${i}`} tag="circle"
          shapeProps={{ cx: 13 + o * 3, cy: 19 - o * 3, r: 5 }}
          light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 13 + o * 3, y: 14 - o * 3, width: 6, height: 11 }} />
      ))}
      <path d="M16 9.5 16.9 11.3 18.9 11.6 17.4 13 17.8 14.9 16 13.9 14.2 14.9 14.6 13 13.1 11.6 15.1 11.3Z" fill="#ffd84d" />
    </g>
  )
}

function diceHex() {
  return (
    <g transform="rotate(0 16 16)">
      <TwoTone clipId="hexClip" tag="path" shapeProps={{ d: 'M16 6 24 11v10l-8 5-8-5V11Z' }}
        light="#e7e7e7" dark="#9a9a9a" darkRect={{ x: 16, y: 6, width: 8, height: 20 }} />
      <path d="M16 6 16 16 24 11M16 16 8 11M16 16 16 26M16 16 24 21M16 16 8 21" stroke="#1a1a1a" strokeWidth="0.8" opacity="0.4" fill="none" />
    </g>
  )
}

function globeTrophy(ring) {
  return () => (
    <g transform="rotate(2 16 16)">
      <TwoTone clipId={`globeCupClip-${ring}`} tag="circle" shapeProps={{ cx: 16, cy: 14, r: 7.5 }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 16, y: 6.5, width: 7.5, height: 15 }} />
      <path d="M16 6.5v15M8.5 14h15" stroke="#777" strokeWidth="1" opacity="0.5" />
      <ellipse cx="16" cy="14" rx="3.5" ry="7.5" fill="none" stroke="#777" strokeWidth="1" opacity="0.5" />
      <rect x="14" y="21" width="4" height="3" fill="#9c9c9c" />
      {ring && Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2
        return <circle key={i} cx={16 + Math.cos(a) * 11} cy={16 + Math.sin(a) * 11} r="1" fill="#ffd84d" />
      })}
    </g>
  )
}

function dualTrophy() {
  return (
    <g transform="rotate(0 16 16)">
      <TwoTone clipId="dualCupClipA" tag="path" shapeProps={{ d: 'M7 9h7v1.4c0 3-1.6 5-3.5 5S7 13.4 7 10.4Z' }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 11, y: 7, width: 4, height: 9 }} />
      <TwoTone clipId="dualCupClipB" tag="path" shapeProps={{ d: 'M18 9h7v1.4c0 3-1.6 5-3.5 5S18 13.4 18 10.4Z' }}
        light="#f0f0f0" dark="#9c9c9c" darkRect={{ x: 22, y: 7, width: 4, height: 9 }} />
      <rect x="9.5" y="15.4" width="2" height="3" fill="#cfcfcf" />
      <rect x="20.5" y="15.4" width="2" height="3" fill="#cfcfcf" />
      <rect x="7" y="22" width="18" height="2.4" rx="0.6" fill="#9c9c9c" />
    </g>
  )
}

const ZERADO_FLAG = flagGlyph
const JOGOU_STEPS = footstepsGlyph
const NOTE_PRIMEIRA = starBurstGlyph(0, { filled: false, dim: false })
const NOTE_MAXIMA = starBurstGlyph(0, { filled: true })
const NOTE_MINIMA = starBurstGlyph(0, { filled: false, dim: true })
const CRITICO_MASTER = starBurstGlyph(2)
const CRITICO_SUPREMO = starBurstGlyph(3)

Object.assign(GLYPHS, {
  // Zerado milestones
  zerado_1: ZERADO_FLAG, zerado_10: ZERADO_FLAG, zerado_25: ZERADO_FLAG, zerado_50: ZERADO_FLAG, zerado_100: ZERADO_FLAG,
  // Played milestones
  jogou_1: JOGOU_STEPS, jogou_50: JOGOU_STEPS, jogou_100: JOGOU_STEPS, jogou_250: JOGOU_STEPS, jogou_500: JOGOU_STEPS,
  // Completionist extra tiers
  completionist_50: shieldStarsGlyph(1), completionist_100: shieldStarsGlyph(2), completionist_200: shieldStarsGlyph(3),
  // Wishlist tiers
  quero_50: heartQueueGlyph(false), quero_100: heartQueueGlyph(true),
  // Rating-based
  primeira_nota: NOTE_PRIMEIRA, nota_maxima: NOTE_MAXIMA, nota_minima: NOTE_MINIMA,
  critico_master: CRITICO_MASTER, critico_supremo: CRITICO_SUPREMO,
  // Genres
  genero_acao: GENRE_GLYPHS.acao, genero_aventura: GENRE_GLYPHS.aventura, genero_rpg: GENRE_GLYPHS.rpg,
  genero_jrpg: GENRE_GLYPHS.jrpg, genero_fps: GENRE_GLYPHS.fps, genero_plataforma: GENRE_GLYPHS.plataforma,
  genero_estrategia: GENRE_GLYPHS.estrategia, genero_puzzle: GENRE_GLYPHS.puzzle, genero_terror: GENRE_GLYPHS.terror,
  genero_corrida: GENRE_GLYPHS.corrida, genero_luta: GENRE_GLYPHS.luta, genero_esportes: GENRE_GLYPHS.esportes,
  genero_simulacao: GENRE_GLYPHS.simulacao, genero_tiro: GENRE_GLYPHS.tiro, genero_sandbox: GENRE_GLYPHS.sandbox,
  genero_acao_gold: GENRE_GLYPHS.acao, genero_aventura_gold: GENRE_GLYPHS.aventura, genero_rpg_gold: GENRE_GLYPHS.rpg,
  genero_estrategia_gold: GENRE_GLYPHS.estrategia, genero_puzzle_gold: GENRE_GLYPHS.puzzle,
  genero_corrida_gold: GENRE_GLYPHS.corrida, genero_esportes_gold: GENRE_GLYPHS.esportes,
  // Consoles (disc: xbox360/ps2/ps3/wii, cartridge: snes/gba, card: nsw)
  console_xbox360_5: discGlyph(false), console_xbox360_15: discGlyph(true),
  console_ps2_5: discGlyph(false), console_ps2_15: discGlyph(true),
  console_ps3_5: discGlyph(false), console_ps3_15: discGlyph(true),
  console_wii_5: discGlyph(false), console_wii_15: discGlyph(true),
  console_snes_5: cartridgeGlyph(false), console_snes_15: cartridgeGlyph(true),
  console_gba_5: cartridgeGlyph(false), console_gba_15: cartridgeGlyph(true),
  console_nsw_5: cardGlyph(false), console_nsw_15: cardGlyph(true),
  // Console breadth (reuses maratonista's own metaphor — same finish-line idea, different bar)
  maratonista_5: GLYPHS.maratonista, explorador_total: GLYPHS.maratonista_plus,
  // Era-based
  retro_gamer: crtGlyph, classic_curator: crtGlyph, gamer_moderno: chipGlyph, atraves_do_tempo: hourglassGlyph,
  // Score-based
  jogo_aclamado: laurelTrophyGlyph(1), critico_de_elite: laurelTrophyGlyph(2), sobrevivente: survivorGlyph,
  // Multiplayer
  socializador_local: controllersGlyph(false), socializador_online: controllersGlyph(true),
  // Time-based
  notivago: moonGlyph, fim_de_semana_gamer: calendarGlyph(true), produtivo: calendarGlyph(false),
  // Comments
  primeiro_comentario: speechBubble(1), comentarista_pro: speechBubble(3), comentarista_lendario: speechBubble(4),
  // Reactions given/received
  primeira_reacao: reactionHand(false), reage_tudo: reactionHand(true),
  querido_pela_galera: GLYPHS.popular, post_viral: GLYPHS.popular,
  // Feed posts
  cronista: quillScroll(false), historiador: quillScroll(true),
  // Duels
  primeiro_duelo: crossedSwords(false), duelista: crossedSwords(false), duelista_supremo: crossedSwords(true),
  // Polls
  primeira_enquete: ballotBox(0), enquete_popular: ballotBox(1), votante: ballotBox(2), votante_assiduo: ballotBox(3),
  // Profile
  rosto_na_galera: portraitFrame, nome_de_guerra: nameBanner,
  // Top 10
  top10_completo: GLYPHS.curador,
  // Meta-achievements
  cacador_de_emblemas: stackedMedals(1), colecionador_de_emblemas: stackedMedals(2), platina_das_platinas: stackedMedals(3),
  // Combo achievements
  jogo_e_avalia: NOTE_MAXIMA, all_rounder: diceHex,
  // Platina internacional/universal
  platina_internacional: globeTrophy(false), platina_universal: globeTrophy(true),
  // Extra milestones
  ano_de_ouro: calendarGlyph(false), decada_favorita: calendarGlyph(false),
  platina_em_dobro: dualTrophy, maratona_anual: calendarGlyph(false),
})

export default function AchievementIcon({ id, tier = 'bronze', className = 'w-8 h-8' }) {
  const make = GLYPHS[id]
  if (!make) return null
  const ring = TIER_RING[tier]
  const bg = TIER_BG[tier]
  return (
    <svg viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="15" fill={bg} stroke={ring} strokeWidth="2.2" />
      {make(bg)}
    </svg>
  )
}
