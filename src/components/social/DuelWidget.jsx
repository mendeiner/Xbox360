import { useState, useEffect, useCallback } from 'react'
import { coverSrc, coverObjectPosition } from '../../consoles/dl'
import { getNextDuelPair, castDuelVote } from '../../lib/duels'

// Small, secondary interactive widget (same visual weight as the Stories rail, not a
// hero) — pick a winner between two games you've played, then load the next pair. The
// "real interactivity beyond emoji reactions" the duel system delivers.
export default function DuelWidget({ userId }) {
  const [pair, setPair] = useState(null)
  const [loading, setLoading] = useState(true)
  const [votedFor, setVotedFor] = useState(null)
  const [swapping, setSwapping] = useState(false)
  // Past {pair, votedFor} snapshots, most-recent last — lets the back arrow step
  // through already-voted duels, without re-fetching anything.
  const [history, setHistory] = useState([])
  // True while looking at a past duel via the back arrow — unlike the live pair, a past
  // one stays clickable so the other option can be picked instead (re-casts the vote).
  const [viewingPast, setViewingPast] = useState(false)

  // Doesn't touch `loading`/`votedFor` itself — only the initial mount-time call below
  // shows the loading-null state. Re-running this after a vote must keep the just-voted
  // pair (with its highlighted border) on screen until the next pair is ready to swap in,
  // instead of blanking the widget out in between.
  const loadPair = useCallback(() => {
    return getNextDuelPair(userId).then(p => { setPair(p); setVotedFor(null); setViewingPast(false); setLoading(false) })
  }, [userId])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    loadPair()
  }, [userId, loadPair])

  // Voting on the live pair, or re-voting on a past one reached via the back arrow —
  // either way, picking an option (even the one already chosen, on a past pair) re-casts
  // the vote (upsert overwrites the row) and advances straight to a fresh next pair.
  function vote(winner) {
    if (!pair) return
    if (votedFor === winner.id && !viewingPast) return
    setVotedFor(winner.id)
    setViewingPast(false)
    setHistory(h => [...h, { pair, votedFor: winner.id }])
    // The insert doesn't gate the UI — it runs in the background while the next pair is
    // fetched in parallel (not after the dwell delay), so by the time the dwell ends the
    // next pair is usually already in hand and the swap is instant.
    castDuelVote(pair.consoleId, pair.gameA.id, pair.gameB.id, winner.id, userId).catch(() => {})
    const nextPair = getNextDuelPair(userId)
    const minOverlay = new Promise(r => setTimeout(r, 150))
    setTimeout(() => {
      setSwapping(true)
      Promise.all([nextPair, minOverlay]).then(([p]) => {
        setPair(p)
        setVotedFor(null)
        setViewingPast(false)
        setSwapping(false)
      })
    }, 450)
  }

  function goBack() {
    if (!history.length) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setPair(prev.pair)
    setVotedFor(prev.votedFor)
    setViewingPast(true)
  }

  // No hero-empty-state for a secondary widget — if there's nothing to vote on yet
  // (not enough played games), render nothing rather than a confusing empty box.
  if (!userId || loading || !pair) return null

  return (
    <div className="bg-social-ink border border-[#222b4a] p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-[1.5px] text-social">Duelo</p>
        <button
          onClick={goBack}
          disabled={!history.length}
          aria-label="Duelo anterior"
          className="text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="relative grid grid-cols-2 gap-3">
        <DuelOption game={pair.gameA} console_={pair.console} chosen={votedFor === pair.gameA.id} onVote={() => vote(pair.gameA)} disabled={!!votedFor && !viewingPast} />
        <DuelOption game={pair.gameB} console_={pair.console} chosen={votedFor === pair.gameB.id} onVote={() => vote(pair.gameB)} disabled={!!votedFor && !viewingPast} />
        {swapping && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-social/20 via-black/50 to-black/70 pointer-events-none">
            <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-social border border-[#222b4a] text-[10px] font-black text-white">
          VS
        </div>
      </div>
    </div>
  )
}

function DuelOption({ game, console_, chosen, onVote, disabled }) {
  return (
    <button
      onClick={onVote}
      disabled={disabled}
      className={`relative text-left border transition-colors overflow-hidden
        ${chosen ? 'border-social' : 'border-[#222b4a] hover:border-gray-600'}`}
    >
      <div className={disabled && !chosen ? 'opacity-50' : ''}>
        <img
          src={coverSrc(game, console_) || undefined}
          alt=""
          className="w-full h-28 object-cover bg-[#0a0a0a]"
          style={{ objectPosition: coverObjectPosition(console_) }}
          onError={e => { e.target.style.display = 'none' }}
        />
        <p className="text-[11px] font-bold text-white p-2 truncate">{game.title}</p>
      </div>
    </button>
  )
}
