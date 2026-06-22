import { supabase } from './supabase'
import { isMockMode } from './mockState'
import {
  MOCK_FEED_POSTS, MOCK_COMMENTS_STORE, MOCK_REACTIONS_STORE, MOCK_PROFILES,
  MOCK_TOP10_STORE, MOCK_ACHIEVEMENTS_STORE,
} from './mockSocialData'

// achievement_id -> static def, used to attach { achievement } onto unlock rows for rendering.
function achievementById(id) {
  return ACHIEVEMENTS.find(a => a.id === id) || null
}

// Social data layer: feed posts, comments, reactions, friends, personal top-10 lists,
// the cross-console community ranking, achievements, and notifications.
// Mock mode (see mockState.js / mockSocialData.js) backs every function below with an
// in-memory 10-profile dataset so the whole social layer is previewable via "Entrar como Teste".

const MOCK_ME = { username: 'BrunoTeste', display_name: 'Bruno (Teste)', avatar_url: null }

// ── Feed ────────────────────────────────────────────────────────────────────

export async function createFeedPost(console_name, gameId, action, rating = null) {
  if (isMockMode()) {
    const post = {
      id: `mock-post-mine-${Date.now()}`,
      user_id: 'mock-user',
      console: console_name,
      game_id: gameId,
      action,
      rating,
      created_at: new Date().toISOString(),
      profiles: MOCK_ME,
    }
    MOCK_FEED_POSTS.unshift(post)
    return post
  }
  const { data, error } = await supabase
    .from('feed_posts')
    .insert({ console: console_name, game_id: gameId, action, rating })
    .select()
    .single()
  if (error) throw error
  return data
}

// One row covering several games added in the same browsing session (see
// LibraryAddBatchContext) — rendered distinctly by FeedPostCard since it has no single
// console/game_id of its own.
export async function createBatchFeedPost(items) {
  if (isMockMode()) {
    const post = {
      id: `mock-post-mine-${Date.now()}`,
      user_id: 'mock-user',
      console: null,
      game_id: null,
      action: 'added_games',
      rating: null,
      items,
      created_at: new Date().toISOString(),
      profiles: MOCK_ME,
    }
    MOCK_FEED_POSTS.unshift(post)
    return post
  }
  const { data, error } = await supabase
    .from('feed_posts')
    .insert({ action: 'added_games', items })
    .select()
    .single()
  if (error) throw error
  return data
}

// viewerId (optional) folds in the current viewer's own reaction per post, so
// FeedPostCard doesn't need a separate getReactionSummary round-trip per card.
export async function getFeedPosts(userIds, { limit = 30, before, viewerId } = {}) {
  if (isMockMode()) {
    const pool = before ? MOCK_FEED_POSTS.filter(p => new Date(p.created_at) < new Date(before)) : MOCK_FEED_POSTS
    return pool.slice(0, limit).map(post => ({
      ...post,
      commentCount: (MOCK_COMMENTS_STORE[post.id] || []).length,
      reactionCounts: Object.values(MOCK_REACTIONS_STORE[post.id] || {})
        .reduce((acc, r) => { acc[r] = (acc[r] || 0) + 1; return acc }, {}),
      myReaction: viewerId ? (MOCK_REACTIONS_STORE[post.id]?.[viewerId] || null) : null,
    }))
  }
  if (!userIds.length) return []
  // post_reactions also FKs to both feed_posts and profiles, so a bare `profiles(...)`
  // embed is ambiguous (PostgREST sees it as a possible many-to-many path too).
  let query = supabase
    .from('feed_posts')
    .select('*, profiles!feed_posts_user_id_fkey(username, display_name, avatar_url)')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (before) query = query.lt('created_at', before)
  const { data, error } = await query
  if (error) throw error
  if (!data.length) return []

  const postIds = data.map(p => p.id)
  const queries = [
    supabase.from('post_comments').select('post_id').in('post_id', postIds),
    supabase.from('post_reactions').select('post_id, reaction').in('post_id', postIds),
  ]
  if (viewerId) queries.push(supabase.from('post_reactions').select('post_id, reaction').in('post_id', postIds).eq('user_id', viewerId))
  const [{ data: comments }, { data: reactions }, mine] = await Promise.all(queries)

  return data.map(post => ({
    ...post,
    commentCount: (comments || []).filter(c => c.post_id === post.id).length,
    reactionCounts: (reactions || [])
      .filter(r => r.post_id === post.id)
      .reduce((acc, r) => { acc[r.reaction] = (acc[r.reaction] || 0) + 1; return acc }, {}),
    myReaction: viewerId ? (mine?.data?.find(r => r.post_id === post.id)?.reaction || null) : null,
  }))
}

