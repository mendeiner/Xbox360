import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { validateInvite, useInvite, getProfileByUsername } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'

const EMAIL_DOMAIN = 'users.gametracker.app'
const toAuthEmail = (nickname) => `${nickname.trim().toLowerCase()}@${EMAIL_DOMAIN}`

// A curated pool of recognizable covers across every ready console, so the backdrop
// is a different trio on each visit instead of one over-stretched single image.
const BACKDROP_COVERS = [
  // Xbox 360
  '/covers/xbox360/4D5307E6.webp', // Halo 3
  '/covers/xbox360/4D5307D5.webp', // Gears of War
  '/covers/xbox360/4D5307E8.webp', // Mass Effect
  '/covers/xbox360/545407D8.webp', // BioShock
  '/covers/xbox360/425307E6.webp', // The Elder Scrolls V: Skyrim
  '/covers/xbox360/425307D5.webp', // Fallout 3
  '/covers/xbox360/5454082B.webp', // Red Dead Redemption
  '/covers/xbox360/545407F2.webp', // Grand Theft Auto IV
  '/covers/xbox360/415607E6.webp', // Call of Duty 4: Modern Warfare
  '/covers/xbox360/4D5307EA.webp', // Forza Motorsport
  // PS2
  '/covers/ps2/60.webp',  // God of War
  '/covers/ps2/51.webp',  // Final Fantasy X
  '/covers/ps2/65.webp',  // Grand Theft Auto III
  '/covers/ps2/67.webp',  // Grand Theft Auto: San Andreas
  '/covers/ps2/68.webp',  // Grand Theft Auto: Vice City
  '/covers/ps2/86.webp',  // Kingdom Hearts
  '/covers/ps2/100.webp', // Metal Gear Solid 3: Snake Eater
  '/covers/ps2/112.webp', // Okami
  '/covers/ps2/125.webp', // Resident Evil 4
  '/covers/ps2/138.webp', // Shadow of the Colossus
  // PS3
  '/covers/ps3/BLUS30377.webp', // Call of Duty: Modern Warfare 2
  '/covers/ps3/BLUS30443.webp', // Demon's Souls
  '/covers/ps3/BCUS98111.webp', // God of War III
  '/covers/ps3/BLUS31156.webp', // Grand Theft Auto V
  '/covers/ps3/NPUA70088.webp', // Heavy Rain
  '/covers/ps3/BCUS98119.webp', // inFamous
  '/covers/ps3/BLUS30109.webp', // Metal Gear Solid 4
  '/covers/ps3/BLUS30418.webp', // Red Dead Redemption
  '/covers/ps3/NPUA70257.webp', // The Last of Us
  '/covers/ps3/BCUS98123.webp', // Uncharted 2: Among Thieves
  // SNES
  '/covers/snes/97.webp',  // Chrono Trigger
  '/covers/snes/125.webp', // Donkey Kong Country
  '/covers/snes/127.webp', // Donkey Kong Country 2
  '/covers/snes/263.webp', // The Legend of Zelda: A Link to the Past
  '/covers/snes/298.webp', // Mega Man X
  '/covers/snes/488.webp', // Street Fighter II
  '/covers/snes/523.webp', // Super Mario World
  '/covers/snes/524.webp', // Super Mario World 2: Yoshi's Island
]

function pickRandomCovers(count) {
  const pool = [...BACKDROP_COVERS]
  const picked = []
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    picked.push(pool.splice(idx, 1)[0])
  }
  return picked
}

// Fades each panel into its neighbor so three covers read as one blended strip
// instead of a hard-edged collage.
const PANEL_MASKS = [
  'linear-gradient(to right, black 0%, black 55%, transparent 100%)',
  'linear-gradient(to right, transparent 0%, black 30%, black 70%, transparent 100%)',
  'linear-gradient(to right, transparent 0%, black 45%, black 100%)',
]

