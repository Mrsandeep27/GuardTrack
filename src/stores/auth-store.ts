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

      if (error) {
        console.error('getSession error:', error.message)
        // Bad session — clear it
        await supabase.auth.signOut()
        set({ user: null, profile: null })
      } else if (session?.user) {
        const profile = await fetchProfile(session.user.id)

        if (!profile) {
          // Session exists but can't fetch profile — token is dead/expired
          console.error('Session exists but profile fetch failed — clearing stale session')
          await supabase.auth.signOut()
          set({ user: null, profile: null })
        } else {
          set({ user: session.user, profile })
        }
      }
    } catch (err) {
      console.error('Auth init error:', err)
      // On any error, clear everything
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
