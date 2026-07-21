import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ error: Error | null }>
  resetPassword: (password: string) => Promise<{ error: Error | null }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data as Profile)
      return
    }

    // PGRST116 = "no rows returned" — profile row is missing for this user.
    // This can happen when the DB trigger didn't fire (e.g. trigger not applied,
    // or email-confirmation was pending when the trigger ran). Recover by
    // upserting the profile from the user's auth metadata so the dashboard
    // always has something to work with.
    if (error?.code === 'PGRST116') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const meta = user.user_metadata ?? {}
      const fallbackProfile = {
        id: user.id,
        email: user.email ?? '',
        full_name: (meta.full_name as string) ?? '',
        role: ((meta.role as string) ?? 'influencer') as Profile['role'],
        avatar_url: null,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: upserted, error: upsertError } = await (supabase as any)
        .from('profiles')
        .upsert(fallbackProfile, { onConflict: 'id' })
        .select()
        .single()

      if (!upsertError && upserted) {
        setProfile(upserted as Profile)
      }
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION synchronously on mount,
    // which would duplicate the fetchProfile call from getSession().
    // We use a ref-like flag to let the listener own all events AFTER
    // the initial session bootstrap is done.
    let bootstrapDone = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Let getSession() below handle the very first load.
        // The listener takes over for every subsequent event.
        if (!bootstrapDone && event === 'INITIAL_SESSION') return

        // PASSWORD_RECOVERY: store session but don't query the DB —
        // the recovery token can't be used for data queries (causes 400).
        if (event === 'PASSWORD_RECOVERY') {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    // Bootstrap: read the current session once, then hand control to the listener.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      const finish = () => {
        bootstrapDone = true
        setLoading(false)
      }
      if (session?.user) {
        fetchProfile(session.user.id).finally(finish)
      } else {
        finish()
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = async (
  email: string,
  password: string,
  fullName: string,
  role: UserRole
): Promise<{ error: Error | null }> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  console.log('Signup data:', data)
  console.log('Signup error:', error)

  if (error) {
    return { error: error as Error }
  }

  // The database trigger (handle_new_user) creates the profile.
  return { error: null }
}

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const forgotPassword = async (
  email: string
): Promise<{ error: Error | null }> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    if (error.message.toLowerCase().includes('after')) {
      return {
        error: new Error(
          'Please wait a moment before requesting another reset link.'
        ),
      }
    }

    return { error: error as Error }
  }

  return { error: null }
}

  const resetPassword = async (password: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error as Error | null }
  }

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Not authenticated') }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    if (!error) await fetchProfile(user.id)
    return { error: error as Error | null }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        forgotPassword,
        resetPassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
