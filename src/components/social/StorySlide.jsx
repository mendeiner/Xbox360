import { useEffect, useState } from 'react'

// Generic full-bleed CRT slide shell shared by every distinct screen in recapSlides.jsx (HIGH
// SCORE board, VS clash, BOSS reveal, ...) — purely presentational, knows nothing about recap
// data or thresholds. Owns: the scanline/vignette backdrop, the per-slide accent color (text +
// glow), and an optional tease→reveal beat (a short line shown before the slide's real content,
// e.g. "Seu gênero do ano foi…"). `bgClassName` lets each archetype set its own backdrop tone
// (bookend slides stay near-neutral, "fact" slides go full black) without forking this shell.
export default function StorySlide({ accent = '#107C10', bgClassName = 'bg-black', tease, teaseMs = 1100, children }) {
  const [revealed, setRevealed] = useState(
    () => !tease || (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  )

  useEffect(() => {
    if (revealed) return
    const timer = setTimeout(() => setRevealed(true), teaseMs)
    return () => clearTimeout(timer)
  }, [revealed, teaseMs])

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none ${bgClassName}`}
      style={{ color: accent }}
    >
      <div className="recap-crt-backdrop" />
      {tease && !revealed ? (
        <p className="relative z-10 recap-pixel text-[13px] text-center px-10 leading-relaxed recap-glow">
          {tease}
        </p>
      ) : (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 py-10 gap-4">
          {children}
        </div>
      )}
    </div>
  )
}
