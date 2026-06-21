import { readyConsoles, getConsole } from '../consoles/registry'
import { getMyStatuses } from './db'
import { supabase } from './supabase'
import { isMockMode } from './mockState'
import { MOCK_STATUS_ROWS_STORE } from './mockSocialData'

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
        return s && (s.joguei || s.zerado || s.cem_porcento || s.quero)
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
    total: rows.filter(r => r.joguei || r.zerado || r.cem_porcento || r.quero).length,
  }
}

// All-time genre breakdown across every played game — generalizes the per-year genre
// logic in getYearInReview to "ever", for the profile's taste-fingerprint widget.
export async function getTasteProfile(userId) {
  const rows = await getAllStatusRows(userId)
  const genreCounts = {}
  for (const r of rows) {
    if (!(r.joguei || r.zerado || r.cem_porcento)) continue
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

// Spotify-Wrapped-style yearly recap. Relies on game_statuses.updated_at (bumped by a
// DB trigger on every update) since there's no per-flag timestamp — this is the only way
// to approximate "beaten this year" instead of "beaten ever."
export async function getYearInReview(userId, year = new Date().getFullYear()) {
  const rows = await getAllStatusRows(userId)
  const inYear = r => r.updated_at && new Date(r.updated_at).getFullYear() === year

  const beatenThisYear = rows.filter(r => inYear(r) && (r.zerado || r.cem_porcento))

  const genreCounts = {}
  for (const r of beatenThisYear) {
    const game = r._console.games.find(g => g.id === r.game_id)
    for (const genre of game?.genre || []) {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    }
  }
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const ratedThisYear = rows.filter(r => inYear(r) && r.rating)
  const topRatedRow = ratedThisYear.sort((a, b) => b.rating - a.rating)[0]
  const topRatedGame = topRatedRow
    ? { ...topRatedRow._console.games.find(g => g.id === topRatedRow.game_id), rating: topRatedRow.rating, console: topRatedRow._console }
    : null

  const consolesTouched = new Set(beatenThisYear.map(r => r._console.id)).size

  return {
    year,
    gamesBeaten: beatenThisYear.length,
    topGenre,
    topRatedGame,
    consolesTouched,
  }
}
