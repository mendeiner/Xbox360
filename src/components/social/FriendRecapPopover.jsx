import { useState } from 'react'
import { useHoverPopover } from '../../hooks/useHoverPopover'
import YearRecapStory from './YearRecapStory'
import CompatibilityBadge from './CompatibilityBadge'

// Wraps a friend's avatar (passed as children) and opens that friend's full Year Recap
// story — the same arcade experience self gets, per the plan's Part F:
//   - Desktop hover → a small anchored panel near the avatar, showing the complete story
//     with full navigation (tap zones/swipe/keys). Clicking the panel's "⤢" expands it.
//   - Click/tap (including touch, where hover doesn't exist) → the full-screen takeover.
// The selected year is captured via `onYearChange` so it survives that anchored→fullscreen
// escalation instead of resetting.
export default function FriendRecapPopover({ friendId, friendName, viewerId, children }) {
  const [expanded, setExpanded] = useState(false)
  const [capturedYear, setCapturedYear] = useState(null)

  const { open, setOpen, isTouch, handleMouseEnter, handleMouseLeave, handleClick } = useHoverPopover()

  function closeAll() {
    setOpen(false)
    setExpanded(false)
  }

  // Touch has no hover, so the tap that would open the anchored preview goes straight to the
  // full takeover instead — this is the "separate page on mobile" feel.
  if (isTouch) {
    return (
      <>
        <button onClick={handleClick} className="block">{children}</button>
        {open && (
          <YearRecapStory userId={friendId} subject={friendName} variant="fullscreen" onClose={() => setOpen(false)} />
        )}
      </>
    )
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button onClick={handleClick} className="block">{children}</button>

      {open && !expanded && (
        <div className="absolute z-20 top-full mt-2 left-1/2 -translate-x-1/2 flex flex-col gap-2" style={{ width: YearRecapStory.ANCHORED_SIZE.width }}>
          <div
            className="rounded-md border border-[#222b4a] shadow-xl overflow-hidden bg-black"
            style={{ width: YearRecapStory.ANCHORED_SIZE.width, height: YearRecapStory.ANCHORED_SIZE.height }}
          >
            <YearRecapStory
              userId={friendId}
              subject={friendName}
              variant="anchored"
              onYearChange={setCapturedYear}
              onExpand={() => setExpanded(true)}
            />
          </div>
          {viewerId && <CompatibilityBadge userId={viewerId} friendId={friendId} />}
        </div>
      )}

      {expanded && (
        <YearRecapStory
          userId={friendId}
          subject={friendName}
          variant="fullscreen"
          initialYear={capturedYear}
          onClose={closeAll}
        />
      )}
    </div>
  )
}
