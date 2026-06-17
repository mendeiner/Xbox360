import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Nav() {
  const { profile, signOut } = useAuth()

  return (
    <nav className="sticky top-0 z-50 bg-surface-1/90 backdrop-blur border-b border-surface-4 px-6 py-3 flex items-center justify-between">
      <Link to="/home" className="text-xbox font-black text-lg tracking-tight hover:text-xbox-light transition-colors">
        GAME TRACKER
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400 font-medium">
          {profile?.username ?? ''}
        </span>
        <button
          onClick={signOut}
          className="text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-surface-4 hover:border-gray-500"
        >
          Sair
        </button>
      </div>
    </nav>
  )
}
