import { useState, useEffect, useCallback } from 'react'
import { coverSrc, coverObjectPosition } from '../../consoles/dl'
import { getConsole } from '../../consoles/registry'
import { getActivePolls, votePoll, getPollResults, createPoll } from '../../lib/polls'
import PollCreateModal from './PollCreateModal'

// Open polls last exactly 1 week (see createPoll's default closesAt) before they're
// archived into /polls and the profile's "Votações" tab — this renders the countdown.
function timeUntil(closesAt) {
  if (!closesAt) return null
  const ms = new Date(closesAt).getTime() - Date.now()
  if (ms <= 0) return 'encerrando...'
  const days = Math.floor(ms / 86400000)
  if (days >= 1) return `encerra em ${days}d`
  const hours = Math.floor(ms / 3600000)
  if (hours >= 1) return `encerra em ${hours}h`
  return `encerra em ${Math.max(1, Math.floor(ms / 60000))}min`
}

// Small strip above the feed for open polls from self+friends, with live vote bars.
// Deliberately NOT merged into ActivityFeed's infinite scroll (a third independently-
// paginated source would compound the feed's existing two-cursor merge risk; see plan).
export default function PollStrip({ userId, userIds = [] }) {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState({})
  const [showCreate, setShowCreate] = useState(false)

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

  async function handleSubmitCreate({ consoleId, title, gameIds, duration }) {
    await createPoll(userId, consoleId, gameIds, title, duration)
    setShowCreate(false)
    load()
  }

  if (!userId || loading) return null

  const hasOwnPoll = polls.some(p => p.creator_id === userId)

  return (
    <div className="mb-6 space-y-3">
      {!hasOwnPoll && (
        <button
          onClick={() => setShowCreate(true)}
          className="text-[11px] font-bold text-gray-500 hover:text-white border border-[#222b4a] hover:border-social/40 px-3 py-1.5 transition-colors"
        >
          + Criar votação com a galera
        </button>
      )}
      {showCreate && (
        <PollCreateModal onClose={() => setShowCreate(false)} onSubmit={handleSubmitCreate} />
      )}
      {polls.map(poll => {
        const console_ = getConsole(poll.console)
        const res = results[poll.id] || { counts: {}, total: 0 }
        return (
          <div key={poll.id} className="bg-social-ink border border-[#222b4a] p-4">
            <div className="flex items-center justify-between mb-3 gap-2">
              <p className="text-[11px] font-black uppercase tracking-[1.5px] text-social">{poll.title}</p>
              {timeUntil(poll.closes_at) && (
                <p className="text-[10px] text-gray-500 shrink-0">{timeUntil(poll.closes_at)}</p>
              )}
            </div>
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