// Most recent post per user_id — posts must already be sorted desc by created_at.
export function latestPostByUser(posts) {
  const result = {}
  for (const post of posts) {
    if (!result[post.user_id]) result[post.user_id] = post
  }
  return result
}

export async function getRecentComments(userIds, limit = 20) {
  if (isMockMode()) {
    return Object.values(MOCK_COMMENTS_STORE)
      .flat()
      .map(c => ({ ...c, feed_posts: MOCK_FEED_POSTS.find(p => p.id === c.post_id) }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
  }
  if (!userIds.length) return []
  const { data, error } = await supabase
    .from('post_comments')
    .select('*, profiles(username, display_name, avatar_url), feed_posts!inner(id, user_id, console, game_id, action, profiles!feed_posts_user_id_fkey(username, display_name))')
    .in('feed_posts.user_id', userIds)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// Recent achievement unlocks for self+friends — merged client-side with feed_posts by
// useActivityFeed into one chronological timeline (kept as a separate query rather than a
// 3-way DB union, see plan's "open risks" on merged-pagination correctness).
export async function getRecentAchievementUnlocks(userIds, { limit = 30, before } = {}) {
  if (isMockMode()) {
    let rows = userIds.flatMap(id => MOCK_ACHIEVEMENTS_STORE[id] || [])
      .map(u => ({ ...u, profiles: MOCK_PROFILES.find(p => p.id === u.user_id) }))
    if (before) rows = rows.filter(r => new Date(r.unlocked_at) < new Date(before))
    return rows
      .sort((a, b) => new Date(b.unlocked_at) - new Date(a.unlocked_at))
      .slice(0, limit)
      .map(u => ({ ...u, achievement: achievementById(u.achievement_id) }))
  }
  if (!userIds.length) return []
  let query = supabase
    .from('user_achievements')
    .select('*, profiles(username, display_name, avatar_url)')
    .in('user_id', userIds)
    .order('unlocked_at', { ascending: false })
    .limit(limit)
  if (before) query = query.lt('unlocked_at', before)
  const { data, error } = await query
  if (error) throw error
  return data.map(u => ({ ...u, achievement: achievementById(u.achievement_id) }))
}

// ── Comments ─────────────────────────────────────────────────────────────

export async function getComments(postId) {
  if (isMockMode()) {
    return (MOCK_COMMENTS_STORE[postId] || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }
  const { data, error } = await supabase
    .from('post_comments')
    .select('*, profiles(username, display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addComment(postId, body) {
  if (isMockMode()) {
    const comment = {
      id: `mock-comment-mine-${Date.now()}`,
      post_id: postId,
      user_id: 'mock-user',
      body,
      created_at: new Date().toISOString(),
      profiles: MOCK_ME,
    }
    MOCK_COMMENTS_STORE[postId] = [...(MOCK_COMMENTS_STORE[postId] || []), comment]
    return comment
  }

  const { data: comment, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, body })
    .select()
    .single()
  if (error) throw error

  const { data: post } = await supabase
    .from('feed_posts')
    .select('user_id')
    .eq('id', postId)
    .single()
  if (post) await notify(post.user_id, 'comment', postId)

  const { data: { user } } = await supabase.auth.getUser()
  if (user) checkAndUnlockAchievements(user.id).catch(() => {})

  return comment
}

export async function deleteComment(commentId) {
  if (isMockMode()) {
    for (const postId of Object.keys(MOCK_COMMENTS_STORE)) {
      MOCK_COMMENTS_STORE[postId] = MOCK_COMMENTS_STORE[postId].filter(c => c.id !== commentId)
    }
    return
  }
  const { error } = await supabase.from('post_comments').delete().eq('id', commentId)
  if (error) throw error
}

// ── Reactions ────────────────────────────────────────────────────────────

export const REACTIONS = ['fire', 'laugh', 'mind_blown', 'skull', 'clap', '100', 'goat', 'same']
export const REACTION_GLYPHS = {
  fire: '🔥', laugh: '😂', mind_blown: '🤯', skull: '💀',
  clap: '👏', '100': '💯', goat: '🐐', same: '🙋',
}
export const ACTION_LABEL = { joguei: 'jogou', zerado: 'zerou', cem_porcento: 'completou 100% de', quero: 'quer jogar' }

// Status transitions that post to the feed automatically — only on going from unset to set.
export const SHAREABLE = ['joguei', 'zerado', 'cem_porcento', 'quero']

export async function setReaction(postId, reaction, userId) {
  if (!REACTIONS.includes(reaction)) throw new Error(`Unknown reaction: ${reaction}`)

  if (isMockMode()) {
    const postReactions = MOCK_REACTIONS_STORE[postId] || (MOCK_REACTIONS_STORE[postId] = {})
    if (postReactions[userId] === reaction) {
      delete postReactions[userId]
      return null
    }
    postReactions[userId] = reaction
    return reaction
  }

  const { data: existing } = await supabase
    .from('post_reactions')
    .select('reaction')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing?.reaction === reaction) {
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    if (error) throw error
    return null
  }

  const { error } = await supabase
    .from('post_reactions')
    .upsert({ post_id: postId, reaction }, { onConflict: 'post_id,user_id' })
  if (error) throw error

  const { data: post } = await supabase
    .from('feed_posts')
    .select('user_id')
    .eq('id', postId)
    .single()
  if (post) await notify(post.user_id, 'reaction', postId)

  return reaction
}

export async function getReactionSummary(postId, userId) {
  if (isMockMode()) {
    const postReactions = MOCK_REACTIONS_STORE[postId] || {}
    const counts = Object.values(postReactions).reduce((acc, r) => { acc[r] = (acc[r] || 0) + 1; return acc }, {})
    return { counts, mine: postReactions[userId] || null }
  }
  const { data, error } = await supabase
    .from('post_reactions')
    .select('user_id, reaction')
    .eq('post_id', postId)
  if (error) throw error
  const counts = data.reduce((acc, r) => { acc[r.reaction] = (acc[r.reaction] || 0) + 1; return acc }, {})
  const mine = data.find(r => r.user_id === userId)?.reaction || null
  return { counts, mine }
}

// ── Friends ──────────────────────────────────────────────────────────────
// There's no add-friend flow in the app — every signup is auto-friended with the
// whole site by the `handle_new_user` trigger (see supabase/schema.sql), so
// `getFriends` below is the only thing this layer needs to expose.

export async function getFriends(userId) {
  if (isMockMode()) {
    return MOCK_PROFILES.map(p => ({ id: p.id, username: p.username, displayName: p.display_name, avatarUrl: p.avatar_url }))
  }
  // profiles is embedded twice (once per FK), so each needs its own alias — PostgREST
  // rejects two embeds of the same target table sharing the default "profiles" name.
  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, addressee:profiles!friendships_addressee_id_fkey(username, display_name, avatar_url), requester:profiles!friendships_requester_id_fkey(username, display_name, avatar_url)')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted')
  if (error) return []
  return data.map(f => {
    const friendId = f.requester_id === userId ? f.addressee_id : f.requester_id
    const profile = f.requester_id === userId ? f.addressee : f.requester
    return { id: friendId, username: profile?.username, displayName: profile?.display_name, avatarUrl: profile?.avatar_url }
  })
}

// ── Top 10 ───────────────────────────────────────────────────────────────

export async function getTop10(userId) {
  if (isMockMode()) return MOCK_TOP10_STORE[userId] || []
  const { data, error } = await supabase
    .from('top10_entries')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true })
  if (error) throw error
  return data
}

