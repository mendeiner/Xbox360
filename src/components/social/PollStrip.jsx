import { useState, useEffect, useCallback } from 'react'
import { coverSrc, coverObjectPosition } from '../../consoles/dl'
import { getConsole } from '../../consoles/registry'
import { getActivePolls, votePoll, getPollResults, createPoll } from '../../lib/polls'
import { getAllStatusRows } from '../../lib/collection'

// Small strip above the feed for open "qual jogo jogar agora" polls from self+friends, with
// live vote bars. Deliberately NOT merged into ActivityFeed's infinite scroll (a third
// independently-paginated source would compound the feed's existing two-cursor merge risk;
// see plan). Poll creation picks from the user's own backlog ("quero") rather than a full
// game-picker UI, to keep this additive feature small.
export default function PollStrip({ userId, userIds = [] }) {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState({})

  const key = userIds.join(',')

  const load = useCallback(() => {
    if (!userId) return
    setLoading(true)
    getActivePolls(userIds, userId).then(async ps => {
      const res = {}
      await Promise.all(ps.map(async p => { res[p.id] = await getPollResults(p.id) }))
      setPolls(ps)
      setResults(res)
      setLoading(false)
    })
  }, [userId, key])

  useEffect(() => { load() }, [load])

  async function handleVote(pollId, gameId) {
    await votePoll(pollId, gameId, userId)
    setPolls(prev => prev.map(p => (p.id === pollId ? { ...p, myVote: gameId } : p)))
    const r = await getPollResults(pollId)
    setResults(prev => ({ ...prev, [pollId]: r }))
  }

  async function handleCreate() {
    const rows = await getAllStatusRows(userId)
    const quero = rows.filter(r => r.quero)
    const byConsole = {}
    for (const r of quero) (byConsole[r.console] ||= []).push(r)
    const consoleId = Object.keys(byConsole).find(c => byConsole[c].length >= 2)
    if (!consoleId) return
    const gameIds = byConsole[consoleId].slice(0, 3).map(r => r.game_id)
    await createPoll(userId, consoleId, gameIds)
    load()
  }

  if (!userId || loading) return null

  if (polls.length === 0) {
    return (
      <div className="mb-6">
        <button
          onClick={handleCreate}
          className="text-[11px] font-bold text-gray-500 hover:text-white border border-[#222b4a] hover:border-social/40 px-3 py-1.5 transition-colors"
        >
          + Criar votação com a galera
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6 space-y-3">
      {polls.map(poll => {
        const console_ = getConsole(poll.console)
        const res = results[poll.id] || { counts: {}, total: 0 }
        return (
          <div key={poll.id} className="bg-social-ink border border-[#222b4a] p-4">
            <p className="text-[11px] font-black uppercase tracking-[1.5px] text-social mb-3">Qual jogar agora?</p>
            <div className="flex gap-3 overflow-x-auto">
              {poll.game_ids.map(gameId => {
                const game = console_?.games.find(g => g.id === gameId)
                if (!game) return null
                const count = res.counts[gameId] || 0
                const pct = res.total ? Math.round((count / res.total) * 100) : 0
                const mine = poll.myVote === gameId
                return (
                  <button
                    key={gameId}
                    onClick={() => handleVote(poll.id, gameId)}
                    className={`relative shrink-0 w-24 text-left border transition-colors ${mine ? 'border-social' : 'border-[#222b4a] hover:border-gray-600'}`}
                  >
                    <img
                      src={coverSrc(game, console_) || undefined}
                      alt=""
                      className="w-full h-28 object-cover bg-[#0a0a0a]"
                      style={{ objectPosition: coverObjectPosition(console_) }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                    <p className="text-[10px] font-bold text-white p-1.5 truncate">{game.title}</p>
                    {poll.myVote && (
                      <div className="absolute bottom-6 left-0 right-0 bg-black/70 text-center text-[10px] font-black text-social py-0.5">{pct}%</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
