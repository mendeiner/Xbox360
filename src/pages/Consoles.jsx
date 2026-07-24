import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'
import { useAuth } from '../contexts/AuthContext'
import { getAllMyStatuses } from '../lib/db'
import { CONSOLES, ACCENT_MAP } from '../consoles/consoleTiles'

export default function Consoles() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [counts, setCounts] = useState({})

  useEffect(() => {
    if (!user) return
    getAllMyStatuses().then(byConsole => {
      const next = {}
      for (const consoleId of Object.keys(byConsole)) {
        const rows = Object.values(byConsole[consoleId])
        next[consoleId] = {
          joguei:       rows.filter(r => r.joguei).length,
          zerado:       rows.filter(r => r.zerado).length,
          cem_porcento: rows.filter(r => r.cem_porcento).length,
          jogando:      rows.filter(r => r.jogando).length,
        }
      }
      setCounts(next)
    })
  }, [user])

  return (
    <div className="min-h-screen bg-surface-1">
      <Nav />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight">Consoles</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Escolha um console para ver seus jogos</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CONSOLES.map(c => {
            const accent = ACCENT_MAP[c.color]
            const count  = counts[c.id]
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
      </main>
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
