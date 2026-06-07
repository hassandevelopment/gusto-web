import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

type Props = { children: React.ReactNode }
type AuthState = 'loading' | 'no-session' | 'not-staff' | 'authorized'

async function checkStaff(session: Session | null): Promise<AuthState> {
  if (!session) return 'no-session'
  const { data } = await supabase
    .from('profiles')
    .select('is_staff')
    .eq('id', session.user.id)
    .single()
  if (data?.is_staff !== true) {
    await supabase.auth.signOut()
    return 'not-staff'
  }
  return 'authorized'
}

export default function ProtectedRoute({ children }: Props) {
  const [state, setState] = useState<AuthState>('loading')

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkStaff(session).then(s => { if (mounted) setState(s) })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkStaff(session).then(s => { if (mounted) setState(s) })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (state === 'loading') {
    return <div style={{ padding: '2rem', fontFamily: 'var(--font-sans)' }}>Loading…</div>
  }
  if (state === 'no-session' || state === 'not-staff') {
    return <Navigate to="/kitchen/login" replace />
  }
  return <>{children}</>
}
