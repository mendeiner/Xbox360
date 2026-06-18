import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { XBOX360_GAMES } from '../data/xbox360/games'
import { getMyStatuses, setFlag as dbSetFlag } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'
import GameCard   from '../components/xbox360/GameCard'
import GameModal  from '../components/xbox360/GameModal'
import FilterChip from '../components/xbox360/FilterChip'
import Nav from '../components/Nav'

// All unique genres from the game data
const ALL_GENRES = [...new Set(XBOX360_GAMES.flatMap(g => g.genre || []))].sort()

const TYPE_FILTERS = [
  { id: 'retail', label: 'Retail' },
  { id: 'arcade', label: 'XBLA'   },
  { id: 'kinect', label: 'Kinect' },
  { id: 'indie',  label: 'Indie'  },
]
const STATUS_FILTERS = [
  { id: 'joguei',       label: 'Joguei'   },
  { id: 'zerado',       label: 'Zerado'   },
  { id: 'cem_porcento', label: '100%'     },
  { id: 'quero',        label: 'Quero'    },
  { id: 'nao_joguei',  label: 'Não joguei' },
]
const SPECIAL_FILTERS = [
  { id: 'dl',      label: 'Download' },
  { id: 'localMP', label: 'Co-op'    },
  { id: 'online',  label: 'Online'   },
]

function matchesFilter(game, active, statuses) {
  for (const f of active) {
    // Status filters
    if (f === 'joguei'       && !statuses[game.id]?.joguei)       return false
    if (f === 'zerado'       && !statuses[game.id]?.zerado)       return false
    if (f === 'cem_porcento' && !statuses[game.id]?.cem_porcento) return false
    if (f === 'quero'        && !statuses[game.id]?.quero)        return false
    if (f === 'nao_joguei') {
      const s = statuses[game.id]
      if (s?.joguei || s?.zerado || s?.cem_porcento)              return false
    }
    // Type filters
    if (['retail','arcade','kinect','indie'].includes(f) && game.type !== f) return false
    // Special
    if (f === 'dl'      && !game.dl)                     return false
    if (f === 'localMP' && !game.localMP)                return false
    if (f === 'online'  && !game.online)                 return false
    // Genre
    if (ALL_GENRES.includes(f) && !(game.genre || []).includes(f)) return false
  }
  return true
}

// Group games into rows by genre (Netflix-style)
function buildRows(games) {
  const genreMap = new Map()
  for (const g of games) {
    for (const genre of (g.genre?.length ? g.genre : ['Outros'])) {
      if (!genreMap.has(genre)) genreMap.set(genre, [])
      genreMap.get(genre).push(g)
    }
  }
  return [...genreMap.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([label, games]) => ({ label, games }))
}

export default function Xbox360() {
  const { user }  = useAuth()
  const [statuses, setStatuses]     = useState({})
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [activeFilters, setActive]  = useState(new Set())
  const [selectedGame, setSelected] = useState(null)
  const [showGenreMenu, setGenreMenu] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getMyStatuses('xbox360')
      .then(s => setStatuses(s))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const filteredGames = useMemo(() => {
    const q = search.toLowerCase()
    return XBOX360_GAMES.filter(g =>
      (!q || g.title.toLowerCase().includes(q)) &&
      matchesFilter(g, activeFilters, statuses)
    )
  }, [search, activeFilters, statuses])

  const rows = useMemo(() => buildRows(filteredGames), [filteredGames])

  const toggleFilter = id => {
    setActive(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleStatusChange = useCallback((gameId, key, value) => {
    setStatuses(prev => ({
      ...prev,
      [gameId]: { ...(prev[gameId] || {}), [key]: value }
    }))
  }, [])

  const isSearch = search.length > 0 || activeFilters.size > 0

  return (
    <div className="min-h-screen bg-surface-1">
      <Nav />

      {/* Header */}
      <div className="sticky top-[57px] z-40 bg-surface-1/95 backdrop-blur border-b border-surface-4 px-4 py-3 space-y-3">
        {/* Search + back */}
        <div className="flex items-center gap-3">
          <Link to="/home" className="text-gray-500 hover:text-white transition-colors text-lg leading-none">←</Link>
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar jogo..."
              className="w-full bg-surface-2 border border-surface-4 rounded-full px-4 py-2 text-sm font-medium outline-none focus:border-xbox transition-colors placeholder-gray-600"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">✕</button>
            )}
          </div>
          <div className="text-xs text-gray-600 font-medium whitespace-nowrap">
            {filteredGames.length.toLocaleString()} jogos
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {STATUS_FILTERS.map(f => (
            <FilterChip key={f.id} label={f.label} active={activeFilters.has(f.id)} onClick={() => toggleFilter(f.id)} />
          ))}
          <div className="w-px bg-surface-4 flex-shrink-0" />
          {TYPE_FILTERS.map(f => (
            <FilterChip key={f.id} label={f.label} active={activeFilters.has(f.id)} onClick={() => toggleFilter(f.id)} />
          ))}
          <div className="w-px bg-surface-4 flex-shrink-0" />
          {SPECIAL_FILTERS.map(f => (
            <FilterChip key={f.id} label={f.label} active={activeFilters.has(f.id)} onClick={() => toggleFilter(f.id)} />
          ))}
          <div className="w-px bg-surface-4 flex-shrink-0" />
          {/* Genre picker */}
          <div className="relative">
            <FilterChip label="Gênero ▾" active={showGenreMenu} onClick={() => setGenreMenu(v => !v)} />
            {showGenreMenu && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-surface-2 border border-surface-4 rounded-xl p-3 w-64 max-h-72 overflow-y-auto shadow-xl grid grid-cols-2 gap-1">
                {ALL_GENRES.map(g => (
                  <button key={g} onClick={() => { toggleFilter(g); setGenreMenu(false) }}
                    className={`text-left text-xs px-2 py-1.5 rounded-lg transition-colors font-medium
                      ${activeFilters.has(g) ? 'bg-xbox text-white' : 'text-gray-400 hover:text-white hover:bg-surface-3'}`}>
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="pb-20">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-xbox border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <p className="font-bold">Nenhum jogo encontrado</p>
            <button onClick={() => { setSearch(''); setActive(new Set()) }}
              className="mt-2 text-xs text-xbox hover:text-xbox-light">Limpar filtros</button>
          </div>
        ) : (
          <div className="space-y-8 pt-6">
            {rows.map(row => (
              <section key={row.label}>
                <div className="flex items-center gap-3 px-4 mb-3">
                  <h3 className="text-base font-black tracking-tight border-l-[3px] border-xbox pl-3">{row.label}</h3>
                  <span className="text-xs text-gray-600">{row.games.length}</span>
                </div>
                <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
                  {row.games.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      status={statuses[game.id] || {}}
                      onStatusChange={handleStatusChange}
                      onClick={setSelected}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {selectedGame && (
        <GameModal
          game={selectedGame}
          status={statuses[selectedGame.id] || {}}
          onStatusChange={handleStatusChange}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
