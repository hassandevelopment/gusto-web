import PublicLayout from '../components/PublicLayout'

/**
 * About `/about`, marketing page (2026-07 redesign). Narrative intro plus an
 * "essentials" grid. No Privacy/Terms sections; the real legal pages live at
 * /privacy and /terms and are reachable from the footer.
 */
export default function AboutPage() {
  return (
    <PublicLayout>
      <div style={{ fontFamily: 'var(--font-archivo)' }}>
        <section style={{ padding: '74px 0 40px' }}>
          <div style={reading}>
            <span style={eyebrow}>La Nostra Storia</span>
            <h1 style={pageTitle}>About Gusto</h1>
            <p style={lead}>
              Gusto is a family run pizzeria in Janabiyah, Bahrain. Every pizza starts with a dough
              that rises slowly for three days, then bakes in seconds in our oak fired oven.
            </p>
            <p style={prose}>
              We keep the menu simple and the ingredients honest. Fior di latte, San Marzano
              tomatoes, fresh basil, and a rotating handful of house specials that our regulars keep
              coming back for. Whether you sit with us under the string lights or order for the trip
              home, we want it to taste like it just came out of the oven, because it did.
            </p>
          </div>
        </section>

        <section style={{ ...reading, padding: '16px 1.5rem 64px' }}>
          <div style={essentials}>
            <div>
              <div style={label}>Address</div>
              <div style={value}>
                Shop 21, Building 385, Road 7113, Block 571
                <br />
                Al Janabiyah, Kingdom of Bahrain
              </div>
            </div>
            <div>
              <div style={label}>Hours</div>
              <div style={value}>
                Open daily, 12:00 to 23:30
                <br />
                Seven days a week
              </div>
            </div>
            <div>
              <div style={label}>Contact</div>
              <div style={value}>
                <a href="tel:+97317695556" style={linkStyle}>+973 1769 5556</a>
                <br />
                <a href="https://instagram.com/gusto_bahrain" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  @gusto_bahrain
                </a>
              </div>
            </div>
            <div>
              <div style={label}>Company</div>
              <div style={value}>
                IL Gusto W.L.L · CR 78804-1
                <br />
                Prices are VAT inclusive
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}

const reading: React.CSSProperties = {
  maxWidth: '760px',
  margin: '0 auto',
  padding: '0 1.5rem',
}

const eyebrow: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--color-warm-accent)',
}

const pageTitle: React.CSSProperties = {
  fontFamily: 'var(--font-italic)',
  fontWeight: 500,
  fontSize: 'clamp(2.75rem, 6vw, 3.6rem)',
  lineHeight: 1.05,
  letterSpacing: '-0.01em',
  color: 'var(--color-warm-ink)',
  margin: '14px 0 28px',
}

const lead: React.CSSProperties = {
  fontFamily: 'var(--font-italic)',
  fontSize: '23px',
  lineHeight: 1.6,
  color: '#4E443B',
  margin: '0 0 20px',
}

const prose: React.CSSProperties = {
  fontSize: '17px',
  lineHeight: 1.75,
  color: 'var(--color-warm-body)',
  margin: 0,
}

const essentials: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '28px 40px',
  padding: '30px 0',
  borderTop: '1px solid var(--color-warm-line)',
  borderBottom: '1px solid var(--color-warm-line)',
}

const label: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-warm-muted)',
  marginBottom: '8px',
}

const value: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: 1.6,
  color: 'var(--color-warm-ink)',
}

const linkStyle: React.CSSProperties = {
  color: 'var(--color-warm-accent)',
  textDecoration: 'none',
}