export default function Login() {
  const [backdropCovers] = useState(() => pickRandomCovers(3))
  const navigate    = useNavigate()
  const { mockLogin } = useAuth()
  const [tab, setTab]         = useState('entrar')   // 'entrar' | 'criar'
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [invite, setInvite]   = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  // Pre-fill invite code from URL ?invite=CODE
  useState(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('invite')
    if (code) { setInvite(code.toUpperCase()); setTab('criar') }
  })

  async function handleLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: toAuthEmail(username), password })
    if (error) { setError('Usuário ou senha inválidos.'); setLoading(false); return }
    navigate('/home')
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError(''); setLoading(true)

    if (!username.trim()) { setError('Escolha um nome de usuário.'); setLoading(false); return }
    if (username.length < 3) { setError('Nome de usuário muito curto (mínimo 3 letras).'); setLoading(false); return }
    if (!displayName.trim()) { setError('Informe seu nome.'); setLoading(false); return }

    const existing = await getProfileByUsername(username.trim().toLowerCase())
    if (existing) { setError('Esse nome de usuário já está em uso.'); setLoading(false); return }

    const validInvite = await validateInvite(invite.trim().toUpperCase())
    if (!validInvite) { setError('Código de convite inválido ou esgotado.'); setLoading(false); return }

    const { error } = await supabase.auth.signUp({
      email: toAuthEmail(username),
      password,
      options: { data: { username: username.trim().toLowerCase(), display_name: displayName.trim() } },
    })
    if (error) { setError(error.message); setLoading(false); return }

    try {
      await useInvite(invite.trim().toUpperCase())
    } catch {
      setError('Erro ao usar o convite. Tente novamente.')
      setLoading(false)
      return
    }

    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-surface-1 relative flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Backdrop: three desaturated covers blended into one strip, just ambiance, never the focal point */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 flex">
          {backdropCovers.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              aria-hidden="true"
              className="flex-1 h-full object-cover grayscale opacity-40"
              style={{ maskImage: PANEL_MASKS[i], WebkitMaskImage: PANEL_MASKS[i] }}
            />
          ))}
        </div>
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(10,14,26,0.55) 0%, rgba(10,14,26,0.97) 70%)' }}
        />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8 text-center motion-safe:animate-fade-up">
        <img src="/jogalera-logo.svg" alt="JogaLera" className="h-16 w-auto mx-auto" />
        <p className="text-gray-500 text-sm mt-3 font-medium">Seu histórico de jogos em todos os consoles</p>
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md bg-surface-2 rounded-2xl border border-surface-4 overflow-hidden motion-safe:animate-fade-up"
        style={{ animationDelay: '120ms' }}
      >
        {/* Tabs */}
        <div className="flex border-b border-surface-4">
          {['entrar', 'criar'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                tab === t
                  ? 'text-social border-b-2 border-social bg-surface-3'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'entrar' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={tab === 'entrar' ? handleLogin : handleSignup}
          className="p-8 flex flex-col gap-4"
        >
          {tab === 'criar' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Nome completo
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Bruno Milesi"
                className="bg-surface-3 border border-surface-4 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-social transition-colors placeholder-gray-600"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Nome de usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="brunomilesi"
              autoCapitalize="none"
              className="bg-surface-3 border border-surface-4 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-social transition-colors placeholder-gray-600"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-surface-3 border border-surface-4 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-social transition-colors placeholder-gray-600"
              required
              minLength={6}
            />
          </div>

          {tab === 'criar' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Código de convite
              </label>
              <input
                type="text"
                value={invite}
                onChange={e => setInvite(e.target.value.toUpperCase())}
                placeholder="EX: A1B2C3D4"
                className="bg-surface-3 border border-surface-4 rounded-xl px-4 py-3 text-sm font-mono font-bold tracking-widest outline-none focus:border-social transition-colors placeholder-gray-600"
                required
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm font-medium bg-red-400/10 px-4 py-3 rounded-xl border border-red-400/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-social hover:bg-social-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {loading ? 'Aguarde...' : tab === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>

      <p
        className="relative z-10 mt-6 text-gray-600 text-xs motion-safe:animate-fade-up"
        style={{ animationDelay: '200ms' }}
      >
        Precisa de um convite? Peça a um amigo.
      </p>

      {import.meta.env.DEV && (
        <button
          onClick={() => { mockLogin(); navigate('/home') }}
          className="relative z-10 mt-4 text-xs text-gray-600 hover:text-gray-400 underline underline-offset-2 transition-colors motion-safe:animate-fade-up"
          style={{ animationDelay: '200ms' }}
        >
          [DEV] Entrar como Bruno (sem Supabase)
        </button>
      )}
    </div>
  )
}
