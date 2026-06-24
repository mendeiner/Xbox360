// Franchise-flavored pixel HUD — the replacement vocabulary for round 1's abstract scenery
// (skylines, podiums, generic silhouettes), which read as meaningless because they said nothing
// about *games*. Every shape here is a recognizable game-item silhouette (heart container,
// coin, ring, mushroom, star, D-pad, arcade button, boss health bar, combo meter, medal,
// platinum trophy) so a slide's claim is dressed in the language of the thing it's about, never
// an arbitrary shape. Single-color SVG (`currentColor`), same 32x32 convention as
// AchievementIcon.jsx, recolored per slide accent via the `color` prop.

export function HeartIcon({ color = 'currentColor', className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} style={{ color }} fill="currentColor">
      <path d="M16 27 6 18.5C2.5 15.3 3 9.5 7.5 7.8 10.5 6.7 13.8 7.8 16 11c2.2-3.2 5.5-4.3 8.5-3.2C29 9.5 29.5 15.3 26 18.5Z" />
    </svg>
  )
}

export function CoinIcon({ color = 'currentColor', className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} style={{ color }} fill="none" stroke="currentColor">
      <circle cx="16" cy="16" r="11" strokeWidth="3" fill="currentColor" fillOpacity="0.15" />
      <rect x="14" y="7" width="4" height="18" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function RingIcon({ color = 'currentColor', className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} style={{ color }} fill="none" stroke="currentColor" strokeWidth="5">
      <circle cx="16" cy="16" r="10" />
    </svg>
  )
}

export function MushroomIcon({ color = 'currentColor', className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} style={{ color }} fill="currentColor">
      <path d="M16 6C9 6 5 11 5 16h22c0-5-4-10-11-10Z" />
      <rect x="11" y="16" width="10" height="9" rx="2" fill="currentColor" opacity="0.55" />
      <circle cx="11" cy="11" r="1.8" fill="#04130a" />
      <circle cx="20" cy="9.5" r="1.6" fill="#04130a" />
      <circle cx="16" cy="14" r="1.5" fill="#04130a" />
    </svg>
  )
}

export function StarIcon({ color = 'currentColor', className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} style={{ color }} fill="currentColor">
      <polygon points="16,3 19.5,12 28,13 21,19 23,28 16,23 9,28 11,19 4,13 12.5,12" />
    </svg>
  )
}

export function DPadIcon({ color = 'currentColor', className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} style={{ color }} fill="currentColor">
      <path d="M12 4h8v8h8v8h-8v8h-8v-8H4v-8h8Z" />
      <rect x="14" y="6" width="4" height="20" fill="#04130a" opacity="0.35" />
      <rect x="6" y="14" width="20" height="4" fill="#04130a" opacity="0.35" />
    </svg>
  )
}

// Round arcade button with a letter — built from divs/text rather than SVG so the pixel font
// renders the letter crisply at small sizes.
export function ButtonIcon({ letter = 'A', color = 'currentColor', className = 'w-7 h-7' }) {
  return (
    <span
      className={`${className} rounded-full flex items-center justify-center recap-pixel text-[10px] shrink-0`}
      style={{ color: '#04130a', backgroundColor: color, border: '2px solid currentColor' }}
    >
      {letter}
    </span>
  )
}

export function JoystickIcon({ color = 'currentColor', className = 'w-6 h-8' }) {
  return (
    <svg viewBox="0 0 32 40" className={className} style={{ color }} fill="currentColor">
      <path d="M6 30h20l-2 6H8Z" opacity="0.6" />
      <rect x="14" y="10" width="4" height="20" />
      <circle cx="16" cy="8" r="7" />
    </svg>
  )
}

// 1-up mushroom-star hybrid badge — pairs the icon with literal "1UP" pixel text, the way the
// trope always reads in-game.
export function OneUpBadge({ color = 'currentColor', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} style={{ color }}>
      <StarIcon color={color} className="w-4 h-4" />
      <span className="recap-pixel text-[10px]">1UP</span>
    </span>
  )
}

