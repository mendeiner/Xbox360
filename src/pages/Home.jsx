import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'
import { useAuth } from '../contexts/AuthContext'
import { getConsoleCounts, generateInvite } from '../lib/db'

const CONSOLES = [
  { id: 'xbox360', label: 'Xbox 360',  color: 'xbox',   textColor: 'text-xbox',  ready: true  },
  { id: 'ps2',     label: 'PS2',       color: 'ps',     textColor: 'text-blue-400', ready: false },
  { id: 'ps3',     label: 'PS3',       color: 'ps',     textColor: 'text-blue-400', ready: false },
  { id: 'snes',    label: 'SNES',      color: 'snes',   textColor: 'text-red-400',  ready: false },
  { id: 'n64',     label: 'N64',       color: 'n64',    textColor: 'text-blue-300', ready: false },
  { id: 'gamecube',label: 'GameCube',  color: 'gcube',  textColor: 'text-purple-400', ready: false },
  { id: 'wii',     label: 'Wii',       color: 'wii',    textColor: 'text-gray-300', ready: false },
]

const ACCENT_MAP = {
  xbox:  { border: 'border-xbox/40',   bg: 'hover:bg-xbox/10',   dot: 'bg-xbox'   },
  ps:    { border: 'border-blue-600/40', bg: 'hover:bg-blue-900/20', dot: 'bg-blue-500' },
  snes:  { border: 'border-red-700/40',  bg: 'hover:bg-red-900/20',  dot: 'bg-red-500'  },
  n64:   { border: 'border-blue-500/40', bg: 'hover:bg-blue-900/20', dot: 'bg-blue-400' },
  gcube: { border: 'border-purple-600/40', bg: 'hover:bg-purple-900/20', dot: 'bg-purple-500' },
  wii:   { border: 'border-gray-500/40', bg: 'hover:bg-gray-800/20', dot: 'bg-gray-400' },
}

export default function Home() {
  const navigate      = useNavigate()
  const { user }      = useAuth()
  const [counts, setCounts]     = useState({})
  const [inviteCode, setInviteCode] = useState(null)
  const [copying, setCopying]   = useState(false)

  useEffect(() => {
    if (!user) return
    getConsoleCounts('xbox360', user.id).then(c => setCounts(prev => ({ ...prev, xbox360: c })))
  }, [user])

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
        {/* Header */}
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

        {/* Console grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
