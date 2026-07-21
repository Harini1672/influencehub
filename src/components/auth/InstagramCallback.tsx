import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

// The redirect URI must exactly match what is registered in the Meta App Dashboard.
// Format: <origin>/auth/instagram/callback
const REDIRECT_URI = `${window.location.origin}/auth/instagram/callback`

type Status = 'exchanging' | 'success' | 'error'

export function InstagramCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const calledRef = useRef(false)           // prevent StrictMode double-invoke
  const [status, setStatus] = useState<Status>('exchanging')
  const [message, setMessage] = useState('Connecting your Instagram account…')

  useEffect(() => {
    // Guard: only run once even in React Strict Mode
    if (calledRef.current) return
    calledRef.current = true

    const code  = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      const reason = searchParams.get('error_reason') ?? error
      finish('error', `Instagram denied access: ${reason}`)
      return
    }

    if (!code) {
      finish('error', 'No authorization code received from Instagram.')
      return
    }

    if (!user) {
      // Session may not be rehydrated yet — wait a moment then retry once
      const timer = setTimeout(() => {
        if (!user) finish('error', 'You must be signed in to connect Instagram.')
      }, 3000)
      return () => clearTimeout(timer)
    }

    exchangeCode(code)

    async function exchangeCode(code: string) {
      try {
        // Get the current session JWT to pass as Authorization header
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          finish('error', 'Session expired. Please sign in again.')
          return
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
        const res = await fetch(`${supabaseUrl}/functions/v1/instagram-oauth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
        })

        const data = await res.json()

        if (!res.ok || data.error) {
          finish('error', data.error ?? 'Failed to connect Instagram. Please try again.')
          return
        }

        // Invalidate the influencer query so the profile page re-fetches
        queryClient.invalidateQueries({ queryKey: ['influencer', user!.id] })

        finish('success', `@${data.instagram_username} connected successfully!`)
      } catch (err) {
        console.error('Instagram OAuth exchange error:', err)
        finish('error', 'An unexpected error occurred. Please try again.')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function finish(outcome: Status, msg: string) {
    setStatus(outcome)
    setMessage(msg)

    // Encode result into the redirect so the profile page can show a toast
    const params = new URLSearchParams({
      instagram: outcome,
      message: msg,
    })

    // Short delay so the user sees the status screen before redirect
    setTimeout(() => {
      navigate(`/influencer/profile?${params.toString()}`, { replace: true })
    }, outcome === 'success' ? 1500 : 2500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
      <div className="text-center space-y-4 max-w-sm mx-auto p-6">
        {status === 'exchanging' && (
          <>
            {/* Animated Instagram gradient spinner */}
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 animate-spin" />
              <div className="absolute inset-1 rounded-full bg-white dark:bg-background flex items-center justify-center">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"
                    stroke="url(#ig)" strokeWidth="2" fill="none" />
                  <circle cx="12" cy="12" r="4.5"
                    stroke="url(#ig)" strokeWidth="2" fill="none" />
                  <circle cx="17.5" cy="6.5" r="1" fill="url(#ig)" />
                  <defs>
                    <linearGradient id="ig" x1="0" y1="24" x2="24" y2="0"
                      gradientUnits="userSpaceOnUse">
                      <stop stopColor="#f9a825" />
                      <stop offset="0.5" stopColor="#e91e8c" />
                      <stop offset="1" stopColor="#9c27b0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <p className="text-base font-medium">{message}</p>
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your Instagram account…
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-semibold text-emerald-600">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting to your profile…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-base font-semibold text-destructive">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting back to your profile…</p>
          </>
        )}
      </div>
    </div>
  )
}
