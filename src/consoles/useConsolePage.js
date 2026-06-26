import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { getMyStatuses } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'
import { getConsole, ensureConsoleData, isConsoleDataLoaded } from './registry'

export function gameHas(console_, game, f, statuses) {
  if (f === 'joguei')       return !!statuses[game.id]?.joguei
  if (f === 'zerado')       return !!statuses[game.id]?.zerado
  if (f === 'cem_porcento') return !!statuses[game.id]?.cem_porcento
  if (f === 'quero')        return !!statuses[game.id]?.quero
  if (f === 'jogando')      return !!statuses[game.id]?.jogando
  if (f === 'dl')           return !!game.dl
  if (f === 'localMP')      return game.localMP === true
  if (f === 'online')       return game.online === true
  if (console_.types.includes(f)) return game.type === f
  return (game.genre || []).includes(f)
}

export function passes(console_, game, inc, exc, statuses) {
  for (const f of exc) if (gameHas(console_, game, f, statuses)) return false
  for (const f of inc) if (!gameHas(console_, game, f, statuses)) return false
  return true
}

// Click-and-drag horizontal scrolling for the row strips / collection strip.
// Suppresses the click event a drag would otherwise fire, so dragging never opens a card.
export function useDragScroll() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let down = false, startX = 0, scrollL = 0, dragged = false
    const onDown = e => {
      down = true; dragged = false; el.style.cursor = 'grabbing'
      startX = e.pageX - el.offsetLeft; scrollL = el.scrollLeft; e.preventDefault()
    }
    const onUp   = () => { down = false; el.style.cursor = '' }
    const onMove = e => {
      if (!down) return
      const dx = e.pageX - el.offsetLeft - startX
      if (Math.abs(dx) > 4) dragged = true
      el.scrollLeft = scrollL - dx
    }
    const onClick = e => { if (dragged) { e.stopPropagation(); dragged = false } }
    el.addEventListener('mousedown', onDown)
    el.addEventListener('mouseleave', onUp)
    el.addEventListener('mouseup', onUp)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('click', onClick, true)
    return () => {
      el.removeEventListener('mousedown', onDown)
      el.removeEventListener('mouseleave', onUp)
      el.removeEventListener('mouseup', onUp)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('click', onClick, true)
    }
  }, [])
  return ref
}

// Shared search/filter/sort/selection state for a console's catalog page.
// Each console's page component supplies its own ROWS/FEATURED curation and markup;
// this hook only owns what's identical across consoles (search, filters, stats, modal navigation).
export function useConsolePage(consoleId) {
  const console_ = getConsole(consoleId)
  const { user } = useAuth()

  const [statuses,    setStatuses]    = useState({})
  const [loading,     setLoading]     = useState(true)
  const [dataLoading, setDataLoading] = useState(!isConsoleDataLoaded(consoleId))
  const [search,      setSearch]      = useState('')
  const [inc,         setInc]         = useState(new Set())
  const [exc,         setExc]         = useState(new Set())
  const [selectedList,  setSelectedList]  = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    setDataLoading(true)
    ensureConsoleData(consoleId).finally(() => setDataLoading(false))
  }, [consoleId])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getMyStatuses(consoleId)
      .then(s => setStatuses(s))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, consoleId])

  const toggleInc = useCallback(id => {
    setInc(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    setExc(prev => { if (!prev.has(id)) return prev; const n = new Set(prev); n.delete(id); return n })
  }, [])

  const toggleExc = useCallback(id => {
    setExc(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    setInc(prev => { if (!prev.has(id)) return prev; const n = new Set(prev); n.delete(id); return n })
  }, [])

  const clearAll = useCallback(() => { setInc(new Set()); setExc(new Set()) }, [])

  const isGrid = search.length > 0 || inc.size > 0 || exc.size > 0

  const filteredGames = useMemo(() => {
    if (dataLoading) return []
    const q = search.toLowerCase()
    return console_.games.filter(g =>
      (!q || g.title.toLowerCase().includes(q)) && passes(console_, g, inc, exc, statuses)
    )
  }, [console_, dataLoading, search, inc, exc, statuses])

  const collectionGames = useMemo(() => {
    if (dataLoading) return []
    return console_.games.filter(g => { const s = statuses[g.id]; return s && (s.joguei || s.zerado || s.cem_porcento || s.quero || s.jogando) })
  }, [console_, dataLoading, statuses])

  const stats = useMemo(() => {
    const vals = Object.values(statuses)
    return {
      joguei:       vals.filter(s => s.joguei).length,
      zerado:       vals.filter(s => s.zerado).length,
      cem_porcento: vals.filter(s => s.cem_porcento).length,
      quero:        vals.filter(s => s.quero).length,
      jogando:      vals.filter(s => s.jogando).length,
      dl:           dataLoading ? 0 : console_.games.filter(g => g.dl).length,
    }
  }, [console_, dataLoading, statuses])

  const handleStatusChange = useCallback((gameId, key, value) => {
    setStatuses(prev => ({ ...prev, [gameId]: { ...(prev[gameId] || {}), [key]: value } }))
  }, [])

  const openGame = useCallback((list, game) => {
    const idx = list.findIndex(g => g.id === game.id)
    setSelectedList(list)
    setSelectedIndex(idx === -1 ? 0 : idx)
  }, [])

  const closeGame = useCallback(() => { setSelectedList(null); setSelectedIndex(0) }, [])
  const goPrev = useCallback(() => setSelectedIndex(i => Math.max(0, i - 1)), [])
  const goNext = useCallback(() => setSelectedIndex(i => Math.min((selectedList?.length || 1) - 1, i + 1)), [selectedList])

  const selected = selectedList ? selectedList[selectedIndex] : null

  return {
    console: console_,
    user,
    statuses, loading, dataLoading,
    search, setSearch,
    inc, exc, toggleInc, toggleExc, clearAll,
    isGrid, filteredGames, collectionGames, stats,
    handleStatusChange,
    openGame, closeGame, goPrev, goNext,
    selected, selectedIndex, selectedList,
  }
}
