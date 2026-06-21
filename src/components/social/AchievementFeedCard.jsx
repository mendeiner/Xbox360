import { Link } from 'react-router-dom'
import { TIER_STYLES } from '../../lib/social'

// Achievement-unlock flavored feed entry — visually distinct from FeedPostCard (tier
// border/glyph, no cover, no reactions/comments since unlocks aren't wired to either).
export default function AchievementFeedCard({ unlock }) {
  const { achievement, profiles } = unlock
  if (!achievement) return null

  const username = profiles?.display_name || profiles?.username

  return (
    <div className={`bg-social-ink border-2 px-4 py-3 ${TIER_STYLES[achievement.tier]}`}>
      <p className="text-[15px] text-white leading-snug">
        <span className="text-lg mr-1.5">🏆</span>
        <Link to={`/u/${profiles?.username}`} className="font-black hover:text-social">{username}</Link>
        <span className="text-gray-400"> desbloqueou </span>
        <span className="font-black">{achievement.label}</span>
      </p>
      <p className="text-[11px] text-gray-500 mt-1">{achievement.description}</p>
      <p className="text-[11px] text-gray-600 font-semibold mt-1 uppercase tracking-wide">
        {new Date(unlock.unlocked_at).toLocaleDateString('pt-BR')}
      </p>
    </div>
  )
}
