import { Link, NavLink } from 'react-router-dom'
import { Download, UtensilsCrossed, AtSign, Phone, MapPin } from 'lucide-react'
import { menuData } from '../data/menu'

const NAV_LINKS = [
  { to: '/about', label: 'About' },
]

/**
 * Homepage at `/` — single-viewport (no-scroll) marketing layout.
 *
 * Desktop:
 *   ┌─ Centered header (compact) ───────────────────────────┐
 *   │ ┌─ Hero (flex-1, 2-column) ─────────────────────────┐ │
 *   │ │  [Photo]    │   [Eyebrow + H1 + lede + CTAs]      │ │
 *   │ └───────────────────────────────────────────────────┘ │
 *   │ ┌─ Contact strip (compact, centered) ───────────────┐ │
 *   │ │  pizzeria ristorante · address · hours · links    │ │
 *   │ └───────────────────────────────────────────────────┘ │
 *   │ ┌─ Footer (thin, centered) ─────────────────────────┐ │
 *   └────────────────────────────────────────────────────────┘
 *
 * Whole page is height: 100dvh on desktop so nothing scrolls.
 * On mobile (<md), grid stacks to single column — natural scroll
 * because mobile users expect it.
 *
 * Inline styles for layout containers (Tailwind v4 max-w-* didn't
 * generate reliably for the new pages/ folder). Tailwind for color/
 * font-family utilities since those work fine.
 */
export default function HomePage() {
  const { restaurant } = menuData
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const heroSrc = `${base}/images/exterior.jpg`

  return (
    <div
      className="bg-bg"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Compact centered header ──────────────────────────────── */}
      <header
        style={{
          textAlign: 'center',
          paddingTop: '1.5rem',
          paddingBottom: '0.5rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
        }}
      >
        <Link
          to="/"
          aria-label="Gusto Pizzeria Ristorante — home"
          className="no-underline inline-block"
        >
          <img
            src={`${import.meta.env.BASE_URL}images/gusto-wordmark.png`}
            alt="Gusto Pizzeria Ristorante"
            width={200}
            height={94}
            style={{ display: 'block' }}
          />
        </Link>
        <p
          className="text-text-muted"
          style={{
            marginTop: '0.4rem',
            fontSize: '10px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          Janabiyah · Bahrain
        </p>

        {/* ── Public nav links ─────────────────────────────────────── */}
        <nav
          aria-label="Main navigation"
          style={{
            marginTop: '0.875rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.25rem 0.5rem',
          }}
        >
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'nav-pill is-active' : 'nav-pill')}
              style={{
                fontSize: '12px',
                padding: '0.35rem 0.9rem',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* ── Hero — 2-column on desktop, stacked on mobile ────────── */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingTop: '1rem',
          paddingBottom: '1rem',
        }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 md:gap-12"
          style={{
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            width: '100%',
            alignItems: 'center',
          }}
        >
          {/* ── Photo (preserves natural aspect, no cropping) ── */}
          <div
            className="stagger-in bg-bg-cream"
            style={{
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow:
                '0 1px 2px rgba(104,90,90,0.06), 0 20px 50px -20px rgba(104,90,90,0.30)',
              ['--i' as never]: 0,
            }}
          >
            <img
              src={heroSrc}
              alt="Gusto Pizzeria Ristorante — The Park, Janabiyah"
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
              }}
              loading="eager"
              decoding="async"
            />
          </div>

          {/* ── Copy + CTAs ── */}
          <div style={{ textAlign: 'center' }}>
            <p
              className="text-accent stagger-in"
              style={{
                fontSize: '10px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: '0.75rem',
                ['--i' as never]: 1,
              }}
            >
              Forno a legna
            </p>

            <h1
              className="text-ink stagger-in"
              style={{
                fontFamily: 'var(--font-italic)',
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 'clamp(30px, 3.4vw, 44px)',
                lineHeight: 1.08,
                letterSpacing: '-0.005em',
                marginBottom: '1rem',
                ['--i' as never]: 2,
              }}
            >
              Wood-fired. Hand-stretched. Delivered.
            </h1>

            <p
              className="text-text stagger-in"
              style={{
                fontSize: '15px',
                lineHeight: 1.55,
                marginBottom: '1.5rem',
                maxWidth: '460px',
                marginLeft: 'auto',
                marginRight: 'auto',
                ['--i' as never]: 3,
              }}
            >
              Pizzas, pastas, antipasti, dolci. For the table or the
              trip home.
            </p>

            <div
              className="stagger-in"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '0.625rem',
                maxWidth: '440px',
                marginLeft: 'auto',
                marginRight: 'auto',
                ['--i' as never]: 4,
              }}
            >
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-disabled="true"
                className="rounded-pill bg-accent text-white shadow-pill no-underline"
                style={{
                  flex: '1 1 180px',
                  minHeight: '46px',
                  padding: '0.75rem 1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                <Download size={14} strokeWidth={2.2} />
                <span>Download the App</span>
              </a>
              <Link
                to="/menu"
                className="rounded-pill bg-accent-dark text-white shadow-pill no-underline"
                style={{
                  flex: '1 1 180px',
                  minHeight: '46px',
                  padding: '0.75rem 1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                <UtensilsCrossed size={14} strokeWidth={2.2} />
                <span>View Menu</span>
              </Link>
            </div>

            <p
              className="text-text-muted stagger-in"
              style={{
                marginTop: '0.875rem',
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                ['--i' as never]: 5,
              }}
            >
              App launching soon · Tap above to browse the menu
            </p>
          </div>
        </div>
      </section>

      {/* ── Compact contact band ─────────────────────────────────── */}
      <section
        style={{
          textAlign: 'center',
          paddingTop: '1rem',
          paddingBottom: '0.75rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          borderTop: '1px solid rgba(154, 142, 142, 0.15)',
        }}
      >
        <p
          className="text-text-muted"
          style={{
            fontFamily: 'var(--font-italic)',
            fontStyle: 'italic',
            fontSize: '13px',
            marginBottom: '0.25rem',
          }}
        >
          pizzeria ristorante · forno a legna
        </p>
        <p
          className="text-text"
          style={{
            fontFamily: 'var(--font-italic)',
            fontStyle: 'italic',
            fontSize: '13px',
            marginBottom: '0.5rem',
          }}
        >
          {restaurant.address} · <span className="text-text-muted">{restaurant.hours}</span>
        </p>
        <div
          className="text-text"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem 1.25rem',
            fontSize: '12px',
          }}
        >
          {restaurant.googleMapsUrl && (
            <a
              href={restaurant.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <MapPin size={12} strokeWidth={2} className="text-text-muted" />
              <span>Directions</span>
            </a>
          )}
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <Phone size={12} strokeWidth={2} className="text-text-muted" />
              <span>{restaurant.phone}</span>
            </a>
          )}
          {restaurant.instagram && (
            <a
              href={`https://instagram.com/${restaurant.instagram.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <AtSign size={12} strokeWidth={2} className="text-text-muted" />
              <span>{restaurant.instagram}</span>
            </a>
          )}
        </div>
      </section>

      {/* ── Thin footer ──────────────────────────────────────────── */}
      <footer
        className="text-text-muted"
        style={{
          textAlign: 'center',
          paddingTop: '0.75rem',
          paddingBottom: '1rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          fontSize: '9px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 500,
          borderTop: '1px solid rgba(154, 142, 142, 0.1)',
        }}
      >
        © {new Date().getFullYear()} IL Gusto W.L.L · VAT incl.
      </footer>
    </div>
  )
}
