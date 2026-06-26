import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Nav from '../components/Nav'
import YearRecapStory from '../components/social/YearRecapStory'
import UsersList from '../components/social/UsersList'
import ActivityFeed from '../components/social/ActivityFeed'
import DuelWidget from '../components/social/DuelWidget'
import PollStrip from '../components/social/PollStrip'
import GameCard from '../components/xbox360/GameCard'
import GameModal from '../components/xbox360/GameModal'
import { useAuth } from '../contexts/AuthContext'
import { useFriends } from '../hooks/useFriends'
import { getConsoleCounts, generateInvite } from '../lib/db'
import { getCollection } from '../lib/collection'
import { getFeedPosts, getCommunityRanking, latestPostByUser as buildLatestPostByUser } from '../lib/social'
import { getConsole } from '../consoles/registry'

const CONSOLES = [
  { id: 'xbox360',    label: 'Xbox 360',    color: 'xbox',       ready: true,  logo: '/logos/xbox360.svg'    },
  { id: 'ps2',        label: 'PS2',         color: 'ps',         ready: true,  logo: '/logos/ps2.svg'        },
  { id: 'ps3',        label: 'PS3',         color: 'ps3',        ready: true,  logo: '/logos/ps3.svg'        },
  { id: 'snes',       label: 'SNES',        color: 'snes',       ready: true,  logo: '/logos/snes.svg'       },
  { id: 'nsw',        label: 'Switch',      color: 'nsw',        ready: true,  logo: '/logos/nsw.svg'        },
  { id: 'n64',        label: 'N64',         color: 'n64',        ready: true,  logo: '/logos/n64.svg'        },
  { id: 'gamecube',   label: 'GameCube',    color: 'gcube',      ready: true,  logo: '/logos/gamecube.svg'   },
  { id: 'wii',        label: 'Wii',         color: 'wii',        ready: true,  logo: '/logos/wii.svg'        },
  { id: 'ps4',        label: 'PS4',         color: 'ps4',        ready: true,  logo: '/logos/ps4.svg'        },
  { id: 'xboxone',    label: 'Xbox One',    color: 'xboxone',    ready: false, logo: '/logos/xboxone.svg'    },
  { id: 'xboxseries', label: 'Xbox Series', color: 'xboxseries', ready: false, logo: '/logos/xboxseries.svg' },
  { id: 'pc',         label: 'PC',          color: 'pc',         ready: false, logo: '/logos/pc.svg'         },
  { id: 'gba',        label: 'GBA',         color: 'gba',        ready: true,  logo: '/logos/gba.svg'        },
  { id: 'gbc',        label: 'GBC',         color: 'gbc',        ready: false, logo: '/logos/gbc.svg'        },
  { id: '3ds',        label: '3DS',         color: 'n3ds',       ready: false, logo: '/logos/3ds.svg'        },
  { id: 'xboxorig',   label: 'Xbox',        color: 'xboxorig',   ready: false, logo: '/logos/xboxorig.svg'   },
  { id: 'ps5',        label: 'PS5',         color: 'ps5',        ready: false, logo: '/logos/ps5.svg'        },
  { id: 'wiiu',       label: 'Wii U',       color: 'wiiu',       ready: false, logo: '/logos/wiiu.svg'       },
  { id: 'nds',        label: 'Nintendo DS', color: 'nds',        ready: false, logo: '/logos/nds.svg'        },
  { id: 'dsi',        label: 'Nintendo DSi',color: 'dsi',        ready: false, logo: '/logos/dsi.svg'        },
  { id: 'psp',        label: 'PSP',         color: 'psp',        ready: false, logo: '/logos/psp.svg'        },
  { id: 'vita',       label: 'PS Vita',     color: 'vita',       ready: false, logo: '/logos/vita.svg'       },
]

