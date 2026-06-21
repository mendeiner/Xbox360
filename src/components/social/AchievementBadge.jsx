const TIER_STYLES = {
  bronze: 'border-[#9c6b3f] text-[#cd9a66]',
  silver: 'border-[#9ca3af] text-[#d1d5db]',
  gold:   'border-[#d4af37] text-[#f4d873]',
}

export default function AchievementBadge({ achievement, unlocked }) {
  return (
    <div
      title={achievement.description}
      className={`bg-social-ink border px-3 py-2 min-w-[130px] transition-opacity
        ${unlocked ? TIER_STYLES[achievement.tier] : 'border-[#222b4a] text-gray-600 opacity-40'}`}
    >
      <p className="text-[10px] font-black uppercase tracking-wide truncate">{achievement.label}</p>
      <p className="text-[10px] mt-0.5 leading-tight line-clamp-2 text-gray-500">{achievement.description}</p>
    </div>
  )
}
