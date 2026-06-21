import { useState, useEffect } from 'react'
import { getYearInReview } from '../../lib/collection'
import { useHoverPopover } from '../../hooks/useHoverPopover'
import YearRecapBody from './YearRecapBody'

// Small header affordance for the logged-in user's own yearly recap — appears on hover
// (desktop) since it's secondary, not a click target; falls back to tap on touch devices
// where hover doesn't exist. Same hover/tap pattern as FriendRecapPopover.
export default function YearRecap({ userId }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [recap, setRecap] = useState(null)
  const [loading, setLoading] = useState(true)

  const { open, setOpen, isTouch, handleMouseEnter, handleMouseLeave, handleClick } = useHoverPopover()

  useEffect(() => {
    if (!userId || !open) return
    let alive = true
    setLoading(true)
    getYearInReview(userId, year).then(r => { if (alive) { setRecap(r); setLoading(false) } })
    return () => { alive = false }
  }, [userId, year, open])

  if (!userId) return null

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[1.5px] text-gray-500 hover:text-social transition-colors"
      >
        ✦ Sua Retrospectiva
      </button>

      {open && (
        <>
          {isTouch && <div className="fixed inset-0 z-20 bg-black/60" onClick={() => setOpen(false)} />}
          <div
            className={isTouch
              ? 'fixed z-30 left-4 right-4 bottom-6 bg-social-ink border border-[#222b4a] p-5'
              : 'absolute z-20 right-0 mt-2 w-[min(90vw,360px)] bg-social-ink border border-[#222b4a] p-5 shadow-xl'
            }
          >
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setYear(y => y - 1)} className="text-gray-600 hover:text-white text-sm font-bold px-2 transition-colors">←</button>
              <h2 className="text-[11px] font-black uppercase tracking-[2px] text-social">Retrospectiva {year}</h2>
              <button
                onClick={() => setYear(y => Math.min(new Date().getFullYear(), y + 1))}
                disabled={year >= new Date().getFullYear()}
                className="text-gray-600 hover:text-white text-sm font-bold px-2 disabled:opacity-30 transition-colors"
              >→</button>
            </div>
            <YearRecapBody recap={recap} year={year} loading={loading} />
          </div>
        </>
      )}
    </div>
  )
}
