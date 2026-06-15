import PublicLayout from '../components/PublicLayout'

const LAST_UPDATED = 'June 2026'

export default function RefundPage() {
  return (
    <PublicLayout>
      <article style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>
        <h1 style={h1}>Refund Policy</h1>
        <p style={meta}>Last updated: {LAST_UPDATED}</p>

        <p style={body}>
          IL Gusto W.L.L. is committed to customer satisfaction. This Refund Policy explains
          when and how refunds are issued for orders placed through the IL Gusto mobile application.
        </p>

        <Section title="When Refunds Apply">
          <p style={body}>You are eligible for a full or partial refund in the following situations:</p>
          <ul style={list}>
            <li>
              <strong>Wrong items delivered:</strong> You received items that differ from what you ordered.
            </li>
            <li>
              <strong>Missing items:</strong> One or more items from your order were not included in the delivery.
            </li>
            <li>
              <strong>Food safety concern:</strong> The food arrived in a condition that raises a genuine
              food safety concern (e.g., contaminated, foreign objects).
            </li>
            <li>
              <strong>Order not delivered:</strong> Your order was confirmed but never arrived and could
              not be traced.
            </li>
          </ul>
        </Section>

        <Section title="When Refunds Do Not Apply">
          <p style={body}>Refunds will <strong>not</strong> be issued in the following circumstances:</p>
          <ul style={list}>
            <li>
              Change of mind after the order has entered preparation.
            </li>
            <li>
              Delivery delays that fall within a reasonable window (within 15 minutes of the
              estimated delivery time), except where the delay caused the food to be unfit
              for consumption.
            </li>
            <li>
              Items that were correctly prepared according to your order instructions but you later
              decided you did not want.
            </li>
            <li>
              Flavour preferences or personal taste — our menu descriptions accurately represent
              the dish.
            </li>
            <li>
              Orders where you provided an incorrect delivery address.
            </li>
          </ul>
        </Section>

        <Section title="How to Request a Refund">
          <p style={body}>
            To request a refund, contact IL Gusto within{' '}
            24 hours of your delivery or scheduled pickup time. Please have the following ready:
          </p>
          <ul style={list}>
            <li>Your order number (visible in the app under Order History).</li>
            <li>A description of the issue.</li>
            <li>Photos where relevant (e.g., wrong item, damaged packaging).</li>
          </ul>
          <address style={{ ...body, fontStyle: 'normal', marginTop: '1rem' }}>
            Phone: +973 1769 5556<br />
            Email: gustobahrain@gmail.com
          </address>
        </Section>

        <Section title="Refund Method">
          <p style={body}>
            Approved refunds will be issued using the same payment method used for the original order:
          </p>
          <ul style={list}>
            <li>
              <strong>Cash orders:</strong> Refunds are issued in cash, either at the time of the
              next delivery or by arrangement with the restaurant.
            </li>
            <li>
              <strong>Card orders (on delivery):</strong> Refunds will be processed back to the
              card used at the time of delivery.
            </li>
            <li>
              <strong>In-app card payments</strong> (when available): Refunds are returned to the
              original payment card via Tap Payments within 5–7 business days.
              The exact timing depends on your card issuer.
            </li>
          </ul>
        </Section>

        <Section title="Partial Refunds">
          <p style={body}>
            Where only part of an order is affected (e.g., a single missing item), a partial
            refund corresponding to the value of that item will be issued rather than a full
            order refund.
          </p>
        </Section>

        <Section title="Contact">
          <p style={body}>
            For any questions about this Refund Policy, please contact us:
          </p>
          <address style={{ ...body, fontStyle: 'normal', marginTop: '0.75rem' }}>
            IL Gusto W.L.L.<br />
            Shop 21, Building 385, Road 7113, Block 571<br />
            Al Janabiyah, Kingdom of Bahrain<br />
            Phone: +973 1769 5556<br />
            Email: gustobahrain@gmail.com
          </address>
        </Section>
      </article>
    </PublicLayout>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{
        fontFamily: 'var(--font-italic)',
        fontStyle: 'italic',
        fontWeight: 500,
        fontSize: '1.25rem',
        color: 'var(--color-ink)',
        marginBottom: '0.75rem',
        marginTop: '2rem',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

const h1: React.CSSProperties = {
  fontFamily: 'var(--font-italic)',
  fontStyle: 'italic',
  fontWeight: 500,
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  color: 'var(--color-ink)',
  lineHeight: 1.1,
  marginBottom: '0.5rem',
}

const meta: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--color-text-muted)',
  marginBottom: '2rem',
}

const body: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.7,
  color: 'var(--color-text)',
}

const list: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.7,
  color: 'var(--color-text)',
  paddingLeft: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  marginTop: '0.5rem',
}
