import { useState } from 'react'
import { COVERS } from '../../data/xbox360/covers_map'
import { setFlag } from '../../lib/db'
import { useAuth } from '../../contexts/AuthContext'

const STATUS_PILLS = [
  { key: 'joguei',       label: 'Joguei',  color: 'bg-xbox hover:bg-xbox-light',         active: 'ring-xbox'    },
  { key: 'zerado',       label: 'Zerado',  color: 'bg-blue-600 hover:bg-blue-500',        active: 'ring-blue-500' },
  { key: 'cem_porcento', label: '100%',    color: 'bg-yellow-500 hover:bg-yellow-400',    active: 'ring-yellow-400' },
  { key: 'quero',        label: 'Quero',   color: 'bg-purple-600 hover:bg-purple-500',    active: 'ring-purple-500' },
]

export default function GameCard({ game, status = {}, onStatusChange, onClick }) {
  const { user } = useAuth()
  const [hovered, setHovered] = useState(false)
  const [saving, setSaving]   = useState(null)

  const titleId = COVERS[game.id]
  const coverSrc = titleId ? `/covers/xbox360/${titleId}.png` : null

  async function handlePill(e, key) {
    e.stopPropagation()
    if (!user) return
    const newVal = !status[key]
    setSaving(key)
    try {
      await setFlag('xbox360', game.id, key, newVal)
      onStatusChange?.(game.id, key, newVal)
    } finally {
      setSaving(null)
    }
  }

  const activeBadges = STATUS_PILLS.filter(p => status[p.key])
  const hasDl = !!game.dl

  return (
    <div
      className="relative flex-shrink-0 w-[88px] cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(game)}
    >
      {/* Cover */}
      <div className="relative w-[88px] h-[128px] rounded-lg bg-surface-3 overflow-hidden border-2 border-transparent group-hover:border-xbox/60 transition-all">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={game.title}
            loading="lazy"
            className="absolute right-0 top-0 h-full w-auto"
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center">
            <span className="text-[9px] text-gray-500 leading-tight">{game.title}</span>
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-1 left-1 flex flex-col gap-0.5">
          {status.joguei       && <Badge color="bg-xbox"        label="J" />}
          {status.zerado       && <Badge color="bg-blue-600"    label="Z" />}
          {status.cem_porcento && <Badge color="bg-yellow-500"  label="★" />}
          {status.quero        && <Badge color="bg-purple-600"  label="♡" />}
        </div>

        {/* DL badge */}
        {hasDl && (
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-sm bg-orange-600/90 flex items-center justify-center">
            <span className="text-[7px] font-black text-white">DL</span>
          </div>
        )}

        {/* Pill buttons on hover (logged in only) */}
        {user && hovered && (
          <div
            className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 px-1"
            onClick={e => e.stopPropagation()}
          >
            {STATUS_PILLS.map(p => (
              <button
                key={p.key}
                onClick={e => handlePill(e, p.key)}
                disabled={saving === p.key}
                className={`w-full py-0.5 rounded text-[9px] font-black transition-all
                  ${status[p.key] ? `${p.color} text-white ring-1` : 'bg-black/60 text-gray-300 hover:bg-white/20'}
                  ${saving === p.key ? 'opacity-50' : ''}
                `}
              >
                {saving === p.key ? '...' : p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Title */}
      <p className="mt-1 text-[10px] text-gray-400 text-center leading-tight truncate w-full px-0.5">
        {game.title}
      </p>
    </div>
  )
}

function Badge({ color, label }) {
  return (
    <div className={`w-3.5 h-3.5 rounded-sm ${color} flex items-center justify-center`}>
      <span className="text-[7px] font-black text-white">{label}</span>
    </div>
  )
}
