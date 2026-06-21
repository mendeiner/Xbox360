import { useState, useCallback } from 'react'
import { getYearInReview } from '../../lib/collection'
import { useHoverPopover } from '../../hooks/useHoverPopover'
import YearRecapBody from './YearRecapBody'
import CompatibilityBadge from './CompatibilityBadge'

const recapCache = new Map() // friendId -> { year -> recap }, session-lived

// Wraps a friend's avatar (passed as children) and shows that friend's yearly recap on
// hover (desktop) or tap (mobile, since hover doesn't exist on touch) — the entry point
// the friends Stories rail wires every avatar to. Also surfaces the taste-compatibility
// score against this friend, since it's already a "this friend" context popover.
export default function FriendRecapPopover({ friendId, friendName, viewerId, children }) {
  const [year] = useState(new Date().getFullYear())
  const [recap, setRecap] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    const cached = recapCache.get(friendId)?.[year]
    if (cached) { setRecap(cached); return }
    setLoading(true)
    getYearInReview(friendId, year).then(r => {
      const byYear = recapCache.get(friendId) || {}
      byYear[year] = r
      recapCache.set(friendId, byYear)
      setRecap(r)
      setLoading(false)
    })
  }, [friendId, year])

  const { open, setOpen, isTouch, handleMouseEnter, handleMouseLeave, handleClick } = useHoverPopover({ onOpen: load })

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button onClick={handleClick} className="block">{children}</button>

      {open && (
        <>
          {isTouch && (
            <div className="fixed inset-0 z-20 bg-black/60" onClick={() => setOpen(false)} />
          )}
          <div
            className={isTouch
              ? 'fixed z-30 left-4 right-4 bottom-6 bg-social-ink border border-[#222b4a] p-5'
              : 'absolute z-20 top-full mt-2 left-1/2 -translate-x-1/2 w-[300px] bg-social-ink border border-[#222b4a] p-5 shadow-xl'
            }
          >
            <p className="text-[11px] font-black uppercase tracking-[1.5px] text-social mb-3">
              Retrospectiva de {friendName}
            </p>
            <YearRecapBody recap={recap} year={year} loading={loading} />
            {viewerId && <CompatibilityBadge userId={viewerId} friendId={friendId} />}
          </div>
        </>
      )}
    </div>
  )
}
