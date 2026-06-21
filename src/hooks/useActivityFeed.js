import { useState, useEffect, useCallback, useRef } from 'react'
import { getFeedPosts, getRecentAchievementUnlocks } from '../lib/social'

// Merges feed_posts + user_achievements (two independently-paginated sources) into one
// chronological, infinitely-scrollable timeline. Each source keeps its own cursor so
// pagination correctness doesn't depend on assuming the two sources interleave evenly —
// see plan's "open risks" note on this. Each page over-fetches both sources by `pageSize`
// and re-slices client-side to the merged page size.
export function useActivityFeed(userIds, viewerId, { pageSize = 15 } = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  const cursors = useRef({ posts: null, achievements: null, postsExhausted: false, achievementsExhausted: false })
  const key = userIds.join(',')

  const fetchPage = useCallback(async () => {
    const c = cursors.current
    const [posts, unlocks] = await Promise.all([
      c.postsExhausted ? [] : getFeedPosts(userIds, { limit: pageSize, before: c.posts, viewerId }),
      c.achievementsExhausted ? [] : getRecentAchievementUnlocks(userIds, { limit: pageSize, before: c.achievements }),
    ])

    if (posts.length < pageSize) c.postsExhausted = true
    else c.posts = posts[posts.length - 1].created_at

    if (unlocks.length < pageSize) c.achievementsExhausted = true
    else c.achievements = unlocks[unlocks.length - 1].unlocked_at

    const tagged = [
      ...posts.map(p => ({ kind: 'post', sortTs: p.created_at, data: p })),
      ...unlocks.map(u => ({ kind: 'achievement', sortTs: u.unlocked_at, data: u })),
    ].sort((a, b) => new Date(b.sortTs) - new Date(a.sortTs))

    const more = !c.postsExhausted || !c.achievementsExhausted
    return { tagged, more }
  }, [key, pageSize, viewerId])

  useEffect(() => {
    if (!userIds.length) { setItems([]); setLoading(false); setHasMore(false); return }
    cursors.current = { posts: null, achievements: null, postsExhausted: false, achievementsExhausted: false }
    let alive = true
    setLoading(true)
    setError(null)
    fetchPage()
      .then(({ tagged, more }) => {
        if (!alive) return
        setItems(tagged)
        setHasMore(more)
      })
      .catch(err => { if (alive) setError(err) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [key, fetchPage])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const { tagged, more } = await fetchPage()
      setItems(prev => [...prev, ...tagged])
      setHasMore(more)
    } catch (err) {
      setError(err)
      setHasMore(false) // stop retriggering the sentinel against a broken source
    } finally {
      setLoadingMore(false)
    }
  }, [fetchPage, hasMore, loadingMore])

  return { items, loading, loadingMore, hasMore, loadMore, error }
}
