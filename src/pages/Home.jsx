import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Nav from '../components/Nav'
import YearRecap from '../components/social/YearRecap'
import UsersList from '../components/social/UsersList'
import FeedPostCard from '../components/social/FeedPostCard'
import RankingRow from '../components/social/RankingRow'
import GameCard from '../components/xbox360/GameCard'
import GameModal from '../components/xbox360/GameModal'
import { useAuth } from '../contexts/AuthContext'
import { useFriends } from '../hooks/useFriends'
import { getConsoleCounts, generateInvite } from '../lib/db'
import { getCollection } from '../lib/collection'
import { getFeedPosts, getCommunityRanking, latestPostByUser as buildLatestPostByUser } from '../lib/social'
import { getConsole } from '../consoles/registry'

const CONSOLES = [
  { id: 'xbox360', label: 'Xbox 360',  color: 'xbox',   textColor: 'text-xbox',  ready: true  },
  { id: 'ps2',     label: 'PS2',       color: 'ps',     textColor: 'text-blue-400', ready: true },
  { id: 'ps3',     label: 'PS3',       color: 'ps3',    textColor: 'text-cyan-400', ready: true  },
  { id: 'snes',    label: 'SNES',      color: 'snes',   textColor: 'text-red-400',  ready: true },
  { id: 'n64',     label: 'N64',       color: 'n64',    textColor: 'text-blue-300', ready: false },
  { id: 'gamecube',label: 'GameCube',  color: 'gcube',  textColor: 'text-purple-400', ready: false },
  { id: 'wii',     label: 'Wii',       color: 'wii',    textColor: 'text-gray-300', ready: false },
]

const ACCENT_MAP = {
  xbox:  { border: 'border-xbox/40',   bg: 'hover:bg-xbox/10',   dot: 'bg-xbox'   },
  ps:    { border: 'border-blue-600/40', bg: 'hover:bg-blue-900/20', dot: 'bg-blue-500' },
  ps3:   { border: 'border-cyan-600/40', bg: 'hover:bg-cyan-900/20', dot: 'bg-cyan-500' },
  snes:  { border: 'border-red-700/40',  bg: 'hover:bg-red-900/20',  dot: 'bg-red-500'  },
  n64:   { border: 'border-blue-500/40', bg: 'hover:bg-blue-900/20', dot: 'bg-blue-400' },
  gcube: { border: 'border-purple-600/40', bg: 'hover:bg-purple-900/20', dot: 'bg-purple-500' },
  wii:   { border: 'border-gray-500/40', bg: 'hover:bg-gray-800/20', dot: 'bg-gray-400' },
}

