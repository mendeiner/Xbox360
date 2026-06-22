import { useState, useEffect, useRef, useCallback } from 'react'
import { getConsole } from '../../consoles/registry'
import { coverSrc, buildDlEntries, dlFileUrl, dlPageUrl, typeLabel, accentRgba, accentLight, metacriticCls } from '../../consoles/dl'
import { setFlag, setRating } from '../../lib/db'
import { checkAndUnlockAchievements, SHAREABLE } from '../../lib/social'
import { useAuth } from '../../contexts/AuthContext'
import { useLibraryAddBatch } from '../../contexts/LibraryAddBatchContext'

const YT_KEY = 'AIzaSyC0roJ2MgVzcd1PAnCDImt8BI9eruOdS-c'

// 'joguei' uses the console's accent color (set via inline style) instead of a fixed class.
const STATUS_PILLS = [
  { key:'joguei',       label:'Joguei', on:'text-white',                                  off:'border-[#2a2a2a] bg-[#1a1a1a] text-gray-400 hover:border-gray-500' },
  { key:'zerado',       label:'Zerado', on:'bg-blue-700   text-white border-blue-700',   off:'border-[#2a2a2a] bg-[#1a1a1a] text-gray-400 hover:border-gray-500' },
  { key:'cem_porcento', label:'100%',   on:'bg-yellow-500 text-black border-yellow-500', off:'border-[#2a2a2a] bg-[#1a1a1a] text-gray-400 hover:border-gray-500' },
  { key:'quero',        label:'Quero',  on:'bg-purple-700 text-white border-purple-700', off:'border-[#2a2a2a] bg-[#1a1a1a] text-gray-400 hover:border-gray-500' },
]

async function searchYouTube(title, suffix) {
  try {
    const q   = encodeURIComponent(`${title} ${suffix}`)
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&videoEmbeddable=true&maxResults=1&key=${YT_KEY}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (res.ok) {
      const data = await res.json()
      return data.items?.[0]?.id?.videoId || null
    }
  } catch { /* network / timeout */ }
  return null
}

// Trailer cache: pre-seeded from the console's TRAILERS data file + a per-console localStorage key.
function loadTrailerCache(console_) {
  return Object.assign(
    {},
    console_.trailers || {},
    JSON.parse(localStorage.getItem(console_.trailerCacheKey) || '{}')
  )
}

