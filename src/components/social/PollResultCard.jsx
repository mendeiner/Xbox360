import { coverSrc, coverObjectPosition } from '../../consoles/dl'
import { getConsole } from '../../consoles/registry'

// Read-only outcome of a closed poll — no vote buttons, just final percentages with the
// winner highlighted. Shared between the site-wide /polls history page and a profile's
// "Votações" tab.
export default function PollResultCard({ poll, results, showCreator = false }) {
  const console_ = getConsole(poll.console)
  const res = results || { counts: {}, total: 0 }
  const winnerCount = Math.max(0, ...poll.game_ids.map(id => res.counts[id] || 0))

  return (
    <div className="bg-social-ink border border-[#222b4a] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-[1.5px] text-social">Qual jogar agora?</p>
        <p className="text-[10px] text-gray-500">
          {showCreator && poll.profiles && (
            <span className="font-bold text-gray-400">{poll.profiles.display_name || poll.profiles.username} · </span>
          )}
          encerrada em {new Date(poll.closes_at).toLocaleDateString('pt-BR')}
        </p>
      </div>
      <div className="flex gap-3 overflow-x-auto">
        {poll.game_ids.map(gameId => {
          const game = console_?.games.find(g => g.id === gameId)
          if (!game) return null
          const count = res.counts[gameId] || 0
          const pct = res.total ? Math.round((count / res.total) * 100) : 0
          const isWinner = res.total > 0 && count === winnerCount
          return (
            <div
              key={gameId}
              className={`relative shrink-0 w-24 text-left border ${isWinner ? 'border-social' : 'border-[#222b4a]'}`}
            >
              <img
                src={coverSrc(game, console_) || undefined}
                alt=""
                className="w-full h-28 object-cover bg-[#0a0a0a]"
                style={{ objectPosition: coverObjectPosition(console_) }}
                onError={e => { e.target.style.display = 'none' }}
              />
              <p className="text-[10px] font-bold text-white p-1.5 truncate">{game.title}</p>
              <div className={`absolute bottom-6 left-0 right-0 text-center text-[10px] font-black py-0.5 ${isWinner ? 'bg-social text-black' : 'bg-black/70 text-social'}`}>
                {pct}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
