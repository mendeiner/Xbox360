import { supabase } from './supabase'
import { isMockMode } from './mockState'
import { CONSOLES, readyConsoles } from '../consoles/registry'
import { emitAchievementsUnlocked } from './achievementToast'
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
export const ACTION_LABEL = { joguei: 'jogou', zerado: 'zerou', cem_porcento: 'completou 100% de', quero: 'quer jogar', jogando: 'está jogando' }

// Status transitions that post to the feed automatically — only on going from unset to set.
export const SHAREABLE = ['joguei', 'zerado', 'cem_porcento', 'quero', 'jogando']

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

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

// Genre-based achievements share the same "N games of this genre zerado/100%" shape, so the
// per-genre bronze tier is generated instead of hand-written 15 times.
const GENRE_BASE = [
  { slug: 'acao',       genre: 'Ação',       label: 'Especialista em Ação',       desc: 'jogos de Ação' },
  { slug: 'aventura',   genre: 'Aventura',   label: 'Aventureiro Nato',           desc: 'jogos de Aventura' },
  { slug: 'rpg',        genre: 'RPG',        label: 'Mestre RPG',                 desc: 'jogos de RPG' },
  { slug: 'jrpg',       genre: 'JRPG',       label: 'Coletor de JRPGs',           desc: 'JRPGs' },
  { slug: 'fps',        genre: 'FPS',        label: 'Atirador de Elite',          desc: 'jogos de FPS' },
  { slug: 'plataforma', genre: 'Plataforma', label: 'Saltador Profissional',      desc: 'jogos de Plataforma' },
  { slug: 'estrategia', genre: 'Estratégia', label: 'Estrategista',               desc: 'jogos de Estratégia' },
  { slug: 'puzzle',     genre: 'Puzzle',     label: 'Quebra-Cabeça Resolvido',    desc: 'jogos de Puzzle' },
  { slug: 'terror',     genre: 'Terror',     label: 'Sobrevivente do Terror',     desc: 'jogos de Terror' },
  { slug: 'corrida',    genre: 'Corrida',    label: 'Pé na Tábua',                desc: 'jogos de Corrida' },
  { slug: 'luta',       genre: 'Luta',       label: 'Lutador Nato',               desc: 'jogos de Luta' },
  { slug: 'esportes',   genre: 'Esportes',   label: 'Atleta Virtual',             desc: 'jogos de Esportes' },
  { slug: 'simulacao',  genre: 'Simulação',  label: 'Simulador de Vidas',         desc: 'jogos de Simulação' },
  { slug: 'tiro',       genre: 'Tiro',       label: 'Mira Certeira',              desc: 'jogos de Tiro' },
  { slug: 'sandbox',    genre: 'Sandbox',    label: 'Mundo Aberto',               desc: 'jogos de Sandbox' },
]
const GENRE_GOLD_SLUGS = ['acao', 'aventura', 'rpg', 'estrategia', 'puzzle', 'corrida', 'esportes']
const GENRE_GOLD_LABEL = {
  acao: 'Lenda da Ação', aventura: 'Lenda da Aventura', rpg: 'Lenda do RPG',
  estrategia: 'Lenda da Estratégia', puzzle: 'Lenda do Puzzle', corrida: 'Lenda da Velocidade',
  esportes: 'Lenda dos Esportes',
}

// Bronze tier (5 jogos finalizados) + silver tier (15) for every console currently `ready`,
// generated from the registry instead of hand-written once per console.
const CONSOLE_TIER_RULES = readyConsoles().flatMap(c => [
  { id: `console_${c.id}_5`, label: `Início no ${c.label}`, description: `Zere ou complete 5 jogos de ${c.label}.`, tier: 'bronze',
    target: 5, current: s => s.perConsoleFinished[c.id] || 0 },
  { id: `console_${c.id}_15`, label: `Mestre do ${c.label}`, description: `Zere ou complete 15 jogos de ${c.label}.`, tier: 'silver',
    target: 15, current: s => s.perConsoleFinished[c.id] || 0 },
])

