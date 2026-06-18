import { useState, useEffect } from 'react'
import { COVERS } from '../../data/xbox360/covers_map'
import { TRAILERS } from '../../data/xbox360/trailers_data'
import { DLC_DATA } from '../../data/xbox360/dlc_data'
import { setFlag, setRating } from '../../lib/db'
import { useAuth } from '../../contexts/AuthContext'

const PART_IDS = {
  pt1:'mx360gcxpt1-x360-ztm', pt2:'mx360gcpt2-x360-ztm', pt3:'mx360gcpt3-x360-ztm',
  pt4:'mx360gcpt4-x360-ztm', pt5:'mx360gcpt5-x360-ztm', pt6:'mx360gcpt6-x360-ztm',
  xbla:'XBOX_360_XBLA',
  god1:'XBOX_360_1', god2:'XBOX_360_2', god3:'XBOX_360_3',
  god4:'XBOX_360_4', god5:'XBOX_360_5', god6:'XBOX_360_6',
}
const PART_NAMES = {
  pt1:'Part 1', pt2:'Part 2', pt3:'Part 3', pt4:'Part 4', pt5:'Part 5', pt6:'Part 6',
  xbla:'XBLA', god1:'GOD 1', god2:'GOD 2', god3:'GOD 3', god4:'GOD 4', god5:'GOD 5', god6:'GOD 6',
}

const STATUS_PILLS = [
  { key: 'joguei',       label: 'Joguei',  activeClass: 'bg-xbox text-white',        inactiveClass: 'text-gray-400' },
  { key: 'zerado',       label: 'Zerado',  activeClass: 'bg-blue-600 text-white',    inactiveClass: 'text-gray-400' },
  { key: 'cem_porcento', label: '100%',    activeClass: 'bg-yellow-500 text-black',  inactiveClass: 'text-gray-400' },
  { key: 'quero',        label: 'Quero',   activeClass: 'bg-purple-600 text-white',  inactiveClass: 'text-gray-400' },
]

