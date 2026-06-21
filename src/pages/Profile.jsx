import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Nav from '../components/Nav'
import Top10Editor from '../components/social/Top10Editor'
import AchievementBadge from '../components/social/AchievementBadge'
import { useAuth } from '../contexts/AuthContext'
import { getProfileByUsername, updateAvatar } from '../lib/db'
import { getProfileStats, getAllStatusRows } from '../lib/collection'
import { ACHIEVEMENTS, getUserAchievements, checkAndUnlockAchievements, getFeedPosts, ACTION_LABEL } from '../lib/social'

const TABS = [
  { id: 'top10', label: 'Top 10' },
  { id: 'achievements', label: 'Conquistas' },
  { id: 'activity', label: 'Atividade' },
]

export default function Profile() {
  const { username } = useParams()
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [unlocked, setUnlocked] = useState([])
  const [genres, setGenres] = useState([])
  const [recentPosts, setRecentPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState('top10')

  const isOwner = profile?.id === user?.id

  useEffect(() => {
    let alive = true
    setLoading(true)
    getProfileByUsername(username).then(async p => {
      if (!alive || !p) { setLoading(false); return }
      setProfile(p)

      const [s, rows, unlockedRows] = await Promise.all([
        getProfileStats(p.id),
        getAllStatusRows(p.id),
        getUserAchievements(p.id),
      ])
      if (!alive) return
      setStats(s)
      setUnlocked(unlockedRows.map(u => u.achievement_id))

      const genreCounts = {}
      for (const r of rows) {
        if (!(r.joguei || r.zerado || r.cem_porcento)) continue
        const game = r._console.games.find(g => g.id === r.game_id)
        for (const genre of game?.genre || []) genreCounts[genre] = (genreCounts[genre] || 0) + 1
      }
      setGenres(Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 6))

      try {
        const posts = await getFeedPosts([p.id], { limit: 8 })
        if (alive) setRecentPosts(posts)
      } catch { /* feed_posts may be empty for this user, ignore */ }

      setLoading(false)
    })
    return () => { alive = false }
  }, [username])

  useEffect(() => {
    if (isOwner && profile) {
      checkAndUnlockAchievements(profile.id).catch(() => {})
    }
  }, [isOwner, profile])

  const totalGames = stats?.total ?? 0

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const url = await updateAvatar(user.id, file)
      setProfile(p => ({ ...p, avatar_url: url }))
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-social-bg">
        <Nav />
        <div className="flex items-center justify-center h-60">
          <div className="w-6 h-6 border-2 border-social border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-social-bg">
        <Nav />
        <p className="text-gray-500 text-sm text-center py-20">Usuário não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-social-bg">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="relative shrink-0">
            <div className="w-20 h-20 bg-[#161d35] border border-[#222b4a] overflow-hidden flex items-center justify-center">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl font-black text-gray-600">{profile.username?.[0]?.toUpperCase()}</span>}
            </div>
            {isOwner && (
              <label className="absolute -bottom-1 -right-1 bg-social text-white text-[9px] font-black px-1.5 py-0.5 cursor-pointer uppercase">
                {uploading ? '...' : 'Editar'}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
              </label>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-black uppercase leading-[0.95] tracking-[-0.03em]">{profile.display_name || profile.username}</h1>
            <p className="text-gray-500 text-sm font-medium">@{profile.username}</p>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-social leading-none">{totalGames}</span>
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">jogos rastreados</span>
            </p>
          </div>
        </div>

        {/* Stats row — plain bold inline numbers, no boxes */}
        {stats && (
          <div className="flex items-center gap-x-6 gap-y-1 flex-wrap mb-10 pb-6 border-b border-[#222b4a]">
            <Stat label="Joguei" value={stats.joguei} />
            <Stat label="Zerado" value={stats.zerado} />
            <Stat label="100%" value={stats.cem_porcento} highlight />
            <Stat label="Quero" value={stats.quero} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-[#222b4a]">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-[12px] font-black uppercase tracking-wide pb-3 -mb-px border-b-2 transition-colors
                ${tab === t.id ? 'border-social text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'top10' && (
          <section>
            <Top10Editor userId={profile.id} isOwner={isOwner} />
          </section>
        )}

        {tab === 'achievements' && (
          <section className="flex flex-wrap gap-2">
            {ACHIEVEMENTS.map(a => (
              <AchievementBadge key={a.id} achievement={a} unlocked={unlocked.includes(a.id)} />
            ))}
          </section>
        )}

        {tab === 'activity' && (
          <section className="space-y-10">
            {genres.length > 0 && (
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-[1.5px] text-gray-500 mb-3">Gêneros Favoritos</h2>
                <div className="space-y-1.5">
                  {genres.map(([genre, count]) => (
                    <div key={genre} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-28 truncate">{genre}</span>
                      <div className="flex-1 h-1.5 bg-[#161d35]">
                        <div className="h-full bg-social" style={{ width: `${(count / genres[0][1]) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-white w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentPosts.length > 0 && (
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-[1.5px] text-gray-500 mb-3">Atividade Recente</h2>
                <div className="space-y-1.5">
                  {recentPosts.map(post => (
                    <div key={post.id} className="text-xs text-gray-400 bg-social-ink border border-[#222b4a] px-3 py-2">
                      {ACTION_LABEL[post.action]} um jogo · {new Date(post.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {genres.length === 0 && recentPosts.length === 0 && (
              <p className="text-gray-600 text-sm">Nenhuma atividade ainda.</p>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

function Stat({ label, value, highlight }) {
  return (
    <p className="flex items-baseline gap-1.5">
      <span className={`text-xl font-black leading-none ${highlight ? 'text-yellow-400' : 'text-white'}`}>{value ?? 0}</span>
      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
    </p>
  )
}
