import { supabase } from './supabase'
import { setMockMode as setSharedMockMode, isMockMode } from './mockState'
import { getMockProfileByUsername } from './mockSocialData'

// ── Mock mode (localStorage) ──────────────────────────────────────────────────
export function setMockMode(on) { setSharedMockMode(on) }
const mockKey = c => `mock_statuses_${c}`

export async function getMyStatuses(console_name) {
  if (isMockMode()) {
    return JSON.parse(localStorage.getItem(mockKey(console_name)) || '{}')
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}
  // Explicit user_id filter, not just RLS: the friends_read policy now lets a user see
  // every other user's rows too (everyone is auto-friended), so without this filter
  // "my own statuses" would include every friend's marked games as well.
  const { data, error } = await supabase
    .from('game_statuses')
    .select('*')
    .eq('console', console_name)
    .eq('user_id', user.id)
  if (error) throw error
  return Object.fromEntries(data.map(r => [r.game_id, r]))
}

// Every console's statuses for the current user in one round trip — used by pages that
// need cross-console data (Home's picker counts + "Meus Jogos") instead of one call per
// console. Returns { [consoleId]: { [gameId]: row } }.
export async function getAllMyStatuses() {
  if (isMockMode()) {
    const out = {}
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith('mock_statuses_')) continue
      out[key.slice('mock_statuses_'.length)] = JSON.parse(localStorage.getItem(key) || '{}')
    }
    return out
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}
  const { data, error } = await supabase
    .from('game_statuses')
    .select('*')
    .eq('user_id', user.id)
  if (error) throw error
  const byConsole = {}
  for (const r of data) {
    (byConsole[r.console] ||= {})[r.game_id] = r
  }
  return byConsole
}

export async function setFlag(console_name, gameId, flag, value) {
  if (isMockMode()) {
    const stored = JSON.parse(localStorage.getItem(mockKey(console_name)) || '{}')
    stored[gameId] = { ...(stored[gameId] || {}), [flag]: value }
    localStorage.setItem(mockKey(console_name), JSON.stringify(stored))
    return
  }
  const { error } = await supabase
    .from('game_statuses')
    .upsert({ console: console_name, game_id: gameId, [flag]: value }, {
      onConflict: 'user_id,console,game_id'
    })
  if (error) throw error
}

export async function setRating(console_name, gameId, rating) {
  if (isMockMode()) {
    const stored = JSON.parse(localStorage.getItem(mockKey(console_name)) || '{}')
    stored[gameId] = { ...(stored[gameId] || {}), rating }
    localStorage.setItem(mockKey(console_name), JSON.stringify(stored))
    return
  }
  const { error } = await supabase
    .from('game_statuses')
    .upsert({ console: console_name, game_id: gameId, rating }, {
      onConflict: 'user_id,console,game_id'
    })
  if (error) throw error
}

export async function getFriendStatuses(console_name, friendId) {
  const { data, error } = await supabase
    .from('game_statuses')
    .select('*')
    .eq('console', console_name)
    .eq('user_id', friendId)
  if (error) throw error
  return Object.fromEntries(data.map(r => [r.game_id, r]))
}

// Returns the invite row (so the caller can read `created_by` to friend the inviter)
// or null if the code doesn't exist or is exhausted.
export async function validateInvite(code) {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('code', code)
    .single()
  if (error || !data) return null
  return data.use_count < data.max_uses ? data : null
}

export async function useInvite(code) {
  await supabase.rpc('increment_invite_use', { invite_code: code })
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

export async function getProfileByUsername(username) {
  if (isMockMode()) {
    if (username === 'BrunoTeste') return { id: 'mock-user', username: 'BrunoTeste', display_name: 'Bruno (Teste)', avatar_url: null, created_at: new Date().toISOString() }
    return getMockProfileByUsername(username)
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()
  if (error) return null
  return data
}

export async function updateAvatar(userId, blob) {
  if (isMockMode()) return URL.createObjectURL(blob)
  const path = `${userId}.webp`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { upsert: true, contentType: 'image/webp' })
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
  const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: cacheBustedUrl })
    .eq('id', userId)
  if (error) throw error
  return cacheBustedUrl
}

export async function uploadFeedPhotos(userId, blobs) {
  if (isMockMode()) return blobs.map(blob => URL.createObjectURL(blob))
  const urls = []
  for (const blob of blobs) {
    const path = `${userId}/${crypto.randomUUID()}.webp`
    const { error } = await supabase.storage
      .from('feed-photos')
      .upload(path, blob, { contentType: 'image/webp' })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('feed-photos').getPublicUrl(path)
    urls.push(publicUrl)
  }
  return urls
}

export async function generateInvite(userId) {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase()
  const { error } = await supabase
    .from('invites')
    .insert({ code, created_by: userId, max_uses: 20, use_count: 0 })
  if (error) throw error
  return code
}

export async function exportMyData(userId) {
  const { data, error } = await supabase
    .from('game_statuses')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}
