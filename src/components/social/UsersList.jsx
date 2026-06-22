import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getConsole } from '../../consoles/registry'
import { ACTION_LABEL } from '../../lib/social'
import FriendRecapPopover from './FriendRecapPopover'

function timeAgo(dateStr) {
  const ms = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(ms / 86400000)
  if (days <= 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 7) return `${days}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

// The "users tab" — every friend with name + photo on the left, each showing their last
// shared game. A real, always-visible section (not a nav button), collapsible on mobile.
export default function UsersList({ friends, latestPostByUser = {}, loading, forceOpen = false, viewerId }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      {!forceOpen && (
        <button
          onClick={() => setOpen(v => !v)}
          className="lg:hidden w-full flex items-center justify-between bg-social-ink border border-[#222b4a] px-4 py-3 mb-2"
        >
          <span className="text-[11px] font-black uppercase tracking-[1.5px] text-gray-400">Amigos ({friends.length})</span>
          <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
        </button>
      )}

      <div className={forceOpen ? 'block' : `${open ? 'block' : 'hidden'} lg:block`}>
        <h2 className="hidden lg:block text-[11px] font-black uppercase tracking-[1.5px] text-gray-500 mb-3">Amigos</h2>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-[#10162a] animate-pulse" />
            ))}
          </div>
        ) : friends.length === 0 ? (
          <p className="text-xs text-gray-600">Nenhum amigo ainda.</p>
        ) : (
          <div className="space-y-1">
            {friends.map(f => {
              const post = latestPostByUser[f.id]
              const isBatch = post?.action === 'added_games'
              const console_ = post && !isBatch && getConsole(post.console)
              const game = console_?.games.find(g => g.id === post.game_id)
              return (
                <div key={f.id} className="flex items-center gap-3 px-2 py-2 hover:bg-white/5 transition-colors">
                  {/* Avatar is the hover/tap recap trigger; kept separate from the profile
                      link below to avoid nesting two interactive elements. */}
                  {viewerId ? (
                    <FriendRecapPopover friendId={f.id} friendName={f.displayName || f.username} viewerId={viewerId}>
                      <span className="w-10 h-10 rounded-full bg-[#161d35] border border-[#222b4a] flex items-center justify-center text-sm font-black text-gray-400 shrink-0 overflow-hidden">
                        {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" /> : f.username?.[0]?.toUpperCase()}
                      </span>
                    </FriendRecapPopover>
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-[#161d35] border border-[#222b4a] flex items-center justify-center text-sm font-black text-gray-400 shrink-0 overflow-hidden">
                      {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" /> : f.username?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <Link to={`/u/${f.username}`} className="min-w-0">
                    <p className="text-[13px] font-bold text-white truncate">{f.displayName || f.username}</p>
                    {isBatch ? (
                      <p className="text-[10px] text-gray-500 truncate">
                        adicionou <span className="text-gray-400 font-semibold">{post.items?.length || 0} jogos</span> · {timeAgo(post.created_at)}
                      </p>
                    ) : game ? (
                      <p className="text-[10px] text-gray-500 truncate">
                        {ACTION_LABEL[post.action]} <span className="text-gray-400 font-semibold">{game.title}</span> · {timeAgo(post.created_at)}
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-600">Sem atividade compartilhada</p>
                    )}
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