// list = ordered array of { console, game_id }, length <= 10
export async function saveTop10(userId, list) {
  if (isMockMode()) {
    MOCK_TOP10_STORE[userId] = list.map((entry, i) => ({ user_id: userId, position: i + 1, console: entry.console, game_id: entry.game_id }))
    return
  }
  const { error: delError } = await supabase
    .from('top10_entries')
    .delete()
    .eq('user_id', userId)
  if (delError) throw delError

  if (!list.length) return

  const rows = list.map((entry, i) => ({
    user_id: userId,
    position: i + 1,
    console: entry.console,
    game_id: entry.game_id,
  }))
  const { error: insError } = await supabase.from('top10_entries').insert(rows)
  if (insError) throw insError

  checkAndUnlockAchievements(userId).catch(() => {})
}

// ── Community ranking ────────────────────────────────────────────────────

export async function getCommunityRanking(limit = 50) {
  const data = isMockMode()
    ? Object.values(MOCK_TOP10_STORE).flat()
    : await (async () => {
      const { data, error } = await supabase.from('top10_entries').select('console, game_id, position, user_id')
      if (error) throw error
      return data
    })()

  const points = {}
  for (const row of data) {
    const key = `${row.console}:${row.game_id}`
    if (!points[key]) points[key] = { console: row.console, game_id: row.game_id, points: 0, voters: new Set() }
    points[key].points += 11 - row.position
    points[key].voters.add(row.user_id)
  }

  return Object.values(points)
    .map(p => ({ console: p.console, game_id: p.game_id, points: p.points, voters: p.voters.size }))
    .sort((a, b) => b.points - a.points || b.voters - a.voters)
    .slice(0, limit)
}

