import { supabase } from './supabase'
import { isMockMode } from './mockState'
import { getAllStatusRows } from './collection'
import { getConsole } from '../consoles/registry'

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
  const played = rows.filter(r => r.joguei || r.zerado || r.cem_porcento || r.jogando)

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
    const existing = MOCK_DUEL_VOTES.find(v =>
      v.voter_id === voterId && v.console === consoleId && v.game_a_id === normA && v.game_b_id === normB)
    if (existing) {
      existing.winner_game_id = winnerGameId
      return existing
    }
    const vote = {
      id: `mock-duel-${Date.now()}`, voter_id: voterId, console: consoleId,
      game_a_id: normA, game_b_id: normB, winner_game_id: winnerGameId,
      created_at: new Date().toISOString(),
    }
    MOCK_DUEL_VOTES.push(vote)
    return vote
  }

  // Upsert (not insert) so re-voting on a past duel — after going back in the widget —
  // overwrites the existing row instead of hitting duel_votes_unique_vote.
  const { data, error } = await supabase
    .from('duel_votes')
    .upsert({ voter_id: voterId, console: consoleId, game_a_id: normA, game_b_id: normB, winner_game_id: winnerGameId },
      { onConflict: 'voter_id,console,game_a_id,game_b_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// Classic single-elimination seeding order (1v8, 4v5, 2v7, 3v6 for size 8) so the top
// two seeds can only meet in the final.
function seedOrder(size) {
  if (size === 1) return [1]
  const prev = seedOrder(size / 2)
  const order = []
  for (const s of prev) order.push(s, size + 1 - s)
  return order
}

function topSeedNum(node) {
  return node.type === 'seed' ? node.seedNum : node.winnerSeedNum
}

// Builds the bracket tree by recursively halving the seed order — each half already
// contains exactly the seeds destined to meet there, so no manual round bookkeeping needed.
function buildBracketTree(order, seeds) {
  if (order.length === 1) {
    const seedNum = order[0]
    return { type: 'seed', seedNum, entry: seeds[seedNum - 1] }
  }
  const mid = order.length / 2
  const left = buildBracketTree(order.slice(0, mid), seeds)
  const right = buildBracketTree(order.slice(mid), seeds)
  // Retroactive bracket: the higher-win-count seed always "advances" — there's no
  // re-simulated match, just the existing vote tally visualized as a tournament.
  const winnerSeedNum = Math.min(topSeedNum(left), topSeedNum(right))
  return { type: 'match', left, right, winnerSeedNum }
}

// For each console the user has voted on, ranks every game that appeared in a duel by
// win count and lays the top ones out as a seeded single-elimination bracket.
export async function getUserDuelBrackets(userId) {
  const votes = await getUserDuelVotes(userId)
  if (!votes.length) return []

  const byConsole = {}
  for (const v of votes) (byConsole[v.console] ||= []).push(v)

  const brackets = []
  for (const consoleId of Object.keys(byConsole)) {
    const console_ = getConsole(consoleId)
    if (!console_) continue

    const winCount = new Map()
    const seen = new Set()
    for (const v of byConsole[consoleId]) {
      seen.add(v.game_a_id); seen.add(v.game_b_id)
      winCount.set(v.winner_game_id, (winCount.get(v.winner_game_id) || 0) + 1)
    }

    const ranked = [...seen]
      .map(gameId => ({ gameId, game: console_.games.find(g => g.id === gameId), wins: winCount.get(gameId) || 0 }))
      .filter(s => s.game)
      .sort((a, b) => b.wins - a.wins || a.game.title.localeCompare(b.game.title))

    const size = [8, 4, 2].find(n => ranked.length >= n)
    if (!size) continue

    const seeds = ranked.slice(0, size)
    const root = buildBracketTree(seedOrder(size), seeds)
    brackets.push({ consoleId, console: console_, seeds, root, championSeedNum: topSeedNum(root) })
  }

  return brackets.sort((a, b) => b.seeds.length - a.seeds.length)
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
