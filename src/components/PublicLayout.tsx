import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { LEGAL_LINKS } from '../data/legalLinks'

const NAV_LINKS = [
  { to: '/menu', label: 'Menu' },
  { to: '/about', label: 'About' },
]

/**
 * Shared chrome for the public marketing/legal pages (About, legal pages) and
 * the customer menu.
 *
 * `tone` controls the palette:
 *   - 'warm'    (default),cream redesign palette, used by About + legal pages.
 *   - 'neutral',the original white palette. PublicMenuPage passes this so its
 *     fixed white category sub-nav sits flush under a matching white header
 *     (a warm header over the white sub-nav would seam).
 */
export default function PublicLayout({
  children,
  tone = 'warm',
}: {
  children: React.ReactNode
  tone?: 'warm' | 'neutral'
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const warm = tone === 'warm'

  const c = warm
    ? {
        rootBg: 'var(--color-warm-bg)',
        headerBg: 'var(--color-warm-surface)',
        footerBg: 'var(--color-warm-surface)',
        ink: 'var(--color-warm-ink)',
        text: 'var(--color-warm-body)',
        muted: 'var(--color-warm-muted)',
        accent: 'var(--color-warm-accent)',
        line: 'var(--color-warm-line)',
        navIdle: '#5A4E44',
        font: 'var(--font-archivo)',
      }
    : {
        rootBg: 'var(--color-bg)',
        headerBg: 'var(--color-bg)',
        footerBg: 'var(--color-bg-cream)',
        ink: 'var(--color-ink)',
        text: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        accent: 'var(--color-accent)',
        line: 'rgba(104,90,90,0.1)',
        navIdle: 'var(--color-text)',
        font: 'var(--font-sans)',
      }

  const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '0.4rem 0.5rem',
    textDecoration: 'none',
    color: isActive ? c.accent : c.navIdle,
    transition: 'color 0.15s',
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: c.rootBg, fontFamily: c.font }}>
      {/* Fixed top bar: position:fixed is immune to scroll-context / overflow / flex
          edge cases that broke position:sticky on iOS Safari. `main` gets matching
          top padding (57px) so content starts below it. */}
      <header style={{
        borderBottom: `1px solid ${c.line}`,
        boxShadow: '0 1px 3px rgba(58,38,20,0.06)',
        backgroundColor: c.headerBg,
        position: 'fixed',
        // Extend the solid background 100px above the viewport edge so nothing can
        // bleed into the dynamic-toolbar gap above the nav on iOS Safari. paddingTop
        // pushes the visible bar back down to its normal position (visible bottom = 57px).
        top: -100,
        left: 0,
        right: 0,
        paddingTop: 100,
        zIndex: 100,
        // Promote to its own compositing layer,fixes iOS Safari z-index/stacking glitches.
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
      }}>
        <div style={{
          maxWidth: '1180px',
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
            aria-label="Gusto Pizzeria Ristorante,home"
            style={{
              display: 'block',
              textDecoration: 'none',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {/* Wordmark lockup image (natural 272x128, rendered at half size
                for 2x retina sharpness). Explicit width/height prevent CLS. */}
            <img
              src={`${import.meta.env.BASE_URL}images/gusto-wordmark.png`}
              alt="Gusto Pizzeria Ristorante"
              width={100}
              height={47}
              style={{ display: 'block', height: 'auto', maxHeight: '100%' }}
            />
          </Link>

          {/* Desktop nav,uppercase tracked links, active in the accent colour. */}
          <nav aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="hidden-mobile">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} style={({ isActive }) => navLinkStyle(isActive)}>
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
              color: c.ink,
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
              borderTop: `1px solid ${c.line}`,
              padding: '0.75rem 1.5rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.125rem',
              backgroundColor: c.headerBg,
            }}
          >
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  fontSize: '15px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? c.accent : c.text,
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {/* Spacer offsets the fixed header (56px inner + 1px border = 57px).
          position:relative + z-index:1 puts ALL page content in a stacking context
          below the fixed bars, so cards (and their box-shadows / stacking contexts)
          can never paint over them,an iOS Safari fixed-layer fix. */}
      <main style={{ paddingTop: 57, position: 'relative', zIndex: 1 }}>
        {children}
      </main>

      <footer style={{
        borderTop: `1px solid ${c.line}`,
        backgroundColor: c.footerBg,
        padding: '2.5rem 1.5rem',
      }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1.5rem 2rem',
            marginBottom: '1.75rem',
          }}>
            <div>
              <p style={{
                fontFamily: 'var(--font-italic)',
                fontWeight: 700,
                fontSize: '20px',
                letterSpacing: '0.02em',
                color: c.ink,
                marginBottom: '0.35rem',
              }}>
                IL GUSTO W.L.L.
              </p>
              <p style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontSize: '15px', color: c.muted }}>
                pizzeria ristorante · Al Janabiyah, Bahrain
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: c.muted, fontWeight: 700 }}>
                Legal
              </p>
              {LEGAL_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} style={{ fontSize: '13px', color: c.text, textDecoration: 'none' }}>
                  {label}
                </Link>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: c.muted, fontWeight: 700 }}>
                Download Our App
              </p>
              <span aria-disabled="true" style={{ fontSize: '13px', color: c.muted }}>
                App Store (coming soon)
              </span>
              <span aria-disabled="true" style={{ fontSize: '13px', color: c.muted }}>
                Google Play (coming soon)
              </span>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${c.line}`, paddingTop: '1.1rem' }}>
            <p style={{ fontSize: '11px', color: c.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
              © {new Date().getFullYear()} IL Gusto W.L.L. · VAT incl.
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
