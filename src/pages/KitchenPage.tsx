import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function KitchenPage() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null)
    })
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100dvh', gap: '0.75rem',
      fontFamily: 'var(--font-sans)', color: 'var(--color-ink)',
    }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Kitchen</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Signed in as {email ?? '…'}</p>
      <button
        onClick={() => {}}
        style={{
          marginTop: '1rem', padding: '0.625rem 1.5rem',
          borderRadius: 'var(--radius-pill)', border: 'none',
          background: 'var(--color-accent)', color: '#fff',
          fontFamily: 'var(--font-sans)', fontWeight: 600,
          fontSize: '0.9375rem', cursor: 'pointer', minHeight: '44px',
        }}
      >
        Sign Out
      </button>
    </div>
  )
}