const ACCENT_MAP = {
  xbox:       { border: 'border-xbox/40',   bg: 'hover:bg-xbox/10'   },
  ps:         { border: 'border-blue-600/40', bg: 'hover:bg-blue-900/20' },
  ps3:        { border: 'border-cyan-600/40', bg: 'hover:bg-cyan-900/20' },
  snes:       { border: 'border-red-700/40',  bg: 'hover:bg-red-900/20'  },
  n64:        { border: 'border-blue-500/40', bg: 'hover:bg-blue-900/20' },
  gcube:      { border: 'border-purple-600/40', bg: 'hover:bg-purple-900/20' },
  nsw:        { border: 'border-red-500/40', bg: 'hover:bg-white/10' },
  ps4:        { border: 'border-blue-600/40', bg: 'hover:bg-blue-900/20' },
  xboxone:    { border: 'border-xbox/40',     bg: 'hover:bg-xbox/10'      },
  xboxseries: { border: 'border-xbox/40',     bg: 'hover:bg-xbox/10'      },
  pc:         { border: 'border-sky-500/40',  bg: 'hover:bg-sky-900/20'   },
  gba:        { border: 'border-indigo-600/40', bg: 'hover:bg-indigo-900/20' },
  gbc:        { border: 'border-violet-500/40', bg: 'hover:bg-violet-900/20' },
  n3ds:       { border: 'border-red-600/40',  bg: 'hover:bg-red-900/20'   },
  wii:   { border: 'border-gray-500/40', bg: 'hover:bg-gray-800/20' },
  xboxorig:   { border: 'border-xbox/40',     bg: 'hover:bg-xbox/10'      },
  ps5:        { border: 'border-blue-700/40', bg: 'hover:bg-blue-900/20' },
  wiiu:       { border: 'border-teal-500/40', bg: 'hover:bg-teal-900/20' },
  nds:        { border: 'border-blue-400/40', bg: 'hover:bg-blue-900/20' },
  dsi:        { border: 'border-neutral-400/40', bg: 'hover:bg-neutral-800/20' },
  psp:        { border: 'border-slate-400/40', bg: 'hover:bg-slate-800/20' },
  vita:       { border: 'border-indigo-400/40', bg: 'hover:bg-indigo-900/20' },
}

export default function Home() {
  const navigate      = useNavigate()
  const { user }       = useAuth()
  const { friends, loading: friendsLoading } = useFriends(user?.id)
  const [counts, setCounts]     = useState({})
  const [inviteCode, setInviteCode] = useState(null)
  const [copying, setCopying]   = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)

  // Small, separate fetch used only to sort the Stories rail by recency — the dominant
  // feed section below fetches/paginates its own posts via ActivityFeed/useActivityFeed.
  const [feedPosts, setFeedPosts]       = useState([])
  const [rankingRows, setRankingRows]   = useState([])
  const [rankingLoading, setRankingLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const userIds = [user.id, ...friends.map(f => f.id)]
    getFeedPosts(userIds, { limit: 20, viewerId: user.id }).then(posts => setFeedPosts(posts))
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
    getConsoleCounts('nsw', user.id).then(c => setCounts(prev => ({ ...prev, nsw: c })))
    getConsoleCounts('gba', user.id).then(c => setCounts(prev => ({ ...prev, gba: c })))
    getConsoleCounts('wii', user.id).then(c => setCounts(prev => ({ ...prev, wii: c })))
    getConsoleCounts('ps4', user.id).then(c => setCounts(prev => ({ ...prev, ps4: c })))
    getConsoleCounts('n64', user.id).then(c => setCounts(prev => ({ ...prev, n64: c })))
    getConsoleCounts('gamecube', user.id).then(c => setCounts(prev => ({ ...prev, gamecube: c })))
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
        return s && (s.joguei || s.zerado || s.cem_porcento || s.quero || s.jogando)
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

        {/* Header row — page title left, full-screen retrospective CTA right */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[11px] font-black uppercase tracking-[1.5px] text-social">Feed dos Amigos</h1>
          {user && (
            <button
              onClick={() => setRecapOpen(true)}
              className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[1.5px] text-gray-300 hover:text-social transition-colors"
            >
              ✦ Ver Retrospectiva {new Date().getFullYear()}
            </button>
          )}
        </div>

        {recapOpen && (
          <YearRecapStory userId={user.id} subject="Você" onClose={() => setRecapOpen(false)} />
        )}

        {/* Friends on the left, dominant infinite feed on the right */}
        <div className="grid lg:grid-cols-[220px_1fr] gap-6 mb-12">
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
              />
            )}
            <div className="text-right">
              <Link to="/feed" className="text-[11px] font-bold text-gray-500 hover:text-white">Ver feed completo →</Link>
            </div>
          </section>
        </div>

        {/* Community ranking — demoted to a small link-out card, feed is the priority now */}
        <Link
          to="/rankings"
          className="block mb-12 bg-surface-2 border border-surface-4 hover:border-social/40 px-5 py-4 transition-colors"
        >
          <p className="text-[11px] font-black uppercase tracking-[1.5px] text-social mb-1">Melhores de Todos os Tempos</p>
          <p className="text-gray-500 text-sm">
            {rankingLoading
              ? 'Carregando ranking da comunidade…'
              : rankingRows.length === 0
                ? 'Nenhum Top 10 foi salvo ainda — ver ranking completo →'
                : `${rankingRows[0]?.game?.title} lidera o ranking da comunidade — ver completo →`}
          </p>
        </Link>

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
                <img src={c.logo} alt={c.label} className="h-8 max-w-[85%] object-contain object-left mb-3" />

                {c.ready && count ? (
                  <div className="mt-3 space-y-1">
                    <Stat label="Jogando" val={count.jogando} />
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
