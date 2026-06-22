import { coverSrc, coverObjectPosition } from '../../consoles/dl'

// Retroactive tournament view of a profile's duel votes: games are ranked by win count
// and seeded into a single-elimination tree (see getUserDuelBrackets in lib/duels.js).
// The tree shape (recursive flex stack + a stretched connector per match) self-aligns via
// flexbox, so no manual pixel math is needed to keep rounds visually converging.
export default function DuelBracket({ bracket }) {
  const { console: console_, seeds, root, championSeedNum } = bracket

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-base font-black tracking-tight pl-2.5 border-l-[3px] leading-none"
          style={{ borderColor: console_.accentColor }}
        >
          {console_.label}
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{seeds.length} jogos no bracket</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <MatchNode node={root} alive championSeedNum={championSeedNum} console_={console_} />
      </div>
    </div>
  )
}

function topSeedNum(node) {
  return node.type === 'seed' ? node.seedNum : node.winnerSeedNum
}

function MatchNode({ node, alive, championSeedNum, console_ }) {
  if (node.type === 'seed') {
    return (
      <SeedCard
        entry={node.entry}
        alive={alive}
        isChampion={alive && node.seedNum === championSeedNum}
        console_={console_}
      />
    )
  }

  const leftAlive = alive && topSeedNum(node.left) === node.winnerSeedNum
  const rightAlive = alive && !leftAlive

  return (
    <div className="flex">
      <div className="flex flex-col gap-y-3">
        <MatchNode node={node.left} alive={leftAlive} championSeedNum={championSeedNum} console_={console_} />
        <MatchNode node={node.right} alive={rightAlive} championSeedNum={championSeedNum} console_={console_} />
      </div>
      <div className="w-5 self-stretch flex flex-col shrink-0">
        <div className="flex-1 border-t border-r border-[#222b4a]" />
        <div className="flex-1 border-b border-r border-[#222b4a]" />
      </div>
    </div>
  )
}

function SeedCard({ entry, alive, isChampion, console_ }) {
  return (
    <div
      className={`flex items-center gap-2 w-44 px-2 py-1.5 border bg-social-ink transition-opacity shrink-0
        ${isChampion ? 'border-yellow-400' : 'border-[#222b4a]'} ${alive ? '' : 'opacity-40'}`}
    >
      <img
        src={coverSrc(entry.game, console_) || undefined}
        alt=""
        className="w-8 h-11 object-cover bg-[#0a0a0a] shrink-0"
        style={{ objectPosition: coverObjectPosition(console_) }}
        onError={e => { e.target.style.display = 'none' }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-white truncate">{entry.game.title}</p>
        <p className="text-[10px] text-gray-500">{entry.wins} {entry.wins === 1 ? 'vitória' : 'vitórias'}</p>
      </div>
      {isChampion && <span className="text-yellow-400 text-sm shrink-0">🏆</span>}
    </div>
  )
}
