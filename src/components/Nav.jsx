import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NotificationBell from './social/NotificationBell'
import { CONSOLES } from '../consoles/consoleTiles'

// Ready consoles first, "Em breve" placeholders greyed out at the bottom — the flyout is a
// fast functional shortcut, not the place to sell the roadmap (that's what /consoles is for).
const FLYOUT_TILES = [...CONSOLES.filter(c => c.ready), ...CONSOLES.filter(c => !c.ready)]

export default function Nav() {
  const { user, profile, signOut, mockLogin } = useAuth()

  return (
    <nav className="sticky top-0 z-50 bg-surface-1/90 backdrop-blur border-b border-surface-4 px-6 py-0.5 flex items-center justify-between">
      <div className="flex items-center gap-5">
        <Link to="/home" className="flex items-center hover:opacity-90 transition-opacity">
          <img src="/jogalera-logo.svg" alt="JogaLera" className="h-14 w-auto" />
        </Link>
        {user && (
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/home" className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">Painel</Link>
            <div className="relative group">
              <Link to="/consoles" className="text-xs font-semibold text-gray-400 hover:text-social transition-colors">Consoles</Link>
              <div className="absolute left-0 top-full pt-2 hidden group-hover:block group-focus-within:block z-50">
                <div className="grid grid-cols-4 gap-1.5 p-3 rounded-xl bg-surface-2 border border-surface-4 shadow-xl w-[240px]">
                  {FLYOUT_TILES.map(c => (
                    c.ready ? (
                      <Link
                        key={c.id}
                        to={`/${c.id}`}
                        title={c.label}
                        className="flex items-center justify-center h-9 rounded-lg hover:bg-surface-3 transition-colors"
                      >
                        <img src={c.logo} alt={c.label} className="h-4 max-w-[85%] object-contain" />
                      </Link>
                    ) : (
                      <div
                        key={c.id}
                        title={`${c.label} — Em breve`}
                        className="flex items-center justify-center h-9 rounded-lg opacity-30 cursor-not-allowed"
                      >
                        <img src={c.logo} alt={c.label} className="h-4 max-w-[85%] object-contain" />
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
            <Link to="/feed" className="text-xs font-semibold text-gray-400 hover:text-social transition-colors">Feed</Link>
            <Link to="/rankings" className="text-xs font-semibold text-gray-400 hover:text-social transition-colors">Rankings</Link>
            <Link to="/polls" className="text-xs font-semibold text-gray-400 hover:text-social transition-colors">Votações</Link>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <NotificationBell userId={user.id} />
            <Link
              to={profile?.username ? `/u/${profile.username}` : '/home'}
              className="text-sm text-gray-400 hover:text-white font-medium flex items-center gap-1.5"
            >
              {user.id === 'mock-user' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold">TESTE</span>
              )}
              {profile?.username ?? ''}
            </Link>
            <button
              onClick={signOut}
              className="text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-surface-4 hover:border-gray-500"
            >
              Sair
            </button>
          </>
        ) : (
          <button
            onClick={mockLogin}
            className="text-xs font-bold text-yellow-400 hover:text-yellow-300 transition-colors px-3 py-1.5 rounded-lg border border-yellow-500/30 hover:border-yellow-400/50 bg-yellow-500/10"
          >
            Entrar como Teste
          </button>
        )}
      </div>
    </nav>
  )
}
