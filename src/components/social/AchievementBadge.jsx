import { TIER_STYLES } from '../../lib/social'
import AchievementIcon from './AchievementIcon'

// `progress` is the { current, target } entry from getAchievementsProgress, only meaningful
// while locked — once unlocked the badge goes full color and the bar would be redundant.
export default function AchievementBadge({ achievement, unlocked, progress }) {
  const showBar = !unlocked && progress && progress.target > 0
  return (
    <div
      title={achievement.description}
      className={`bg-social-ink border px-3 py-2 min-w-[130px] flex flex-col items-center text-center gap-1.5 transition-opacity
        ${unlocked ? TIER_STYLES[achievement.tier] : 'border-[#222b4a] text-gray-600 opacity-40'}`}
    >
      <AchievementIcon id={achievement.id} tier={achievement.tier} className={`w-9 h-9 ${unlocked ? '' : 'grayscale'}`} />
      <p className="text-[10px] font-black uppercase tracking-wide truncate w-full">{achievement.label}</p>
      <p className="text-[10px] leading-tight line-clamp-2 text-gray-500">{achievement.description}</p>
      {showBar && (
        <div className="w-full mt-0.5">
          <div className="h-1 bg-[#0a0e1f] overflow-hidden">
            <div className="h-full bg-gray-500" style={{ width: `${(progress.current / progress.target) * 100}%` }} />
          </div>
          <p className="text-[9px] font-bold text-gray-500 mt-0.5">{progress.current}/{progress.target}</p>
        </div>
      )}
    </div>
  )
}
