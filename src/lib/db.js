import { supabase } from './supabase'

export async function getMyStatuses(console_name) {
  const { data, error } = await supabase
    .from('game_statuses')
    .select('*')
    .eq('console', console_name)
  if (error) throw error
  return Object.fromEntries(data.map(r => [r.game_id, r]))
}

export async function setFlag(console_name, gameId, flag, value) {
  const { error } = await supabase
    .from('game_statuses')
    .upsert({ console: console_name, game_id: gameId, [flag]: value }, {
      onConflict: 'user_id,console,game_id'
    })
  if (error) throw error
}

export async function setRating(console_name, gameId, rating) {
  const { error } = await supabase
    .from('game_statuses')
    .upsert({ console: console_name, game_id: gameId, rating }, {
      onConflict: 'user_id,console,game_id'
    })
  if (error) throw error
}

export async function getConsoleCounts(console_name, userId) {
  const { data, error } = await supabase
    .from('game_statuses')
    .select('joguei, zerado, cem_porcento')
    .eq('console', console_name)
    .eq('user_id', userId)
  if (error) throw error
  return {
    joguei:      data.filter(r => r.joguei).length,
    zerado:      data.filter(r => r.zerado).length,
    cem_porcento: data.filter(r => r.cem_porcento).length,
  }
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

export async function validateInvite(code) {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('code', code)
    .single()
  if (error || !data) return false
  return data.use_count < data.max_uses
}

export async function useInvite(code) {
  await supabase.rpc('increment_invite_use', { invite_code: code })
}

export async function createProfile(userId, username) {
  const { error } = await supabase
    .from('profiles')
    .insert({ id: userId, username })
  if (error) throw error
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

export async function getFriends(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, profiles!friendships_addressee_id_fkey(username), profiles!friendships_requester_id_fkey(username)')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted')
  if (error) return []
  return data.map(f => {
    const friendId = f.requester_id === userId ? f.addressee_id : f.requester_id
    const profile = f.requester_id === userId
      ? f['profiles!friendships_addressee_id_fkey']
      : f['profiles!friendships_requester_id_fkey']
    return { id: friendId, username: profile?.username }
  })
}

export async function getRecentActivity(friendIds) {
  if (!friendIds.length) return []
  const { data, error } = await supabase
    .from('activities')
    .select('*, profiles(username)')
    .in('user_id', friendIds)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) return []
  return data
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