// ── Achievements (definitions are JS, only unlocks persist) ────────────

// Co-located with ACHIEVEMENTS since it's keyed by the same `tier` field — kept out of
// AchievementBadge.jsx (a component file) so Fast Refresh doesn't complain about
// non-component exports, and reused as-is by AchievementFeedCard.
export const TIER_STYLES = {
  bronze: 'border-[#9c6b3f] text-[#cd9a66]',
  silver: 'border-[#9ca3af] text-[#d1d5db]',
  gold:   'border-[#d4af37] text-[#f4d873]',
}

export const ACHIEVEMENTS = [
  { id: 'primeira_platina', label: 'Primeira Platina', description: 'Marque seu primeiro jogo como 100%.', tier: 'bronze' },
  { id: 'completionist', label: 'Completionist', description: '10 jogos 100% completos.', tier: 'silver' },
  { id: 'completionist_plus', label: 'Completionist+', description: '25 jogos 100% completos.', tier: 'gold' },
  { id: 'maratonista', label: 'Maratonista', description: 'Jogos marcados em 3 ou mais consoles.', tier: 'bronze' },
  { id: 'maratonista_plus', label: 'Maratonista+', description: 'Jogos marcados em todos os consoles disponíveis.', tier: 'gold' },
  { id: 'critico', label: 'Crítico', description: '10 jogos avaliados com nota.', tier: 'bronze' },
  { id: 'critico_plus', label: 'Crítico+', description: '50 jogos avaliados com nota.', tier: 'silver' },
  { id: 'curador', label: 'Curador', description: 'Salvou sua lista Top 10.', tier: 'bronze' },
  { id: 'influente', label: 'Influente', description: 'Um jogo do seu Top 10 está no top 5 da comunidade.', tier: 'silver' },
  { id: 'comentarista', label: 'Comentarista', description: '25 comentários no feed.', tier: 'bronze' },
  { id: 'popular', label: 'Popular', description: 'Um post seu recebeu 10+ reações.', tier: 'silver' },
  { id: 'social', label: 'Social', description: 'Compartilhou sua primeira atividade no feed.', tier: 'bronze' },
  { id: 'quero_tudo', label: 'Quero Tudo', description: '20+ jogos na lista de desejos.', tier: 'bronze' },
  { id: 'velocista', label: 'Velocista', description: '5+ jogos zerados/100% no mesmo mês.', tier: 'silver' },
  { id: 'veterano', label: 'Veterano', description: 'Conta com 1+ ano e 50+ jogos marcados.', tier: 'gold' },
]

