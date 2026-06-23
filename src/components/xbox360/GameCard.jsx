import { useState, useEffect } from 'react'
import { getConsole } from '../../consoles/registry'
import { coverSrc, dlLink, typeBadge, accentRgba, accentLight, metacriticCls } from '../../consoles/dl'
import { setFlag } from '../../lib/db'
import { checkAndUnlockAchievements, SHAREABLE } from '../../lib/social'
import { useAuth } from '../../contexts/AuthContext'
import { useLibraryAddBatch } from '../../contexts/LibraryAddBatchContext'

// 'joguei' uses the console's accent color (set via inline style) instead of a fixed class.
const STATUS_PILLS = [
  { key: 'jogando',      label: 'Jogando', active: 'bg-teal-600 text-white',     inactive: 'bg-black/50 text-gray-300 hover:bg-white/20' },
  { key: 'joguei',       label: 'Joguei', active: 'text-white',                 inactive: 'bg-black/50 text-gray-300 hover:bg-white/20' },
  { key: 'zerado',       label: 'Zerado', active: 'bg-blue-600 text-white',     inactive: 'bg-black/50 text-gray-300 hover:bg-white/20' },
  { key: 'cem_porcento', label: '100%',   active: 'bg-yellow-500 text-black',   inactive: 'bg-black/50 text-gray-300 hover:bg-white/20' },
  { key: 'quero',        label: 'Quero',  active: 'bg-purple-600 text-white',   inactive: 'bg-black/50 text-gray-300 hover:bg-white/20' },
]

// Turning one of these on asks "when?" with a year picker instead of saving immediately.
const YEAR_KEYS = ['joguei', 'zerado', 'cem_porcento']
const YEAR_QUESTION = {
  joguei: 'Quando você jogou?',
  zerado: 'Quando você zerou?',
  cem_porcento: 'Quando completou 100%?',
}

export default function GameCard({ game, status = {}, onStatusChange, onClick, gridMode = false, consoleId = 'xbox360' }) {
  const console_ = getConsole(consoleId)
  const { user }  = useAuth()
  const { addToBatch } = useLibraryAddBatch()
  const [hovered, setHovered] = useState(false)
  const [saving,  setSaving]  = useState(null)
  const [pendingKey, setPendingKey] = useState(null)

  const cover    = coverSrc(game, console_)
  const dl       = dlLink(game.dl, console_.partIds)
  const [typeLabel, typeCls] = typeBadge(console_, game.type)

  const PROGRESS = ['quero', 'jogando', 'joguei', 'zerado', 'cem_porcento']

  // The year question is optional and never blocks the save — auto-dismiss it after 10s of no answer.
  useEffect(() => {
    if (!pendingKey) return
    const timer = setTimeout(() => setPendingKey(null), 10000)
    return () => clearTimeout(timer)
  }, [pendingKey])

  // Cover shape varies per console source (box/case art is portrait, cart label scans can be
  // landscape or square) -- driven by `coverAspect`/`coverAlign` on the console's registry
  // entry so a new console with an odd cover shape doesn't need a code change here, just a
  // registry field (see the doc comment on the `gba` entry in registry.js for the full list).
  const aspect = console_.coverAspect || 'portrait'
  const cardWidthCls   = aspect === 'landscape' ? 'w-[190px]' : aspect === 'square' ? 'w-[150px]' : 'w-[130px]'
  const coverSizeCls   = aspect === 'landscape' ? 'w-[190px] h-[140px]' : aspect === 'square' ? 'w-[150px] h-[150px]' : 'w-[130px] h-[190px]'
  const coverAspectCls = aspect === 'landscape' ? 'aspect-[4/3]' : aspect === 'square' ? 'aspect-square' : 'aspect-[2/3]'
  const coverFitCls    = aspect === 'portrait' ? 'object-cover' : 'object-contain'
  const coverAlign     = console_.coverAlign || (aspect === 'landscape' ? 'left center' : aspect === 'square' ? 'center center' : 'right center')

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
            if (YEAR_KEYS.includes(k)) {
              await setFlag(consoleId, game.id, `${k}_year`, null)
              onStatusChange?.(game.id, `${k}_year`, null)
            }
          }
        }
      }
      await setFlag(consoleId, game.id, key, next)
      onStatusChange?.(game.id, key, next)
      if (!next && YEAR_KEYS.includes(key)) {
        await setFlag(consoleId, game.id, `${key}_year`, null)
        onStatusChange?.(game.id, `${key}_year`, null)
      }
      checkAndUnlockAchievements(user.id).catch(() => {})

      if (next && SHAREABLE.includes(key)) {
        addToBatch(consoleId, game.id, key, status.rating ?? null)
      }

      // Status is already saved at this point — asking "when?" is just an optional follow-up.
      if (next && YEAR_KEYS.includes(key)) setPendingKey(key)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(null)
    }
  }

  async function confirmYear(e, key, year) {
    e.stopPropagation()
    const value = year === 'unknown' ? null : Number(year)
    setPendingKey(null)
    try {
      await setFlag(consoleId, game.id, `${key}_year`, value)
      onStatusChange?.(game.id, `${key}_year`, value)
    } catch (err) {
      console.error(err)
    }
  }

  function yearOptionsFor() {
    const from = game.year || 1990
    const years = []
    for (let y = new Date().getFullYear(); y >= from; y--) years.push(y)
    return years
  }

  return (
    <div
      className={`cursor-pointer rounded-lg bg-[#1a1a1a] border-l-2 overflow-hidden
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,.55)]
        ${gridMode ? '' : `flex-shrink-0 ${cardWidthCls}`}`}
      style={{ borderLeftColor: console_.accentColor }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPendingKey(null) }}
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
            className={`absolute inset-0 w-full h-full z-10 ${coverFitCls}`}
            style={{ objectPosition: coverAlign }}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}

        {/* Status badges — top left */}
        <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-20">
          {status.jogando      && <Dot color="bg-teal-700"   char="▷" />}
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

            {pendingKey ? (
              <div className="relative z-10 w-full flex flex-col items-center gap-1">
                <div className="w-full flex items-center justify-between">
                  <span className="text-[9px] font-bold text-white leading-tight pr-1">{YEAR_QUESTION[pendingKey]}</span>
                  <button
                    onClick={e => { e.stopPropagation(); setPendingKey(null) }}
                    className="shrink-0 w-4 h-4 rounded-full bg-black/50 text-gray-300 hover:bg-black/70 hover:text-white text-[10px] leading-none flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
                <div className="w-full max-h-[120px] overflow-y-auto rounded bg-black/60 backdrop-blur-sm border border-white/10 flex flex-col gap-[2px] p-1">
                  {yearOptionsFor().map(y => (
                    <button
                      key={y}
                      onClick={e => confirmYear(e, pendingKey, y)}
                      className="w-full rounded text-[10px] font-bold py-0.5 text-gray-100 hover:text-white transition-all"
                      style={{ background: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = accentRgba(console_, 0.45, 1) }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      {y}
                    </button>
                  ))}
                  <button
                    onClick={e => confirmYear(e, pendingKey, 'unknown')}
                    className="w-full rounded text-[9px] italic py-0.5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    Não lembro
                  </button>
                </div>
              </div>
            ) : (
              STATUS_PILLS.map(p => (
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
              ))
            )}
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
