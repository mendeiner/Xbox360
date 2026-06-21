import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Nav from '../components/Nav'
import Top10Editor from '../components/social/Top10Editor'
import AchievementBadge from '../components/social/AchievementBadge'
import AvatarCropModal from '../components/social/AvatarCropModal'
import PollResultCard from '../components/social/PollResultCard'
import { coverSrc, coverObjectPosition } from '../consoles/dl'
import { readyConsoles } from '../consoles/registry'
import { useAuth } from '../contexts/AuthContext'
import { getProfileByUsername, updateAvatar } from '../lib/db'
import { getProfileStats, getAllStatusRows, getTasteProfile, getConsoleCompletion } from '../lib/collection'
import { ACHIEVEMENTS, getUserAchievements, checkAndUnlockAchievements, getFeedPosts, ACTION_LABEL } from '../lib/social'
import { getClosedPollsByCreator, getPollResults } from '../lib/polls'

const TABS = [
  { id: 'collection', label: 'Coleção' },
  { id: 'top10', label: 'Top 10' },
  { id: 'achievements', label: 'Conquistas' },
  { id: 'activity', label: 'Atividade' },
  { id: 'polls', label: 'Votações' },
]

// Groups this profile's status rows by console into "estante" shelves: the main row of
// marked games, a completion %, and a softly-framed "Decepções" row (low-rated games the
// user actually finished, not just owned/wanted) — the negative-signal feature, reusing
// the existing 1-5 star rating instead of a new dislike flag.
function buildShelves(rows) {
  const byConsole = {}
  for (const r of rows) (byConsole[r.console] ||= []).push(r)

  return readyConsoles()
    .map(console_ => {
      const consoleRows = byConsole[console_.id] || []
      const marked = consoleRows.filter(r => r.joguei || r.zerado || r.cem_porcento || r.quero)
      if (!marked.length) return null

      const games = marked
        .map(r => ({ game: console_.games.find(g => g.id === r.game_id), row: r }))
        .filter(x => x.game)

      const decepcoes = games.filter(({ row }) =>
        (row.joguei || row.zerado || row.cem_porcento) && row.rating && row.rating <= 2
      )

      return {
        console: console_,
        games,
        decepcoes,
        completion: getConsoleCompletion(rows, console_),
      }
    })
    .filter(Boolean)
}

export default function Profile() {
  const { username } = useParams()
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [unlocked, setUnlocked] = useState([])
  const [genres, setGenres] = useState([])
  const [shelves, setShelves] = useState([])
  const [recentPosts, setRecentPosts] = useState([])
  const [closedPolls, setClosedPolls] = useState([])
  const [pollResults, setPollResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState(null)
  const [tab, setTab] = useState('collection')

  const isOwner = profile?.id === user?.id

  useEffect(() => {
    let alive = true
    setLoading(true)
    getProfileByUsername(username).then(async p => {
      if (!alive || !p) { setLoading(false); return }
      setProfile(p)

      const [s, rows, unlockedRows, taste] = await Promise.all([
        getProfileStats(p.id),
        getAllStatusRows(p.id),
        getUserAchievements(p.id),
        getTasteProfile(p.id),
      ])
      if (!alive) return
      setStats(s)
      setUnlocked(unlockedRows.map(u => u.achievement_id))
      setGenres(taste)
      setShelves(buildShelves(rows))

      try {
        const posts = await getFeedPosts([p.id], { limit: 8 })
        if (alive) setRecentPosts(posts)
      } catch { /* feed_posts may be empty for this user, ignore */ }

      try {
        const polls = await getClosedPollsByCreator(p.id)
        if (alive) setClosedPolls(polls)
        const res = {}
        await Promise.all(polls.map(async poll => { res[poll.id] = await getPollResults(poll.id) }))
        if (alive) setPollResults(res)
      } catch { /* no closed polls yet, ignore */ }

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

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    setCropSrc(URL.createObjectURL(file))
  }

  async function handleCropSave(blob) {
    if (!user) return
    setUploading(true)
    try {
      const url = await updateAvatar(user.id, blob)
      setProfile(p => ({ ...p, avatar_url: url }))
      setCropSrc(null)
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
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onCancel={() => setCropSrc(null)}
          onSave={handleCropSave}
        />
      )}
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

        {tab === 'collection' && (
          <section className="space-y-10">
            {shelves.length === 0 ? (
              <p className="text-gray-600 text-sm">Nenhum jogo marcado ainda.</p>
            ) : (
              shelves.map(shelf => (
                <div key={shelf.console.id}>
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className="text-base font-black tracking-tight pl-2.5 border-l-[3px] leading-none"
                      style={{ borderColor: shelf.console.accentColor }}
                    >
                      {shelf.console.label}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{shelf.completion}% completo</span>
                  </div>
                  <div className="h-1 bg-[#161d35] mb-3">
                    <div className="h-full bg-social" style={{ width: `${shelf.completion}%` }} />
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {shelf.games.map(({ game }) => (
                      <img
                        key={game.id}
                        src={coverSrc(game, shelf.console) || undefined}
                        alt={game.title}
                        title={game.title}
                        className="w-16 h-[88px] object-cover bg-[#0a0a0a] shrink-0"
                        style={{ objectPosition: coverObjectPosition(shelf.console) }}
                        onError={e => { e.target.style.display = 'none' }}
                      />
                    ))}
                  </div>

                  {shelf.decepcoes.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-600 mb-1.5">Decepções</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {shelf.decepcoes.map(({ game, row }) => (
                          <img
                            key={game.id}
                            src={coverSrc(game, shelf.console) || undefined}
                            alt={game.title}
                            title={`${game.title} · ★ ${row.rating}`}
                            className="w-11 h-[60px] object-cover bg-[#0a0a0a] shrink-0 opacity-60"
                            style={{ objectPosition: coverObjectPosition(shelf.console) }}
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        )}

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

        {tab === 'polls' && (
          <section className="space-y-3">
            {closedPolls.length === 0 ? (
              <p className="text-gray-600 text-sm">Nenhuma votação encerrada ainda.</p>
            ) : (
              closedPolls.map(poll => (
                <PollResultCard key={poll.id} poll={poll} results={pollResults[poll.id]} />
              ))
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
