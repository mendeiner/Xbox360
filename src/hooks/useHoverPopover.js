import { useState, useRef, useEffect } from 'react'

// Shared hover-to-open (desktop, with open/close delay so moving the pointer between the
// trigger and the panel doesn't flicker) / tap-to-toggle (touch, since hover doesn't exist
// there) popover state machine — used by YearRecap and FriendRecapPopover.
export function useHoverPopover({ openDelay = 300, closeDelay = 200, onOpen } = {}) {
  const [open, setOpen] = useState(false)
  const hoverTimer = useRef(null)
  const closeTimer = useRef(null)
  const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches

  useEffect(() => {
    return () => {
      clearTimeout(hoverTimer.current)
      clearTimeout(closeTimer.current)
    }
  }, [])

  function handleMouseEnter() {
    if (isTouch) return
    clearTimeout(closeTimer.current)
    hoverTimer.current = setTimeout(() => { setOpen(true); onOpen?.() }, openDelay)
  }
  function handleMouseLeave() {
    if (isTouch) return
    clearTimeout(hoverTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay)
  }
  function handleClick() {
    if (!isTouch) return
    setOpen(v => {
      const next = !v
      if (next) onOpen?.()
      return next
    })
  }

  return { open, setOpen, isTouch, handleMouseEnter, handleMouseLeave, handleClick }
}