export default function GameModal({ game, status = {}, onStatusChange, onClose, onPrev, onNext, consoleId = 'xbox360' }) {
  const console_ = getConsole(consoleId)
  const { user } = useAuth()
  const { addToBatch } = useLibraryAddBatch()

  const [localStatus, setLocalStatus] = useState(status)
  const [rating,      setRatingState] = useState(status.rating ?? 0)
  const [saving,      setSaving]      = useState(null)

  const [trailerLoading, setTrailerLoading] = useState(false)
  const [trailerError,   setTrailerError]   = useState(false)
  const [videoId,        setVideoId]        = useState(null)

  const [dlcOpen, setDlcOpen] = useState(false)

  const trailerCache = useRef(loadTrailerCache(console_))
  const startY = useRef(0)

  // Reset all state when game changes, and load the trailer automatically
  useEffect(() => {
    setLocalStatus(status)
    setRatingState(status.rating ?? 0)
    setTrailerLoading(false)
    setTrailerError(false)
    setVideoId(null)
    setDlcOpen(false)

    const cached = trailerCache.current[game.id]
    if (cached) { setVideoId(cached); return }

    setTrailerLoading(true)
    searchYouTube(game.title, console_.trailerSearchSuffix).then(found => {
      setTrailerLoading(false)
      if (found) {
        trailerCache.current[game.id] = found
        localStorage.setItem(console_.trailerCacheKey, JSON.stringify(trailerCache.current))
        setVideoId(found)
      } else {
        setTrailerError(true)
      }
    })
  }, [game.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setLocalStatus(status) }, [status])

  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const cover     = coverSrc(game, console_)
  const dlcList   = console_.dlc[game.id] || []
  const dlEntries = buildDlEntries(game.dl)
  const firstPart = game.dl?.part || game.dl?.discs?.[0]?.part

  const PROGRESS = ['quero', 'joguei', 'zerado', 'cem_porcento']

  async function handlePill(key) {
    if (!user) return
    const next = !localStatus[key]
    const prev = localStatus

    // Joguei / Zerado / 100% are mutually exclusive
    let updated = { ...localStatus, [key]: next }
    if (next && PROGRESS.includes(key)) {
      for (const k of PROGRESS) {
        if (k !== key) updated[k] = false
      }
    }

    setSaving(key)
    setLocalStatus(updated)
    try {
      if (next && PROGRESS.includes(key)) {
        for (const k of PROGRESS) {
          if (k !== key && localStatus[k]) {
            await setFlag(consoleId, game.id, k, false)
            onStatusChange?.(game.id, k, false)
          }
        }
      }
      await setFlag(consoleId, game.id, key, next)
      onStatusChange?.(game.id, key, next)
      checkAndUnlockAchievements(user.id).catch(() => {})

      if (next && SHAREABLE.includes(key)) {
        addToBatch(consoleId, game.id, key, rating || null)
      }
    } catch {
      setLocalStatus(prev)
    } finally {
      setSaving(null)
    }
  }

  async function handleRating(val) {
    if (!user) return
    setRatingState(val)
    await setRating(consoleId, game.id, val)
    onStatusChange?.(game.id, 'rating', val)
    checkAndUnlockAchievements(user.id).catch(() => {})
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <NavArrow direction="left" onClick={onPrev} accentColor={console_.accentColor} />

      <div
        className="w-full sm:w-[620px] max-h-[90vh] bg-[#1a1a1a] overflow-y-auto
          rounded-t-[20px] sm:rounded-2xl
          border-t-[3px] sm:border-t-0 sm:border-l-[3px]
          sm:scale-100 transition-all"
        style={{ borderColor: console_.accentColor }}
        onClick={e => e.stopPropagation()}
        onTouchStart={e => { startY.current = e.touches[0].clientY }}
        onTouchEnd={e => { if (e.changedTouches[0].clientY - startY.current > 80) onClose() }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden w-10 h-1 bg-[#333] rounded-full mx-auto mt-4 mb-1" />

        {/* Header */}
        <div className="flex gap-4 px-5 pt-4 pb-4 sm:pt-7 sm:px-7">
          <div className="flex-shrink-0 w-[80px] h-[120px] sm:w-[120px] sm:h-[180px] rounded-lg sm:rounded-xl bg-[#222] overflow-hidden relative">
            {cover && (
              <img src={cover} alt={game.title}
                className="absolute inset-0 w-full h-full object-cover rounded-r-lg sm:rounded-r-xl"
                style={{ objectPosition: consoleId === 'snes' ? 'left center' : consoleId === 'nsw' ? 'center center' : 'right center' }}
                onError={e => { e.target.style.display = 'none' }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-[20px] sm:text-[24px] font-black leading-tight mb-1.5">{game.title}</h2>

            <div className="flex flex-wrap gap-1 mb-2">
              {(game.genre || []).map(g => (
                <span key={g} className="text-[11px] px-2 py-0.5 rounded-lg" style={{ background: accentRgba(console_, 0.15), color: accentLight(console_) }}>{g}</span>
              ))}
            </div>

            <p className="text-[13px] text-gray-500 mb-1.5">{game.year || '?'} · {typeLabel(console_, game.type)}</p>

            {(game.localMP || game.online) && (
              <div className="flex items-center gap-2 flex-wrap text-[12px] text-gray-500">
                {game.localMP && (
                  <span className="flex items-center gap-1">
                    <UsersIcon size={11} /> Local: até {game.players || '?'} jogador{(game.players||2) > 1 ? 'es':''}
                  </span>
                )}
                {game.localMP && game.online && <span className="opacity-40">·</span>}
                {game.online && (
                  <span className="flex items-center gap-1" style={{ color: accentLight(console_) }}>
                    <GlobeIcon size={11} /> Online Multiplayer
                  </span>
                )}
              </div>
            )}
          </div>

          <button onClick={onClose} className="flex-shrink-0 self-start text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="px-5 sm:px-7 pb-8 space-y-3">

          {/* Status pills + star rating, side by side */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6">
            <div>
              <SectionLabel>Status</SectionLabel>
              <div className="flex gap-2 flex-wrap mt-2">
                {STATUS_PILLS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => handlePill(p.key)}
                    disabled={!user || saving === p.key}
                    style={p.key === 'joguei' && localStatus.joguei ? { background: console_.accentColor, borderColor: console_.accentColor } : undefined}
                    className={`px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all
                      ${localStatus[p.key] ? p.on : p.off}
                      ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {saving === p.key ? '···' : p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:flex-shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-[.8px] text-gray-500 mb-2 flex items-center gap-2">
                <span>Nota {rating > 0 ? `— ${rating.toFixed(1)}` : ''}</span>
                {game.score != null && (
                  <span className={`text-[10px] font-bold normal-case tracking-normal px-1.5 py-0.5 rounded ${metacriticCls(game.score)}`}>
                    Metacritic {game.score}
                  </span>
                )}
              </p>
              <StarRating value={rating} onChange={handleRating} disabled={!user} />
            </div>
          </div>

          {/* Trailer — loads automatically when the modal opens */}
          <Section>
            <SectionLabel as="span">Trailer</SectionLabel>
            <div className="mt-2">
              {trailerLoading && (
                <p className="text-[12px] text-gray-500 text-center py-4">Buscando trailer...</p>
              )}
              {!trailerLoading && trailerError && (
                <div className="text-center py-3">
                  <p className="text-[12px] text-gray-600 mb-2">Trailer não encontrado.</p>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(game.title + ' ' + console_.trailerSearchSuffix)}`}
                    target="_blank" rel="noreferrer"
                    className="text-[13px] hover:opacity-80"
                    style={{ color: accentLight(console_) }}
                  >Buscar no YouTube →</a>
                </div>
              )}
              {!trailerLoading && videoId && (
                <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full border-0"
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    title="trailer"
                  />
                </div>
              )}
            </div>
          </Section>

          {/* DLC — collapsible, hidden if none */}
          {dlcList.length > 0 && (
            <Section>
              <button onClick={() => setDlcOpen(v => !v)} className="w-full flex items-center justify-between">
                <SectionLabel as="span">DLC</SectionLabel>
                <span className="text-[11px] font-semibold" style={{ color: accentLight(console_) }}>
                  {dlcOpen ? '▼ Fechar' : `▼ Ver DLCs (${dlcList.length})`}
                </span>
              </button>
              {dlcOpen && (
                <div className="mt-2">
                  {dlcList.map((dlc, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#1e1e1e] last:border-0">
                      <span className="text-[12px] font-semibold text-gray-300 flex-1 min-w-0 truncate">{dlc.title}</span>
                      {dlc.dl && <span className="text-[10px] font-bold text-[#e65100] ml-2 flex-shrink-0">DL</span>}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Download — bottom */}
          <Section>
            <SectionLabel>{console_.dlTypeLabel(firstPart)}</SectionLabel>
            {game.dl ? (
              <div className="space-y-2">
                {dlEntries.map((entry, i) => {
                  const pname   = console_.partNames[entry.part] || entry.part
                  const fileUrl = dlFileUrl(console_.partIds, entry.part, entry.file)
                  const pageUrl = dlPageUrl(console_.partIds, entry.part)
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-0.5 text-gray-400 flex-shrink-0">
                          {pname}{entry.disc > 0 ? ` · Disco ${entry.disc}` : ''}
                        </span>
                        <span className="text-[10px] text-gray-600 truncate">{entry.file}</span>
                      </div>
                      <div className="flex gap-2">
                        <a href={fileUrl} target="_blank" rel="noreferrer"
                          className="flex-1 text-center text-[12px] sm:text-[13px] font-bold bg-[#e65100] hover:opacity-90 text-white py-2.5 rounded-lg transition-opacity flex items-center justify-center gap-1.5">
                          <DlIcon size={13} /> Baixar
                        </a>
                        <a href={pageUrl} target="_blank" rel="noreferrer"
                          className="flex-1 text-center text-[12px] sm:text-[13px] font-bold bg-[#222] hover:bg-[#2a2a2a] text-gray-400 border border-[#2a2a2a] py-2.5 rounded-lg transition-colors">
                          Archive.org
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-[12px] text-gray-600 text-center py-1">Arquivo não mapeado</p>
            )}
          </Section>

          <div className="text-center pt-1">
            <button onClick={onClose} className="text-[13px] text-gray-500 px-6 py-2 hover:text-white transition-colors">
              Fechar
            </button>
          </div>
        </div>
      </div>

      <NavArrow direction="right" onClick={onNext} accentColor={console_.accentColor} />
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Section({ children }) {
  return <div className="bg-[#111] rounded-xl border border-[#1e1e1e] px-3 py-2.5">{children}</div>
}

function NavArrow({ direction, onClick, accentColor }) {
  if (!onClick) return <div className="hidden sm:block w-14 sm:w-16 flex-shrink-0" />
  const rgb = hexToRgbString(accentColor)
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      aria-label={direction === 'left' ? 'Jogo anterior' : 'Próximo jogo'}
      className="hidden sm:flex items-center justify-center flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 mx-2 sm:mx-5 rounded-full text-white/55 hover:text-white transition-all duration-200"
      style={{ background: `radial-gradient(circle at center, rgba(${rgb},0.4) 0%, rgba(${rgb},0.12) 55%, rgba(${rgb},0) 78%)` }}
    >
      <ChevronsIcon direction={direction} size={26} />
    </button>
  )
}

function hexToRgbString(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  return m ? `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}` : '255,255,255'
}

function ChevronsIcon({ direction, size }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: direction === 'left' ? 'rotate(180deg)' : undefined }}
    >
      <polyline points="7 5 13 12 7 19" />
      <polyline points="13 5 19 12 13 19" />
    </svg>
  )
}

function SectionLabel({ children, as: Tag = 'p' }) {
  return <Tag className="text-[11px] font-bold uppercase tracking-[.8px] text-gray-500 mb-0">{children}</Tag>
}

function StarShape({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l2.939 6.728 7.061.913-5.323 5.05 1.546 7.309L12 18.25l-6.223 3.75 1.546-7.309L2 9.641l7.061-.913L12 2z" />
    </svg>
  )
}

function StarRating({ value, onChange, disabled }) {
  const [hover, setHover] = useState(null)
  const display = hover ?? value

  const pick = useCallback((v) => {
    if (disabled) return
    // clicking the same value again clears the rating
    onChange(value === v ? 0 : v)
  }, [disabled, onChange, value])

  return (
    <div
      className={`flex gap-1 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map(i => {
        const full = display >= i
        const half = !full && display >= i - 0.5
        return (
          <div key={i} className="relative w-8 h-8 cursor-pointer select-none">
            {/* Empty star base */}
            <StarShape className="w-8 h-8 text-gray-700 absolute inset-0" />

            {/* Filled portion — full or left half */}
            {(full || half) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: full ? '100%' : '50%' }}
              >
                <StarShape className="w-8 h-8 text-yellow-400" />
              </div>
            )}

            {/* Left half zone → i - 0.5 */}
            <div
              className="absolute inset-y-0 left-0 w-1/2 z-10"
              onMouseEnter={() => setHover(i - 0.5)}
              onClick={() => pick(i - 0.5)}
            />
            {/* Right half zone → i */}
            <div
              className="absolute inset-y-0 right-0 w-1/2 z-10"
              onMouseEnter={() => setHover(i)}
              onClick={() => pick(i)}
            />
          </div>
        )
      })}
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
