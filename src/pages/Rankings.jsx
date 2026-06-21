import { useState, useEffect, useMemo } from 'react'
import Nav from '../components/Nav'
import RankingRow, { PodiumCard } from '../components/social/RankingRow'
import MetacriticRow, { MetacriticPodiumCard } from '../components/social/MetacriticRow'
import { getConsole, readyConsoles } from '../consoles/registry'
import { getCommunityRanking } from '../lib/social'
import { getMetacriticRankings } from '../lib/metacritic'

const TABS = [
  { id: 'comunidade', label: 'Comunidade' },
  { id: 'metacritic', label: 'Metacritic' },
]

export default function Rankings() {
  const [tab, setTab] = useState('comunidade')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getCommunityRanking(50).then(data => {
      if (!alive) return
      const resolved = data
        .map(r => {
          const console_ = getConsole(r.console)
          const game = console_?.games.find(g => g.id === r.game_id)
          return game ? { ...r, game, console: console_ } : null
        })
        .filter(Boolean)
      setRows(resolved)
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const { byConsole, overall } = useMemo(() => getMetacriticRankings(), [])
  const [consoleFilter, setConsoleFilter] = useState('all')
  const metacriticConsoles = readyConsoles().filter(c => byConsole[c.id]?.length)
  const metacriticRows = consoleFilter === 'all' ? overall : (byConsole[consoleFilter] || [])

  const top3 = rows.slice(0, 3)
  const rest = rows.slice(3)
  const mcTop3 = metacriticRows.slice(0, 3)
  const mcRest = metacriticRows.slice(3)

  return (
    <div className="min-h-screen bg-social-bg">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-black uppercase leading-[0.92] tracking-[-0.03em]" style={{ textWrap: 'balance' }}>
          Melhores de <span className="text-social">Todos os Tempos</span>
        </h1>

        <div className="flex gap-2 mt-6 mb-3">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-colors ${
                tab === t.id
                  ? 'bg-social text-white border-social'
                  : 'border-[#222b4a] text-gray-500 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'comunidade' ? (
          <>
            <p className="text-gray-500 text-sm font-medium mb-10">
              Ranking da comunidade, agregado a partir do Top 10 de cada amigo.
            </p>

            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-social border-t-transparent rounded-full animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <p className="text-gray-600 text-sm">
                Nenhum Top 10 foi salvo ainda. Monte o seu no seu perfil para começar o ranking.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                  {top3.map((r, i) => <PodiumCard key={`${r.console.id}:${r.game.id}`} rank={i + 1} row={r} />)}
                </div>

                {rest.length > 0 && (
                  <div className="space-y-1">
                    {rest.map((r, i) => <RankingRow key={`${r.console.id}:${r.game.id}`} rank={i + 4} row={r} />)}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <p className="text-gray-500 text-sm font-medium mb-6">
              Notas do Metacritic por console. Jogos lançados em mais de um console aparecem só uma vez em "Todos", com a maior nota.
            </p>

            <div className="flex gap-2 mb-10 flex-wrap">
              <button
                onClick={() => setConsoleFilter('all')}
                className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
                  consoleFilter === 'all'
                    ? 'bg-white text-black border-white'
                    : 'border-[#222b4a] text-gray-500 hover:text-white'
                }`}
              >
                Todos
              </button>
              {metacriticConsoles.map(c => (
                <button
                  key={c.id}
                  onClick={() => setConsoleFilter(c.id)}
                  className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
                    consoleFilter === c.id
                      ? 'bg-white text-black border-white'
                      : 'border-[#222b4a] text-gray-500 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {metacriticRows.length === 0 ? (
              <p className="text-gray-600 text-sm">Nenhum jogo com nota cadastrada ainda.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                  {mcTop3.map((r, i) => (
                    <MetacriticPodiumCard key={`${r.console.id}:${r.game.id}`} rank={i + 1} row={r} />
                  ))}
                </div>

                {mcRest.length > 0 && (
                  <div className="space-y-1">
                    {mcRest.map((r, i) => (
                      <MetacriticRow key={`${r.console.id}:${r.game.id}`} rank={i + 4} row={r} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
