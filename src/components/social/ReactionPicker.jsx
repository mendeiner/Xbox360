import { useState } from 'react'
import { REACTIONS, REACTION_GLYPHS, setReaction } from '../../lib/social'

export default function ReactionPicker({ postId, userId, counts, mine, onChange }) {
  const [pending, setPending] = useState(false)

  async function handlePick(reaction) {
    if (pending) return
    setPending(true)
    try {
      const result = await setReaction(postId, reaction, userId)
      onChange?.(result)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {REACTIONS.map(r => {
        const active = mine === r
        const count = counts?.[r] || 0
        if (!count && !active) return null
        return <ReactionTag key={r} r={r} active={active} count={count} onClick={() => handlePick(r)} disabled={pending} />
      })}
      <ReactionMenu onPick={handlePick} disabled={pending} mine={mine} />
    </div>
  )
}

function ReactionTag({ r, active, count, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 px-2 py-1 text-[11px] font-black transition-colors
        ${active ? 'bg-social text-white' : 'bg-[#161d35] text-gray-400 hover:bg-[#1d2640] hover:text-white'}`}
    >
      <span className="leading-none">{REACTION_GLYPHS[r]}</span>
      <span className="leading-none">{count}</span>
    </button>
  )
}

function ReactionMenu({ onPick, disabled, mine }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={disabled}
        className="px-2 py-1 text-[11px] font-black bg-[#161d35] text-gray-500 hover:bg-[#1d2640] hover:text-white transition-colors"
      >
        +
      </button>
      {open && (
        <div
          className="absolute bottom-full left-0 mb-1.5 flex gap-1 bg-[#10162a] border border-[#222b4a] p-1.5 z-10"
          onMouseLeave={() => setOpen(false)}
        >
          {REACTIONS.map(r => (
            <button
              key={r}
              onClick={() => { onPick(r); setOpen(false) }}
              className={`text-base px-1.5 py-0.5 hover:bg-white/10 transition-colors ${mine === r ? 'bg-social/20' : ''}`}
            >
              {REACTION_GLYPHS[r]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
