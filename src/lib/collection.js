import { readyConsoles, getConsole } from '../consoles/registry'
import { coverSrc } from '../consoles/dl'
import { getMyStatuses } from './db'
import { supabase } from './supabase'
import { isMockMode } from './mockState'
import { MOCK_STATUS_ROWS_STORE } from './mockSocialData'
import { getUserAchievements, achievementById, getFriends } from './social'

// For each ready console, fetch the current user's statuses and join them against that
// console's static games data. Only games with at least one status flag set are kept —
// this is what powers the cross-console dashboard (Phase E of the PS2 plan).
export async function getCollection() {
  const consoles = readyConsoles()
  const pairs = await Promise.all(
    consoles.map(c => getMyStatuses(c.id).then(s => [c, s]).catch(() => [c, {}]))
  )
  return pairs
    .map(([console_, statuses]) => {
      const games = console_.games.filter(g => {
        const s = statuses[g.id]
        return s && (s.joguei || s.zerado || s.cem_porcento || s.quero || s.jogando)
      })
      return { console: console_, games, statuses }
    })
    .filter(group => group.games.length > 0)
}

// Cross-console status rows for a user, across every ready console — the shared fetch
// both getProfileStats and getYearInReview build on (needs registry access, so lives
// here rather than in social.js, same split collection.js already establishes).
export async function getAllStatusRows(userId) {
  if (isMockMode()) {
    return (MOCK_STATUS_ROWS_STORE[userId] || []).map(r => ({ ...r, _console: getConsole(r.console) }))
  }
  const consoles = readyConsoles()
  const results = await Promise.all(
    consoles.map(async c => {
      const { data, error } = await supabase
        .from('game_statuses')
        .select('*')
        .eq('console', c.id)
        .eq('user_id', userId)
      if (error) return []
      return data.map(r => ({ ...r, _console: c }))
    })
  )
  return results.flat()
}

// Cross-console profile stats — sums across every ready console, no follower/following
// counts (deliberately excluded per product decision).
export async function getProfileStats(userId) {
  const rows = await getAllStatusRows(userId)
  return {
    joguei: rows.filter(r => r.joguei).length,
    zerado: rows.filter(r => r.zerado).length,
    cem_porcento: rows.filter(r => r.cem_porcento).length,
    quero: rows.filter(r => r.quero).length,
    jogando: rows.filter(r => r.jogando).length,
    total: rows.filter(r => r.joguei || r.zerado || r.cem_porcento || r.quero || r.jogando).length,
  }
}

// All-time genre breakdown across every played game — generalizes the per-year genre
// logic in getYearInReview to "ever", for the profile's taste-fingerprint widget.
export async function getTasteProfile(userId) {
  const rows = await getAllStatusRows(userId)
  const genreCounts = {}
  for (const r of rows) {
    if (!(r.joguei || r.zerado || r.cem_porcento || r.jogando)) continue
    const game = r._console.games.find(g => g.id === r.game_id)
    for (const genre of game?.genre || []) genreCounts[genre] = (genreCounts[genre] || 0) + 1
  }
  return Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
}

// % of a console's total catalog the user has finished (zerado/cem_porcento) — the
// per-console completion meter shown atop each profile "estante" shelf.
export function getConsoleCompletion(rows, console_) {
  if (!console_.games.length) return 0
  const completed = rows.filter(r => r.console === console_.id && (r.zerado || r.cem_porcento)).length
  return Math.round((completed / console_.games.length) * 100)
}

