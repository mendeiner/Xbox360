// Instagram-style segmented "lives" bar for the Year Recap story — purely cosmetic, no
// autoplay advance in v1 (see YearRecapStory.jsx): completed slides show full, the current
// slide's segment fills over its own reveal duration, upcoming slides stay empty.
export default function StoryProgressBar({ count, current, accent = '#107C10' }) {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-2 pb-2" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-[3px] rounded-full bg-white/15 overflow-hidden">
          {i < current && <div className="h-full" style={{ width: '100%', backgroundColor: accent }} />}
          {i === current && (
            <div className="h-full recap-anim-bar-fill" style={{ backgroundColor: accent, '--recap-fill': '100%' }} />
          )}
        </div>
      ))}
    </div>
  )
}