export default function GameModal({ game, status = {}, onStatusChange, onClose }) {
  const { user } = useAuth()
  const [localStatus, setLocalStatus] = useState(status)
  const [rating, setRatingState]      = useState(status.rating ?? 0)
  const [saving, setSaving]           = useState(null)
  const [showTrailer, setShowTrailer] = useState(false)

  useEffect(() => { setLocalStatus(status); setRatingState(status.rating ?? 0) }, [status])

  // Close on Escape
  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const titleId   = COVERS[game.id]
  const coverSrc  = titleId ? `/covers/xbox360/${titleId}.png` : null
  const trailerId = TRAILERS[String(game.id)]
  const dlcList   = DLC_DATA[game.id] || []

  async function handlePill(key) {
    if (!user) return
    const newVal = !localStatus[key]
    setSaving(key)
    const updated = { ...localStatus, [key]: newVal }
    setLocalStatus(updated)
    try {
      await setFlag('xbox360', game.id, key, newVal)
      onStatusChange?.(game.id, key, newVal)
    } catch {
      setLocalStatus(localStatus)
    } finally {
      setSaving(null)
    }
  }

  async function handleRating(val) {
    if (!user) return
    setRatingState(val)
    await setRating('xbox360', game.id, val)
    onStatusChange?.(game.id, 'rating', val)
  }

  function buildDlEntries(dl) {
    if (!dl) return []
    if (dl.discs) return dl.discs.map((d, i) => ({ part: d.part, file: d.file, disc: i + 1 }))
    if (dl.files) return dl.files.map((f, i) => ({ part: dl.part, file: f, disc: i + 1 }))
    return [{ part: dl.part, file: dl.file, disc: 0 }]
  }

  const dlEntries = buildDlEntries(game.dl)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[560px] max-h-[90vh] bg-surface-2 rounded-t-2xl sm:rounded-2xl border border-surface-4 overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex gap-4 p-5 border-b border-surface-4">
          {/* Cover */}
          <div className="flex-shrink-0 w-[72px] h-[104px] rounded-lg bg-surface-3 overflow-hidden relative">
            {coverSrc && (
              <img src={coverSrc} alt={game.title} className="absolute right-0 top-0 h-full w-auto"
                onError={e => { e.target.style.display = 'none' }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-black text-lg leading-tight">{game.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">{game.year || '?'}</span>
              <TypeBadge type={game.type} />
              {game.localMP && (
                <span className="text-xs bg-surface-3 border border-surface-4 px-2 py-0.5 rounded-full text-gray-400">
                  {game.players || '?'}P Local
                </span>
              )}
              {game.online && (
                <span className="text-xs bg-surface-3 border border-surface-4 px-2 py-0.5 rounded-full text-gray-400">Online</span>
              )}
            </div>
            {game.genre?.length > 0 && (
              <p className="text-xs text-gray-500 mt-1.5">{game.genre.join(' · ')}</p>
            )}
          </div>

          <button onClick={onClose} className="flex-shrink-0 text-gray-500 hover:text-white text-xl leading-none self-start">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status pills */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Status</p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_PILLS.map(p => (
                <button
                  key={p.key}
                  onClick={() => handlePill(p.key)}
                  disabled={!user || saving === p.key}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all
                    ${localStatus[p.key]
                      ? `${p.activeClass} border-transparent`
                      : 'border-surface-4 bg-surface-3 text-gray-400 hover:border-gray-500'
                    }
                    ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {saving === p.key ? '...' : p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Nota {rating > 0 ? `— ${StarDisplay(rating)}` : ''}
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0} max={10} step={1}
                value={rating * 2}
                disabled={!user}
                onChange={e => handleRating(Number(e.target.value) / 2)}
                className="flex-1 accent-xbox disabled:opacity-40"
              />
              <span className="text-sm font-black text-xbox w-8 text-right">
                {rating > 0 ? rating.toFixed(1) : '—'}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-600 mt-0.5 px-0.5">
              <span>0.5</span><span>5.0</span>
            </div>
          </div>

          {/* Trailer */}
          {trailerId && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Trailer</p>
              {showTrailer ? (
                <div className="aspect-video rounded-xl overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`}
                    allow="autoplay; encrypted-media"
                    className="w-full h-full"
                    title="trailer"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="w-full aspect-video rounded-xl bg-surface-3 border border-surface-4 hover:border-xbox/50 transition-colors flex items-center justify-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-xbox/20 group-hover:bg-xbox/40 flex items-center justify-center transition-colors">
                    <span className="text-2xl">▶</span>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Download */}
          {game.dl && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Download</p>
              <div className="space-y-2">
                {dlEntries.map((entry, i) => {
                  const partId   = PART_IDS[entry.part] || entry.part
                  const partName = PART_NAMES[entry.part] || entry.part
                  const fileUrl  = `https://archive.org/download/${partId}/${encodeURIComponent(entry.file)}`
                  const pageUrl  = `https://archive.org/details/${partId}`
                  return (
                    <div key={i} className="bg-surface-3 rounded-xl p-3 border border-surface-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black bg-orange-600/20 text-orange-400 border border-orange-600/30 px-2 py-0.5 rounded-full">
                          {partName}{entry.disc > 0 ? ` · Disco ${entry.disc}` : ''}
                        </span>
                        <span className="text-[10px] text-gray-500 truncate">{entry.file}</span>
                      </div>
                      <div className="flex gap-2">
                        <a href={fileUrl} target="_blank" rel="noreferrer"
                          className="flex-1 text-center text-xs font-bold bg-xbox hover:bg-xbox-light text-white py-2 rounded-lg transition-colors">
                          Baixar
                        </a>
                        <a href={pageUrl} target="_blank" rel="noreferrer"
                          className="flex-1 text-center text-xs font-bold bg-surface-4 hover:bg-gray-600 text-gray-300 py-2 rounded-lg transition-colors">
                          Archive.org
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* DLC */}
          {dlcList.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">DLC</p>
              <div className="space-y-1">
                {dlcList.map((dlc, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-surface-4 last:border-0">
                    <span className="text-gray-300 text-xs">{dlc.title}</span>
                    {dlc.dl && <span className="text-[10px] text-orange-400 font-bold">DL</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StarDisplay(rating) {
  const full  = Math.floor(rating)
  const half  = rating % 1 >= 0.5
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0))
}

function TypeBadge({ type }) {
  const map = { retail: ['Retail', 'text-green-400 bg-green-400/10 border-green-400/20'],
                arcade: ['XBLA',   'text-blue-400 bg-blue-400/10 border-blue-400/20'],
                kinect: ['Kinect', 'text-pink-400 bg-pink-400/10 border-pink-400/20'],
                indie:  ['Indie',  'text-gray-400 bg-gray-400/10 border-gray-400/20'] }
  const [label, cls] = map[type] || ['?', 'text-gray-400']
  return <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
}