// Spotify-Wrapped-style yearly recap. Single canonical "what year does this row count
// toward" rule, used by every derived field below (beaten/played/rated/genres/consoles) so
// a row's effective year is consistent everywhere — previously `topRatedGame` bucketed off
// `updated_at` alone while `beatenThisYear` preferred the explicit `<flag>_year` column (set
// via GameModal's "quando você jogou isso?" picker), so a game finished via the year-picker
// but edited in a different calendar year could count as "zerado" for one year yet be
// invisible to the top-rated/genre slides for that same year. Preference order: the flag's
// own `_year` column (most precise intent), then any other set flag's `_year`, then
// `updated_at`'s year as the last resort for rows predating the picker.
function rowYear(r) {
  if (r.zerado_year != null) return r.zerado_year
  if (r.cem_porcento_year != null) return r.cem_porcento_year
  if (r.joguei_year != null) return r.joguei_year
  return r.updated_at ? new Date(r.updated_at).getFullYear() : null
}

// Each genre tuple now carries a few of its own covers (`[genre, count, covers]`) — the round-2
// principle that no stat stands alone without the real games it's built from. Existing index-
// based consumers (`top[0]`/`top[1]`) are unaffected by the appended third element.
function topGenres(rows, limit = 5) {
  const genreCounts = {}
  const genreCovers = {}
  for (const r of rows) {
    const game = r._console.games.find(g => g.id === r.game_id)
    if (!game?.genre?.length) continue
    const cover = gameWithCover(r)?.cover
    for (const genre of game.genre) {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
      const covers = genreCovers[genre] || (genreCovers[genre] = [])
      if (cover && covers.length < 6 && !covers.includes(cover)) covers.push(cover)
    }
  }
  return Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre, count]) => [genre, count, genreCovers[genre] || []])
}

function gameWithCover(row) {
  const game = row._console.games.find(g => g.id === row.game_id)
  if (!game) return null
  return { ...game, console: row._console, cover: coverSrc(game, row._console) }
}

// Earliest beaten game of the year, by updated_at (the only timestamp with day-level
// precision — `_year` columns are year-only) — null if no beaten row has a usable timestamp.
function computeFirstGame(beatenThisYear) {
  const withTimestamp = beatenThisYear.filter(r => r.updated_at)
  if (!withTimestamp.length) return null
  const earliest = withTimestamp.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at))[0]
  return gameWithCover(earliest)
}

// Mean Metacritic `score` across beaten games that have one — null if none do, so the
// slide built on this can skip rather than show a misleading "average of nothing."
function computeAvgMetacritic(beatenThisYear) {
  const scores = beatenThisYear
    .map(r => r._console.games.find(g => g.id === r.game_id)?.score)
    .filter(s => typeof s === 'number')
  if (!scores.length) return null
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
}

