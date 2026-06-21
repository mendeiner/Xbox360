import { useState } from 'react'
import FriendRecapPopover from './FriendRecapPopover'
import UsersList from './UsersList'

// Instagram/Stories-style horizontal avatar row — replaces the old static "last action +
// date" vertical list as the primary friends affordance on Home. Most recently active
// friends lead the row and get a larger emphasized avatar. Each avatar doubles as the
// entry point into that friend's year recap (FriendRecapPopover). The full list (with
// last-shared-action context) stays one tap away via "ver todos".
export default function FriendsStoriesRail({ friends, latestPostByUser = {}, loading }) {
  const [showAll, setShowAll] = useState(false)

  const sorted = [...friends].sort((a, b) => {
    const ta = latestPostByUser[a.id]?.created_at
    const tb = latestPostByUser[b.id]?.created_at
    if (!ta && !tb) return 0
    if (!ta) return 1
    if (!tb) return -1
    return new Date(tb) - new Date(ta)
  })

  if (loading) {
    return (
      <div className="flex gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-14 h-14 rounded-full bg-[#10162a] animate-pulse shrink-0" />
        ))}
      </div>
    )
  }

  if (friends.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 overflow-x-auto pb-1 -mx-1 px-1">
        {sorted.map((f, i) => {
          const active = i < 3 && latestPostByUser[f.id]
          return (
            <FriendRecapPopover key={f.id} friendId={f.id} friendName={f.displayName || f.username}>
              <div className="flex flex-col items-center gap-1.5 shrink-0 w-16">
                <span
                  className={`flex items-center justify-center rounded-full overflow-hidden bg-[#161d35] border text-sm font-black text-gray-400 transition-transform
                    ${active ? 'w-14 h-14 border-2 border-social' : 'w-11 h-11 border border-[#222b4a] opacity-80'}`}
                >
                  {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" /> : f.username?.[0]?.toUpperCase()}
                </span>
                <p className="text-[10px] font-bold text-gray-400 truncate w-full text-center">{f.displayName || f.username}</p>
              </div>
            </FriendRecapPopover>
          )
        })}

        <button
          onClick={() => setShowAll(v => !v)}
          className="flex flex-col items-center gap-1.5 shrink-0 w-16 text-gray-500 hover:text-white"
        >
          <span className="w-11 h-11 rounded-full border border-[#222b4a] flex items-center justify-center text-xs font-black">
            {showAll ? '▲' : '⋯'}
          </span>
          <p className="text-[10px] font-bold">Ver todos</p>
        </button>
      </div>

      {showAll && (
        <div className="mt-4">
          <UsersList friends={friends} latestPostByUser={latestPostByUser} loading={false} forceOpen />
        </div>
      )}
    </div>
  )
}