// Medal ribbon — 1st/2nd/3rd place, reused by the Top 5 ranked list for the top 3 rows.
export function MedalIcon({ place = 1, color = 'currentColor', className = 'w-7 h-9' }) {
  return (
    <svg viewBox="0 0 32 40" className={className} style={{ color }}>
      <path d="M10 14 4 32l8-3 4 6 6-21Z" fill="currentColor" opacity="0.45" />
      <path d="M22 14 28 32l-8-3-4 6-6-21Z" fill="currentColor" opacity="0.45" />
      <circle cx="16" cy="14" r="11" fill="currentColor" />
      <circle cx="16" cy="14" r="8" fill="none" stroke="#04130a" strokeWidth="1.4" opacity="0.4" />
      <text x="16" y="19" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#04130a">{place}</text>
    </svg>
  )
}

// Trophy with a platinum tint — the "100% Club" payoff, distinct from AchievementIcon's bronze
// cup so the completionist slide reads as the rarer thing it is.
export function PlatinumTrophyIcon({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <path d="M9 6h14v2.4c0 5-2.8 8.2-7 8.2s-7-3.2-7-8.2Z" fill="#dfe7ee" />
      <path d="M9 7c-2.4 0-3.8 1.3-3.8 3.4 0 2.2 1.7 3.8 4 3.6" stroke="#aebccb" strokeWidth="1.6" fill="none" />
      <path d="M23 7c2.4 0 3.8 1.3 3.8 3.4 0 2.2-1.7 3.8-4 3.6" stroke="#aebccb" strokeWidth="1.6" fill="none" />
      <rect x="13.5" y="16.5" width="5" height="4" fill="#c7d2dc" />
      <rect x="10" y="20.8" width="12" height="2.6" rx="0.8" fill="#aebccb" />
    </svg>
  )
}

// Boss/HP bar — drains left→right by `pct` (100 = full health, 0 = defeated). Segmented like a
// classic boss bar, with a label slot for "BOSS"/the opponent's name/etc.
export function HealthBar({ pct = 100, color = '#ff3b3b', label, segments = 12, className = 'w-full' }) {
  const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * segments)
  return (
    <div className={className}>
      {label && <p className="recap-pixel text-[8px] tracking-widest opacity-70 mb-1">{label}</p>}
      <div className="flex gap-[2px] h-3 border-2 p-[2px]" style={{ borderColor: color }}>
        {Array.from({ length: segments }).map((_, i) => (
          <span key={i} className="flex-1" style={{ backgroundColor: i < filled ? color : 'transparent' }} />
        ))}
      </div>
    </div>
  )
}

// Combo meter — "xN COMBO" with a small flame/star kicker, the arcade shorthand for "stacking
// wins" (used by the metacritic/streak-flavored slides instead of a bare number).
export function ComboMeter({ value, color = 'currentColor', className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`} style={{ color }}>
      <StarIcon color={color} className="w-4 h-4" />
      <span className="recap-pixel text-lg recap-glow">x{value}</span>
      <span className="recap-pixel text-[8px] tracking-widest opacity-70">COMBO</span>
    </div>
  )
}

// Arcade text plate — "PRESS START" / "INSERT COIN" / "FIGHT" / "CLEARED" / "NEW RECORD" —
// bevelled pixel banner reused across slides instead of plain body text for these beats.
export function TextPlate({ children, color = 'currentColor', className = '' }) {
  return (
    <div
      className={`recap-pixel text-[11px] tracking-widest px-3 py-1.5 border-2 ${className}`}
      style={{ color, borderColor: color, backgroundColor: 'rgba(0,0,0,0.45)' }}
    >
      {children}
    </div>
  )
}

// Ammo/charge counter — a row of small bullet capsules, used for "shots fired" style tallies
// (achievements unlocked, consoles touched) where a flat number alone would float in space.
export function AmmoCounter({ count, max = 10, color = 'currentColor', className = '' }) {
  const shown = Math.min(count, max)
  const overflow = count - shown
  return (
    <div className={`flex items-center gap-1 ${className}`} style={{ color }}>
      {Array.from({ length: shown }).map((_, i) => (
        <span key={i} className="w-1.5 h-3 rounded-full" style={{ backgroundColor: color }} />
      ))}
      {overflow > 0 && <span className="recap-pixel text-[9px] ml-1 opacity-70">+{overflow}</span>}
    </div>
  )
}
