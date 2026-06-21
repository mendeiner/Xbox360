import { useState } from 'react'

// Mixes a hex color toward white — raw brand hexes (e.g. PS2's dark navy #003791) read
// too low-contrast as small text/icons on this dark sidebar background.
function lighten(hex, amount = 0.55) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  if (!m) return hex
  const mix = v => Math.round(parseInt(v, 16) + (255 - parseInt(v, 16)) * amount)
  return `rgb(${mix(m[1])}, ${mix(m[2])}, ${mix(m[3])})`
}

function Chip({ label, inc, exc, onInc, onExc, accentColor }) {
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors
        ${inc ? '' : exc ? 'bg-red-900/20' : 'hover:bg-surface-3'}`}
      style={inc ? { background: `${accentColor}26` } : undefined}
    >
      <span className={`flex-1 text-[12px] truncate
        ${inc ? 'text-white font-semibold' : exc ? 'text-gray-500 line-through' : 'text-gray-400'}`}>
        {label}
      </span>
      <button
        onClick={onInc}
        className={`w-[22px] h-[22px] rounded flex items-center justify-center text-[13px] font-bold flex-shrink-0 transition-colors
          ${inc ? 'text-white' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-500 hover:text-white hover:border-gray-500'}`}
        style={inc ? { background: accentColor } : undefined}
      >+</button>
      <button
        onClick={onExc}
        className={`w-[22px] h-[22px] rounded flex items-center justify-center text-[13px] font-bold flex-shrink-0 transition-colors
          ${exc ? 'bg-red-700 text-white border-red-700' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-500 hover:text-white hover:border-gray-500'}`}
      >−</button>
    </div>
  )
}

function Group({ title, filters, inc, exc, onInc, onExc, accentColor }) {
  const [open, setOpen] = useState(true)
  const activeCount = filters.filter(f => inc.has(f.id) || exc.has(f.id)).length

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-bold uppercase tracking-[1.5px] text-gray-500 hover:text-gray-400 transition-colors select-none"
      >
        <span>{title}{activeCount > 0 ? ` (${activeCount})` : ''}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
          style={{ color: lighten(accentColor) }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="px-1 pb-1 space-y-0.5">
          {filters.map(f => (
            <Chip
              key={f.id}
              label={f.label}
              inc={inc.has(f.id)}
              exc={exc.has(f.id)}
              onInc={() => onInc(f.id)}
              onExc={() => onExc(f.id)}
              accentColor={accentColor}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ special = [], groups = [], inc, exc, onInc, onExc, onClearAll, isOpen, onClose, accentColor = '#107C10' }) {
  const hasAny = inc.size > 0 || exc.size > 0

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 bottom-0 w-[200px] bg-[#111] border-r border-[#1e1e1e] z-50
        overflow-y-auto scrollbar-none pb-16 transition-transform duration-[260ms]
        top-0 md:top-[57px]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="px-3 py-3 flex items-center justify-between border-b border-[#1e1e1e]">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-gray-600">Filtros</span>
          {hasAny && (
            <button onClick={onClearAll} className="text-[10px] font-bold transition-colors hover:opacity-80" style={{ color: lighten(accentColor) }}>
              Limpar
            </button>
          )}
        </div>

        {/* All */}
        <button
          onClick={onClearAll}
          className={`flex items-center w-[calc(100%-16px)] mx-2 mt-2 px-2.5 py-2 rounded-lg text-[12px] font-semibold transition-colors
            ${!hasAny ? 'text-white border' : 'text-gray-400 hover:bg-surface-3'}`}
          style={!hasAny ? { background: `${accentColor}33`, borderColor: `${accentColor}66` } : undefined}
        >
          Todos
        </button>

        {/* Special */}
        <div className="px-1 mt-2 space-y-0.5">
          {special.map(f => (
            <Chip
              key={f.id}
              label={f.label}
              inc={inc.has(f.id)}
              exc={exc.has(f.id)}
              onInc={() => onInc(f.id)}
              onExc={() => onExc(f.id)}
              accentColor={accentColor}
            />
          ))}
        </div>

        <div className="mt-2 border-t border-[#1e1e1e]">
          {groups.map(g => (
            <Group
              key={g.id}
              title={g.title}
              filters={g.filters}
              inc={inc}
              exc={exc}
              onInc={onInc}
              onExc={onExc}
              accentColor={accentColor}
            />
          ))}
        </div>
      </aside>
    </>
  )
}