export default function Home() {
  const navigate      = useNavigate()
  const { user }       = useAuth()
  const { friends, loading: friendsLoading } = useFriends(user?.id)
  const [counts, setCounts]     = useState({})
  const [inviteCode, setInviteCode] = useState(null)
  const [copying, setCopying]   = useState(false)

  const [feedPosts, setFeedPosts]       = useState([])
  const [feedLoading, setFeedLoading]   = useState(true)
  const [rankingRows, setRankingRows]   = useState([])
  const [rankingLoading, setRankingLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const userIds = [user.id, ...friends.map(f => f.id)]
    setFeedLoading(true)
    getFeedPosts(userIds, { limit: 20, viewerId: user.id }).then(posts => { setFeedPosts(posts); setFeedLoading(false) })
  }, [user, friends])

  useEffect(() => {
    if (!user) return
    setRankingLoading(true)
    getCommunityRanking(5).then(rows => {
      const resolved = rows
        .map(r => {
          const console_ = getConsole(r.console)
          const game = console_?.games.find(g => g.id === r.game_id)
          return game ? { ...r, game, console: console_ } : null
        })
        .filter(Boolean)
      setRankingRows(resolved)
      setRankingLoading(false)
    })
  }, [user])

  // Most recent shared post per friend, for the users list's "last game added" line.
  const latestPostByUser = buildLatestPostByUser(feedPosts)

  const [groups,  setGroups]  = useState([])
  const [collectionLoading, setCollectionLoading] = useState(true)
  const [selectedConsoleId, setSelectedConsoleId] = useState(null)
  const [selectedList,      setSelectedList]      = useState(null)
  const [selectedIndex,     setSelectedIndex]      = useState(0)

  useEffect(() => {
    if (!user) return
    getConsoleCounts('xbox360', user.id).then(c => setCounts(prev => ({ ...prev, xbox360: c })))
    getConsoleCounts('ps2', user.id).then(c => setCounts(prev => ({ ...prev, ps2: c })))
    getConsoleCounts('ps3', user.id).then(c => setCounts(prev => ({ ...prev, ps3: c })))
    getConsoleCounts('snes', user.id).then(c => setCounts(prev => ({ ...prev, snes: c })))
  }, [user])

  useEffect(() => {
    if (!user) { setCollectionLoading(false); return }
    let alive = true
    getCollection()
      .then(g => { if (alive) setGroups(g) })
      .finally(() => { if (alive) setCollectionLoading(false) })
    return () => { alive = false }
  }, [user])

  const handleStatusChange = useCallback((consoleId, gameId, key, value) => {
    setGroups(prev => prev.map(g => {
      if (g.console.id !== consoleId) return g
      const statuses = { ...g.statuses, [gameId]: { ...(g.statuses[gameId] || {}), [key]: value } }
      const games = g.console.games.filter(game => {
        const s = statuses[game.id]
        return s && (s.joguei || s.zerado || s.cem_porcento || s.quero)
      })
      return { ...g, statuses, games }
    }).filter(g => g.games.length > 0))
  }, [])

  function openGame(consoleId, list, game) {
    const idx = list.findIndex(g => g.id === game.id)
    setSelectedConsoleId(consoleId)
    setSelectedList(list)
    setSelectedIndex(idx === -1 ? 0 : idx)
  }
  function closeGame() { setSelectedConsoleId(null); setSelectedList(null); setSelectedIndex(0) }
  const goPrev = () => setSelectedIndex(i => Math.max(0, i - 1))
  const goNext = () => setSelectedIndex(i => Math.min((selectedList?.length || 1) - 1, i + 1))

  const selectedGroup  = groups.find(g => g.console.id === selectedConsoleId)
  const selected       = selectedList ? selectedList[selectedIndex] : null
  const selectedStatus = selected && selectedGroup ? (selectedGroup.statuses[selected.id] || {}) : {}

  async function handleGenerateInvite() {
    const code = await generateInvite(user.id)
    setInviteCode(code)
  }

  async function handleCopyInvite() {
    const url = `${window.location.origin}/?invite=${inviteCode}`
    await navigator.clipboard.writeText(url)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  return (
    <div className="min-h-screen bg-surface-1">
      <Nav />

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Year Recap — seasonal showpiece, first thing on the page */}
        <YearRecap userId={user?.id} />

        {/* Central Social hub — real Feed/Rankings content, with the users list on the left */}
        <div className="grid lg:grid-cols-[220px_1fr] gap-6 mb-12">
          <UsersList friends={friends} latestPostByUser={latestPostByUser} loading={friendsLoading} />

          <div className="space-y-10 min-w-0">
            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-[11px] font-black uppercase tracking-[1.5px] text-social">Feed dos Amigos</h2>
                <Link to="/feed" className="text-[11px] font-bold text-gray-500 hover:text-white">Ver tudo →</Link>
              </div>
              {feedLoading ? (
                <div className="h-24 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-social border-t-transparent rounded-full animate-spin" />
                </div>
              ) : feedPosts.length === 0 ? (
                <p className="text-gray-600 text-sm">Nenhuma atividade compartilhada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {feedPosts.slice(0, 4).map(post => (
                    <FeedPostCard key={post.id} post={post} currentUserId={user?.id} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-[11px] font-black uppercase tracking-[1.5px] text-social">Melhores de Todos os Tempos</h2>
                <Link to="/rankings" className="text-[11px] font-bold text-gray-500 hover:text-white">Ver tudo →</Link>
              </div>
              {rankingLoading ? (
                <div className="h-24 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-social border-t-transparent rounded-full animate-spin" />
                </div>
              ) : rankingRows.length === 0 ? (
                <p className="text-gray-600 text-sm">Nenhum Top 10 foi salvo ainda.</p>
              ) : (
                <div className="space-y-1">
                  {rankingRows.map((row, i) => (
                    <RankingRow key={`${row.console.id}:${row.game.id}`} rank={i + 1} row={row} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Console picker */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Meu Catálogo</h2>
            <p className="text-gray-500 text-sm mt-1 font-medium">Escolha um console para ver seus jogos</p>
          </div>

          {/* Invite section */}
          <div className="flex items-center gap-3">
            {inviteCode ? (
              <div className="flex items-center gap-2">
                <code className="bg-surface-3 border border-surface-4 px-3 py-2 rounded-lg text-xs font-mono text-xbox tracking-widest">
                  {inviteCode}
                </code>
                <button
                  onClick={handleCopyInvite}
                  className="text-xs bg-xbox/20 hover:bg-xbox/30 text-xbox border border-xbox/30 px-3 py-2 rounded-lg transition-colors font-semibold"
                >
                  {copying ? 'Copiado!' : 'Copiar link'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateInvite}
                className="text-xs text-gray-400 hover:text-white border border-surface-4 hover:border-gray-500 px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                + Convidar amigo
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {CONSOLES.map(c => {
            const accent  = ACCENT_MAP[c.color]
            const count   = counts[c.id]
            return (
              <button
                key={c.id}
                onClick={() => c.ready && navigate(`/${c.id}`)}
                disabled={!c.ready}
                className={`relative text-left p-5 rounded-2xl border bg-surface-2 transition-all duration-200
                  ${c.ready
                    ? `${accent.border} ${accent.bg} cursor-pointer hover:scale-[1.02] active:scale-[0.98]`
                    : 'border-surface-4 opacity-40 cursor-not-allowed'
                  }`}
              >
                {/* Color dot */}
                <div className={`w-2.5 h-2.5 rounded-full ${accent.dot} mb-3`} />

                <p className={`font-black text-lg leading-tight ${c.ready ? c.textColor : 'text-gray-500'}`}>
                  {c.label}
                </p>

                {c.ready && count ? (
                  <div className="mt-3 space-y-1">
                    <Stat label="Joguei"  val={count.joguei} />
                    <Stat label="Zerado"  val={count.zerado} />
                    <Stat label="100%"    val={count.cem_porcento} gold />
                  </div>
                ) : c.ready ? (
                  <p className="text-gray-600 text-xs mt-3 font-medium">Nenhum jogo ainda</p>
                ) : (
                  <p className="text-gray-700 text-xs mt-3 font-semibold uppercase tracking-widest">Em breve</p>
                )}
              </button>
            )
          })}
        </div>

        {/* My marked games, grouped by console */}
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-1">Meus Jogos</h2>
          <p className="text-gray-500 text-sm mb-8 font-medium">Seus jogos marcados em todos os consoles</p>

          {collectionLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-xbox border-t-transparent rounded-full animate-spin" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-gray-600 text-sm">
              Você ainda não marcou nenhum jogo. Vá para um console e marque alguns!
            </div>
          ) : (
            <div className="space-y-10">
              {groups.map(g => (
                <section key={g.console.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3
                      className="text-lg font-black tracking-tight pl-2.5 border-l-[3px] leading-none"
                      style={{ borderColor: g.console.accentColor }}
                    >
                      {g.console.label}
                    </h3>
                    <span className="text-[11px] text-gray-500 bg-surface-3 border border-surface-4 rounded-full px-2.5 py-0.5 font-semibold">
                      {g.games.length}
                    </span>
                  </div>
                  <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                    {g.games.map(game => (
                      <GameCard
                        key={game.id}
                        game={game}
                        consoleId={g.console.id}
                        status={g.statuses[game.id] || {}}
                        onStatusChange={(gameId, key, value) => handleStatusChange(g.console.id, gameId, key, value)}
                        onClick={gm => openGame(g.console.id, g.games, gm)}
                        gridMode
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      {selected && (
        <GameModal
          game={selected}
          consoleId={selectedConsoleId}
          status={selectedStatus}
          onStatusChange={(gameId, key, value) => handleStatusChange(selectedConsoleId, gameId, key, value)}
          onClose={closeGame}
          onPrev={selectedIndex > 0 ? goPrev : null}
          onNext={selectedList && selectedIndex < selectedList.length - 1 ? goNext : null}
        />
      )}
    </div>
  )
}

function Stat({ label, val, gold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs font-semibold ${gold ? 'text-yellow-500' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-xs font-black ${gold ? 'text-yellow-400' : 'text-white'}`}>{val ?? 0}</span>
    </div>
  )
}
