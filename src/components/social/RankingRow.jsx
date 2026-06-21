import { coverSrc, coverObjectPosition } from '../../consoles/dl'

export function PodiumCard({ rank, row }) {
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
      </div>
      <div className="p-3">
        <p className="text-sm font-black text-white truncate">{row.game.title}</p>
        <p className="text-[10px] uppercase font-bold text-gray-500 mt-0.5">{row.console.label}</p>
        <p className="text-sm font-black text-social mt-2">{row.points} pts <span className="text-gray-500 font-bold text-[11px]">· {row.voters} {row.voters === 1 ? 'voto' : 'votos'}</span></p>
      </div>
    </div>
  )
}

export default function RankingRow({ rank, row }) {
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
      <div className="text-right shrink-0">
        <p className="text-sm font-black text-white">{row.points} pts</p>
        <p className="text-[10px] text-gray-500">{row.voters} {row.voters === 1 ? 'voto' : 'votos'}</p>
      </div>
    </div>
  )
}
