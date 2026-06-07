import { useState } from 'react'

export default function KitchenLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('submit:', { email })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.75rem',
    border: '1px solid rgba(104,90,90,0.2)', borderRadius: '8px',
    fontFamily: 'var(--font-sans)', fontSize: '1rem',
    color: 'var(--color-ink)', background: '#fff', outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '0.375rem',
    fontSize: '0.875rem', fontWeight: 600,
    color: 'var(--color-text)',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', background: 'var(--color-bg-cream)',
      fontFamily: 'var(--font-sans)', padding: '1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '2rem',
      }}>
        <h1 style={{
          fontSize: '1.25rem', fontWeight: 700,
          color: 'var(--color-ink)', marginBottom: '1.5rem',
        }}>
          Kitchen Sign In
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="kitchen-email" style={labelStyle}>Email</label>
            <input
              id="kitchen-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="kitchen-password" style={labelStyle}>Password</label>
            <input
              id="kitchen-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%', padding: '0.75rem',
              borderRadius: 'var(--radius-pill)', border: 'none',
              background: 'var(--color-accent)', color: '#fff',
              fontFamily: 'var(--font-sans)', fontWeight: 600,
              fontSize: '1rem', cursor: 'pointer', minHeight: '44px',
            }}
          >
            Sign In
          </button>

          {/* Error message — populated in Phase 2c */}
          <p style={{
            marginTop: '0.75rem', fontSize: '0.875rem',
            color: '#B91C1C', minHeight: '1.25rem',
          }} />
        </form>
      </div>
    </div>
  )
}
