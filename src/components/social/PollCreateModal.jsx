import { useState } from 'react'
import { coverSrc, coverObjectPosition } from '../../consoles/dl'
import { readyConsoles } from '../../consoles/registry'
import { POLL_DURATIONS } from '../../lib/polls'

// Full create flow for a poll: pick a console, search its whole catalog (not just your
// own backlog) and select any number of games, give the poll a title, pick how long it
// stays open. One console per poll — keeps game_ids a flat array of that console's ids,
// matching the schema and how duels already scope each round to a single console.
export default function PollCreateModal({ onClose, onSubmit }) {
  const consoles = readyConsoles()
  const [consoleId, setConsoleId] = useState(consoles[0]?.id || null)
  const [title, setTitle] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState([])
  const [duration, setDuration] = useState('1w')
  const [submitting, setSubmitting] = useState(false)

  const console_ = consoles.find(c => c.id === consoleId)

  const q = query.trim().toLowerCase()
  const results = q ? console_?.games.filter(g => g.title.toLowerCase().includes(q)).slice(0, 30) || [] : []

  function toggleGame(game) {
    setSelected(prev => prev.some(g => g.id === game.id)
      ? prev.filter(g => g.id !== game.id)
      : [...prev, game])
  }

  function changeConsole(id) {
    setConsoleId(id)
    setSelected([])
    setQuery('')
  }

  const canSubmit = title.trim().length > 0 && selected.length >= 2 && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    await onSubmit({ consoleId, title: title.trim(), gameIds: selected.map(g => g.id), duration })
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-social-ink border border-[#222b4a] w-full max-w-lg max-h-[85vh] overflow-y-auto p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-black uppercase tracking-[1.5px] text-social">Criar votação</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-sm">✕</button>
        </div>

        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título da votação (ex: Qual jogar agora?)"
          className="w-full bg-[#0a0a0a] border border-[#222b4a] focus:border-social/60 outline-none text-sm text-white px-3 py-2 mb-3"
        />

        <div className="flex gap-2 mb-3">
          {consoles.map(c => (
            <button
              key={c.id}
              onClick={() => changeConsole(c.id)}
              className={`text-[11px] font-bold px-3 py-1.5 border transition-colors ${
                consoleId === c.id ? 'border-social text-social' : 'border-[#222b4a] text-gray-500 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selected.map(g => (
              <button
                key={g.id}
                onClick={() => toggleGame(g)}
                className="text-[10px] font-bold text-social border border-social/40 px-2 py-1 hover:border-social"
              >
                {g.title} ✕
              </button>
            ))}
          </div>
        )}

        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Buscar jogo de ${console_?.label || ''}...`}
          className="w-full bg-[#0a0a0a] border border-[#222b4a] focus:border-social/60 outline-none text-sm text-white px-3 py-2 mb-3"
        />

        {results.length > 0 && (
          <div className="space-y-1 mb-3 max-h-56 overflow-y-auto">
            {results.map(g => {
              const isSelected = selected.some(s => s.id === g.id)
              return (
                <button
                  key={g.id}
                  onClick={() => toggleGame(g)}
                  className={`w-full flex items-center gap-2 text-left px-2 py-1.5 border transition-colors ${
                    isSelected ? 'border-social bg-social/10' : 'border-transparent hover:border-[#222b4a]'
                  }`}
                >
                  <img
                    src={coverSrc(g, console_) || undefined}
                    alt=""
                    className="w-8 h-10 object-cover bg-[#0a0a0a] shrink-0"
                    style={{ objectPosition: coverObjectPosition(console_) }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                  <span className="text-xs text-white truncate">{g.title}</span>
                </button>
              )
            })}
          </div>
        )}

        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Duração</p>
        <div className="flex gap-2 mb-5">
          {Object.entries(POLL_DURATIONS).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setDuration(key)}
              className={`text-[11px] font-bold px-3 py-1.5 border transition-colors ${
                duration === key ? 'border-social text-social' : 'border-[#222b4a] text-gray-500 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-social text-black font-black text-xs uppercase tracking-wider py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {selected.length < 2 ? 'Selecione ao menos 2 jogos' : 'Criar votação'}
        </button>
      </div>
    </div>
  )
}
