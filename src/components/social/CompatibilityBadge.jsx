import { useState, useEffect } from 'react'
import { getCompatibilityScore } from '../../lib/duels'

// Small derived "taste match" stat between the current user and a friend — surfaced inside
// FriendRecapPopover and on profiles. Renders nothing until there's enough shared rating/duel
// data to produce a meaningful score.
export default function CompatibilityBadge({ userId, friendId }) {
  const [score, setScore] = useState(undefined) // undefined = loading, null = not enough data

  useEffect(() => {
    if (!userId || !friendId) return
    let alive = true
    getCompatibilityScore(userId, friendId).then(s => { if (alive) setScore(s) })
    return () => { alive = false }
  }, [userId, friendId])

  if (score === undefined || score === null) return null

  return (
    <p className="text-[11px] font-bold text-gray-500 mt-2">
      <span className="text-social font-black">{score}%</span> de compatibilidade de gosto
    </p>
  )
}
