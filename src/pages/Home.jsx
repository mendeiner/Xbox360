import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import YearRecapStory from '../components/social/YearRecapStory'
import UsersList from '../components/social/UsersList'
import ActivityFeed from '../components/social/ActivityFeed'
import DuelWidget from '../components/social/DuelWidget'
import PollStrip from '../components/social/PollStrip'
import AchievementsWidget from '../components/social/AchievementsWidget'
import PhotoPostComposer from '../components/social/PhotoPostComposer'
import { useAuth } from '../contexts/AuthContext'
import { useFriends } from '../hooks/useFriends'
import { getFeedPosts, getRecentAchievementUnlocks, latestPostByUser as buildLatestPostByUser } from '../lib/social'

export default function Home() {
  const { user }       = useAuth()
  const { friends, loading: friendsLoading } = useFriends(user?.id)
  const [recapOpen, setRecapOpen] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [feedReloadKey, setFeedReloadKey] = useState(0)

  // Small, separate fetch used only to sort the Stories rail by recency — the dominant
  // feed section below fetches/paginates its own posts via ActivityFeed/useActivityFeed.
  const [feedPosts, setFeedPosts]       = useState([])
  const [achievementUnlocks, setAchievementUnlocks] = useState([])

  useEffect(() => {
    if (!user) return
    const userIds = [user.id, ...friends.map(f => f.id)]
    getFeedPosts(userIds, { limit: 20, viewerId: user.id }).then(posts => setFeedPosts(posts))
    getRecentAchievementUnlocks(userIds, { limit: 8 }).then(unlocks => setAchievementUnlocks(unlocks))
  }, [user, friends])

  // Most recent shared post per friend, for the users list's "last game added" line.
  const latestPostByUser = buildLatestPostByUser(feedPosts)

  return (
    <div className="min-h-screen bg-surface-1">
      <Nav />

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Mobile-only quick link — desktop reaches Consoles via the nav bar instead */}
        <Link
          to="/consoles"
          className="sm:hidden block mb-6 text-center text-[11px] font-black uppercase tracking-[1.5px] bg-surface-2 border border-surface-4 hover:border-social/40 text-social px-4 py-2.5 rounded-lg transition-colors"
        >
          Ver Consoles
        </Link>

        {/* Header row — page title left, full-screen retrospective CTA right */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[11px] font-black uppercase tracking-[1.5px] text-social">Feed dos Amigos</h1>
          {user && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setComposerOpen(true)}
                className="px-3 py-1.5 text-[11px] font-black uppercase tracking-[1.5px] bg-social text-white hover:bg-social/90"
              >
                Compartilhar foto
              </button>
              <button
                onClick={() => setRecapOpen(true)}
                className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[1.5px] text-gray-300 hover:text-social transition-colors"
              >
                ✦ Ver Retrospectiva {new Date().getFullYear()}
              </button>
            </div>
          )}
        </div>

        {recapOpen && (
          <YearRecapStory userId={user.id} subject="Você" onClose={() => setRecapOpen(false)} />
        )}

        {composerOpen && (
          <PhotoPostComposer
            userId={user.id}
            onCancel={() => setComposerOpen(false)}
            onPosted={() => {
              setComposerOpen(false)
              setFeedReloadKey(k => k + 1)
            }}
          />
        )}

        {/* Friends on the left, dominant infinite feed in the middle, achievements on the right (desktop) */}
        <div className="grid lg:grid-cols-[220px_1fr_240px] gap-6 mb-12">
          <div className="space-y-6">
            <UsersList friends={friends} latestPostByUser={latestPostByUser} loading={friendsLoading} viewerId={user?.id} />
            {user && <PollStrip userId={user.id} userIds={[user.id, ...friends.map(f => f.id)]} />}
            <DuelWidget userId={user?.id} />
          </div>

          <section className="min-w-0 space-y-6">
            {user && (
              <ActivityFeed
                userIds={[user.id, ...friends.map(f => f.id)]}
                viewerId={user.id}
                currentUserId={user.id}
                reloadKey={feedReloadKey}
              />
            )}
            <div className="text-right">
              <Link to="/feed" className="text-[11px] font-bold text-gray-500 hover:text-white">Ver feed completo →</Link>
            </div>
          </section>

          <aside className="hidden lg:block">
            <div className="lg:sticky lg:top-[88px]">
              <AchievementsWidget unlocks={achievementUnlocks} />
            </div>
          </aside>
        </div>

      </main>
    </div>
  )
}
