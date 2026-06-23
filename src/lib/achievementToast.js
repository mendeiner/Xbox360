// Tiny pub/sub so checkAndUnlockAchievements (called from many places: GameCard, GameModal,
// addComment, saveTop10, Profile's mount effect...) can notify a single global toast container
// without every call site needing to know the container exists or thread state through props.
const listeners = new Set()

export function onAchievementsUnlocked(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function emitAchievementsUnlocked(achievements) {
  if (!achievements?.length) return
  for (const cb of listeners) cb(achievements)
}
