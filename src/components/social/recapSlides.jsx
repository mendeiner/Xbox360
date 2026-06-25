// This file intentionally mixes many small per-screen components with the `buildSlides`
// registry builder (the plan's "one file per slide archetype" design) — fast-refresh can't
// establish a clean component-only boundary here, so edits trigger a full reload instead of
// a hot patch. A dev-experience tradeoff only, not a correctness issue.
//
// ROUND 2 REBUILD (see plan parts G1-G4): round 1 filled slides with abstract decoration
// (skylines, a podium, generic pixel-people) that a grilling session surfaced as meaningless —
// none of it said "video games," and none of it was the player's *own* games. Every slide here
// now follows one rule: lead with a verdict about the player (recapTrivia's verdict
// functions), then surround it with real evidence — the player's actual cover art
// (recapScenery's CoverFan/CoverStack/CoverRow/SceneBackdrop) and franchise-flavored HUD
// (recapHud — hearts, coins, boss bars, medals, combo meters) — never an arbitrary shape.
/* eslint-disable react-refresh/only-export-components */
import { useCountUp } from '../../hooks/useCountUp'
import StorySlide from './StorySlide'
import AchievementIcon from './AchievementIcon'
import { SceneBackdrop, CoverFan, CoverStack, CoverRow, Particles, CornerSticker } from './recapScenery'
import {
  CoinIcon, JoystickIcon, DPadIcon, ButtonIcon, MedalIcon, PlatinumTrophyIcon,
  HealthBar, ComboMeter, TextPlate, AmmoCounter,
} from './recapHud'
import {
  gamesBeatenLine, achievementsLine, consolesTouchedLine, vsDeltaLine, friendRankLine,
  gamesBeatenVerdict, metacriticVerdict, completionistVerdict, platformLoyaltyVerdict,
  consolesVerdict, friendRankVerdict, achievementsVerdict, continueVerdict, wallVerdict,
  busiestMonthVerdict, topGenreVerdict, deaccent,
} from './recapTrivia'

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function metacriticGrade(score) {
  if (score >= 90) return 'S'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  return 'D'
}

// Raw genre string (as it appears in games.js / recap.topGenres) -> the slug AchievementIcon's
// GENRE_GLYPHS already draws a real object for — reused here instead of a second icon set.
const GENRE_SLUG = {
  'Ação': 'acao', 'Aventura': 'aventura', 'RPG': 'rpg', 'JRPG': 'jrpg', 'FPS': 'fps',
  'Plataforma': 'plataforma', 'Estratégia': 'estrategia', 'Puzzle': 'puzzle', 'Terror': 'terror',
  'Corrida': 'corrida', 'Luta': 'luta', 'Esportes': 'esportes', 'Simulação': 'simulacao',
  'Tiro': 'tiro', 'Sandbox': 'sandbox',
}

