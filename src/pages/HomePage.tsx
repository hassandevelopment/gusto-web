import { Link } from 'react-router-dom'
import { LEGAL_LINKS } from '../data/legalLinks'

/**
 * Inline stroke icons (paths lifted from the design handoff). Kept inline rather
 * than pulling lucide so the home page, which sits in the customer initial
 * chunk, adds zero icon JS to the bundle (customer perf budget is non-negotiable).
 */
function Ico({
  size = 18,
  sw = 2,
  className,
  children,
}: {
  size?: number
  sw?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/**
 * Homepage at `/`,full-scroll marketing page (2026-07 redesign).
 *
 * Standalone: owns its own header + footer rather than using PublicLayout,
 * because the header uses in-page anchor nav (#menu, #visit) and a centered
 * wordmark footer that only make sense on this scroll page.
 *
 * Sections: Header · Hero · "A few from the oven" menu band · "Find us in
 * Janabiyah" visit block · wordmark footer. Styling is ported from the design
 * handoff into the `home-` prefixed <style> block below and driven by the warm
 * palette tokens (--color-warm-*) + Archivo / Cormorant Garamond.
 */

const base = import.meta.env.BASE_URL.replace(/\/$/, '')
const img = (name: string) => `${base}/images/home/${name}`
const wordmark = `${import.meta.env.BASE_URL}images/gusto-wordmark.png`

// Real venue details (address matches the legal pages; hours are dine-in hours).
const PHONE_DISPLAY = '+973 1769 5556'
const PHONE_TEL = '+97317695556'
const INSTAGRAM = '@gusto_bahrain'
const INSTAGRAM_URL = 'https://instagram.com/gusto_bahrain'
const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Il%20Gusto%20Pizzeria%20Al%20Janabiyah%20Bahrain'
const MAPS_EMBED = 'https://www.google.com/maps?q=Il+Gusto+Pizzeria+Al+Janabiyah+Bahrain&output=embed'

const MENU_HIGHLIGHTS = [
  { img: 'arabica.webp', name: 'Arabica', desc: 'Spiced beef salami, red onion, green chilli, fior di latte' },
  { img: 'caprese.webp', name: 'Caprese', desc: 'Fior di latte, fresh basil, confit cherry tomato, olive oil' },
  { img: 'primavera.webp', name: 'Primavera', desc: 'Basil pesto, grilled courgette, peppers and mushroom' },
  { img: 'donald-duck.webp', name: 'Donald Duck', desc: "Mozzarella, beef and golden fries, the little ones' favourite" },
]

export default function HomePage() {
  return (
    <div className="home">
      <div className="home-wrap">
        <header className="home-header">
          <Link to="/" className="home-brand" aria-label="Gusto Pizzeria Ristorante,home">
            <img src={wordmark} alt="Gusto Pizzeria Ristorante" width={168} height={79} />
          </Link>
          <nav className="home-nav" aria-label="Main navigation">
            <Link className="home-navlink" to="/menu">Menu</Link>
            <a className="home-navlink" href="#visit">Visit</a>
            <Link className="home-navlink" to="/about">About</Link>
            <span className="home-locale">Janabiyah · Bahrain</span>
          </nav>
        </header>

        <section className="home-hero">
          <div>
            <div className="home-eyebrow-rule">
              <span className="home-rule" />
              <span className="home-eyebrow">Forno a Legna</span>
            </div>
            <h1 className="home-h1">
              Wood-fired,<br />hand-stretched,<br />
              <span className="home-h1-accent">to your table.</span>
            </h1>
            <p className="home-hero-sub">
              Napoletana pizza pulled fresh, blistered in the oak-fired oven, and carried straight to
              your table, or your door.
            </p>
            <div className="home-cta-row">
              <span className="home-btn home-btn-primary" aria-disabled="true">
                <Ico size={18} sw={2.2}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </Ico>
                Coming Soon
              </span>
              <Link className="home-btn home-btn-primary" to="/menu">
                <Ico size={17} sw={2.2}>
                  <rect x="8" y="2" width="8" height="4" rx="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <path d="M12 11h4" />
                  <path d="M12 16h4" />
                  <path d="M8 11h.01" />
                  <path d="M8 16h.01" />
                </Ico>
                View Menu
              </Link>
            </div>
            <p className="home-micro-note">App launching soon on the App Store and Google Play</p>
          </div>
          <div className="home-hero-media">
            <img
              src={img('arabica.webp')}
              alt="Wood-fired salami pizza fresh from the oven"
              width={1100}
              height={1375}
              loading="eager"
              // @ts-expect-error fetchpriority is a valid HTML attribute not yet in React's types
              fetchpriority="high"
              decoding="async"
            />
          </div>
        </section>
      </div>

      <section className="home-menu-band" id="menu">
        <div className="home-wrap">
          <div className="home-section-head">
            <div>
              <span className="home-eyebrow">Dal Forno</span>
              <h2 className="home-section-title">A few from the oven</h2>
            </div>
            <Link className="home-link-arrow" to="/menu">
              Full menu
              <Ico size={15} sw={2.4}>
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </Ico>
            </Link>
          </div>
          <div className="home-menu-grid">
            {MENU_HIGHLIGHTS.map((item) => (
              <article className="home-menu-card" key={item.name}>
                <div className="home-thumb">
                  <img src={img(item.img)} alt={`${item.name} pizza`} width={300} height={300} loading="lazy" decoding="async" />
                </div>
                <h3>{item.name}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-visit home-wrap" id="visit">
        <div className="home-visit-grid">
          <div className="home-visit-photo">
            <img
              src={img('storefront.webp')}
              alt="Il Gusto storefront in Janabiyah at dusk"
              width={1400}
              height={933}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="home-visit-info">
            <span className="home-eyebrow">Trovaci</span>
            <h2 className="home-section-title">Find us in Janabiyah</h2>
            <div className="home-info-list">
              <div className="home-info-item">
                <Ico size={20} sw={2} className="home-info-icon">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </Ico>
                <div>
                  <div className="home-info-primary">Shop 21, Building 385, Road 7113, Block 571</div>
                  <div className="home-info-secondary">Al Janabiyah, Kingdom of Bahrain</div>
                </div>
              </div>
              <div className="home-info-item">
                <Ico size={20} sw={2} className="home-info-icon">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </Ico>
                <div>
                  <div className="home-info-primary">Open daily · 12:00 to 23:30</div>
                  <div className="home-info-secondary">Seven days a week</div>
                </div>
              </div>
              <div className="home-info-contacts">
                <div className="home-info-item">
                  <Ico size={20} sw={2} className="home-info-icon">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                  </Ico>
                  <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
                </div>
                <div className="home-info-item">
                  <Ico size={20} sw={2} className="home-info-icon">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <path d="M17.5 6.5h.01" />
                  </Ico>
                  <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">{INSTAGRAM}</a>
                </div>
              </div>
            </div>
            <a className="home-btn home-btn-primary home-btn-start" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              Get directions
              <Ico size={15} sw={2.2}>
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </Ico>
            </a>
          </div>
        </div>
        <div className="home-map">
          <iframe title="Map to Il Gusto, Janabiyah" src={MAPS_EMBED} loading="lazy" />
        </div>
      </section>

      <footer className="home-footer home-wrap">
        <div className="home-footer-word">GUSTO</div>
        <div className="home-footer-tag">pizzeria ristorante · forno a legna</div>
        <div className="home-footer-divider" />
        <nav className="home-footer-nav" aria-label="Footer navigation">
          <Link to="/about">About</Link>
          {LEGAL_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>{link.label}</Link>
          ))}
        </nav>
        <div className="home-copyright">© {new Date().getFullYear()} IL Gusto W.L.L · VAT Incl.</div>
      </footer>

      <style>{`
        .home {
          background: var(--color-warm-bg);
          color: var(--color-warm-ink);
          font-family: var(--font-archivo);
          -webkit-font-smoothing: antialiased;
          min-height: 100dvh;
        }
        .home a { color: var(--color-warm-accent); text-decoration: none; transition: color .2s ease; }
        .home a:hover { color: var(--color-warm-accent-deep); }
        .home img { display: block; max-width: 100%; }
        .home h1, .home h2, .home h3 { margin: 0; }
        .home-wrap { max-width: 1180px; margin: 0 auto; padding: 0 32px; }

        /* Header */
        .home-header { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 34px 0 30px; }
        .home-brand { flex: none; display: block; }
        .home-brand img { height: 60px; width: auto; }
        .home-nav { display: flex; align-items: center; gap: 34px; }
        .home-navlink { font-size: 13px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #5A4E44; }
        .home-navlink:hover { color: var(--color-warm-ink); }
        .home-locale { font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-warm-muted); border-left: 1px solid var(--color-warm-line); padding-left: 34px; }

        /* Eyebrow */
        .home-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; color: var(--color-warm-accent); }
        .home-eyebrow-rule { display: flex; align-items: center; gap: 12px; }
        .home-eyebrow-rule .home-rule { width: 34px; height: 1px; background: #C0693C; }

        /* Hero */
        .home-hero { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 56px; align-items: center; padding: 44px 0 84px; }
        .home-h1 { font-family: var(--font-italic); font-weight: 500; font-size: 74px; line-height: 1.0; letter-spacing: -0.01em; color: var(--color-warm-ink); margin: 26px 0 24px; }
        .home-h1-accent { font-style: italic; color: var(--color-warm-accent); }
        .home-hero-sub { font-family: var(--font-italic); font-size: 23px; line-height: 1.5; color: var(--color-warm-body); margin: 0 0 38px; max-width: 430px; }
        .home-cta-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        /* All CTAs share one treatment: solid terracotta, white text, readable at rest. */
        .home-btn { display: inline-flex; align-items: center; gap: 11px; border-radius: 100px; font-weight: 700; font-size: 15px; padding: 17px 30px; cursor: pointer; border: none; font-family: var(--font-archivo); }
        /* .home .home-btn-primary (two classes) outranks the .home a colour rule
           above, so button labels and their icons stay white on the terracotta. */
        .home .home-btn-primary { background: var(--color-warm-accent); color: #FFFFFF; box-shadow: 0 10px 26px -10px rgba(178,74,36,0.7); }
        .home .home-btn-primary:hover { background: var(--color-warm-accent-deep); color: #FFFFFF; }
        .home-btn-start { align-self: flex-start; }
        .home-btn[aria-disabled="true"] { cursor: default; }
        .home-micro-note { font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-warm-muted); margin: 22px 0 0; }
        .home-hero-media { aspect-ratio: 4 / 5; border-radius: 20px; overflow: hidden; box-shadow: 0 34px 70px -30px rgba(58,38,20,0.55); }
        .home-hero-media img { width: 100%; height: 100%; object-fit: cover; }

        /* Menu band */
        .home-menu-band { background: var(--color-warm-surface); border-top: 1px solid rgba(42,35,30,0.08); border-bottom: 1px solid rgba(42,35,30,0.08); }
        .home-menu-band .home-wrap { padding: 76px 32px 84px; }
        .home-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 52px; }
        .home-section-title { font-family: var(--font-italic); font-weight: 500; font-size: 46px; line-height: 1.05; color: var(--color-warm-ink); margin-top: 10px; }
        .home-link-arrow { font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-warm-accent); display: inline-flex; align-items: center; gap: 8px; }
        .home-menu-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 34px; }
        .home-menu-card { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .home-thumb { width: 100%; aspect-ratio: 1 / 1; border-radius: 50%; overflow: hidden; background: var(--color-warm-card-img); box-shadow: 0 20px 40px -24px rgba(58,38,20,0.55); margin-bottom: 22px; }
        .home-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .home-menu-card h3 { font-family: var(--font-italic); font-weight: 600; font-size: 26px; color: var(--color-warm-ink); margin-bottom: 8px; }
        .home-menu-card p { font-size: 13.5px; line-height: 1.6; color: #7A6C5E; margin: 0; max-width: 220px; }

        /* Visit */
        .home-visit { padding: 84px 32px 40px; }
        .home-visit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 52px; align-items: stretch; }
        .home-visit-photo { border-radius: 22px; overflow: hidden; min-height: 420px; box-shadow: 0 30px 60px -34px rgba(58,38,20,0.55); }
        .home-visit-photo img { width: 100%; height: 100%; object-fit: cover; }
        .home-visit-info { display: flex; flex-direction: column; justify-content: center; }
        .home-visit-info h2 { margin-bottom: 30px; }
        .home-info-list { display: flex; flex-direction: column; gap: 20px; margin: 0 0 32px; }
        .home-info-item { display: flex; gap: 15px; align-items: flex-start; }
        .home-info-icon { margin-top: 2px; flex: none; color: var(--color-warm-accent); }
        .home-info-primary { font-weight: 700; font-size: 15px; color: var(--color-warm-ink); }
        .home-info-secondary { font-size: 14px; color: #7A6C5E; margin-top: 2px; }
        .home-info-contacts { display: flex; gap: 32px; flex-wrap: wrap; }
        .home-info-contacts .home-info-item { align-items: center; }
        .home-info-contacts a { font-weight: 700; font-size: 15px; }
        .home-map { margin-top: 34px; border-radius: 22px; overflow: hidden; border: 1px solid var(--color-warm-line); box-shadow: 0 20px 44px -30px rgba(58,38,20,0.4); }
        .home-map iframe { width: 100%; height: 320px; border: 0; display: block; filter: saturate(0.9) contrast(1.02); }

        /* Footer */
        .home-footer { padding: 44px 32px 56px; text-align: center; }
        .home-footer-word { font-family: var(--font-italic); font-weight: 900; font-size: 24px; letter-spacing: -0.01em; color: var(--color-warm-dark); }
        .home-footer-tag { font-family: var(--font-italic); font-style: italic; font-size: 16px; color: #9C8C7C; margin-top: 2px; }
        .home-footer-divider { height: 1px; background: rgba(42,35,30,0.1); max-width: 340px; margin: 26px auto; }
        .home-footer-nav { display: flex; align-items: center; justify-content: center; gap: 26px; flex-wrap: wrap; margin-bottom: 20px; }
        .home-footer-nav a { font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #7A6C5E; }
        .home-copyright { font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-warm-muted); }

        /* Responsive */
        @media (max-width: 900px) {
          .home-hero { grid-template-columns: 1fr; gap: 40px; padding: 24px 0 64px; }
          .home-h1 { font-size: 58px; }
          .home-hero-media { max-width: 460px; }
          .home-visit-grid { grid-template-columns: 1fr; gap: 32px; }
          .home-visit-photo { min-height: 300px; }
          .home-menu-grid { grid-template-columns: repeat(2, 1fr); gap: 40px 28px; }
        }
        @media (max-width: 760px) {
          .home-header { flex-wrap: wrap; gap: 16px; padding: 24px 0 20px; }
          .home-nav { gap: 22px; flex-wrap: wrap; }
          .home-locale { border-left: none; padding-left: 0; }
          .home-h1 { font-size: 46px; }
          .home-section-title { font-size: 36px; }
        }
        @media (max-width: 520px) {
          .home-menu-grid { grid-template-columns: 1fr; gap: 40px; }
          .home-cta-row .home-btn { flex: 1 1 auto; justify-content: center; }
          .home-h1 { font-size: 40px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .home a, .home-btn { transition: none; }
        }
      `}</style>
    </div>
  )
}
