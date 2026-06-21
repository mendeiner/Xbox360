import { useState, useEffect, useCallback } from 'react'
import { coverSrc, coverObjectPosition } from '../../consoles/dl'
import { getNextDuelPair, castDuelVote, getDuelTally } from '../../lib/duels'

// Small, secondary interactive widget (same visual weight as the Stories rail, not a
// hero) — pick a winner between two games you've played, see the running tally, then load
// the next pair. The "real interactivity beyond emoji reactions" the duel system delivers.
export default function DuelWidget({ userId }) {
  const [pair, setPair] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tally, setTally] = useState(null)
  const [votedFor, setVotedFor] = useState(null)

  const loadPair = useCallback(() => {
    setLoading(true)
    setTally(null)
    setVotedFor(null)
    getNextDuelPair(userId).then(p => { setPair(p); setLoading(false) })
  }, [userId])

  useEffect(() => { if (userId) loadPair() }, [userId, loadPair])

  async function vote(winner) {
    if (!pair || votedFor) return
    setVotedFor(winner.id)
    await castDuelVote(pair.consoleId, pair.gameA.id, pair.gameB.id, winner.id, userId)
    const t = await getDuelTally(pair.consoleId, pair.gameA.id, pair.gameB.id)
    setTally(t)
  }

  // No hero-empty-state for a secondary widget — if there's nothing to vote on yet
  // (not enough played games), render nothing rather than a confusing empty box.
  if (!userId || loading || !pair) return null

  return (
    <div className="bg-social-ink border border-[#222b4a] p-4 mb-6">
      <p className="text-[11px] font-black uppercase tracking-[1.5px] text-social mb-3">Duelo</p>

      <div className="grid grid-cols-2 gap-3">
        <DuelOption game={pair.gameA} console_={pair.console} pct={tally?.aPct} chosen={votedFor === pair.gameA.id} onVote={() => vote(pair.gameA)} disabled={!!votedFor} />
        <DuelOption game={pair.gameB} console_={pair.console} pct={tally?.bPct} chosen={votedFor === pair.gameB.id} onVote={() => vote(pair.gameB)} disabled={!!votedFor} />
      </div>

      {votedFor && (
        <button onClick={loadPair} className="mt-3 text-[11px] font-bold text-gray-500 hover:text-white">
          Próximo duelo →
        </button>
      )}
    </div>
  )
}

function DuelOption({ game, console_, pct, chosen, onVote, disabled }) {
  return (
    <button
      onClick={onVote}
      disabled={disabled}
      className={`relative text-left border transition-colors overflow-hidden
        ${chosen ? 'border-social' : 'border-[#222b4a] hover:border-gray-600'}
        ${disabled && !chosen ? 'opacity-50' : ''}`}
    >
      <img
        src={coverSrc(game, console_) || undefined}
        alt=""
        className="w-full h-28 object-cover bg-[#0a0a0a]"
        style={{ objectPosition: coverObjectPosition(console_) }}
        onError={e => { e.target.style.display = 'none' }}
      />
      <p className="text-[11px] font-bold text-white p-2 truncate">{game.title}</p>
      {pct != null && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center text-[11px] font-black text-social py-1">
          {pct}%
        </div>
      )}
    </button>
  )
}
