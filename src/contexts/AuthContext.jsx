import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile, setMockMode } from '../lib/db'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const p = await getProfile(session.user.id)
        setProfile(p)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const p = await getProfile(session.user.id)
        setProfile(p)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = () => {
    if (user?.id === 'mock-user') {
      setMockMode(false)
      setUser(null)
      setProfile(null)
      return
    }
    supabase.auth.signOut()
  }

  const mockLogin = () => {
    setMockMode(true)
    setUser({ id: 'mock-user', email: 'bruno@teste.com' })
    setProfile({ id: 'mock-user', username: 'BrunoTeste', display_name: 'Bruno (Teste)' })
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, mockLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
