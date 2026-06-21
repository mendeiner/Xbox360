import { readyConsoles } from '../consoles/registry'

// Deterministic preview dataset — 10 fake friends with real games (pulled from the actual
// registry, so covers/titles resolve), real-looking top 10s, feed posts, comments and
// reactions. Only active when mock mode is on ("Entrar como Teste"), so the whole social
// layer is visually testable without a multi-account Supabase project.

const NAMES = ['ana', 'rafa', 'carla', 'diego', 'elisa', 'felipe', 'gabi', 'hugo', 'ivone', 'joao']
const DISPLAY = ['Ana Souza', 'Rafa Lima', 'Carla Mendes', 'Diego Alves', 'Elisa Cruz', 'Felipe Rocha', 'Gabi Ferreira', 'Hugo Castro', 'Ivone Dias', 'João Pereira']

// Flatten every ready console's games into one pool, tagged with their console id.
function allGamesPool() {
  const pool = []
  for (const c of readyConsoles()) {
    for (const g of c.games) pool.push({ console: c.id, game_id: g.id, title: g.title, genre: g.genre || [] })
  }
  return pool
}

const POOL = allGamesPool()
function pickGame(seed) {
  return POOL[seed % POOL.length]
}

const ACTIONS = ['joguei', 'zerado', 'cem_porcento']
const REACTION_SET = ['fire', 'laugh', 'mind_blown', 'skull', 'clap', '100', 'goat', 'same']

export const MOCK_PROFILES = NAMES.map((username, i) => ({
  id: `mock-friend-${i + 1}`,
  username,
  display_name: DISPLAY[i],
  avatar_url: null,
  created_at: new Date(Date.now() - (400 + i * 37) * 86400000).toISOString(),
}))

export function getMockProfileByUsername(username) {
  return MOCK_PROFILES.find(p => p.username === username) || null
}

// Top 10 — each friend gets 10 games spread across the pool (stride keeps variety across consoles).
export const MOCK_TOP10_STORE = {}
MOCK_PROFILES.forEach((p, i) => {
  MOCK_TOP10_STORE[p.id] = Array.from({ length: 10 }, (_, pos) => {
    const g = pickGame(i * 17 + pos * 31)
    return { user_id: p.id, position: pos + 1, console: g.console, game_id: g.game_id }
  })
})
// mock-user (the real "Entrar como Teste" session) starts with an empty Top 10 of their own.
MOCK_TOP10_STORE['mock-user'] = []

// Feed posts — 2-3 per friend, recent, so "last game added" reads naturally.
export const MOCK_FEED_POSTS = []
MOCK_PROFILES.forEach((p, i) => {
  const count = 2 + (i % 2)
  for (let j = 0; j < count; j++) {
    const g = pickGame(i * 53 + j * 7 + 3)
    const hoursAgo = i * 9 + j * 31 + 2
    MOCK_FEED_POSTS.push({
      id: `mock-post-${p.id}-${j}`,
      user_id: p.id,
      console: g.console,
      game_id: g.game_id,
      action: ACTIONS[(i + j) % ACTIONS.length],
      rating: (i + j) % 3 === 0 ? 4.5 : null,
      created_at: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
      profiles: { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url },
    })
  }
})
MOCK_FEED_POSTS.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

// Mutable in-session stores so reacting/commenting during a preview feels real
// (not persisted across reload — acceptable for a mock preview).
export const MOCK_REACTIONS_STORE = {} // postId -> { userId: reaction }
export const MOCK_COMMENTS_STORE = {}  // postId -> [{ id, user_id, body, created_at, profiles }]

const SAMPLE_COMMENTS = [
  'mano que jogo incrível', 'finalmente alguém jogando isso!', 'até hoje não consegui zerar esse',
  'recomendo muito, vale cada minuto', 'esse final me quebrou', 'top demais essa escolha',
]
MOCK_FEED_POSTS.slice(0, 6).forEach((post, i) => {
  const commenter = MOCK_PROFILES[(i + 3) % MOCK_PROFILES.length]
  MOCK_COMMENTS_STORE[post.id] = [{
    id: `mock-comment-${post.id}`,
    post_id: post.id,
    user_id: commenter.id,
    body: SAMPLE_COMMENTS[i % SAMPLE_COMMENTS.length],
    created_at: new Date(Date.now() - i * 5400000).toISOString(),
    profiles: { username: commenter.username, display_name: commenter.display_name, avatar_url: commenter.avatar_url },
  }]
  MOCK_REACTIONS_STORE[post.id] = {}
  const reactorCount = 1 + (i % 4)
  for (let r = 0; r < reactorCount; r++) {
    const reactor = MOCK_PROFILES[(i + r + 1) % MOCK_PROFILES.length]
    MOCK_REACTIONS_STORE[post.id][reactor.id] = REACTION_SET[(i + r) % REACTION_SET.length]
  }
})

// Full synthetic "library" per friend (distinct from their curated Top 10) — backs stats,
// genre breakdown, and the yearly recap with real variety instead of just 10 games.
export const MOCK_STATUS_ROWS_STORE = {}
MOCK_PROFILES.forEach((p, i) => {
  const rows = []
  const libSize = 28 + i * 4
  for (let j = 0; j < libSize; j++) {
    const g = pickGame(i * 101 + j * 13)
    const zerado = j % 2 === 0
    const cem = j % 6 === 0
    const daysAgo = (j * 11 + i * 3) % 760 // spread across ~2 years, some land in the current year
    rows.push({
      user_id: p.id,
      console: g.console,
      game_id: g.game_id,
      joguei: true,
      zerado,
      cem_porcento: cem,
      quero: false,
      rating: (zerado || cem) && j % 3 === 0 ? 4 + ((j % 3) * 0.5) : null,
      updated_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    })
  }
  // a handful of wishlist-only entries
  for (let k = 0; k < 6; k++) {
    const g = pickGame(i * 211 + k * 19 + 5)
    rows.push({ user_id: p.id, console: g.console, game_id: g.game_id, joguei: false, zerado: false, cem_porcento: false, quero: true, rating: null, updated_at: new Date().toISOString() })
  }
  MOCK_STATUS_ROWS_STORE[p.id] = rows
})
MOCK_STATUS_ROWS_STORE['mock-user'] = []

// Achievement unlocks — a believable spread across tiers per friend.
const ACHIEVEMENT_POOL = [
  'primeira_platina', 'completionist', 'maratonista', 'critico', 'curador',
  'comentarista', 'social', 'quero_tudo', 'popular', 'veterano',
]
export const MOCK_ACHIEVEMENTS_STORE = {}
MOCK_PROFILES.forEach((p, i) => {
  const unlockCount = 2 + (i % 4)
  MOCK_ACHIEVEMENTS_STORE[p.id] = ACHIEVEMENT_POOL.slice(0, unlockCount).map(id => ({
    user_id: p.id, achievement_id: id, unlocked_at: p.created_at,
  }))
})

