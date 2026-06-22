import { useState } from 'react'
import { getConsole } from '../../consoles/registry'
import { coverSrc, dlLink, typeBadge, accentRgba, accentLight, metacriticCls } from '../../consoles/dl'
import { setFlag } from '../../lib/db'
import { checkAndUnlockAchievements, SHAREABLE } from '../../lib/social'
import { useAuth } from '../../contexts/AuthContext'
import { useLibraryAddBatch } from '../../contexts/LibraryAddBatchContext'

// 'joguei' uses the console's accent color (set via inline style) instead of a fixed class.
const STATUS_PILLS = [
  { key: 'joguei',       label: 'Joguei', active: 'text-white',                 inactive: 'bg-black/50 text-gray-300 hover:bg-white/20' },
  { key: 'zerado',       label: 'Zerado', active: 'bg-blue-600 text-white',     inactive: 'bg-black/50 text-gray-300 hover:bg-white/20' },
  { key: 'cem_porcento', label: '100%',   active: 'bg-yellow-500 text-black',   inactive: 'bg-black/50 text-gray-300 hover:bg-white/20' },
  { key: 'quero',        label: 'Quero',  active: 'bg-purple-600 text-white',   inactive: 'bg-black/50 text-gray-300 hover:bg-white/20' },
]

export default function GameCard({ game, status = {}, onStatusChange, onClick, gridMode = false, consoleId = 'xbox360' }) {
  const console_ = getConsole(consoleId)
  const { user }  = useAuth()
  const { addToBatch } = useLibraryAddBatch()
  const [hovered, setHovered] = useState(false)
  const [saving,  setSaving]  = useState(null)

  const cover    = coverSrc(game, console_)
  const dl       = dlLink(game.dl, console_.partIds)
  const [typeLabel, typeCls] = typeBadge(console_, game.type)

  const PROGRESS = ['quero', 'joguei', 'zerado', 'cem_porcento']

  // SNES box art is landscape (front+spine scan), unlike the portrait case art used by
  // the other consoles (NSW included, since its GameTDB box art is portrait) — widen the
  // card so more of the actual image shows instead of cropping it into a portrait slot.
  const isSnes = consoleId === 'snes'
  const isNsw  = consoleId === 'nsw'
  const cardWidthCls   = isSnes ? 'w-[190px]' : 'w-[130px]'
  const coverSizeCls   = isSnes ? 'w-[190px] h-[140px]' : 'w-[130px] h-[190px]'
  const coverAspectCls = isSnes ? 'aspect-[4/3]' : 'aspect-[2/3]'

  async function handlePill(e, key) {
    e.stopPropagation()
    if (!user) return
    const next = !status[key]
    setSaving(key)
    try {
      // Joguei / Zerado / 100% are mutually exclusive
      if (next && PROGRESS.includes(key)) {
        for (const k of PROGRESS) {
          if (k !== key && status[k]) {
            await setFlag(consoleId, game.id, k, false)
            onStatusChange?.(game.id, k, false)
          }
        }
      }
      await setFlag(consoleId, game.id, key, next)
      onStatusChange?.(game.id, key, next)
      checkAndUnlockAchievements(user.id).catch(() => {})

      if (next && SHAREABLE.includes(key)) {
        addToBatch(consoleId, game.id, key, status.rating ?? null)
      }
    } finally {
      setSaving(null)
    }
  }

  return (
    <div
      className={`cursor-pointer rounded-lg bg-[#1a1a1a] border-l-2 overflow-hidden
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,.55)]
        ${gridMode ? '' : `flex-shrink-0 ${cardWidthCls}`}`}
      style={{ borderLeftColor: console_.accentColor }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(game)}
    >
      {/* Cover image area */}
      <div className={`relative bg-[#222] overflow-hidden flex items-center justify-center
        ${gridMode ? `w-full ${coverAspectCls}` : coverSizeCls}`}
      >
        {/* Fallback text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-1.5 text-center z-0">
          <span className="text-[10px] text-gray-600 leading-tight">{game.title}</span>
          <span className="text-[9px] text-gray-700 mt-0.5">{game.year}</span>
        </div>

        {/* Cover */}
        {cover && (
          <img
            src={cover}
            alt={game.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover z-10"
            style={{ objectPosition: isSnes ? 'left center' : isNsw ? 'center center' : 'right center' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}

        {/* Status badges — top left */}
        <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-20">
          {status.joguei       && <Dot style={{ background: console_.accentColor }} char="✓" />}
          {status.zerado       && <Dot color="bg-blue-700"   char="▶" />}
          {status.cem_porcento && <Dot color="bg-yellow-500" char="★" />}
          {status.quero        && <Dot color="bg-purple-700" char="♡" />}
        </div>

        {/* DL button — top right */}
        {dl && (
          <a
            href={dl}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className={`absolute top-1 right-1 z-20 rounded-full bg-[#e65100] flex items-center justify-center shadow
              ${gridMode ? 'w-[18px] h-[18px]' : 'w-[26px] h-[26px]'}`}
          >
            <DlIcon size={gridMode ? 9 : 13} />
          </a>
        )}

        {/* Hover overlay — pill buttons (click outside the pills bubbles up and opens the modal) */}
        {hovered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2 z-30">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(circle at center, ${accentRgba(console_, 0.92, 0.18)} 0%, ${accentRgba(console_, 0.55, 0.18)} 55%, ${accentRgba(console_, 0, 0.18)} 85%)` }}
            />
            {STATUS_PILLS.map(p => (
              <button
                key={p.key}
                onClick={e => handlePill(e, p.key)}
                disabled={!user || saving === p.key}
                style={p.key === 'joguei' && status.joguei ? { background: console_.accentColor } : undefined}
                className={`relative w-full rounded text-[10px] font-black py-0.5 transition-all
                  ${status[p.key] ? p.active : p.inactive}
                  ${(!user || saving === p.key) ? 'opacity-50' : ''}`}
              >
                {saving === p.key ? '···' : p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info below cover */}
      <div className={`${gridMode ? 'p-1.5' : 'px-2 pt-1.5 pb-2'}`}>
        <p className={`font-bold leading-snug overflow-hidden mb-1
          ${gridMode
            ? 'text-[10px] line-clamp-2 min-h-[24px]'
            : 'text-[13px] line-clamp-2 min-h-[32px]'}`}
        >
          {game.title}
        </p>

        <div className="flex items-center gap-1">
          <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded ${typeCls}`}>{typeLabel}</span>
          <span className={`${gridMode ? 'text-[9px]' : 'text-[11px]'} text-gray-500`}>{game.year || '?'}</span>
          {game.score != null && (
            <span className={`ml-auto text-[9px] font-bold px-1 py-0.5 rounded ${metacriticCls(game.score)}`}>{game.score}</span>
          )}
        </div>

        {!gridMode && (
          <div className="flex items-center gap-1.5 mt-1 min-h-[14px]">
            {game.dl && (
              <span className="text-[#e65100]"><DlIcon size={11} /></span>
            )}
            {game.localMP && (
              <span className="flex items-center gap-0.5 text-[9px] text-gray-500 font-bold">
                <UsersIcon size={11} />
                <span className="text-[9px]">{game.players || ''}</span>
              </span>
            )}
            {game.online && (
              <span style={{ color: accentLight(console_) }}><GlobeIcon size={11} /></span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Dot({ color, style, char }) {
  return (
    <div className={`w-[22px] h-[22px] rounded-full ${color || ''} flex items-center justify-center shadow-md`} style={style}>
      <span className="text-[10px] font-black text-white">{char}</span>
    </div>
  )
}

function DlIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

function UsersIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function GlobeIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}
