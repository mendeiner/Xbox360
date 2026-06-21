import { supabase } from './supabase'
import { isMockMode } from './mockState'
import { getAllStatusRows } from './collection'

// Head-to-head duel voting + the compatibility score derived from it (plus rating
// similarity). Session-only in-memory store for mock mode, same pattern as the other
// interaction stores in mockSocialData.js — kept local here since it's specific to duels.
const MOCK_DUEL_VOTES = [] // { id, voter_id, console, game_a_id, game_b_id, winner_game_id, created_at }

// userId:friendId -> score, session-lived — CompatibilityBadge mounts/unmounts on every
// hover open/close, so without this it re-runs 4 queries on every single hover.
const compatCache = new Map()

function pairKey(consoleId, a, b) {
  return a < b ? `${consoleId}:${a}:${b}` : `${consoleId}:${b}:${a}`
}

async function getUserDuelVotes(userId) {
  if (isMockMode()) return MOCK_DUEL_VOTES.filter(v => v.voter_id === userId)
  const { data, error } = await supabase
    .from('duel_votes')
    .select('console, game_a_id, game_b_id, winner_game_id')
    .eq('voter_id', userId)
  if (error) throw error
  return data
}

// Picks two games (same console) the given user has a status for, skipping pairs already
// voted on by that user. Returns null if there isn't enough played-game variety yet.
export async function getNextDuelPair(userId) {
  const rows = await getAllStatusRows(userId)
  const played = rows.filter(r => r.joguei || r.zerado || r.cem_porcento)

  const byConsole = {}
  for (const r of played) (byConsole[r.console] ||= []).push(r)
  const consoleIds = Object.keys(byConsole).filter(c => byConsole[c].length >= 2)
  if (!consoleIds.length) return null

  const voted = await getUserDuelVotes(userId)
  const votedPairs = new Set(voted.map(v => pairKey(v.console, v.game_a_id, v.game_b_id)))

  for (let attempt = 0; attempt < 20; attempt++) {
    const consoleId = consoleIds[Math.floor(Math.random() * consoleIds.length)]
    const pool = byConsole[consoleId]
    const a = pool[Math.floor(Math.random() * pool.length)]
    const b = pool[Math.floor(Math.random() * pool.length)]
    if (a.game_id === b.game_id) continue
    if (votedPairs.has(pairKey(consoleId, a.game_id, b.game_id))) continue

    const console_ = a._console
    const gameA = console_.games.find(g => g.id === a.game_id)
    const gameB = console_.games.find(g => g.id === b.game_id)
    if (!gameA || !gameB) continue
    return { console: console_, consoleId, gameA, gameB }
  }
  return null
}

export async function castDuelVote(consoleId, gameAId, gameBId, winnerGameId, voterId) {
  const [normA, normB] = gameAId < gameBId ? [gameAId, gameBId] : [gameBId, gameAId]

  if (isMockMode()) {
    const vote = {
      id: `mock-duel-${Date.now()}`, voter_id: voterId, console: consoleId,
      game_a_id: normA, game_b_id: normB, winner_game_id: winnerGameId,
      created_at: new Date().toISOString(),
    }
    MOCK_DUEL_VOTES.push(vote)
    return vote
  }

  const { data, error } = await supabase
    .from('duel_votes')
    .insert({ console: consoleId, game_a_id: normA, game_b_id: normB, winner_game_id: winnerGameId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getDuelTally(consoleId, gameAId, gameBId) {
  const [normA, normB] = gameAId < gameBId ? [gameAId, gameBId] : [gameBId, gameAId]

  const votes = isMockMode()
    ? MOCK_DUEL_VOTES.filter(v => v.console === consoleId && v.game_a_id === normA && v.game_b_id === normB)
    : await (async () => {
      const { data, error } = await supabase
        .from('duel_votes')
        .select('winner_game_id')
        .eq('console', consoleId)
        .eq('game_a_id', normA)
        .eq('game_b_id', normB)
      if (error) throw error
      return data
    })()

  const aWins = votes.filter(v => v.winner_game_id === gameAId).length
  const bWins = votes.filter(v => v.winner_game_id === gameBId).length
  const total = aWins + bWins
  return {
    total,
    aWins, bWins,
    aPct: total ? Math.round((aWins / total) * 100) : 0,
    bPct: total ? Math.round((bWins / total) * 100) : 0,
  }
}

// Combines duel agreement (% of shared voted pairs where both picked the same winner) with
// rating similarity (closeness of star ratings on commonly-rated games). Rating similarity
// is weighted higher since duel data will be sparse early on. Returns null if there isn't
// enough shared data yet for either signal.
export async function getCompatibilityScore(userId, friendId) {
  const cacheKey = `${userId}:${friendId}`
  if (compatCache.has(cacheKey)) return compatCache.get(cacheKey)

  const score = await computeCompatibilityScore(userId, friendId)
  compatCache.set(cacheKey, score)
  return score
}

async function computeCompatibilityScore(userId, friendId) {
  const [myRows, friendRows] = await Promise.all([getAllStatusRows(userId), getAllStatusRows(friendId)])
  const myRatings = new Map(myRows.filter(r => r.rating).map(r => [`${r.console}:${r.game_id}`, r.rating]))
  const friendRatings = new Map(friendRows.filter(r => r.rating).map(r => [`${r.console}:${r.game_id}`, r.rating]))
  const sharedKeys = [...myRatings.keys()].filter(k => friendRatings.has(k))

  let ratingScore = null
  if (sharedKeys.length) {
    const avgDiff = sharedKeys.reduce((sum, k) => sum + Math.abs(myRatings.get(k) - friendRatings.get(k)), 0) / sharedKeys.length
    ratingScore = Math.max(0, 100 - (avgDiff / 4.5) * 100)
  }

  const [myVotes, friendVotes] = await Promise.all([getUserDuelVotes(userId), getUserDuelVotes(friendId)])
  const myVoteMap = new Map(myVotes.map(v => [pairKey(v.console, v.game_a_id, v.game_b_id), v.winner_game_id]))
  const sharedPairs = friendVotes.filter(v => myVoteMap.has(pairKey(v.console, v.game_a_id, v.game_b_id)))

  let duelScore = null
  if (sharedPairs.length) {
    const agree = sharedPairs.filter(v => myVoteMap.get(pairKey(v.console, v.game_a_id, v.game_b_id)) === v.winner_game_id).length
    duelScore = (agree / sharedPairs.length) * 100
  }

  if (ratingScore == null && duelScore == null) return null
  if (ratingScore == null) return Math.round(duelScore)
  if (duelScore == null) return Math.round(ratingScore)
  return Math.round(ratingScore * 0.7 + duelScore * 0.3)
}
