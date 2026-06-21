import { useState, useEffect, useMemo } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { readyConsoles, getConsole } from '../../consoles/registry'
import { coverSrc, coverObjectPosition } from '../../consoles/dl'
import { getTop10, saveTop10 } from '../../lib/social'

function resolveGame(entry) {
  const console_ = getConsole(entry.console)
  const game = console_?.games.find(g => g.id === entry.game_id)
  return game ? { ...entry, game, console: console_ } : null
}

export default function Top10Editor({ userId, isOwner }) {
  const [slots, setSlots] = useState(Array(10).fill(null))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    getTop10(userId).then(rows => {
      if (!alive) return
      const next = Array(10).fill(null)
      for (const row of rows) {
        const resolved = resolveGame(row)
        if (resolved) next[row.position - 1] = resolved
      }
      setSlots(next)
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => { alive = false }
  }, [userId])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const ids = useMemo(() => slots.map((s, i) => s ? `${s.console.id}:${s.game.id}` : `empty-${i}`), [slots])

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = ids.indexOf(active.id)
    const to = ids.indexOf(over.id)
    setSlots(prev => arrayMove(prev, from, to))
  }

  function pickGame(game, console_) {
    setSlots(prev => {
      const next = [...prev]
      next[editingSlot] = { game, console: console_ }
      return next
    })
    setEditingSlot(null)
    setQuery('')
  }

  function clearSlot(i) {
    setSlots(prev => prev.map((s, idx) => idx === i ? null : s))
  }

  async function handleSave() {
    setSaving(true)
    const list = slots.filter(Boolean).map(s => ({ console: s.console.id, game_id: s.game.id }))
    try {
      await saveTop10(userId, list)
    } finally {
      setSaving(false)
    }
  }

  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const results = []
    for (const console_ of readyConsoles()) {
      for (const game of console_.games) {
        if (game.title.toLowerCase().includes(q)) {
          results.push({ game, console: console_ })
          if (results.length >= 8) return results
        }
      }
    }
    return results
  }, [query])

  if (loading) {
    return <div className="h-40 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-social border-t-transparent rounded-full animate-spin" />
    </div>
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {slots.map((slot, i) => (
              <div key={ids[i]}>
                <SortableRow
                  id={ids[i]}
                  index={i}
                  slot={slot}
                  isOwner={isOwner}
                  onEdit={() => setEditingSlot(i)}
                  onClear={() => clearSlot(i)}
                />
                {i === 2 && <div className="h-px bg-social/40 my-2" />}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {isOwner && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 text-xs font-black uppercase tracking-wider px-4 py-2 bg-social hover:bg-social-dark text-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Top 10'}
        </button>
      )}

      {editingSlot !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setEditingSlot(null)}>
          <div
            className="bg-social-ink border border-[#222b4a] w-full max-w-md p-4"
            onClick={e => e.stopPropagation()}
          >
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar jogo em qualquer console..."
              className="w-full bg-social-bg border border-[#222b4a] px-3 py-2 text-sm text-white focus:border-social outline-none"
            />
            <div className="mt-3 max-h-80 overflow-y-auto space-y-1">
              {searchResults.map(r => (
                <button
                  key={`${r.console.id}:${r.game.id}`}
                  onClick={() => pickGame(r.game, r.console)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 text-left"
                >
                  <span className="text-[10px] font-bold uppercase text-gray-500">{r.console.label}</span>
                  <span className="text-sm text-white truncate">{r.game.title}</span>
                </button>
              ))}
              {query && !searchResults.length && (
                <p className="text-xs text-gray-600 px-2 py-1.5">Nenhum jogo encontrado.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SortableRow({ id, index, slot, isOwner, onEdit, onClear }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isOwner })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-social-ink border border-[#222b4a] px-3 py-2"
    >
      <span className={`text-2xl font-black w-8 shrink-0 leading-none ${index < 3 ? 'text-social' : 'text-gray-600'}`}>{index + 1}</span>

      {slot ? (
        <>
          <img
            src={coverSrc(slot.game, slot.console) || undefined}
            alt=""
            className="w-9 h-12 object-cover bg-[#0a0a0a] shrink-0"
            style={{ objectPosition: coverObjectPosition(slot.console) }}
            onError={e => { e.target.style.display = 'none' }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{slot.game.title}</p>
            <p className="text-[10px] uppercase font-bold text-gray-500">{slot.console.label}</p>
          </div>
          {isOwner && (
            <>
              <button {...attributes} {...listeners} className="text-gray-500 hover:text-white px-2 cursor-grab active:cursor-grabbing">⠿</button>
              <button onClick={onClear} className="text-gray-600 hover:text-red-400 text-xs px-1">✕</button>
            </>
          )}
        </>
      ) : isOwner ? (
        <button onClick={onEdit} className="flex-1 text-left text-xs text-gray-600 hover:text-social font-semibold py-2.5">
          + Adicionar jogo
        </button>
      ) : (
        <span className="flex-1 text-xs text-gray-700">—</span>
      )}
    </div>
  )
}
