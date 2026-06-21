import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NotificationBell from './social/NotificationBell'

export default function Nav() {
  const { user, profile, signOut, mockLogin } = useAuth()

  return (
    <nav className="sticky top-0 z-50 bg-surface-1/90 backdrop-blur border-b border-surface-4 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-5">
        <Link to="/home" className="text-xbox font-black text-lg tracking-tight hover:text-xbox-light transition-colors">
          GAME TRACKER
        </Link>
        {user && (
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/home" className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">Painel</Link>
            <Link to="/feed" className="text-xs font-semibold text-gray-400 hover:text-social transition-colors">Feed</Link>
            <Link to="/rankings" className="text-xs font-semibold text-gray-400 hover:text-social transition-colors">Rankings</Link>
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
