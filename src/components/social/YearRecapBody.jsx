// Pure presentational stat block, shared by YearRecap (self, header affordance) and
// FriendRecapPopover (hover/tap on a friend's avatar) — one source of truth for the layout.
export default function YearRecapBody({ recap, year, loading }) {
  if (loading) {
    return (
      <div className="h-24 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-social border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!recap) return null

  return (
    <>
      <p className="text-[clamp(1.75rem,5vw,3rem)] font-black leading-[0.95] tracking-[-0.03em]" style={{ textWrap: 'balance' }}>
        {recap.gamesBeaten} <span className="text-social">jogos</span> zerados
      </p>
      <p className="text-gray-500 text-sm font-medium mt-2">em {year}, em {recap.consolesTouched} console{recap.consolesTouched === 1 ? '' : 's'}.</p>

      <div className="grid sm:grid-cols-2 gap-px bg-[#222b4a] mt-5">
        {recap.topGenre && (
          <div className="bg-social-ink px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Gênero do ano</p>
            <p className="text-lg font-black text-white mt-1">{recap.topGenre}</p>
          </div>
        )}
        {recap.topRatedGame && (
          <div className="bg-social-ink px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Melhor nota do ano</p>
            <p className="text-lg font-black text-white mt-1 truncate">{recap.topRatedGame.title} · ★ {recap.topRatedGame.rating}</p>
          </div>
        )}
      </div>
    </>
  )
}