// Three-axis radar wheel behind PlayerTypeSlide's bars — a real data visualization of the same
// `pct` values the bars show, not a decorative stand-in for "a place" (which is what round 1's
// skylines/podiums were and got rejected for). Kept from round 1: a stat chart is information,
// not set-dressing.
function StatWheel({ values, color }) {
  const angles = [-90, 30, 150].map(d => (d * Math.PI) / 180)
  const center = 50
  const radius = 38
  const ring = (f) => angles.map(a => `${center + radius * f * Math.cos(a)},${center + radius * f * Math.sin(a)}`).join(' ')
  const shape = values.map((v, i) => {
    const r = (Math.min(100, v) / 100) * radius
    return `${center + r * Math.cos(angles[i])},${center + r * Math.sin(angles[i])}`
  }).join(' ')
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 pointer-events-none"
      style={{ color, opacity: 0.7 }}
    >
      <polygon points={ring(1)} fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <polygon points={ring(0.66)} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <polygon points={ring(0.33)} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <polygon points={shape} fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

// ── Slide components ────────────────────────────────────────────────────
// Each is its own distinct game-UI screen — cohesion comes from the shared StorySlide shell +
// CRT/phosphor styles, not from a repeated layout. Every slide composes: a full-bleed
// SceneBackdrop of its own covers (never empty/abstract), a verdict headline, real-cover
// evidence, and franchise-flavored HUD — see the file header.

// Attract-mode screen — a full-bleed wall of the year's own beaten-game covers, a fanned
// preview of them up front, and the year stamped as a corner sticker.
function TitleSlide({ recap, year, subject }) {
  const covers = recap.beatenCovers
  return (
    <StorySlide accent="#3ddc6a" bgClassName="bg-[#04130a]">
      <SceneBackdrop covers={covers} accent="#3ddc6a" />
      <CornerSticker color="#3ddc6a">{year}</CornerSticker>
      <p className="relative recap-pixel text-[10px] tracking-widest opacity-70">
        {subject === 'Você' ? 'JOGADOR 1' : deaccent(subject?.toUpperCase() || '')}
      </p>
      <h1 className="relative recap-pixel text-2xl text-center recap-glow leading-loose">
        RETROSPECTIVA<br />{year}
      </h1>
      {covers?.length > 0 && <CoverFan covers={covers} max={5} color="#3ddc6a" className="relative" />}
      <p className="relative recap-pixel text-[11px] recap-anim-blink mt-2">
        ▸ {recap.isCurrentYear ? 'TOQUE PARA COMECAR' : 'PRESS START'}
      </p>
    </StorySlide>
  )
}

// "NOW LOADING" cartridge screen — the earliest beaten game of the year, framed like a
// cartridge in its tray (corner screws).
function FirstGameSlide({ recap, subject }) {
  const game = recap.firstGame
  return (
    <StorySlide accent="#3ddc6a" bgClassName="bg-[#04130a]">
      <SceneBackdrop covers={game.cover ? [game.cover] : []} accent="#3ddc6a" />
      <CornerSticker color="#3ddc6a" className="absolute top-3 left-3 -rotate-3">DIA 1</CornerSticker>
      <div className="relative flex items-center gap-2">
        <JoystickIcon color="#3ddc6a" className="w-5 h-6" />
        <p className="recap-pixel text-[10px] tracking-widest opacity-70">NOW LOADING…</p>
      </div>
      <div className="relative recap-anim-bar-fill h-2 w-48 bg-[#3ddc6a] rounded-full" style={{ '--recap-fill': '100%' }} />
      <div className="relative w-32 aspect-[3/4] mt-2">
        <span className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-[#3ddc6a]/60" />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#3ddc6a]/60" />
        <span className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-[#3ddc6a]/60" />
        <span className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-[#3ddc6a]/60" />
        <div className="w-full h-full border-2 border-[#3ddc6a] rounded overflow-hidden bg-black/40">
          {game.cover && <img src={game.cover} alt="" className="w-full h-full object-cover" />}
        </div>
      </div>
      <p className="relative text-sm text-white/90 text-center max-w-xs mt-2">
        {subject === 'Você' ? 'Você' : subject} começou o ano com <span className="font-bold">{game.title}</span>
      </p>
    </StorySlide>
  )
}

// "HIGH SCORE" — the headline beat. Verdict leads, then a coin-counter score, then the actual
// games it's built from fanned out as evidence, then the flavor/benchmark line underneath.
function GamesBeatenSlide({ recap }) {
  const count = useCountUp(recap.gamesBeaten, 900)
  const evidence = (recap.topGames?.length ? recap.topGames : recap.beatenGames).map(g => g.cover)
  return (
    <StorySlide accent="#ff3b3b" bgClassName="bg-[#2a0808]" tease="Voce zerou jogos esse ano…">
      <SceneBackdrop covers={recap.beatenGames.map(g => g.cover)} accent="#ff3b3b" />
      {recap.gamesBeaten > 0 && <Particles kind="confetti" density={Math.min(18, recap.gamesBeaten + 4)} color="#ff3b3b" />}
      <p className="relative recap-pixel text-xs tracking-widest opacity-80">HIGH SCORE</p>
      <p className="relative recap-pixel text-xl text-center recap-glow leading-snug max-w-[280px]">
        {gamesBeatenVerdict(recap.gamesBeaten)}
      </p>
      <div className="relative flex items-center gap-2">
        <CoinIcon color="#ff3b3b" className="w-7 h-7" />
        <p className="recap-pixel text-6xl recap-glow recap-anim-score-flash">
          {String(count).padStart(5, '0')}
        </p>
      </div>
      {evidence.length > 0 && <CoverFan covers={evidence} max={5} color="#ff3b3b" className="relative" />}
      <p className="relative text-sm text-white/80 text-center max-w-xs">{gamesBeatenLine(recap.gamesBeaten)}</p>
    </StorySlide>
  )
}

// "CONTINUE?" — the real unfinished games by name and cover, replacing round 1's nameless
// placeholder figures (the user's specific complaint: "I don't see any of the games").
function ContinueSlide({ recap }) {
  const extra = Math.max(recap.gamesPlayed - recap.gamesBeaten, 0)
  const count = useCountUp(extra, 700)
  const games = recap.inProgressGames.slice(0, 4)
  const overflow = extra - games.length
  return (
    <StorySlide accent="#ffb020" bgClassName="bg-[#2a1c02]">
      <SceneBackdrop covers={recap.inProgressGames.map(g => g.cover)} accent="#ffb020" />
      <p className="relative recap-pixel text-xs tracking-widest opacity-80 recap-anim-blink">CONTINUE?</p>
      <p className="relative recap-pixel text-lg text-center recap-glow max-w-[260px]">{continueVerdict(extra)}</p>
      <p className="relative recap-pixel text-5xl recap-glow">+{count}</p>
      {games.length > 0 && (
        <div className="relative grid grid-cols-2 gap-2 w-64">
          {games.map((g, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-black/60 border border-[#ffb020]/40 rounded px-1.5 py-1">
              <img src={g.cover} alt="" className="w-7 h-9 object-cover rounded shrink-0" />
              <span className="text-[10px] text-white/80 truncate">{g.title}</span>
            </div>
          ))}
        </div>
      )}
      {overflow > 0 && <p className="relative text-[11px] text-white/60">+{overflow} jogos pausados</p>}
      <div className="relative flex items-center gap-2">
        <ButtonIcon letter="A" color="#ffb020" className="w-6 h-6" />
        <TextPlate color="#ffb020">PRESS START</TextPlate>
      </div>
    </StorySlide>
  )
}

// Fighting-game "VS" face-off — this year's covers vs last year's, stacked as two fighters,
// real games on both sides of the comparison instead of a bare count.
function VsSlide({ recap, year }) {
  const delta = Math.round(((recap.gamesBeaten - recap.prevYearGamesBeaten) / recap.prevYearGamesBeaten) * 100)
  const up = delta >= 0
  const winColor = up ? '#3ddc6a' : '#ff3b3b'
  return (
    <StorySlide accent={winColor} bgClassName="bg-black">
      <SceneBackdrop covers={[...recap.prevYearCovers, ...recap.beatenGames.map(g => g.cover)]} accent={winColor} />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(115deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.55) 49.3%, ${winColor}33 49.3%, ${winColor}33 50.7%, ${winColor}22 50.7%, ${winColor}22 100%)`,
        }}
      />
      <p className="relative recap-pixel text-lg text-center recap-glow max-w-[260px]">
        {up ? 'VOCE SUBIU DE FASE' : 'ANO DE FARM, NAO DE BOSS RUSH'}
      </p>
      <div className="relative flex items-center gap-4">
        <div className="text-center recap-anim-vs-clash" style={{ '--recap-from': '-24px' }}>
          <p className="recap-pixel text-[10px] opacity-60">{year - 1}</p>
          <CoverStack covers={recap.prevYearCovers} max={3} color="#fff" className="mx-auto scale-75" />
          <p className="recap-pixel text-4xl text-white/60 mt-1">{recap.prevYearGamesBeaten}</p>
        </div>
        <p className="recap-pixel text-xl text-white recap-glow">VS</p>
        <div className="text-center recap-anim-vs-clash" style={{ '--recap-from': '24px' }}>
          <p className="recap-pixel text-[10px] opacity-80">{year}</p>
          <CoverStack covers={recap.beatenGames.map(g => g.cover)} max={3} color={winColor} className="mx-auto scale-75" />
          <p className="recap-pixel text-5xl recap-glow mt-1">{recap.gamesBeaten}</p>
        </div>
      </div>
      <p className="relative recap-pixel text-[11px] recap-glow mt-2 bg-black/50 px-2 py-1 text-center">
        {up ? '↑' : '↓'} {Math.abs(delta)}% — {vsDeltaLine(delta, up)}
      </p>
    </StorySlide>
  )
}

// "STAGE SELECT" calendar grid — busiest month lit up, with the actual covers beaten that
// month as the evidence, not just a count.
function BusiestMonthSlide({ recap }) {
  const { month, count, covers } = recap.busiestMonth
  return (
    <StorySlide accent="#7c5cff" bgClassName="bg-[#140a2a]">
      <SceneBackdrop covers={covers} accent="#7c5cff" />
      <p className="relative recap-pixel text-[10px] tracking-widest opacity-70">STAGE SELECT</p>
      <p className="relative recap-pixel text-lg text-center recap-glow max-w-[260px]">{busiestMonthVerdict(count)}</p>
      <div className="relative grid grid-cols-4 gap-2 mt-1">
        {MONTHS_PT.map((m, i) => (
          <div key={m} className="relative">
            {i === month && (
              <div
                className="absolute -inset-2 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.35), transparent 70%)' }}
              />
            )}
            <div
              className={`relative w-12 h-12 flex items-center justify-center rounded text-[9px] recap-pixel ${i === month ? 'recap-anim-trophy-pop recap-glow' : 'opacity-25'}`}
              style={{ border: '1px solid currentColor', backgroundColor: i === month ? 'rgba(124,92,255,0.15)' : 'transparent' }}
            >
              {m.slice(0, 3).toUpperCase()}
            </div>
          </div>
        ))}
      </div>
      {covers.length > 0 && <CoverRow covers={covers} max={6} size="w-9" className="relative flex gap-1.5 flex-wrap justify-center max-w-[260px]" />}
      <p className="relative text-sm text-white/80 text-center max-w-xs">
        <span className="font-bold">{MONTHS_PT[month]}</span> foi seu mês campeão — {count} zerados
      </p>
    </StorySlide>
  )
}

// "SELECT YOUR CLASS" — upgraded to a real ranked 1-5 list (round 2 part G3): rank + the
// genre's real glyph + a row of the actual games in that genre + count, instead of one big
// genre and a couple of bare bars.
function TopGenresSlide({ recap }) {
  const genres = recap.topGenres
  const allCovers = genres.flatMap(([, , covers]) => covers || [])
  return (
    <StorySlide accent="#ffb020" bgClassName="bg-[#2a1c02]" tease="Seu ranking de generos…">
      <SceneBackdrop covers={allCovers} accent="#ffb020" />
      <p className="relative recap-pixel text-[10px] tracking-widest opacity-70">SELECT YOUR CLASS</p>
      <p className="relative recap-pixel text-lg text-center recap-glow max-w-[280px]">{topGenreVerdict(genres[0][0])}</p>
      <div className="relative flex flex-col gap-2 w-full max-w-[300px]">
        {genres.map(([genre, n, covers], i) => {
          const slug = GENRE_SLUG[genre]
          return (
            <div key={genre} className="flex items-center gap-2 bg-black/60 border border-[#ffb020]/30 rounded px-2 py-1.5">
              <span className="recap-pixel text-sm w-5 text-center shrink-0" style={i === 0 ? { color: '#ffd84d' } : undefined}>{i + 1}</span>
              {slug && <AchievementIcon id={`genero_${slug}`} tier={i === 0 ? 'gold' : 'silver'} className="w-7 h-7 shrink-0" />}
              <span className="text-[12px] font-bold flex-1 truncate">{genre}</span>
              <CoverRow covers={covers} max={3} size="w-6" className="flex gap-0.5 shrink-0" />
              <span className="text-[11px] opacity-70 shrink-0">{n}</span>
            </div>
          )
        })}
      </div>
    </StorySlide>
  )
}

// "MÉDIA METACRITIC" — the user's explicit example of a number that must never stand alone:
// the real high-scoring games played are the proof "você joga o que o mundo aplaude" is true.
function AvgMetacriticSlide({ recap }) {
  const score = useCountUp(recap.avgMetacritic, 800)
  const grade = metacriticGrade(recap.avgMetacritic)
  const evidence = recap.topMetacriticGames
  return (
    <StorySlide accent="#3ddc6a" bgClassName="bg-[#062012]">
      <SceneBackdrop covers={evidence.map(g => g.cover)} accent="#3ddc6a" />
      <Particles kind="lightshaft" density={3} color="#3ddc6a" />
      <p className="relative recap-pixel text-[10px] tracking-widest opacity-70">MEDIA METACRITIC</p>
      <p className="relative recap-pixel text-lg text-center recap-glow max-w-[260px]">{metacriticVerdict(recap.avgMetacritic)}</p>
      <div className="relative flex items-center gap-3">
        <p className="recap-pixel text-6xl recap-glow">{score}</p>
        {evidence.length > 0 && <ComboMeter value={evidence.length} color="#ffb020" />}
      </div>
      {evidence.length > 0 && (
        <div className="relative flex flex-col gap-1 w-full max-w-[260px]">
          {evidence.slice(0, 3).map(g => (
            <div key={g.title} className="flex items-center gap-2 bg-black/60 rounded px-1.5 py-1">
              <img src={g.cover} alt="" className="w-6 h-8 object-cover rounded shrink-0" />
              <span className="text-[10px] text-white/80 truncate flex-1">{g.title}</span>
              <span className="recap-pixel text-[9px]" style={{ color: '#3ddc6a' }}>{g.score}</span>
            </div>
          ))}
        </div>
      )}
      <p className="relative recap-pixel text-3xl recap-anim-stamp-impact mt-1" style={{ color: '#ffb020' }}>RANK {grade}</p>
    </StorySlide>
  )
}

// "CONSOLE SELECT" — each console a glowing tile in its real brand color (the logo is already
// real/branded art, not abstract decoration), over a wall of the year's own covers.
function ConsolesSlide({ recap }) {
  return (
    <StorySlide accent="#3ddc6a" bgClassName="bg-black">
      <SceneBackdrop covers={recap.beatenGames.map(g => g.cover)} accent="#3ddc6a" />
      <Particles kind="dust" density={10} color="#3ddc6a" />
      <div className="relative flex items-center gap-2">
        <DPadIcon color="#3ddc6a" className="w-5 h-5" />
        <p className="recap-pixel text-[10px] tracking-widest opacity-70">CONSOLE SELECT</p>
      </div>
      <p className="relative recap-pixel text-lg text-center recap-glow max-w-[260px]">{consolesVerdict(recap.consolesTouched.length)}</p>
      <div className="relative flex flex-wrap items-center justify-center gap-3 mt-1 max-w-xs">
        {recap.consolesTouched.map(c => (
          <div
            key={c.id}
            className="recap-anim-trophy-pop flex items-center justify-center px-4 py-3 rounded"
            style={{ border: `1px solid ${c.accentColor}`, backgroundColor: `${c.accentColor}1a` }}
          >
            <img src={`/logos/${c.id}.svg`} alt={c.label} className="h-6 w-auto" />
          </div>
        ))}
      </div>
      <p className="relative text-sm text-white/70 mt-1 text-center max-w-xs">
        {recap.consolesTouched.length} console{recap.consolesTouched.length === 1 ? '' : 's'} este ano — {consolesTouchedLine(recap.consolesTouched.length)}
      </p>
    </StorySlide>
  )
}

// Boss-intro reveal — iris/spotlight opens onto the highest-rated game's cover, with a real
// boss-health bar (drained to near zero — you cleared it) instead of a generic crowd shape.
function TopRatedSlide({ recap }) {
  const game = recap.topRatedGame
  return (
    <StorySlide accent="#ff3b3b" bgClassName="bg-black" tease="O chefao do seu ano foi…">
      <SceneBackdrop covers={game.cover ? [game.cover] : []} accent="#ff3b3b" />
      <CornerSticker color="#ff3b3b">MVP</CornerSticker>
      <p className="relative recap-pixel text-[10px] tracking-widest opacity-70">O CHEFAO DO SEU ANO</p>
      <HealthBar pct={6} color="#ff3b3b" label="BOSS" className="relative w-44" />
      <div className="relative recap-anim-iris-open">
        <div className="w-44 aspect-[3/4] border-2 border-[#ff3b3b] rounded overflow-hidden bg-black/40">
          {game.cover && <img src={game.cover} alt="" className="w-full h-full object-cover" />}
        </div>
      </div>
      <p className="relative recap-pixel text-sm text-center recap-glow bg-black/60 px-3 py-2">{game.title}</p>
      <div className="relative flex items-center gap-2">
        <p className="text-2xl tracking-wider" style={{ color: '#ffb020' }}>{'★'.repeat(Math.round(game.rating))}</p>
        <TextPlate color="#ff3b3b">CLEARED</TextPlate>
      </div>
    </StorySlide>
  )
}

// "TROPHY CASE" — real achievement glyphs popping in, an ammo-style tally of how many, and a
// verdict about what that volume says about the player.
function AchievementsSlide({ recap }) {
  const shown = recap.achievementsThisYear.slice(0, 8)
  return (
    <StorySlide accent="#ffb020" bgClassName="bg-black">
      <SceneBackdrop covers={recap.beatenGames.map(g => g.cover)} accent="#ffb020" />
      <CornerSticker color="#ffb020">+{recap.achievementsThisYear.length} NOVAS</CornerSticker>
      <p className="relative recap-pixel text-[10px] tracking-widest opacity-70">TROPHY CASE</p>
      <p className="relative recap-pixel text-lg text-center recap-glow max-w-[260px]">{achievementsVerdict(recap.achievementsThisYear.length)}</p>
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-y-0 w-1/3 recap-anim-shine-sweep"
          style={{ background: 'linear-gradient(115deg, transparent, rgba(255,255,255,0.18), transparent)' }}
        />
        <div className="relative grid grid-cols-4 gap-3 mt-2">
          {shown.map((u, i) => (
            <div key={u.achievement_id} className="recap-anim-trophy-pop" style={{ animationDelay: `${i * 80}ms` }}>
              <AchievementIcon id={u.achievement_id} tier={u.achievement.tier} className="w-10 h-10" />
            </div>
          ))}
        </div>
      </div>
      <AmmoCounter count={recap.achievementsThisYear.length} color="#ffb020" className="relative" />
      <p className="relative text-sm text-white/80 mt-1 text-center max-w-xs">
        {recap.achievementsThisYear.length} conquistas desbloqueadas — {achievementsLine(recap.achievementsThisYear.length)}
      </p>
    </StorySlide>
  )
}

// "PLATFORM LOYALTY" — share of this year's beaten games on a single console, with the actual
// games beaten on it as the proof, staged on that console's own brand color.
function PlatformLoyaltySlide({ recap }) {
  const { console: c, pct, count, covers } = recap.platformLoyalty
  return (
    <StorySlide accent={c.accentColor} bgClassName="bg-black">
      <SceneBackdrop covers={covers} accent={c.accentColor} />
      <p className="relative recap-pixel text-[10px] tracking-widest opacity-70">PLATAFORMA PRINCIPAL</p>
      <p className="relative recap-pixel text-lg text-center recap-glow max-w-[260px]">{platformLoyaltyVerdict(pct)}</p>
      <img src={`/logos/${c.id}.svg`} alt={c.label} className="relative h-12 w-auto" />
      <p className="relative recap-pixel text-5xl recap-glow">{pct}%</p>
      <div className="relative w-48 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full recap-anim-bar-fill" style={{ backgroundColor: c.accentColor, '--recap-fill': `${pct}%` }} />
      </div>
      {covers.length > 0 && <CoverRow covers={covers} max={6} size="w-9" className="relative flex gap-1.5 flex-wrap justify-center max-w-[260px]" />}
      <p className="relative text-sm text-white/80 text-center max-w-xs">
        {count} dos seus zerados foram no {c.label}
      </p>
    </StorySlide>
  )
}

// "100% CLUB" — a platinum trophy (not a generic shape) plus the actual games 100%'d, instead
// of a bare percentage.
function CompletionistSlide({ recap }) {
  const { cem, total, pct, covers } = recap.completionistRatio
  return (
    <StorySlide accent="#ffb020" bgClassName="bg-[#2a1c02]">
      <SceneBackdrop covers={covers} accent="#ffb020" />
      <Particles kind="confetti" density={pct >= 50 ? 10 : 5} color="#ffb020" />
      <CornerSticker color="#ffb020">100% CLUB</CornerSticker>
      <p className="relative recap-pixel text-[10px] tracking-widest opacity-70">COMPLETIONIST RATE</p>
      <p className="relative recap-pixel text-lg text-center recap-glow max-w-[260px]">{completionistVerdict(pct)}</p>
      <div className="relative flex items-center gap-2">
        <PlatinumTrophyIcon className="w-10 h-10" />
        <p className="recap-pixel text-5xl recap-glow">{pct}%</p>
      </div>
      {covers.length > 0 && <CoverRow covers={covers} max={6} size="w-9" className="relative flex gap-1.5 flex-wrap justify-center max-w-[260px]" />}
      <p className="relative text-sm text-white/80 text-center max-w-xs">
        {cem} de {total} jogos zerados foram até o fim, 100%
      </p>
    </StorySlide>
  )
}

// "JOIA RARA" — the game rated well above its Metacritic score: your rating vs the critics',
// as two real HUD bars instead of a plain text comparison.
function HiddenGemSlide({ recap }) {
  const game = recap.hiddenGem
  return (
    <StorySlide accent="#7c5cff" bgClassName="bg-black" tease="Um jogo que voce amou mais que a critica…">
      <SceneBackdrop covers={game.cover ? [game.cover] : []} accent="#7c5cff" />
      <CornerSticker color="#7c5cff">JOIA RARA</CornerSticker>
      <p className="relative recap-pixel text-[10px] tracking-widest opacity-70 text-center max-w-[260px]">VOCE VIU O QUE A CRITICA NAO VIU</p>
      <div className="relative w-40 aspect-[3/4] border-2 border-[#7c5cff] rounded overflow-hidden bg-black/40">
        {game.cover && <img src={game.cover} alt="" className="w-full h-full object-cover" />}
      </div>
      <p className="relative recap-pixel text-sm text-center recap-glow bg-black/60 px-3 py-2">{game.title}</p>
      <div className="relative flex flex-col gap-1.5 w-48">
        <HealthBar pct={(game.rating / 5) * 100} color="#ffb020" label="SUA NOTA" segments={10} />
        <HealthBar pct={game.metacritic} color="#7c5cff" label="METACRITIC" segments={10} />
      </div>
    </StorySlide>
  )
}

// Comparative friend hook — self-only, see YearRecapStory.jsx for the gating. The percentile
// itself is the headline (bigger always reads better — see friendRankLine's doc comment for
// why this isn't framed as "TOP X%"), backed by the player's own games stacked as evidence.
function FriendRankSlide({ recap }) {
  const { percentile, friendCount } = recap.friendPercentile
  return (
    <StorySlide accent="#ff3b3b" bgClassName="bg-black" tease="Como voce se saiu comparado a galera…">
      <SceneBackdrop covers={recap.beatenGames.map(g => g.cover)} accent="#ff3b3b" />
      <p className="relative recap-pixel text-[10px] tracking-widest opacity-70">RANKING ENTRE AMIGOS</p>
      <p className="relative recap-pixel text-lg text-center recap-glow max-w-[260px]">{friendRankVerdict(percentile)}</p>
      <p className="relative recap-pixel text-5xl recap-glow">{percentile}%</p>
      <CoverStack covers={recap.beatenGames.map(g => g.cover)} max={4} color="#ff3b3b" className="relative" />
      <p className="relative text-sm text-white/80 text-center max-w-xs">
        melhor que isso entre seus {friendCount} amigo{friendCount === 1 ? '' : 's'} este ano — {friendRankLine(percentile)}
      </p>
    </StorySlide>
  )
}

// "TOP 5 DO ANO" (round 2 part G3) — the centerpiece the user kept pointing at in the Spotify
// reference: a real ranked list, medals for the top 3, covers + titles + stars for every row.
function Top5GamesSlide({ recap }) {
  const games = recap.topGames
  return (
    <StorySlide accent="#ffd84d" bgClassName="bg-[#1a1404]" tease="Os campeoes do seu ano…">
      <SceneBackdrop covers={games.map(g => g.cover)} accent="#ffd84d" />
      <p className="relative recap-pixel text-[10px] tracking-widest opacity-70">TOP 5 DO ANO</p>
      <p className="relative recap-pixel text-lg text-center recap-glow">OS CAMPEOES DO SEU ANO</p>
      <div className="relative flex flex-col gap-1.5 w-full max-w-[300px]">
        {games.map((g, i) => (
          <div
            key={g.id}
            className="recap-anim-trophy-pop flex items-center gap-2 bg-black/60 border border-[#ffd84d]/30 rounded px-2 py-1.5"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {i < 3
              ? <MedalIcon place={i + 1} color="#ffd84d" className="w-7 h-9 shrink-0" />
              : <span className="recap-pixel text-sm w-7 text-center shrink-0">{i + 1}</span>}
            <img src={g.cover} alt="" className="w-9 h-12 object-cover rounded shrink-0" />
            <span className="text-[12px] font-bold flex-1 truncate">{g.title}</span>
            {g.rating != null && <span className="text-xs tracking-wide shrink-0" style={{ color: '#ffb020' }}>{'★'.repeat(Math.round(g.rating))}</span>}
          </div>
        ))}
      </div>
    </StorySlide>
  )
}

// "HALL DA FAMA" (round 2 part G3) — every beaten game's cover as a full wall, the literal
// "tudo que você zerou" the user asked to see.
function BeatenWallSlide({ recap }) {
  const games = recap.beatenGames
  return (
    <StorySlide accent="#3ddc6a" bgClassName="bg-black">
      <SceneBackdrop covers={games.map(g => g.cover)} accent="#3ddc6a" />
      <p className="relative recap-pixel text-[10px] tracking-widest opacity-70">HALL DA FAMA</p>
      <p className="relative recap-pixel text-lg text-center recap-glow max-w-[260px]">{wallVerdict(games.length)}</p>
      <div className="relative grid grid-cols-5 gap-1 max-w-[320px]">
        {games.slice(0, 25).map((g, i) => (
          <img
            key={i}
            src={g.cover}
            alt=""
            className="recap-anim-trophy-pop w-full aspect-[3/4] object-cover rounded"
            style={{ animationDelay: `${(i % 10) * 60}ms` }}
          />
        ))}
      </div>
      <div className="relative flex items-center gap-2">
        <CoinIcon color="#3ddc6a" className="w-6 h-6" />
        <p className="recap-pixel text-2xl recap-glow">{games.length}</p>
      </div>
      <p className="relative text-sm text-white/70 text-center">tudo que você zerou este ano</p>
    </StorySlide>
  )
}

// "CHARACTER SELECT" verdict card — the player-type archetype, the headline payoff slide. Bars
// are real ratios computed from recap fields already in hand; the radar wheel behind them is a
// real chart of those same values, and the year's top games sit below as a footer row.
function PlayerTypeSlide({ recap, subject }) {
  const genreFocus = recap.topGenres?.length > 0 ? Math.round((recap.topGenres[0][1] / recap.gamesBeaten) * 100) : 0
  const bars = [
    { label: 'FOCO', value: genreFocus, pct: genreFocus },
    { label: 'ALCANCE', value: recap.consolesTouched?.length || 0, pct: Math.min(100, ((recap.consolesTouched?.length || 0) / 6) * 100) },
    { label: 'VOLUME', value: recap.gamesBeaten, pct: Math.min(100, (recap.gamesBeaten / 20) * 100) },
  ]
  return (
    <StorySlide accent="#7c5cff" bgClassName="bg-[#140a2a]">
      <SceneBackdrop covers={recap.beatenGames.map(g => g.cover)} accent="#7c5cff" />
      <p className="relative recap-pixel text-[10px] tracking-widest opacity-70">{subject === 'Você' ? 'PLAYER 1' : deaccent(subject?.toUpperCase() || '')}</p>
      <div
        className="relative recap-anim-stamp-impact px-4 py-2 mt-1"
        style={{ border: '2px solid #7c5cff', backgroundColor: 'rgba(124,92,255,0.12)' }}
      >
        <p className="recap-pixel text-lg recap-glow text-center">{recap.playerType.label.toUpperCase()}</p>
      </div>
      <div className="relative flex flex-col gap-2 w-52 mt-4">
        <StatWheel values={bars.map(b => b.pct)} color="#7c5cff" />
        {bars.map(b => (
          <div key={b.label} className="relative flex items-center gap-2">
            <span className="recap-pixel text-[8px] opacity-60 w-16 shrink-0">{b.label}</span>
            <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full recap-anim-bar-fill" style={{ backgroundColor: '#7c5cff', '--recap-fill': `${b.pct}%` }} />
            </div>
            <span className="text-[10px] font-bold text-white w-6 text-right">{b.value}</span>
          </div>
        ))}
      </div>
      {recap.topGames?.length > 0 && <CoverRow covers={recap.topGames.map(g => g.cover)} max={5} size="w-9" className="relative flex gap-1.5" />}
    </StorySlide>
  )
}

// "GAME CLEAR" results plaque — the closing screen (round 2 part G4): the Top-5 mini-list is
// now the centerpiece, alongside stat tiles, the player-type stamp, and consoles, over a wall
// of the year's own covers.
function ClosingCardSlide({ recap, year, subject }) {
  const top5 = recap.topGames.slice(0, 5)
  const tiles = [
    recap.topGenres?.length > 0 && { label: 'GENERO', value: recap.topGenres[0][0] },
    recap.avgMetacritic != null && { label: 'MEDIA META.', value: recap.avgMetacritic },
    recap.achievementsThisYear?.length > 0 && { label: 'CONQUISTAS', value: recap.achievementsThisYear.length },
    recap.busiestMonth && { label: 'MES CAMPEAO', value: MONTHS_PT[recap.busiestMonth.month].slice(0, 3).toUpperCase() },
  ].filter(Boolean)

  return (
    <StorySlide accent="#3ddc6a" bgClassName="bg-[#04130a]" tease={null}>
      <div
        className="w-full max-w-[300px] aspect-[9/16] border-2 rounded-md flex flex-col items-center p-3 overflow-hidden relative"
        style={{ borderColor: '#3ddc6a' }}
      >
        <SceneBackdrop covers={recap.beatenGames.map(g => g.cover)} accent="#3ddc6a" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/85" />

        <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: '#3ddc6a' }} />
        <span className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: '#3ddc6a' }} />
        <span className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: '#3ddc6a' }} />
        <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: '#3ddc6a' }} />

        <p className="relative recap-pixel text-[9px] tracking-widest opacity-70 mt-1">GAME CLEAR — {year}</p>
        <p className="relative recap-pixel text-4xl recap-glow recap-anim-score-flash leading-none mt-1">
          {recap.gamesBeaten > 0 ? String(recap.gamesBeaten).padStart(2, '0') : '—'}
        </p>
        <p className="relative text-[9px] uppercase tracking-wide opacity-70">
          {recap.gamesBeaten > 0 ? 'jogos zerados' : 'nenhum jogo zerado (ainda)'}
        </p>

        {recap.playerType && (
          <div
            className="relative recap-pixel text-[11px] text-center px-2 py-1 mt-1.5 -rotate-2 recap-anim-stamp-impact"
            style={{ color: '#ffb020', border: '2px solid #ffb020', backgroundColor: 'rgba(255,176,32,0.1)' }}
          >
            {deaccent(recap.playerType.label.toUpperCase())}
          </div>
        )}

        {top5.length > 0 && (
          <div className="relative flex flex-col gap-1 w-full mt-2">
            <p className="recap-pixel text-[7px] tracking-widest opacity-60">TOP 5</p>
            {top5.map((g, i) => (
              <div key={g.id} className="flex items-center gap-1.5">
                <span className="recap-pixel text-[8px] w-3 text-center shrink-0">{i + 1}</span>
                <img src={g.cover} alt="" className="w-5 h-7 object-cover rounded shrink-0" />
                <span className="text-[9px] text-white truncate flex-1">{g.title}</span>
              </div>
            ))}
          </div>
        )}

        {tiles.length > 0 && (
          <div className="relative grid grid-cols-2 gap-1 w-full mt-2">
            {tiles.map(t => (
              <div key={t.label} className="border border-white/20 rounded px-1.5 py-1 bg-black/55">
                <p className="recap-pixel text-[6px] tracking-wide opacity-60 leading-none">{t.label}</p>
                <p className="text-[10px] font-bold text-white mt-0.5 leading-tight truncate">{t.value}</p>
              </div>
            ))}
          </div>
        )}

        {recap.consolesTouched?.length > 0 && (
          <div className="relative flex flex-wrap items-center justify-center gap-1 w-full mt-1.5">
            {recap.consolesTouched.map(c => (
              <span
                key={c.id}
                className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                style={{ color: c.accentColor, border: `1px solid ${c.accentColor}`, backgroundColor: `${c.accentColor}1a` }}
              >
                {c.label}
              </span>
            ))}
          </div>
        )}

        <p className="relative text-[9px] opacity-50 mt-auto pt-1.5">
          {subject === 'Você' ? 'sua coleção' : `coleção de ${subject}`}
        </p>
      </div>
    </StorySlide>
  )
}

// Builds the ordered slide list for a recap — skips slides whose backing field is empty.
// `subject` ("Você" or a friend's display name) is threaded through so the exact same slides
// serve self and friend recaps with no duplicated copy/logic. Title, games-beaten, and the
// closing card are always present (the zero-state guard); every slide in between is included
// only when its field actually has data.
export function buildSlides(recap, year, { subject = 'Você' } = {}) {
  if (!recap) return []
  const props = { recap, year, subject }
  const slides = [{ id: 'title', Component: TitleSlide, props }]

  if (recap.firstGame) slides.push({ id: 'first-game', Component: FirstGameSlide, props })

  slides.push({ id: 'games-beaten', Component: GamesBeatenSlide, props })

  if (recap.topGames?.length > 0) slides.push({ id: 'top5', Component: Top5GamesSlide, props })
  if (recap.gamesPlayed > recap.gamesBeaten) slides.push({ id: 'continue', Component: ContinueSlide, props })
  if (recap.prevYearGamesBeaten > 0) slides.push({ id: 'vs', Component: VsSlide, props })
  if (recap.platformLoyalty) slides.push({ id: 'platform-loyalty', Component: PlatformLoyaltySlide, props })
  if (recap.busiestMonth) slides.push({ id: 'busiest-month', Component: BusiestMonthSlide, props })
  if (recap.topGenres?.length > 0) slides.push({ id: 'top-genres', Component: TopGenresSlide, props })
  if (recap.completionistRatio) slides.push({ id: 'completionist', Component: CompletionistSlide, props })
  if (recap.avgMetacritic != null) slides.push({ id: 'avg-metacritic', Component: AvgMetacriticSlide, props })
  if (recap.consolesTouched?.length > 0) slides.push({ id: 'consoles', Component: ConsolesSlide, props })
  if (recap.topRatedGame) slides.push({ id: 'top-rated', Component: TopRatedSlide, props })
  if (recap.hiddenGem) slides.push({ id: 'hidden-gem', Component: HiddenGemSlide, props })
  if (recap.achievementsThisYear?.length > 0) slides.push({ id: 'achievements', Component: AchievementsSlide, props })
  if (recap.beatenGames?.length > 0) slides.push({ id: 'wall', Component: BeatenWallSlide, props })
  if (recap.friendPercentile) slides.push({ id: 'friend-rank', Component: FriendRankSlide, props })
  if (recap.playerType) slides.push({ id: 'player-type', Component: PlayerTypeSlide, props })

  slides.push({ id: 'closing', Component: ClosingCardSlide, props })
  return slides
}
