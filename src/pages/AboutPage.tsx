import PublicLayout from '../components/PublicLayout'

export default function AboutPage() {
  return (
    <PublicLayout>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-italic)',
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          color: 'var(--color-ink)',
          lineHeight: 1.1,
          marginBottom: '2rem',
        }}>
          About Us
        </h1>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={sectionHeading}>Business Information</h2>
          <dl style={definitionList}>
            <div style={dlRow}>
              <dt style={dtStyle}>Business Name</dt>
              <dd style={ddStyle}>IL Gusto W.L.L.</dd>
            </div>
            <div style={dlRow}>
              <dt style={dtStyle}>Commercial Registration</dt>
              <dd style={ddStyle}>78804-1</dd>
            </div>
            <div style={dlRow}>
              <dt style={dtStyle}>Type</dt>
              <dd style={ddStyle}>Italian Pizzeria &amp; Restaurant</dd>
            </div>
            <div style={dlRow}>
              <dt style={dtStyle}>Location</dt>
              <dd style={ddStyle}>
                Shop 21, Building 385, Road 7113, Block 571
                <br />
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Al Janabiyah, Kingdom of Bahrain
                </span>
              </dd>
            </div>
          </dl>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={sectionHeading}>About IL Gusto</h2>
          <p style={bodyText}>
            IL Gusto is an Italian pizzeria and restaurant in Al Janabiyah, Bahrain, serving authentic
            Italian cuisine including wood-fired pizzas, fresh pasta, salads, and desserts.
            IL Gusto is committed to bringing genuine Italian culinary
            tradition to Bahrain — from our hand-stretched dough baked in a wood-fired oven to
            our house-made sauces and seasonal ingredients.
          </p>
          <p style={{ ...bodyText, marginTop: '1rem' }}>
            Our menu is available for dine-in, takeaway, and delivery through our mobile
            application. We operate under IL Gusto W.L.L., a registered company in the
            Kingdom of Bahrain.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={sectionHeading}>Contact</h2>
          <dl style={definitionList}>
            <div style={dlRow}>
              <dt style={dtStyle}>Phone</dt>
              <dd style={ddStyle}>+973 1769 5556</dd>
            </div>
            <div style={dlRow}>
              <dt style={dtStyle}>Email</dt>
              <dd style={ddStyle}>
                gustobahrain@gmail.com
              </dd>
            </div>
            <div style={dlRow}>
              <dt style={dtStyle}>Instagram</dt>
              <dd style={ddStyle}>
                <a
                  href="https://instagram.com/gusto_bahrain"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-accent)', textDecoration: 'none' }}
                >
                  @gusto_bahrain
                </a>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </PublicLayout>
  )
}

const sectionHeading: React.CSSProperties = {
  fontFamily: 'var(--font-italic)',
  fontStyle: 'italic',
  fontWeight: 500,
  fontSize: '1.375rem',
  color: 'var(--color-accent)',
  marginBottom: '1rem',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid rgba(199,93,44,0.2)',
}

const bodyText: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.7,
  color: 'var(--color-text)',
}

const definitionList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
}

const dlRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '160px 1fr',
  gap: '0.5rem',
  alignItems: 'baseline',
}

const dtStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
}

const ddStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--color-ink)',
  margin: 0,
}
