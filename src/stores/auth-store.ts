import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  name: string
  email: string
  phone: string | null
  role: 'guard' | 'admin'
  is_active: boolean
}

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  logout: () => Promise<void>
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      console.error('Profile fetch error:', error.message)
      return null
    }
    return data as Profile
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session?.user) {
        if (error) console.error('getSession error:', error.message)
        await supabase.auth.signOut().catch(() => {})
        set({ user: null, profile: null, loading: false, initialized: true })
        return
      }

      // Validate session is actually working by fetching profile
      const profile = await fetchProfile(session.user.id)

      if (!profile) {
        console.error('Session invalid — clearing')
        await supabase.auth.signOut().catch(() => {})
        set({ user: null, profile: null, loading: false, initialized: true })
        return
      }

      // Also verify data access works (catches corrupted tokens)
      const { error: testErr } = await supabase.from('profiles').select('id').limit(1)
      if (testErr) {
        console.error('Data access failed — clearing session:', testErr.message)
        await supabase.auth.signOut().catch(() => {})
        set({ user: null, profile: null, loading: false, initialized: true })
        return
      }

      set({ user: session.user, profile })
    } catch (err) {
      console.error('Auth init error:', err)
      await supabase.auth.signOut().catch(() => {})
      set({ user: null, profile: null })
    } finally {
      set({ loading: false, initialized: true })
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        set({ user: session.user, profile })
      } else {
        set({ user: null, profile: null })
      }
    })
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },
}))
