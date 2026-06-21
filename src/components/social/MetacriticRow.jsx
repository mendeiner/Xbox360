import { coverSrc, coverObjectPosition, metacriticCls } from '../../consoles/dl'

export function MetacriticPodiumCard({ rank, row }) {
  return (
    <div className="bg-social-ink border border-[#222b4a]">
      <div className="relative">
        <img
          src={coverSrc(row.game, row.console) || undefined}
          alt=""
          className="w-full h-48 object-cover bg-[#0a0a0a]"
          style={{ objectPosition: coverObjectPosition(row.console) }}
          onError={e => { e.target.style.display = 'none' }}
        />
        <span className="absolute top-0 left-0 bg-social text-white text-2xl font-black w-10 h-10 flex items-center justify-center leading-none">
          {rank}
        </span>
        <span className={`absolute top-2 right-2 text-xs font-black px-2 py-1 rounded ${metacriticCls(row.game.score)}`}>
          {row.game.score}
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-black text-white truncate">{row.game.title}</p>
        <p className="text-[10px] uppercase font-bold text-gray-500 mt-0.5">{row.console.label}</p>
      </div>
    </div>
  )
}

export default function MetacriticRow({ rank, row }) {
  return (
    <div className="flex items-center gap-4 bg-social-ink border border-[#222b4a] px-4 py-3">
      <span className="text-2xl font-black w-10 shrink-0 leading-none text-gray-600">{rank}</span>
      <img
        src={coverSrc(row.game, row.console) || undefined}
        alt=""
        className="w-9 h-12 object-cover bg-[#0a0a0a] shrink-0"
        style={{ objectPosition: coverObjectPosition(row.console) }}
        onError={e => { e.target.style.display = 'none' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{row.game.title}</p>
        <p className="text-[10px] uppercase font-bold text-gray-500">{row.console.label}</p>
      </div>
      <span className={`text-xs font-black px-2 py-1 rounded shrink-0 ${metacriticCls(row.game.score)}`}>
        {row.game.score}
      </span>
    </div>
  )
}