// Busiest month, gated on having enough rows with a real *in-year* `updated_at` (not just an
// in-year `_year` column, which is too coarse — year-only — to bucket by month). Below the
// threshold, the data is too sparse/unreliable to claim a "busiest month" and the slide skips.
// Carries `covers` for the games actually beaten that month — the stat's own evidence.
function computeBusiestMonth(beatenThisYear, year, { minSample = 3 } = {}) {
  const clean = beatenThisYear.filter(r => r.updated_at && new Date(r.updated_at).getFullYear() === year)
  if (clean.length < minSample) return null
  const counts = {}
  for (const r of clean) {
    const month = new Date(r.updated_at).getMonth()
    counts[month] = (counts[month] || 0) + 1
  }
  const [month, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  const monthNum = Number(month)
  const covers = [...new Set(
    clean.filter(r => new Date(r.updated_at).getMonth() === monthNum).map(r => gameWithCover(r)?.cover).filter(Boolean)
  )].slice(0, 8)
  return { month: monthNum, count, covers }
}

const PLAYER_TYPE_LABELS = {
  platinador: 'Caçador de Platina',
  maratonista_rpg: 'Maratonista de RPG',
  explorador: 'Explorador Multiplataforma',
  arqueologo: 'Arqueólogo Retrô',
  versatil: 'Jogador Versátil',
}

// Deterministic archetype from genre dominance + completion ratio (cem_porcento vs zerado)
// + console spread + retro-game share — the "listening age" analog. Checked in a fixed,
// most-specific-first order so a year can only ever match one archetype. Null if nothing
// was beaten this year (no archetype to claim).
function computePlayerType(beatenThisYear, consolesTouchedCount, topGenresList) {
  if (!beatenThisYear.length) return null

  const completionRatio = beatenThisYear.filter(r => r.cem_porcento).length / beatenThisYear.length
  const retroRatio = beatenThisYear.filter(r => {
    const g = r._console.games.find(x => x.id === r.game_id)
    return g?.year && g.year < 1995
  }).length / beatenThisYear.length
  const topGenre = topGenresList[0]?.[0]

  let key
  if (completionRatio >= 0.4) key = 'platinador'
  else if (retroRatio >= 0.4) key = 'arqueologo'
  else if (consolesTouchedCount >= 4) key = 'explorador'
  else if (topGenre === 'RPG' || topGenre === 'JRPG') key = 'maratonista_rpg'
  else key = 'versatil'

  return { key, label: PLAYER_TYPE_LABELS[key] }
}

// Share of this year's beaten games on the single most-played console — the "platform
// loyalty" slide (Part C). Null with no beaten games (nothing to be loyal to yet). Carries
// `covers` for the games actually beaten on that console — never a bare percentage.
function computePlatformLoyalty(beatenThisYear) {
  if (!beatenThisYear.length) return null
  const counts = {}
  for (const r of beatenThisYear) counts[r._console.id] = (counts[r._console.id] || 0) + 1
  const [topConsoleId, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  const console_ = beatenThisYear.find(r => r._console.id === topConsoleId)._console
  const covers = [...new Set(
    beatenThisYear.filter(r => r._console.id === topConsoleId).map(r => gameWithCover(r)?.cover).filter(Boolean)
  )].slice(0, 8)
  return {
    console: { id: console_.id, label: console_.label, accentColor: console_.accentColor },
    count: topCount,
    pct: Math.round((topCount / beatenThisYear.length) * 100),
    covers,
  }
}

// cem_porcento share among beaten games this year — the "100% Club" slide (Part C). Null if
// the user hasn't 100%'d anything this year (a 0% completionist rate isn't a flattering stat).
// Carries `covers` for the actual 100%'d games — the platinum claim's own proof.
function computeCompletionistRatio(beatenThisYear) {
  if (!beatenThisYear.length) return null
  const cemRows = beatenThisYear.filter(r => r.cem_porcento)
  if (!cemRows.length) return null
  const covers = [...new Set(cemRows.map(r => gameWithCover(r)?.cover).filter(Boolean))].slice(0, 8)
  return { cem: cemRows.length, total: beatenThisYear.length, pct: Math.round((cemRows.length / beatenThisYear.length) * 100), covers }
}

// The beaten-and-rated game whose personal rating (scaled to a 0-100 Metacritic-comparable
// score) most exceeds its actual Metacritic score — "you rated this above what critics did."
// Requires a real double-digit gap, not noise from rounding, so the slide only ever claims a
// genuine above-consensus call.
function computeHiddenGem(ratedThisYear) {
  let best = null
  let bestGap = -Infinity
  for (const r of ratedThisYear) {
    const game = r._console.games.find(g => g.id === r.game_id)
    if (!game || typeof game.score !== 'number') continue
    const gap = r.rating * 20 - game.score
    if (gap > bestGap) {
      bestGap = gap
      best = { ...gameWithCover(r), rating: r.rating, metacritic: game.score, gap: Math.round(gap) }
    }
  }
  return bestGap >= 10 ? best : null
}

// The year's headline ranked list — "TOP 5 DO ANO" (round 2's centerpiece). Composite sort
// (personal rating desc, then Metacritic score desc, then recency) rather than rating-only, so
// the list stays full even in a year with few/no star ratings — a real top 5, never empty.
function computeTopGames(beatenThisYear, limit = 5) {
  const withGames = beatenThisYear
    .map(r => ({ row: r, game: gameWithCover(r) }))
    .filter(x => x.game?.cover)

  const sorted = withGames.sort((a, b) => {
    const ratingDiff = (b.row.rating ?? -1) - (a.row.rating ?? -1)
    if (ratingDiff !== 0) return ratingDiff
    const scoreDiff = (b.game.score ?? -1) - (a.game.score ?? -1)
    if (scoreDiff !== 0) return scoreDiff
    return new Date(b.row.updated_at || 0) - new Date(a.row.updated_at || 0)
  })

  const seen = new Set()
  const out = []
  for (const { row, game } of sorted) {
    if (seen.has(game.id)) continue
    seen.add(game.id)
    out.push({ id: game.id, title: game.title, cover: game.cover, rating: row.rating ?? null, score: game.score ?? null })
    if (out.length >= limit) break
  }
  return out
}

// Every beaten game's cover, deduped — the "HALL DA FAMA" wall's raw material and the default
// cover-collage fill for slides that don't have a more specific evidence set of their own.
function computeBeatenGames(beatenThisYear, cap = 40) {
  const seen = new Set()
  const out = []
  for (const r of beatenThisYear) {
    const game = gameWithCover(r)
    if (!game?.cover || seen.has(game.id)) continue
    seen.add(game.id)
    out.push({ title: game.title, cover: game.cover })
    if (out.length >= cap) break
  }
  return out
}

// Games played this year but not (yet) beaten — the real titles behind the "CONTINUE?" slide,
// replacing round 1's nameless placeholder figures. Same `joguei && !zerado && !cem_porcento`
// set the slide's "+N" count is already built from (see ContinueSlide in recapSlides.jsx).
function computeInProgressGames(rows, year, cap = 8) {
  const inProgress = rows.filter(r => r.joguei && !r.zerado && !r.cem_porcento && rowYear(r) === year)
  const seen = new Set()
  const out = []
  for (const r of inProgress) {
    const game = gameWithCover(r)
    if (!game?.cover || seen.has(game.id)) continue
    seen.add(game.id)
    out.push({ title: game.title, cover: game.cover })
    if (out.length >= cap) break
  }
  return out
}

// The real high-scoring games behind the Metacritic slide's claim ("você joga o que o mundo
// aplaude") — the user's explicit example of a number that must never stand alone. Distinct
// from `topGames` (personal-rating-led): this is critic-score-led, the actual evidence for the
// average shown on that slide.
function computeTopMetacriticGames(beatenThisYear, limit = 5) {
  const withScore = beatenThisYear
    .map(r => gameWithCover(r))
    .filter(g => g?.cover && typeof g.score === 'number')
    .sort((a, b) => b.score - a.score)

  const seen = new Set()
  const out = []
  for (const g of withScore) {
    if (seen.has(g.id)) continue
    seen.add(g.id)
    out.push({ title: g.title, cover: g.cover, score: g.score })
    if (out.length >= limit) break
  }
  return out
}

export async function getYearInReview(userId, year = new Date().getFullYear()) {
  const rows = await getAllStatusRows(userId)

  const beatenThisYear = rows.filter(r => (r.zerado || r.cem_porcento) && rowYear(r) === year)
  const beatenLastYear = rows.filter(r => (r.zerado || r.cem_porcento) && rowYear(r) === year - 1)
  const playedThisYear = rows.filter(r => r.joguei && rowYear(r) === year)
  const ratedThisYear = rows.filter(r => r.rating != null && rowYear(r) === year)

  const topRatedRow = ratedThisYear.sort((a, b) => b.rating - a.rating)[0]
  const topRatedGame = topRatedRow ? { ...gameWithCover(topRatedRow), rating: topRatedRow.rating } : null

  const consolesTouched = [...new Map(beatenThisYear.map(r => [r._console.id, r._console])).values()]
    .map(c => ({ id: c.id, label: c.label, accentColor: c.accentColor }))

  const topGenresList = topGenres(beatenThisYear)

  // Capped, deduped cover list for the title slide's attract-mode marquee — built from rows
  // already in hand, no new query.
  const beatenCovers = [...new Set(
    beatenThisYear.map(r => gameWithCover(r)?.cover).filter(Boolean)
  )].slice(0, 12)

  // The VS slide's "evidence" for last year — real covers, not a bare count, on both sides of
  // the face-off (same `beatenLastYear` rows already fetched, no new query).
  const prevYearCovers = [...new Set(
    beatenLastYear.map(r => gameWithCover(r)?.cover).filter(Boolean)
  )].slice(0, 6)

  let achievementsThisYear = []
  try {
    const unlocks = await getUserAchievements(userId)
    achievementsThisYear = unlocks
      .filter(u => u.unlocked_at && new Date(u.unlocked_at).getFullYear() === year)
      .map(u => ({ ...u, achievement: achievementById(u.achievement_id) }))
      .filter(u => u.achievement)
  } catch { /* non-critical, recap still works without it */ }

  return {
    year,
    isCurrentYear: year === new Date().getFullYear(),
    gamesBeaten: beatenThisYear.length,
    gamesPlayed: playedThisYear.length,
    prevYearGamesBeaten: beatenLastYear.length,
    prevYearCovers,
    topGenres: topGenresList,
    topRatedGame,
    consolesTouched,
    achievementsThisYear,
    beatenCovers,
    firstGame: computeFirstGame(beatenThisYear),
    avgMetacritic: computeAvgMetacritic(beatenThisYear),
    busiestMonth: computeBusiestMonth(beatenThisYear, year),
    playerType: computePlayerType(beatenThisYear, consolesTouched.length, topGenresList),
    platformLoyalty: computePlatformLoyalty(beatenThisYear),
    completionistRatio: computeCompletionistRatio(beatenThisYear),
    hiddenGem: computeHiddenGem(ratedThisYear),
    topGames: computeTopGames(beatenThisYear),
    beatenGames: computeBeatenGames(beatenThisYear),
    inProgressGames: computeInProgressGames(rows, year),
    topMetacriticGames: computeTopMetacriticGames(beatenThisYear),
  }
}

// What share of a user's friends this user out-beat this year — the comparative "FriendRank"
// slide (Part D). Self-only by design (callers should never pass a friend's userId in here).
// Null when there are no friends, or none of them have any recap-eligible activity for `year`
// (nothing to compare against) — same zero-state-guard pattern as every other optional field.
export async function getFriendRecapPercentile(userId, year) {
  const friends = await getFriends(userId)
  if (!friends.length) return null

  const myRows = await getAllStatusRows(userId)
  const myBeaten = myRows.filter(r => (r.zerado || r.cem_porcento) && rowYear(r) === year).length

  const friendCounts = await Promise.all(
    friends.map(async f => {
      const rows = await getAllStatusRows(f.id)
      return rows.filter(r => (r.zerado || r.cem_porcento) && rowYear(r) === year).length
    })
  )
  const eligible = friendCounts.filter(c => c > 0)
  if (!eligible.length) return null

  const beatenByFewerOrEqual = eligible.filter(c => c <= myBeaten).length
  return {
    percentile: Math.round((beatenByFewerOrEqual / eligible.length) * 100),
    friendCount: eligible.length,
    myBeaten,
  }
}

// Distinct years with real play activity (joguei/zerado/cem_porcento — wishlist-only `quero`
// years don't count), descending — backs the Year Recap story's year picker (both self and
// friends) so navigation only ever lands on a year that actually has something to show.
// One extra pass over rows `getAllStatusRows` already fetches; no new query.
export async function getEligibleRecapYears(userId) {
  const rows = await getAllStatusRows(userId)
  const years = new Set()
  for (const r of rows) {
    if (r.joguei || r.zerado || r.cem_porcento) years.add(rowYear(r))
  }
  return [...years].filter(y => y != null).sort((a, b) => b - a)
}
