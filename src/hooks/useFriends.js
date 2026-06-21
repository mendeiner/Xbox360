import { useState, useEffect } from 'react'
import { getFriends } from '../lib/social'

export function useFriends(userId) {
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setFriends([]); setLoading(false); return }
    let alive = true
    getFriends(userId).then(f => { if (alive) { setFriends(f); setLoading(false) } })
    return () => { alive = false }
  }, [userId])

  return { friends, loading }
}
