import { supabase } from './supabase'
import { isMockMode } from './mockState'

// Group polls ("qual jogo a galera deveria jogar agora") — session-only mock store, same
// pattern as the other interaction stores. game_ids is a small array (2-4 entries).
const MOCK_POLLS = []     // { id, creator_id, console, game_ids, created_at, closes_at, profiles }
const MOCK_POLL_VOTES = [] // { poll_id, voter_id, game_id }

// Selectable poll lifetimes — kept to exactly these three options in the create modal.
export const POLL_DURATIONS = {
  '1d': { label: '1 dia', ms: 24 * 60 * 60 * 1000 },
  '1w': { label: '1 semana', ms: 7 * 24 * 60 * 60 * 1000 },
  '1m': { label: '1 mês', ms: 30 * 24 * 60 * 60 * 1000 },
}

export async function createPoll(creatorId, consoleId, gameIds, title, durationKey = '1w') {
  const closesAt = new Date(Date.now() + POLL_DURATIONS[durationKey].ms).toISOString()
  if (isMockMode()) {
    const poll = {
      id: `mock-poll-${Date.now()}`, creator_id: creatorId, console: consoleId,
      title, game_ids: gameIds, created_at: new Date().toISOString(), closes_at: closesAt,
    }
    MOCK_POLLS.unshift(poll)
    return poll
  }
  const { data, error } = await supabase
    .from('polls')
    .insert({ console: consoleId, title, game_ids: gameIds, closes_at: closesAt })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function votePoll(pollId, gameId, voterId) {
  if (isMockMode()) {
    const existing = MOCK_POLL_VOTES.find(v => v.poll_id === pollId && v.voter_id === voterId)
    if (existing) existing.game_id = gameId
    else MOCK_POLL_VOTES.push({ poll_id: pollId, voter_id: voterId, game_id: gameId })
    return
  }
  const { error } = await supabase
    .from('poll_votes')
    .upsert({ poll_id: pollId, game_id: gameId }, { onConflict: 'poll_id,voter_id' })
  if (error) throw error
}

// Open polls (not past closes_at) from self+friends, with this viewer's vote attached.
export async function getActivePolls(userIds, viewerId) {
  const now = new Date()

  if (isMockMode()) {
    return MOCK_POLLS
      .filter(p => userIds.includes(p.creator_id) && (!p.closes_at || new Date(p.closes_at) > now))
      .map(p => ({ ...p, myVote: MOCK_POLL_VOTES.find(v => v.poll_id === p.id && v.voter_id === viewerId)?.game_id || null }))
  }

  if (!userIds.length) return []
  // Disambiguate the embed — PostgREST also sees a many-to-many polls<->profiles path via
  // poll_votes, so a bare `profiles(...)` is rejected as ambiguous.
  const { data, error } = await supabase
    .from('polls')
    .select('*, profiles!polls_creator_id_fkey(username, display_name, avatar_url)')
    .in('creator_id', userIds)
    .or(`closes_at.is.null,closes_at.gt.${now.toISOString()}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!data.length) return []

  const pollIds = data.map(p => p.id)
  const { data: myVotes } = await supabase
    .from('poll_votes')
    .select('poll_id, game_id')
    .in('poll_id', pollIds)
    .eq('voter_id', viewerId)

  return data.map(p => ({ ...p, myVote: myVotes?.find(v => v.poll_id === p.id)?.game_id || null }))
}

// Closed polls (past closes_at) from self+friends, newest-first — backs the site-wide
// /polls history page. Mirrors getActivePolls's shape but inverted on the closes_at check.
export async function getClosedPolls(userIds, viewerId) {
  const now = new Date()

  if (isMockMode()) {
    return MOCK_POLLS
      .filter(p => userIds.includes(p.creator_id) && p.closes_at && new Date(p.closes_at) <= now)
      .map(p => ({ ...p, myVote: MOCK_POLL_VOTES.find(v => v.poll_id === p.id && v.voter_id === viewerId)?.game_id || null }))
  }

  if (!userIds.length) return []
  const { data, error } = await supabase
    .from('polls')
    .select('*, profiles!polls_creator_id_fkey(username, display_name, avatar_url)')
    .in('creator_id', userIds)
    .lte('closes_at', now.toISOString())
    .order('closes_at', { ascending: false })
  if (error) throw error
  if (!data.length) return []

  const pollIds = data.map(p => p.id)
  const { data: myVotes } = await supabase
    .from('poll_votes')
    .select('poll_id, game_id')
    .in('poll_id', pollIds)
    .eq('voter_id', viewerId)

  return data.map(p => ({ ...p, myVote: myVotes?.find(v => v.poll_id === p.id)?.game_id || null }))
}

// Closed polls created by a single user — backs the "Votações" tab on their profile.
// No friend-list filtering needed: RLS on `polls` already hides it if the viewer isn't
// the creator or an accepted friend.
export async function getClosedPollsByCreator(creatorId) {
  const now = new Date()

  if (isMockMode()) {
    return MOCK_POLLS.filter(p => p.creator_id === creatorId && p.closes_at && new Date(p.closes_at) <= now)
  }

  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('creator_id', creatorId)
    .lte('closes_at', now.toISOString())
    .order('closes_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getPollResults(pollId) {
  const votes = isMockMode()
    ? MOCK_POLL_VOTES.filter(v => v.poll_id === pollId)
    : await (async () => {
      const { data, error } = await supabase.from('poll_votes').select('game_id').eq('poll_id', pollId)
      if (error) throw error
      return data
    })()

  const counts = {}
  for (const v of votes) counts[v.game_id] = (counts[v.game_id] || 0) + 1
  return { counts, total: votes.length }
}
