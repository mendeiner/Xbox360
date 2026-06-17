import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { validateInvite, useInvite, createProfile } from '../lib/db'

export default function Login() {
  const navigate    = useNavigate()
  const [tab, setTab]         = useState('entrar')   // 'entrar' | 'criar'
  const [email, setEmail]     = useState('')
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    navigate('/home')
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError(''); setLoading(true)

    if (!username.trim()) { setError('Escolha um nome de usuário.'); setLoading(false); return }
    if (username.length < 3) { setError('Nome de usuário muito curto (mínimo 3 letras).'); setLoading(false); return }

    const validInvite = await validateInvite(invite.trim().toUpperCase())
    if (!validInvite) { setError('Código de convite inválido ou esgotado.'); setLoading(false); return }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    try {
      await createProfile(data.user.id, username.trim().toLowerCase())
      await useInvite(invite.trim().toUpperCase())
    } catch {
      setError('Erro ao criar perfil. Tente novamente.')
      setLoading(false)
      return
    }

    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-xbox tracking-tight">GAME TRACKER</h1>
        <p className="text-gray-500 text-sm mt-2 font-medium">Seu histórico de jogos em todos os consoles</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-surface-2 rounded-2xl border border-surface-4 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-surface-4">
          {['entrar', 'criar'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                tab === t
                  ? 'text-xbox border-b-2 border-xbox bg-surface-3'
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
                Nome de usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="brunomilesi"
                autoCapitalize="none"
                className="bg-surface-3 border border-surface-4 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-xbox transition-colors placeholder-gray-600"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="bg-surface-3 border border-surface-4 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-xbox transition-colors placeholder-gray-600"
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
              className="bg-surface-3 border border-surface-4 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-xbox transition-colors placeholder-gray-600"
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
                className="bg-surface-3 border border-surface-4 rounded-xl px-4 py-3 text-sm font-mono font-bold tracking-widest outline-none focus:border-xbox transition-colors placeholder-gray-600"
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
            className="mt-2 bg-xbox hover:bg-xbox-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {loading ? 'Aguarde...' : tab === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-gray-600 text-xs">Precisa de um convite? Peça a um amigo.</p>
    </div>
  )
}
