import { useEffect, useRef, useState } from 'react'
import { onAchievementsUnlocked } from '../../lib/achievementToast'
import { TIER_STYLES } from '../../lib/social'
import AchievementIcon from './AchievementIcon'

const AUTO_DISMISS_MS = 6000

// Desktop-only popup (bottom-right) for newly unlocked achievements — mobile already has the
// notification bell for this (checkAndUnlockAchievements also inserts a 'achievement' row
// there), so this container renders nothing below the `md` breakpoint.
export default function AchievementToastContainer() {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  useEffect(() => {
    return onAchievementsUnlocked(achievements => {
      setToasts(prev => [
        ...prev,
        ...achievements.map(achievement => ({ id: nextId.current++, achievement })),
      ])
    })
  }, [])

  function dismiss(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  if (!toasts.length) return null

  return (
    <div className="hidden md:flex fixed bottom-4 right-4 z-[100] flex-col gap-2 w-80">
      {toasts.map(t => (
        <Toast key={t.id} achievement={t.achievement} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  )
}

function Toast({ achievement, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className={`bg-social-ink border px-3 py-2.5 flex items-center gap-3 shadow-lg animate-toast-in ${TIER_STYLES[achievement.tier]}`}
    >
      <AchievementIcon id={achievement.id} tier={achievement.tier} className="w-10 h-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-wide text-gray-500">Conquista desbloqueada</p>
        <p className="text-[13px] font-black uppercase tracking-wide truncate">{achievement.label}</p>
        <p className="text-[10px] leading-tight text-gray-500 line-clamp-2">{achievement.description}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-600 hover:text-white shrink-0 text-lg leading-none px-1"
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  )
}
