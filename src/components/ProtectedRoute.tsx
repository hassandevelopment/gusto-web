import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

type Props = { children: React.ReactNode }
type AuthState = 'loading' | 'no-session' | 'not-staff' | 'authorized'

export default function ProtectedRoute({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [state, setState] = useState<AuthState>('loading')

  // Track session. INITIAL_SESSION fires on subscribe, so no separate getSession() call
  // is needed. CRITICAL: do ONLY synchronous state updates in this callback. Making ANY
  // Supabase call (query, signOut, etc.) inside onAuthStateChange deadlocks supabase-js
  // (documented bug) — that was the cause of staff being signed out on token refresh.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Staff check runs OUTSIDE the auth callback, keyed on the user id so it does NOT
  // re-run on TOKEN_REFRESHED (same id). A failed/errored query does NOT sign the user
  // out — RLS is the real security boundary; we only bounce on a CONFIRMED non-staff.
  const userId = session?.user?.id ?? null
  useEffect(() => {
    if (!sessionReady) return
    if (!userId) {
      setState('no-session')
      return
    }

    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_staff')
        .eq('id', userId)
        .single()
      if (cancelled) return
      if (error) {
        // Couldn't verify (transient/network/refresh window). Do NOT sign out — RLS
        // still blocks any non-staff data access server-side. Keeping real staff in
        // beats kicking them out on a flaky check.
        console.error('Staff check failed (keeping session):', error)
        setState('authorized')
        return
      }
      if (data?.is_staff === true) {
        setState('authorized')
      } else {
        // Confirmed non-staff. Safe to call signOut here — this is a normal effect,
        // NOT the onAuthStateChange callback.
        setState('not-staff')
        supabase.auth.signOut().catch((e) => console.error('Sign out failed:', e))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, sessionReady])

  if (state === 'loading') {
    return <div style={{ padding: '2rem', fontFamily: 'var(--font-sans)' }}>Loading…</div>
  }
  if (state === 'no-session' || state === 'not-staff') {
    return <Navigate to="/kitchen/login" replace />
  }
  return <>{children}</>
}
