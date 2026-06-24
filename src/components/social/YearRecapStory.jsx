import { useEffect, useMemo, useRef, useState } from 'react'
import { getYearInReview, getEligibleRecapYears, getFriendRecapPercentile } from '../../lib/collection'
import { buildSlides } from './recapSlides'
import StoryProgressBar from './StoryProgressBar'

// Slides use Tailwind's `sm:` breakpoints, which key off the *viewport* — inside a small
// anchored panel on a wide desktop screen those would still fire and overflow the panel.
// Rather than teach every slide about a second "compact" size, anchored mode renders the
// exact same markup at this fixed virtual mobile size and scales the whole thing down with a
// CSS transform (browsers map click/touch coordinates back through the transform correctly,
// so tap zones/swipe still work unmodified). `ANCHORED_SIZE` is exported so a parent
// (FriendRecapPopover) can size its container to match exactly, with no cropping or gaps.
const VIRTUAL_W = 390
const VIRTUAL_H = 640
const ANCHORED_SCALE = 0.72

// Full-screen, tap/swipe/keyboard-driven story overlay for the Year Recap — the arcade CRT
// sequence (see plan: this Part B). Keyed only by `userId`/`subject`, never the logged-in
// user, so the exact same component serves both the self entry point (Home.jsx) and the
// friend entry point (FriendRecapPopover.jsx) with zero duplicated slide/copy logic.
//
// `initialYear`/`onYearChange` exist so a parent can preserve the selected year across the
// friend hover→click anchored/fullscreen escalation (Part F) — not used by the self entry
// point, which always opens fresh.
//
// `variant`: `'fullscreen'` (default, self + mobile-tap-on-friend) covers the whole viewport
// with scroll-lock/focus-trap, closed via the ✕/Esc. `'anchored'` (desktop friend hover) fills
// whatever fixed-size container its parent positions it in instead — no scroll-lock/focus-trap
// since it doesn't block the page — and swaps the ✕ for an "expand to fullscreen" affordance
// (`onExpand`), since hover already implies "leaving closes it." Slide content/navigation
// (tap zones, swipe, keyboard, the year dropdown) work identically in both.
export default function YearRecapStory({
  userId, subject = 'Você', variant = 'fullscreen', initialYear = null, onYearChange, onExpand, onClose,
}) {
  const anchored = variant === 'anchored'
  const [reduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
  const [visible, setVisible] = useState(reduceMotion || anchored)
  const [eligibleYears, setEligibleYears] = useState(null)
  const [year, setYear] = useState(initialYear)
  const [slideIndex, setSlideIndex] = useState(0)
  const [recap, setRecap] = useState(null)
  const [fetchedKey, setFetchedKey] = useState(null)
  const [friendPercentile, setFriendPercentile] = useState(null)

  const containerRef = useRef(null)
  const previouslyFocused = useRef(null)
  const closeTimer = useRef(null)
  const touchStartX = useRef(null)

  const fetchKey = year != null ? `${userId}:${year}` : null
  const loading = year == null || fetchedKey !== fetchKey

  // Always includes the current `year` even if it falls outside `eligibleYears` (the "no
  // eligible years yet" fallback below picks the current calendar year, which must still be
  // a selectable, valid option in the dropdown).
  const yearOptions = useMemo(() => {
    const set = new Set(eligibleYears || [])
    if (year != null) set.add(year)
    return [...set].sort((a, b) => b - a)
  }, [eligibleYears, year])

  // Friend-percentile comparison (Part D) is self-only — viewing a friend's recap must never
  // show how *they* rank against *their* friends, so this only fetches when `subject` is the
  // viewer's own recap, and gets merged onto `recap` rather than folded into
  // getYearInReview itself (which has no notion of "whose friends list").
  const recapWithExtras = useMemo(
    () => (recap ? { ...recap, friendPercentile: subject === 'Você' ? friendPercentile : null } : recap),
    [recap, friendPercentile, subject]
  )
  const slides = useMemo(() => buildSlides(recapWithExtras, year, { subject }), [recapWithExtras, year, subject])
  const slide = slides[slideIndex]

  // Entry transition: fade+scale in on mount (skipped outright under reduced motion, see
  // initial `visible` state above) — mirrors the tease→reveal deferred-setState pattern used
  // throughout this feature (StorySlide.jsx, useCountUp.js) to stay clear of calling setState
  // synchronously within an effect body.
  useEffect(() => {
    if (visible) return
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [visible])

  // Resolve which years are selectable, then default `year` to the most recent eligible one —
  // unless `initialYear` was already supplied by a parent preserving a prior selection. Falls
  // back to the current calendar year (showing its zero-state) if nothing is eligible yet, so
  // there's always something openable.
  useEffect(() => {
    let alive = true
    getEligibleRecapYears(userId).then(years => {
      if (!alive) return
      setEligibleYears(years)
      setYear(y => y ?? years[0] ?? new Date().getFullYear())
    })
    return () => { alive = false }
  }, [userId])

  useEffect(() => {
    if (year != null) onYearChange?.(year)
  }, [year, onYearChange])

  useEffect(() => {
    if (year == null) return
    let alive = true
    getYearInReview(userId, year).then(r => {
      if (!alive) return
      setRecap(r)
      setFetchedKey(fetchKey)
    })
    return () => { alive = false }
  }, [userId, year, fetchKey])

  useEffect(() => {
    // `recapWithExtras` above already nulls this out for non-self subjects, so this effect
    // only needs to skip the fetch — no synchronous setState needed on the early return.
    if (year == null || subject !== 'Você') return
    let alive = true
    getFriendRecapPercentile(userId, year).then(p => { if (alive) setFriendPercentile(p) })
    return () => { alive = false }
  }, [userId, year, subject])

  // Body scroll-lock while the overlay is mounted — skipped in anchored mode, which doesn't
  // cover the page.
  useEffect(() => {
    if (anchored) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [anchored])

  // Focus trap: capture the trigger element, focus the dialog, return focus on unmount —
  // skipped in anchored mode (hovering shouldn't steal keyboard focus from the page).
  useEffect(() => {
    if (anchored) return
    previouslyFocused.current = document.activeElement
    containerRef.current?.focus()
    return () => { previouslyFocused.current?.focus?.() }
  }, [anchored])

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  function handleClose() {
    if (reduceMotion) { onClose?.(); return }
    setVisible(false)
    closeTimer.current = setTimeout(() => onClose?.(), 200)
  }

  function goNext() {
    setSlideIndex(i => Math.min(i + 1, slides.length - 1))
  }
  function goPrev() {
    setSlideIndex(i => Math.max(i - 1, 0))
  }
  function changeYear(newYear) {
    setYear(newYear)
    setSlideIndex(0)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); handleClose(); return }
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); return }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); return }
    if (e.key !== 'Tab') return

    const focusable = containerRef.current?.querySelectorAll('button:not(:disabled), [tabindex]')
    if (!focusable?.length) return
    const list = Array.from(focusable)
    const first = list[0]
    const last = list[list.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e) {
    if (touchStartX.current == null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 50) return
    if (delta < 0) goNext()
    else goPrev()
  }

  const content = (
    <>
      {!loading && slides.length > 0 && (
        <StoryProgressBar count={slides.length} current={slideIndex} accent="#3ddc6a" />
      )}

      <button
        onClick={anchored ? onExpand : handleClose}
        aria-label={anchored ? 'Ver retrospectiva em tela cheia' : 'Fechar retrospectiva'}
        className="absolute top-2 right-2 z-30 w-9 h-9 flex items-center justify-center text-white/70 hover:text-white"
        style={{ paddingTop: anchored ? 0 : 'max(0, env(safe-area-inset-top))' }}
      >
        {anchored ? '⤢' : '✕'}
      </button>

      {slideIndex === 0 && !loading && (
        <div className="absolute z-30 left-0 right-0 top-12 flex items-center justify-center pointer-events-none">
          <select
            value={year}
            onChange={e => changeYear(Number(e.target.value))}
            aria-label="Selecionar ano da retrospectiva"
            className="pointer-events-auto recap-pixel text-[10px] bg-black/70 text-white border border-white/30 rounded px-2 py-1.5 outline-none"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      <button
        onClick={goPrev}
        disabled={slideIndex === 0}
        aria-label="Slide anterior"
        className="absolute left-0 top-0 bottom-0 z-20 w-1/3"
      />
      <button
        onClick={goNext}
        disabled={slideIndex === slides.length - 1}
        aria-label="Próximo slide"
        className="absolute right-0 top-0 bottom-0 z-20 w-2/3"
      />

      <div className="relative w-full h-full">
        {loading || !slide ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <slide.Component key={slide.id} {...slide.props} />
        )}
      </div>
    </>
  )

  // Fullscreen on an actual phone-width viewport fills edge-to-edge (unchanged behavior). On a
  // wider screen it letterboxes into a fixed 9:16 "story" card instead of stretching slide
  // content across the whole browser window — every slide's layout (including the off-center
  // align presets in StorySlide) is authored against a phone-shaped frame, so on desktop it
  // needs that same frame, not the raw viewport, or corner anchors land in empty space with no
  // relation to anything. Anchored mode already has its own constrained virtual-viewport box
  // below and is untouched by this.
  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal={anchored ? undefined : 'true'}
      aria-label={`Retrospectiva ${year}`}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={anchored
        ? 'relative w-full h-full overflow-hidden transition-opacity duration-200'
        : 'fixed inset-0 z-50 flex sm:items-center sm:justify-center transition-opacity duration-200'}
      style={{ height: anchored ? undefined : '100dvh', opacity: visible ? 1 : 0, background: '#000' }}
    >
      {anchored ? (
        <div
          className="relative bg-black"
          style={{ width: VIRTUAL_W, height: VIRTUAL_H, transform: `scale(${ANCHORED_SCALE})`, transformOrigin: 'top left' }}
        >
          {content}
        </div>
      ) : (
        <div
          className="relative w-full h-full sm:w-auto sm:max-w-[480px] sm:aspect-[9/16] sm:max-h-[92dvh] sm:rounded-2xl sm:border sm:border-white/10 overflow-hidden bg-black transition-transform duration-200"
          style={{ transform: visible ? 'scale(1)' : 'scale(0.95)' }}
        >
          {content}
        </div>
      )}
    </div>
  )
}

// Single source of truth for the anchored container size, so FriendRecapPopover's wrapper
// matches the scaled virtual viewport exactly (no cropping, no empty gaps).
YearRecapStory.ANCHORED_SIZE = {
  width: Math.round(VIRTUAL_W * ANCHORED_SCALE),
  height: Math.round(VIRTUAL_H * ANCHORED_SCALE),
}
