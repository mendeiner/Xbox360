import { useEffect, useRef } from 'react'
import { useActivityFeed } from '../../hooks/useActivityFeed'
import FeedPostCard from './FeedPostCard'
import AchievementFeedCard from './AchievementFeedCard'

// Shared infinite-scroll timeline used by both Home (dense) and Feed.jsx (full) — merges
// feed_posts + achievement unlocks via useActivityFeed, renders the right card per item
// kind, and loads more as the sentinel div enters the viewport.
export default function ActivityFeed({ userIds, viewerId, currentUserId, emptyMessage }) {
  const { items, loading, loadingMore, hasMore, loadMore, error } = useActivityFeed(userIds, viewerId)
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore()
    }, { rootMargin: '400px' })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  if (loading) {
    return (
      <div className="h-24 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-social border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && items.length === 0) {
    return <p className="text-gray-600 text-sm">Não foi possível carregar o feed agora. Tente novamente em breve.</p>
  }

  if (items.length === 0) {
    return <p className="text-gray-600 text-sm">{emptyMessage || 'Nenhuma atividade compartilhada ainda.'}</p>
  }

  return (
    <div className="space-y-5">
      {items.map((item, i) => {
        // posts have an `id`; user_achievements rows have a composite PK (user_id,
        // achievement_id) instead, so the key must branch per kind.
        const itemKey = item.kind === 'post'
          ? `post-${item.data.id}`
          : `achievement-${item.data.user_id}-${item.data.achievement_id}`
        return (
          <div key={itemKey} className={i < 8 ? 'fade-in-up' : ''} style={i < 8 ? { animationDelay: `${i * 40}ms` } : undefined}>
            {item.kind === 'post'
              ? <FeedPostCard post={item.data} currentUserId={currentUserId} />
              : <AchievementFeedCard unlock={item.data} />}
          </div>
        )
      })}

      {hasMore && (
        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {loadingMore && <div className="w-5 h-5 border-2 border-social border-t-transparent rounded-full animate-spin" />}
        </div>
      )}
    </div>
  )
}
