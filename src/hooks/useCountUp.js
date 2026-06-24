import { useEffect, useRef, useState } from 'react'

// Arcade "score ticking" number tween via requestAnimationFrame — used by the Year Recap
// story's count-up slides (games beaten, YoY delta, Metacritic rank). Returns `target`
// directly under prefers-reduced-motion instead of animating, per the project's motion
// convention (see fade-in-up in index.css).
export function useCountUp(target, durationMs = 900, { active = true } = {}) {
  const [reduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
  const shouldAnimate = active && !reduceMotion && target > 0
  const [value, setValue] = useState(0)
  const frame = useRef(null)

  useEffect(() => {
    if (!shouldAnimate) return

    const start = performance.now()
    function tick(now) {
      const progress = Math.min((now - start) / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out-cubic, no bounce
      setValue(Math.round(eased * target))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame.current)
  }, [target, durationMs, shouldAnimate])

  return shouldAnimate ? value : target
}
