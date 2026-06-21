import { useState, useEffect, useRef } from 'react'
import { getYearInReview } from '../../lib/collection'
import YearRecapBody from './YearRecapBody'

// Small header affordance for the logged-in user's own yearly recap — no longer a page
// hero. Opens a compact popover on click; same year-nav/fetch logic as before.
export default function YearRecap({ userId }) {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [recap, setRecap] = useState(null)
  const [loading, setLoading] = useState(true)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!userId || !open) return
    let alive = true
    setLoading(true)
    getYearInReview(userId, year).then(r => { if (alive) { setRecap(r); setLoading(false) } })
    return () => { alive = false }
  }, [userId, year, open])

  useEffect(() => {
    if (!open) return
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  if (!userId) return null

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[1.5px] text-gray-500 hover:text-social border border-[#222b4a] hover:border-social/40 px-3 py-1.5 transition-colors"
      >
        ✦ Sua Retrospectiva
      </button>

      {open && (
        <div className="absolute z-20 right-0 mt-2 w-[min(90vw,360px)] bg-social-ink border border-[#222b4a] p-5 shadow-xl">
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
      )}
    </div>
  )
}
