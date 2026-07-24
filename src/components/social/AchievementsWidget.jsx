import { Link } from 'react-router-dom'
import { TIER_STYLES } from '../../lib/social'
import AchievementIcon from './AchievementIcon'

// Desktop-only right-rail widget (Feed.jsx/Home.jsx) — the compact counterpart to
// AchievementFeedCard, which stays inline in the mobile timeline. Always renders, even
// with zero unlocks, so this rail doesn't go back to looking empty on a quiet day.
export default function AchievementsWidget({ unlocks }) {
  return (
    <div>
      <h2 className="text-[11px] font-black uppercase tracking-[1.5px] text-gray-500 mb-3">Conquistas Recentes</h2>
      {unlocks.length === 0 ? (
        <p className="text-gray-600 text-[12px]">Nenhuma conquista recente ainda.</p>
      ) : (
        <div className="space-y-3">
          {unlocks.map(unlock => {
            const { achievement, profiles } = unlock
            if (!achievement) return null
            const username = profiles?.display_name || profiles?.username
            return (
              <Link
                key={`${unlock.user_id}-${unlock.achievement_id}`}
                to={`/u/${profiles?.username}`}
                className="flex items-start gap-2 group"
              >
                <AchievementIcon id={achievement.id} tier={achievement.tier} className="w-8 h-8 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[12px] leading-snug">
                    <span className="font-black text-white group-hover:text-social transition-colors">{username}</span>
                    <span className="text-gray-500"> desbloqueou </span>
                    <span className={`font-bold ${TIER_STYLES[achievement.tier]}`}>{achievement.label}</span>
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {new Date(unlock.unlocked_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