// Single source of truth for achievements: each rule drives both the unlock check
// (current(stats) >= target, optionally gated by `requires`) and the progress bar shown for
// locked achievements (current/target). `target` may be a function of stats for thresholds
// that depend on the catalog (e.g. "every console").
const RULES = [
  // ── Original 15 ──────────────────────────────────────────────────────
  { id: 'primeira_platina', label: 'Primeira Platina', description: 'Marque seu primeiro jogo como 100%.', tier: 'bronze',
    target: 1, current: s => s.cemPorcentoCount },
  { id: 'completionist', label: 'Completionist', description: '10 jogos 100% completos.', tier: 'silver',
    target: 10, current: s => s.cemPorcentoCount },
  { id: 'completionist_plus', label: 'Completionist+', description: '25 jogos 100% completos.', tier: 'gold',
    target: 25, current: s => s.cemPorcentoCount },
  { id: 'maratonista', label: 'Maratonista', description: 'Jogos marcados em 3 ou mais consoles.', tier: 'bronze',
    target: 3, current: s => s.consolesTouchedCount },
  { id: 'maratonista_plus', label: 'Maratonista+', description: 'Jogos marcados em todos os consoles disponíveis.', tier: 'gold',
    target: s => s.totalReadyConsoles, current: s => s.consolesTouchedCount },
  { id: 'critico', label: 'Crítico', description: '10 jogos avaliados com nota.', tier: 'bronze',
    target: 10, current: s => s.ratedCount },
  { id: 'critico_plus', label: 'Crítico+', description: '50 jogos avaliados com nota.', tier: 'silver',
    target: 50, current: s => s.ratedCount },
  { id: 'curador', label: 'Curador', description: 'Salvou sua lista Top 10.', tier: 'bronze',
    target: 1, current: s => s.top10Count },
  { id: 'influente', label: 'Influente', description: 'Um jogo do seu Top 10 está no top 5 da comunidade.', tier: 'silver',
    target: 1, current: s => (s.influente ? 1 : 0) },
  { id: 'comentarista', label: 'Comentarista', description: '25 comentários no feed.', tier: 'bronze',
    target: 25, current: s => s.commentsCount },
  { id: 'popular', label: 'Popular', description: 'Um post seu recebeu 10+ reações.', tier: 'silver',
    target: 10, current: s => s.maxReactionsOnOwnPost },
  { id: 'social', label: 'Social', description: 'Compartilhou sua primeira atividade no feed.', tier: 'bronze',
    target: 1, current: s => s.feedPostsCount },
  { id: 'quero_tudo', label: 'Quero Tudo', description: '20+ jogos na lista de desejos.', tier: 'bronze',
    target: 20, current: s => s.queroCount },
  { id: 'velocista', label: 'Velocista', description: '5+ jogos zerados/100% no mesmo mês.', tier: 'silver',
    target: 5, current: s => s.maxSameMonthFinished },
  { id: 'veterano', label: 'Veterano', description: 'Conta com 1+ ano e 50+ jogos marcados.', tier: 'gold',
    target: 50, current: s => s.totalFlagsCount, requires: s => s.accountAgeMs >= ONE_YEAR_MS },

  // ── Zerado milestones ─────────────────────────────────────────────────
  { id: 'zerado_1', label: 'Primeira Zerada', description: 'Zere seu primeiro jogo.', tier: 'bronze', target: 1, current: s => s.zeradoCount },
  { id: 'zerado_10', label: 'Zerador', description: '10 jogos zerados.', tier: 'bronze', target: 10, current: s => s.zeradoCount },
  { id: 'zerado_25', label: 'Zerador Veterano', description: '25 jogos zerados.', tier: 'silver', target: 25, current: s => s.zeradoCount },
  { id: 'zerado_50', label: 'Zerador Expert', description: '50 jogos zerados.', tier: 'silver', target: 50, current: s => s.zeradoCount },
  { id: 'zerado_100', label: 'Zerador Lendário', description: '100 jogos zerados.', tier: 'gold', target: 100, current: s => s.zeradoCount },

  // ── Played (any progress) milestones ─────────────────────────────────
  { id: 'jogou_1', label: 'Primeiro Passo', description: 'Marque seu primeiro jogo como joguei, zerado ou 100%.', tier: 'bronze', target: 1, current: s => s.playedCount },
  { id: 'jogou_50', label: 'Jogador Assíduo', description: '50 jogos com progresso marcado.', tier: 'bronze', target: 50, current: s => s.playedCount },
  { id: 'jogou_100', label: 'Centena', description: '100 jogos com progresso marcado.', tier: 'silver', target: 100, current: s => s.playedCount },
  { id: 'jogou_250', label: 'Biblioteca Cheia', description: '250 jogos com progresso marcado.', tier: 'silver', target: 250, current: s => s.playedCount },
  { id: 'jogou_500', label: 'Arquivista', description: '500 jogos com progresso marcado.', tier: 'gold', target: 500, current: s => s.playedCount },

  // ── Completionist extra tiers ─────────────────────────────────────────
  { id: 'completionist_50', label: 'Completionist Mestre', description: '50 jogos 100% completos.', tier: 'gold', target: 50, current: s => s.cemPorcentoCount },
  { id: 'completionist_100', label: 'Completionist Supremo', description: '100 jogos 100% completos.', tier: 'gold', target: 100, current: s => s.cemPorcentoCount },
  { id: 'completionist_200', label: 'Platina Infinita', description: '200 jogos 100% completos.', tier: 'gold', target: 200, current: s => s.cemPorcentoCount },

  // ── Wishlist tiers ────────────────────────────────────────────────────
  { id: 'quero_50', label: 'Lista Generosa', description: '50+ jogos na lista de desejos.', tier: 'silver', target: 50, current: s => s.queroCount },
  { id: 'quero_100', label: 'Lista Infinita', description: '100+ jogos na lista de desejos.', tier: 'gold', target: 100, current: s => s.queroCount },

  // ── Rating-based ──────────────────────────────────────────────────────
  { id: 'primeira_nota', label: 'Primeira Nota', description: 'Avalie seu primeiro jogo.', tier: 'bronze', target: 1, current: s => s.ratedCount },
  { id: 'nota_maxima', label: 'Nota Cheia', description: 'Dê nota 5 estrelas a um jogo.', tier: 'bronze', target: 1, current: s => (s.ratingMax ? 1 : 0) },
  { id: 'nota_minima', label: 'Sem Pena', description: 'Dê nota 0,5 estrela a um jogo.', tier: 'bronze', target: 1, current: s => (s.ratingMin ? 1 : 0) },
  { id: 'critico_master', label: 'Crítico Master', description: '100 jogos avaliados com nota.', tier: 'gold', target: 100, current: s => s.ratedCount },
  { id: 'critico_supremo', label: 'Crítico Supremo', description: '200 jogos avaliados com nota.', tier: 'gold', target: 200, current: s => s.ratedCount },

  // ── Genre achievements ────────────────────────────────────────────────
  ...GENRE_BASE.map(g => ({
    id: `genero_${g.slug}`, label: g.label, description: `10 ${g.desc} zerados/100%.`, tier: 'bronze',
    target: 10, current: s => s.genreFinishedCounts[g.genre] || 0,
  })),
  ...GENRE_GOLD_SLUGS.map(slug => {
    const g = GENRE_BASE.find(x => x.slug === slug)
    return {
      id: `genero_${slug}_gold`, label: GENRE_GOLD_LABEL[slug], description: `25 ${g.desc} zerados/100%.`, tier: 'gold',
      target: 25, current: s => s.genreFinishedCounts[g.genre] || 0,
    }
  }),

  // ── Per-console tiers ─────────────────────────────────────────────────
  ...CONSOLE_TIER_RULES,

  // ── Console breadth ──────────────────────────────────────────────────
  { id: 'maratonista_5', label: 'Multiplataforma', description: 'Jogos marcados em 5 ou mais consoles.', tier: 'silver', target: 5, current: s => s.consolesTouchedCount },
  { id: 'explorador_total', label: 'Explorador Total', description: 'Jogos marcados em absolutamente todos os consoles.', tier: 'gold', target: s => s.totalReadyConsoles, current: s => s.consolesTouchedCount },

  // ── Era-based ─────────────────────────────────────────────────────────
  { id: 'retro_gamer', label: 'Retrô', description: 'Zere ou complete um jogo lançado antes de 1995.', tier: 'bronze', target: 1, current: s => s.retroFinishedCount },
  { id: 'classic_curator', label: 'Curador Clássico', description: '5+ jogos lançados antes de 1995, zerados/100%.', tier: 'silver', target: 5, current: s => s.retroFinishedCount },
  { id: 'gamer_moderno', label: 'Gamer Moderno', description: '5+ jogos lançados a partir de 2015, zerados/100%.', tier: 'bronze', target: 5, current: s => s.modernFinishedCount },
  { id: 'atraves_do_tempo', label: 'Através do Tempo', description: 'Jogos completos em 3+ décadas diferentes.', tier: 'gold', target: 3, current: s => s.distinctDecadesFinished },

  // ── Score-based ───────────────────────────────────────────────────────
  { id: 'jogo_aclamado', label: 'Jogo Aclamado', description: 'Complete um jogo com nota 90+ no Metacritic.', tier: 'bronze', target: 1, current: s => s.scoreHighCount },
  { id: 'critico_de_elite', label: 'Crítico de Elite', description: 'Complete 5 jogos com nota 90+.', tier: 'silver', target: 5, current: s => s.scoreHighCount },
  { id: 'sobrevivente', label: 'Sobrevivente', description: 'Complete um jogo com nota abaixo de 60 — coragem também conta.', tier: 'bronze', target: 1, current: s => s.scoreLowCount },

  // ── Multiplayer ───────────────────────────────────────────────────────
  { id: 'socializador_local', label: 'Socializador Local', description: '5+ jogos com multiplayer local completos.', tier: 'bronze', target: 5, current: s => s.localMPFinishedCount },
  { id: 'socializador_online', label: 'Socializador Online', description: '5+ jogos com multiplayer online completos.', tier: 'bronze', target: 5, current: s => s.onlineFinishedCount },

  // ── Time-based ────────────────────────────────────────────────────────
  { id: 'notivago', label: 'Notívago', description: 'Marque um status entre meia-noite e 5h da manhã.', tier: 'bronze', target: 1, current: s => (s.nightOwl ? 1 : 0) },
  { id: 'fim_de_semana_gamer', label: 'Gamer de Fim de Semana', description: '5+ atualizações de status feitas no fim de semana.', tier: 'bronze', target: 5, current: s => s.weekendTouches },
  { id: 'produtivo', label: 'Dia Produtivo', description: '3+ jogos zerados/100% no mesmo dia.', tier: 'silver', target: 3, current: s => s.maxSameDayFinished },

  // ── Comments extra tiers ──────────────────────────────────────────────
  { id: 'primeiro_comentario', label: 'Quebra o Gelo', description: 'Faça seu primeiro comentário no feed.', tier: 'bronze', target: 1, current: s => s.commentsCount },
  { id: 'comentarista_pro', label: 'Comentarista Pro', description: '50 comentários no feed.', tier: 'silver', target: 50, current: s => s.commentsCount },
  { id: 'comentarista_lendario', label: 'Comentarista Lendário', description: '100 comentários no feed.', tier: 'gold', target: 100, current: s => s.commentsCount },

  // ── Reactions given ───────────────────────────────────────────────────
  { id: 'primeira_reacao', label: 'Primeira Reação', description: 'Reaja a um post no feed pela primeira vez.', tier: 'bronze', target: 1, current: s => s.reactionsGiven },
  { id: 'reage_tudo', label: 'Reage a Tudo', description: '50 reações dadas no feed.', tier: 'silver', target: 50, current: s => s.reactionsGiven },

  // ── Reactions received ────────────────────────────────────────────────
  { id: 'querido_pela_galera', label: 'Querido pela Galera', description: '25 reações recebidas no total.', tier: 'silver', target: 25, current: s => s.reactionsReceivedTotal },
  { id: 'post_viral', label: 'Post Viral', description: 'Um post seu recebeu 20+ reações.', tier: 'gold', target: 20, current: s => s.maxReactionsOnOwnPost },

  // ── Feed posts ────────────────────────────────────────────────────────
  { id: 'cronista', label: 'Cronista', description: '10 atividades compartilhadas no feed.', tier: 'bronze', target: 10, current: s => s.feedPostsCount },
  { id: 'historiador', label: 'Historiador', description: '50 atividades compartilhadas no feed.', tier: 'silver', target: 50, current: s => s.feedPostsCount },

  // ── Duels ─────────────────────────────────────────────────────────────
  { id: 'primeiro_duelo', label: 'Primeiro Duelo', description: 'Vote em seu primeiro duelo.', tier: 'bronze', target: 1, current: s => s.duelVotesCount },
  { id: 'duelista', label: 'Duelista', description: '25 votos em duelos.', tier: 'silver', target: 25, current: s => s.duelVotesCount },
  { id: 'duelista_supremo', label: 'Duelista Supremo', description: '100 votos em duelos.', tier: 'gold', target: 100, current: s => s.duelVotesCount },

  // ── Polls ─────────────────────────────────────────────────────────────
  { id: 'primeira_enquete', label: 'Primeira Enquete', description: 'Crie sua primeira enquete.', tier: 'bronze', target: 1, current: s => s.pollsCreatedCount },
  { id: 'enquete_popular', label: 'Enquete Popular', description: 'Uma enquete sua recebeu 10+ votos.', tier: 'silver', target: 10, current: s => s.maxVotesOnOwnPoll },
  { id: 'votante', label: 'Votante', description: 'Vote em 10 enquetes.', tier: 'bronze', target: 10, current: s => s.pollVotesCount },
  { id: 'votante_assiduo', label: 'Votante Assíduo', description: 'Vote em 50 enquetes.', tier: 'silver', target: 50, current: s => s.pollVotesCount },

  // ── Profile ───────────────────────────────────────────────────────────
  { id: 'rosto_na_galera', label: 'Rosto na Galera', description: 'Defina uma foto de perfil.', tier: 'bronze', target: 1, current: s => (s.avatarSet ? 1 : 0) },
  { id: 'nome_de_guerra', label: 'Nome de Guerra', description: 'Defina um nome de exibição.', tier: 'bronze', target: 1, current: s => (s.displayNameSet ? 1 : 0) },

  // ── Top 10 ────────────────────────────────────────────────────────────
  { id: 'top10_completo', label: 'Lista Fechada', description: 'Preencha as 10 posições do seu Top 10.', tier: 'silver', target: 10, current: s => s.top10Count },

  // ── Meta-achievements ─────────────────────────────────────────────────
  { id: 'cacador_de_emblemas', label: 'Caçador de Emblemas', description: 'Desbloqueie 10 conquistas.', tier: 'bronze', target: 10, current: s => s.alreadyUnlockedCount },
  { id: 'colecionador_de_emblemas', label: 'Colecionador de Emblemas', description: 'Desbloqueie 25 conquistas.', tier: 'silver', target: 25, current: s => s.alreadyUnlockedCount },
  { id: 'platina_das_platinas', label: 'Platina das Platinas', description: 'Desbloqueie 50 conquistas.', tier: 'gold', target: 50, current: s => s.alreadyUnlockedCount },

  // ── Combo achievements ────────────────────────────────────────────────
  { id: 'jogo_e_avalia', label: 'Joga e Avalia', description: 'Complete e avalie 20 jogos.', tier: 'silver', target: 20, current: s => s.ratedAndFinishedCount },
  { id: 'all_rounder', label: 'Pluralista', description: 'Complete jogos de 5 ou mais gêneros diferentes.', tier: 'silver', target: 5, current: s => s.distinctGenresFinished },

  // ── Platina internacional/universal ───────────────────────────────────
  { id: 'platina_internacional', label: 'Platina Internacional', description: '100% em jogos de 3 ou mais consoles diferentes.', tier: 'silver', target: 3, current: s => s.consolesWithCemPorcentoCount },
  { id: 'platina_universal', label: 'Platina Universal', description: '100% em pelo menos um jogo de cada console.', tier: 'gold', target: s => s.totalReadyConsoles, current: s => s.consolesWithCemPorcentoCount },

  // ── Extra milestones ──────────────────────────────────────────────────
  { id: 'ano_de_ouro', label: 'Ano de Ouro', description: '10+ jogos completos do mesmo ano de lançamento.', tier: 'silver', target: 10, current: s => s.maxReleaseYearFinished },
  { id: 'decada_favorita', label: 'Década Favorita', description: '10+ jogos completos da mesma década de lançamento.', tier: 'bronze', target: 10, current: s => s.maxDecadeFinished },
  { id: 'platina_em_dobro', label: 'Platina em Dobro', description: '2+ jogos 100% no mesmo console.', tier: 'bronze', target: 2, current: s => s.maxCemPorcentoPerConsole },
  { id: 'maratona_anual', label: 'Maratona Anual', description: '20+ jogos zerados/100% no mesmo ano.', tier: 'silver', target: 20, current: s => s.maxSameCompletionYearFinished },
]

