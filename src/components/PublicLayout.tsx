import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { to: '/menu', label: 'Menu' },
  { to: '/about', label: 'About' },
  { to: '/terms', label: 'Terms' },
  { to: '/refund', label: 'Refund Policy' },
  { to: '/privacy', label: 'Privacy' },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      <header style={{
        borderBottom: '1px solid rgba(104,90,90,0.1)',
        backgroundColor: 'var(--color-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <Link
            to="/"
            aria-label="IL Gusto — home"
            style={{
              fontFamily: 'var(--font-wordmark)',
              fontSize: '18px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 400,
              color: 'var(--color-ink)',
              textDecoration: 'none',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            IL GUSTO
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main navigation" style={{ display: 'flex', gap: '0.25rem' }} className="hidden-mobile">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  fontSize: '13px',
                  fontWeight: 500,
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                  backgroundColor: isActive ? 'rgba(199,93,44,0.08)' : 'transparent',
                  transition: 'color 0.15s, background-color 0.15s',
                  whiteSpace: 'nowrap',
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="show-mobile"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: 'var(--color-ink)',
              display: 'none',
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <nav
            aria-label="Mobile navigation"
            style={{
              borderTop: '1px solid rgba(104,90,90,0.1)',
              padding: '0.75rem 1.5rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.125rem',
              backgroundColor: 'var(--color-bg)',
            }}
          >
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  fontSize: '15px',
                  fontWeight: 500,
                  padding: '0.625rem 0.75rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                  backgroundColor: isActive ? 'rgba(199,93,44,0.08)' : 'transparent',
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main style={{ flex: 1 }}>
        {children}
      </main>

      <footer style={{
        borderTop: '1px solid rgba(104,90,90,0.1)',
        backgroundColor: 'var(--color-bg-cream)',
        padding: '2rem 1.5rem',
        marginTop: 'auto',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <div>
              <p style={{
                fontFamily: 'var(--font-wordmark)',
                fontSize: '15px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-ink)',
                marginBottom: '0.25rem',
              }}>
                IL GUSTO W.L.L.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Al Janabiyah, Bahrain
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Legal
              </p>
              {[
                { to: '/terms', label: 'Terms & Conditions' },
                { to: '/refund', label: 'Refund Policy' },
                { to: '/privacy', label: 'Privacy Policy' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} style={{ fontSize: '13px', color: 'var(--color-text)', textDecoration: 'none' }}>
                  {label}
                </Link>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Download Our App
              </p>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-disabled="true"
                style={{ fontSize: '13px', color: 'var(--color-text)', textDecoration: 'none', opacity: 0.5 }}
              >
                App Store (coming soon)
              </a>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-disabled="true"
                style={{ fontSize: '13px', color: 'var(--color-text)', textDecoration: 'none', opacity: 0.5 }}
              >
                Google Play (coming soon)
              </a>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(104,90,90,0.1)', paddingTop: '1rem' }}>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
              © {new Date().getFullYear()} IL Gusto W.L.L. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 680px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 681px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}
