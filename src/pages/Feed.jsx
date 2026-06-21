import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import ActivityFeed from '../components/social/ActivityFeed'
import UsersList from '../components/social/UsersList'
import { useAuth } from '../contexts/AuthContext'
import { useFriends } from '../hooks/useFriends'
import { getFeedPosts, getRecentComments, latestPostByUser as buildLatestPostByUser } from '../lib/social'
import { getProfileStats } from '../lib/collection'

export default function Feed() {
  const { user, profile } = useAuth()
  const { friends, loading: friendsLoading } = useFriends(user?.id)

  // Small fetch kept only to sort UsersList by recency and feed the community-pulse right
  // rail — the main timeline itself is fetched/paginated by ActivityFeed below.
  const [latestPosts, setLatestPosts] = useState([])
  const [recentComments, setRecentComments] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!user) return
    const userIds = [user.id, ...friends.map(f => f.id)]
    let alive = true
    Promise.all([
      getFeedPosts(userIds, { limit: 20, viewerId: user.id }),
      getRecentComments(userIds, 15),
      getProfileStats(user.id),
    ]).then(([posts, comments, profileStats]) => {
      if (!alive) return
      setLatestPosts(posts)
      setRecentComments(comments)
      setStats(profileStats)
    })
    return () => { alive = false }
  }, [user, friends])

  const latestPostByUser = buildLatestPostByUser(latestPosts)

  return (
    <div className="min-h-screen bg-social-bg">
      <Nav />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-[220px_1fr_240px] gap-6">

          {/* Left rail — me + users list */}
          <aside className="lg:sticky lg:top-[88px] lg:self-start space-y-6">
            <div className="bg-social-ink border border-[#222b4a] p-4">
              <div className="w-12 h-12 bg-[#161d35] border border-[#222b4a] flex items-center justify-center text-lg font-black text-gray-400 mb-3">
                {profile?.username?.[0]?.toUpperCase()}
              </div>
              <p className="font-black text-white truncate">{profile?.display_name || profile?.username}</p>
              <p className="text-3xl font-black text-social leading-none mt-3">{stats?.total ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-4">jogos rastreados</p>
              <Link to={`/u/${profile?.username}`} className="block text-[11px] font-black uppercase tracking-wide text-gray-400 hover:text-social py-1.5 border-t border-[#222b4a]">
                Meu perfil →
              </Link>
            </div>

            <UsersList friends={friends} latestPostByUser={latestPostByUser} loading={friendsLoading} />
          </aside>

          {/* Center — feed */}
          <main className="min-w-0">
            <h1 className="text-[clamp(2rem,5vw,3rem)] font-black uppercase leading-[0.95] tracking-[-0.03em] mb-1" style={{ textWrap: 'balance' }}>
              Feed dos <span className="text-social">Amigos</span>
            </h1>
            <p className="text-gray-500 text-sm font-medium mb-8">
              Atividades que seus amigos escolheram compartilhar.
            </p>

            {user && (
              <ActivityFeed
                userIds={[user.id, ...friends.map(f => f.id)]}
                viewerId={user.id}
                currentUserId={user.id}
                emptyMessage='Nenhuma atividade compartilhada ainda. Marque um jogo como jogado/zerado/100% e escolha "Compartilhar no feed".'
              />
            )}

            {/* Community pulse — desktop: hidden here, shown in right rail. Mobile: shown below feed. */}
            {recentComments.length > 0 && (
              <section className="mt-10 lg:hidden">
                <CommunityPulse comments={recentComments} />
              </section>
            )}
          </main>

          {/* Right rail — community pulse (desktop only) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[88px]">
              {recentComments.length > 0 && <CommunityPulse comments={recentComments} />}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function CommunityPulse({ comments }) {
  return (
    <div>
      <h2 className="text-[11px] font-black uppercase tracking-[1.5px] text-gray-500 mb-3">Pulso da Comunidade</h2>
      <div className="space-y-3">
        {comments.map(c => (
          <Link key={c.id} to="/feed" className="block group">
            <p className="text-[12px] leading-snug">
              <span className="font-black text-white group-hover:text-social transition-colors">{c.profiles?.username}</span>
              <span className="text-gray-500"> comentou em </span>
              <span className="font-bold text-gray-300">{c.feed_posts?.profiles?.username}</span>
            </p>
            <p className="text-[12px] text-gray-500 truncate">"{c.body}"</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
