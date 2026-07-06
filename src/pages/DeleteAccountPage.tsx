import PublicLayout from '../components/PublicLayout'

const LAST_UPDATED = 'July 2026'

export default function DeleteAccountPage() {
  return (
    <PublicLayout>
      <article style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>
        <h1 style={h1}>Account Deletion</h1>
        <p style={meta}>Last updated: {LAST_UPDATED}</p>

        <p style={body}>
          You can permanently delete your Gusto Pizzeria account and associated data at any
          time. This page explains what happens when you delete your account, how to do it,
          and what data we retain.
        </p>

        <Section title="How to delete your account">
          <p style={body}>You have two options:</p>

          <p style={{ ...body, marginTop: '0.75rem' }}>
            <strong>Option 1: In the app (fastest).</strong>{' '}
            Open the Gusto Pizzeria app, sign in, go to Profile, and tap "Delete account."
            Confirm by typing DELETE when prompted. Your account and associated data are
            deleted immediately.
          </p>

          <p style={{ ...body, marginTop: '0.75rem' }}>
            <strong>Option 2: By email.</strong>{' '}
            Send an email to gustobahrain@gmail.com with the subject line "Account Deletion
            Request." Include the email address or phone number associated with your account.
            We will process the request within 15 business days and confirm by reply.
          </p>
        </Section>

        <Section title="What we delete">
          <p style={body}>When you delete your account, we permanently remove:</p>
          <ul style={list}>
            <li>Your name, email address, and phone number</li>
            <li>All saved delivery addresses</li>
            <li>Your loyalty points balance and redemption history</li>
            <li>Push notification tokens</li>
          </ul>
        </Section>

        <Section title="What we retain">
          <p style={body}>
            We retain the following for 3 years for legal and accounting purposes, as
            described in our Privacy Policy:
          </p>
          <ul style={list}>
            <li>Order records (order number, items, total, date, status)</li>
          </ul>
          <p style={{ ...body, marginTop: '0.75rem' }}>
            Your name, phone number, and delivery address are removed from these records.
            Only the order data itself is retained in anonymized form.
          </p>
          <p style={{ ...body, marginTop: '0.75rem' }}>
            After 3 years, order records are permanently deleted.
          </p>
        </Section>

        <Section title="Active orders">
          <p style={body}>
            If you have an active order (placed but not yet completed), you cannot delete your
            account until the order completes or is cancelled. This protects both you and our
            kitchen from mid-order disruptions.
          </p>
        </Section>

        <Section title="Contact">
          <p style={body}>For questions about account deletion, contact us:</p>
          <address style={{ ...body, fontStyle: 'normal', marginTop: '0.75rem' }}>
            IL Gusto W.L.L.<br />
            Email: gustobahrain@gmail.com<br />
            Phone: +973 1769 5556
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