export const ACHIEVEMENTS = RULES.map(({ id, label, description, tier }) => ({ id, label, description, tier }))

function resolveTarget(rule, stats) {
  return typeof rule.target === 'function' ? rule.target(stats) : rule.target
}

export async function getUserAchievements(userId) {
  if (isMockMode()) return MOCK_ACHIEVEMENTS_STORE[userId] || []
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

// Gathers every stat any achievement rule needs, in one pass, shared by both
// checkAndUnlockAchievements (unlock) and getAchievementsProgress (progress bars).
async function computeAchievementStats(userId) {
  const [
    { data: statuses, error: statusesError }, { data: unlockedRows }, { data: comments }, { data: top10 },
    { data: profile }, { data: feedPosts }, { data: pollsCreated }, { data: pollVotes },
    { data: duelVotes },
  ] = await Promise.all([
    supabase.from('game_statuses').select('console, game_id, joguei, zerado, cem_porcento, quero, jogando, rating, updated_at').eq('user_id', userId),
    supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
    supabase.from('post_comments').select('id').eq('user_id', userId),
    supabase.from('top10_entries').select('console, game_id').eq('user_id', userId),
    supabase.from('profiles').select('created_at, avatar_url, display_name').eq('id', userId).single(),
    supabase.from('feed_posts').select('id').eq('user_id', userId),
    supabase.from('polls').select('id').eq('creator_id', userId),
    supabase.from('poll_votes').select('poll_id').eq('voter_id', userId),
    supabase.from('duel_votes').select('id').eq('voter_id', userId),
  ])
  // The most consequential query of the nine above — a silent failure here would otherwise
  // compute every achievement stat from a phantom-empty dataset instead of surfacing the error.
  if (statusesError) throw statusesError

  const already = new Set((unlockedRows || []).map(u => u.achievement_id))
  const rows = statuses || []
  const myPostIds = (feedPosts || []).map(p => p.id)
  const myPollIds = (pollsCreated || []).map(p => p.id)

  const [{ count: reactionsGiven }, receivedRes, pollVotesOnMine] = await Promise.all([
    supabase.from('post_reactions').select('post_id', { count: 'exact', head: true }).eq('user_id', userId),
    myPostIds.length
      ? supabase.from('post_reactions').select('post_id').in('post_id', myPostIds)
      : Promise.resolve({ data: [] }),
    myPollIds.length
      ? supabase.from('poll_votes').select('poll_id').in('poll_id', myPollIds)
      : Promise.resolve({ data: [] }),
  ])

  const receivedRows = receivedRes.data || []
  const perPostReceived = {}
  for (const r of receivedRows) perPostReceived[r.post_id] = (perPostReceived[r.post_id] || 0) + 1
  const maxReactionsOnOwnPost = Object.values(perPostReceived).reduce((m, v) => Math.max(m, v), 0)

  const perPollVotes = {}
  for (const v of (pollVotesOnMine.data || [])) perPollVotes[v.poll_id] = (perPollVotes[v.poll_id] || 0) + 1
  const maxVotesOnOwnPoll = Object.values(perPollVotes).reduce((m, v) => Math.max(m, v), 0)

  // Registry game lookups (genre/year/score/localMP/online), cached per console.
  const gamesByConsole = {}
  function lookupGame(consoleId, gameId) {
    if (!gamesByConsole[consoleId]) {
      const c = CONSOLES[consoleId]
      gamesByConsole[consoleId] = new Map((c?.games || []).map(g => [g.id, g]))
    }
    return gamesByConsole[consoleId].get(gameId)
  }

  const played = rows.filter(r => r.joguei || r.zerado || r.cem_porcento || r.jogando)
  const finished = rows.filter(r => r.zerado || r.cem_porcento)
  const rated = rows.filter(r => r.rating != null)

  const consolesTouched = new Set(played.map(r => r.console))
  const consolesWithCemPorcento = new Set(rows.filter(r => r.cem_porcento).map(r => r.console))

  const perConsoleFinished = {}
  const perConsoleCemPorcento = {}
  for (const r of finished) perConsoleFinished[r.console] = (perConsoleFinished[r.console] || 0) + 1
  for (const r of rows) if (r.cem_porcento) perConsoleCemPorcento[r.console] = (perConsoleCemPorcento[r.console] || 0) + 1

  const genreFinishedCounts = {}
  const decadeFinishedCounts = {}
  const releaseYearCounts = {}
  let retroFinishedCount = 0, modernFinishedCount = 0
  let scoreHighCount = 0, scoreLowCount = 0
  let localMPFinishedCount = 0, onlineFinishedCount = 0

  for (const r of finished) {
    const g = lookupGame(r.console, r.game_id)
    if (!g) continue
    for (const genre of (g.genre || [])) genreFinishedCounts[genre] = (genreFinishedCounts[genre] || 0) + 1
    if (g.year) {
      releaseYearCounts[g.year] = (releaseYearCounts[g.year] || 0) + 1
      const decade = Math.floor(g.year / 10) * 10
      decadeFinishedCounts[decade] = (decadeFinishedCounts[decade] || 0) + 1
      if (g.year < 1995) retroFinishedCount++
      if (g.year >= 2015) modernFinishedCount++
    }
    if (typeof g.score === 'number') {
      if (g.score >= 90) scoreHighCount++
      if (g.score < 60) scoreLowCount++
    }
    if (g.localMP) localMPFinishedCount++
    if (g.online) onlineFinishedCount++
  }

  const maxCount = vals => Object.values(vals).reduce((m, v) => Math.max(m, v), 0)

  // Day/month/year/weekend/night-owl signals off updated_at (last write — an approximation,
  // not a full history of flag transitions, but good enough for flair achievements).
  const dayCounts = {}, monthCounts = {}, completionYearCounts = {}
  let weekendTouches = 0
  let nightOwl = false
  for (const r of rows) {
    if (!r.updated_at) continue
    const d = new Date(r.updated_at)
    const hour = d.getHours()
    if (hour >= 0 && hour < 5) nightOwl = true
    const dow = d.getDay()
    if (dow === 0 || dow === 6) weekendTouches++
  }
  for (const r of finished) {
    if (!r.updated_at) continue
    const d = new Date(r.updated_at)
    const dayKey = d.toDateString()
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`
    dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
    completionYearCounts[d.getFullYear()] = (completionYearCounts[d.getFullYear()] || 0) + 1
  }

  let influente = false
  try {
    const top5 = await getCommunityRanking(5)
    const myTop10 = top10 || []
    influente = myTop10.some(e => top5.some(t => t.console === e.console && t.game_id === e.game_id))
  } catch { /* community ranking is a nice-to-have, never block achievement checks on it */ }

  const accountAgeMs = profile ? Date.now() - new Date(profile.created_at).getTime() : 0

  return {
    already,
    playedCount: played.length,
    zeradoCount: rows.filter(r => r.zerado).length,
    cemPorcentoCount: rows.filter(r => r.cem_porcento).length,
    queroCount: rows.filter(r => r.quero).length,
    totalFlagsCount: rows.filter(r => r.joguei || r.zerado || r.cem_porcento || r.quero || r.jogando).length,
    ratedCount: rated.length,
    ratingMax: rated.some(r => Number(r.rating) === 5),
    ratingMin: rated.some(r => Number(r.rating) === 0.5),
    ratedAndFinishedCount: rows.filter(r => r.rating != null && (r.zerado || r.cem_porcento)).length,
    consolesTouchedCount: consolesTouched.size,
    consolesWithCemPorcentoCount: consolesWithCemPorcento.size,
    totalReadyConsoles: readyConsoles().length,
    perConsoleFinished,
    maxCemPorcentoPerConsole: maxCount(perConsoleCemPorcento),
    genreFinishedCounts,
    distinctGenresFinished: Object.keys(genreFinishedCounts).length,
    distinctDecadesFinished: Object.keys(decadeFinishedCounts).length,
    maxDecadeFinished: maxCount(decadeFinishedCounts),
    maxReleaseYearFinished: maxCount(releaseYearCounts),
    retroFinishedCount, modernFinishedCount,
    scoreHighCount, scoreLowCount,
    localMPFinishedCount, onlineFinishedCount,
    maxSameDayFinished: maxCount(dayCounts),
    maxSameMonthFinished: maxCount(monthCounts),
    maxSameCompletionYearFinished: maxCount(completionYearCounts),
    weekendTouches, nightOwl,
    top10Count: (top10 || []).length,
    influente,
    feedPostsCount: myPostIds.length,
    commentsCount: (comments || []).length,
    reactionsGiven: reactionsGiven || 0,
    reactionsReceivedTotal: receivedRows.length,
    maxReactionsOnOwnPost,
    duelVotesCount: (duelVotes || []).length,
    pollsCreatedCount: myPollIds.length,
    maxVotesOnOwnPoll,
    pollVotesCount: (pollVotes || []).length,
    avatarSet: !!(profile && profile.avatar_url),
    displayNameSet: !!(profile && profile.display_name && profile.display_name.trim()),
    accountAgeMs,
    alreadyUnlockedCount: already.size,
  }
}

// Checks unlock conditions against existing data and persists any newly-met achievements.
// Returns the subset newly unlocked by this call (for a toast).
export async function checkAndUnlockAchievements(userId) {
  // Mock friends already have a fixed achievement spread; mock-user's tracking data lives in
  // localStorage, not these Supabase tables, so there's nothing meaningful to recompute here.
  if (isMockMode()) return []

  const stats = await computeAchievementStats(userId)

  const toUnlock = RULES
    .filter(rule => !stats.already.has(rule.id))
    .filter(rule => rule.current(stats) >= resolveTarget(rule, stats))
    .filter(rule => (rule.requires ? rule.requires(stats) : true))
    .map(rule => rule.id)

  if (!toUnlock.length) return []

  const { error } = await supabase
    .from('user_achievements')
    .insert(toUnlock.map(achievement_id => ({ user_id: userId, achievement_id })))
  if (error) throw error

  // Best-effort: surfaces in the bell (NotificationBell already has the 'achievement' label
  // wired up, it just never had anything inserting this row) — never block on it.
  supabase.from('notifications')
    .insert(toUnlock.map(() => ({ user_id: userId, actor_id: userId, type: 'achievement' })))
    .then(() => {}, () => {})

  const unlockedAchievements = ACHIEVEMENTS.filter(a => toUnlock.includes(a.id))
  emitAchievementsUnlocked(unlockedAchievements)
  return unlockedAchievements
}

// Per-achievement progress for the "Conquistas" tab — { id, current, target, unlocked } for
// every rule, current capped at target so a since-changed stat (e.g. unmarking a game) never
// renders a bar over 100%. Locked-but-gated rules (e.g. veterano's account-age requirement)
// still show numeric progress even if `requires` isn't met yet.
export async function getAchievementsProgress(userId) {
  if (isMockMode()) {
    const unlockedIds = new Set((MOCK_ACHIEVEMENTS_STORE[userId] || []).map(u => u.achievement_id))
    return RULES.map(rule => ({
      id: rule.id, unlocked: unlockedIds.has(rule.id),
      current: unlockedIds.has(rule.id) ? 1 : 0, target: 1,
    }))
  }

  const stats = await computeAchievementStats(userId)

  return RULES.map(rule => {
    const target = resolveTarget(rule, stats) || 1
    const current = rule.current(stats)
    const unlocked = stats.already.has(rule.id) || (current >= target && (rule.requires ? rule.requires(stats) : true))
    return { id: rule.id, unlocked, current: Math.min(current, target), target }
  })
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
