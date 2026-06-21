import { useState, useRef, useCallback } from 'react'
import { getYearInReview } from '../../lib/collection'
import YearRecapBody from './YearRecapBody'

const recapCache = new Map() // friendId -> { year -> recap }, session-lived

// Wraps a friend's avatar (passed as children) and shows that friend's yearly recap on
// hover (desktop) or tap (mobile, since hover doesn't exist on touch) — the entry point
// the friends Stories rail wires every avatar to.
export default function FriendRecapPopover({ friendId, friendName, children }) {
  const [open, setOpen] = useState(false)
  const [year] = useState(new Date().getFullYear())
  const [recap, setRecap] = useState(null)
  const [loading, setLoading] = useState(false)
  const hoverTimer = useRef(null)
  const closeTimer = useRef(null)

  const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches

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

  function openNow() {
    clearTimeout(closeTimer.current)
    setOpen(true)
    load()
  }

  function handleMouseEnter() {
    if (isTouch) return
    hoverTimer.current = setTimeout(openNow, 300)
  }
  function handleMouseLeave() {
    if (isTouch) return
    clearTimeout(hoverTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 200)
  }
  function handleClick() {
    if (!isTouch) return
    setOpen(v => {
      const next = !v
      if (next) load()
      return next
    })
  }

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
          </div>
        </>
      )}
    </div>
  )
}
