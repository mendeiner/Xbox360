import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'

const TYPE_LABEL = {
  comment: 'comentou no seu post',
  reaction: 'reagiu ao seu post',
  achievement: 'conquista desbloqueada',
}

export default function NotificationBell({ userId }) {
  const { unreadCount, notifications, open, markRead } = useNotifications(userId)
  const [isOpen, setIsOpen] = useState(false)

  async function handleToggle() {
    const next = !isOpen
    setIsOpen(next)
    if (next) {
      await open()
      await markRead()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative text-gray-400 hover:text-white transition-colors px-2 py-1.5"
        aria-label="Notificações"
      >
        <BellIcon size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-social border border-surface-1" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-social-ink border border-[#222b4a] shadow-lg z-50 max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-gray-600 px-3 py-4 text-center">Nenhuma notificação ainda.</p>
          ) : (
            notifications.map(n => (
              <Link
                key={n.id}
                to={n.post_id ? '/feed' : '/home'}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 border-b border-[#222b4a] last:border-0 hover:bg-white/5"
              >
                <p className="text-[12px] text-gray-300">
                  <span className="font-bold text-white">{n.actor?.username}</span> {TYPE_LABEL[n.type]}
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function BellIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