export async function getUserAchievements(userId) {
  if (isMockMode()) return MOCK_ACHIEVEMENTS_STORE[userId] || []
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

// Checks unlock conditions against existing data and persists any newly-met achievements.
// Returns the subset newly unlocked by this call (for a toast).
export async function checkAndUnlockAchievements(userId) {
  // Mock friends already have a fixed achievement spread; mock-user's tracking data lives in
  // localStorage, not these Supabase tables, so there's nothing meaningful to recompute here.
  if (isMockMode()) return []

  const [{ data: statuses }, { data: unlocked }, { data: comments }, { data: top10 }, { data: profile }] = await Promise.all([
    supabase.from('game_statuses').select('console, joguei, zerado, cem_porcento, quero, rating, updated_at').eq('user_id', userId),
    supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
    supabase.from('post_comments').select('id').eq('user_id', userId),
    supabase.from('top10_entries').select('id').eq('user_id', userId),
    supabase.from('profiles').select('created_at').eq('id', userId).single(),
  ])

  const already = new Set((unlocked || []).map(u => u.achievement_id))
  const rows = statuses || []
  const toUnlock = []

  const cemPorcentoCount = rows.filter(r => r.cem_porcento).length
  const ratedCount = rows.filter(r => r.rating).length
  const consolesTouched = new Set(rows.filter(r => r.joguei || r.zerado || r.cem_porcento).map(r => r.console)).size
  const queroCount = rows.filter(r => r.quero).length
  const totalFlags = rows.filter(r => r.joguei || r.zerado || r.cem_porcento || r.quero).length
  const accountAgeMs = profile ? Date.now() - new Date(profile.created_at).getTime() : 0

  const checks = {
    primeira_platina: cemPorcentoCount >= 1,
    completionist: cemPorcentoCount >= 10,
    completionist_plus: cemPorcentoCount >= 25,
    maratonista: consolesTouched >= 3,
    critico: ratedCount >= 10,
    critico_plus: ratedCount >= 50,
    curador: (top10 || []).length > 0,
    comentarista: (comments || []).length >= 25,
    quero_tudo: queroCount >= 20,
    veterano: accountAgeMs >= 365 * 24 * 60 * 60 * 1000 && totalFlags >= 50,
  }

  for (const [id, met] of Object.entries(checks)) {
    if (met && !already.has(id)) toUnlock.push(id)
  }

  if (!toUnlock.length) return []

  const { error } = await supabase
    .from('user_achievements')
    .insert(toUnlock.map(achievement_id => ({ user_id: userId, achievement_id })))
  if (error) throw error

  return ACHIEVEMENTS.filter(a => toUnlock.includes(a.id))
}

// ── Notifications ────────────────────────────────────────────────────────

async function notify(recipientId, type, postId = null) {
  if (isMockMode()) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id === recipientId) return // don't notify yourself
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: recipientId, type, post_id: postId })
  if (error) throw error
}

export async function getUnreadCount(userId) {
  if (isMockMode()) return 2
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
  return count || 0
}

export async function getNotifications(userId, limit = 20) {
  if (isMockMode()) {
    const [a, b] = MOCK_PROFILES
    return [
      { id: 'mock-notif-1', user_id: userId, type: 'comment', post_id: MOCK_FEED_POSTS[0]?.id, read: false, created_at: new Date(Date.now() - 3600000).toISOString(), actor: a },
      { id: 'mock-notif-2', user_id: userId, type: 'reaction', post_id: MOCK_FEED_POSTS[1]?.id, read: false, created_at: new Date(Date.now() - 7200000).toISOString(), actor: b },
    ].slice(0, limit)
  }
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function markAllRead(userId) {
  if (isMockMode()) return
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
}
