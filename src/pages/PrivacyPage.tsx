import PublicLayout from '../components/PublicLayout'

const LAST_UPDATED = 'June 2026'

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <article style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem 4rem', fontFamily: 'var(--font-archivo)' }}>
        <h1 style={h1}>Privacy Policy</h1>
        <p style={meta}>Last updated: {LAST_UPDATED}</p>

        <p style={body}>
          IL Gusto W.L.L. ("IL Gusto", "we", "us", or "our") is committed to protecting your
          personal data. This Privacy Policy explains how we collect, use, share, and safeguard
          information about you when you use the IL Gusto mobile application and website
          (the "Service"). It is written in compliance with the Kingdom of Bahrain's Personal
          Data Protection Law (PDPL).
        </p>

        <Section title="1. Data We Collect">
          <p style={body}>We collect the following categories of personal data:</p>
          <ul style={list}>
            <li><strong>Identity data:</strong> Full name.</li>
            <li><strong>Contact data:</strong> Phone number, email address.</li>
            <li><strong>Location data:</strong> Delivery addresses you provide when placing orders.</li>
            <li>
              <strong>Transaction data:</strong> Order history, items ordered, order values,
              payment method (cash/card), and order status.
            </li>
            <li>
              <strong>Device data:</strong> Push notification tokens to enable order status
              notifications on your device.
            </li>
            <li>
              <strong>Loyalty data:</strong> Points balance, point transactions, and redemption history.
            </li>
          </ul>
          <p style={{ ...body, marginTop: '0.75rem' }}>
            We do <strong>not</strong> collect payment card numbers. Card transactions are handled
            directly by Tap Payments, a PCI DSS compliant payment processor.
          </p>
        </Section>

        <Section title="2. How We Use Your Data">
          <p style={body}>We use your personal data for the following purposes:</p>
          <ul style={list}>
            <li>To process and fulfil your food orders.</li>
            <li>To arrange delivery to your specified address.</li>
            <li>To send you real-time order status notifications (via push notification).</li>
            <li>To operate and administer the loyalty programme.</li>
            <li>To respond to customer service enquiries and complaints.</li>
            <li>To comply with legal and regulatory obligations in the Kingdom of Bahrain.</li>
          </ul>
        </Section>

        <Section title="3. Payment Data">
          <p style={body}>
            In-app card payments are processed by <strong>Tap Payments Co.</strong>, a PCI DSS
            compliant payment service provider. When you make a card payment, your card details
            are entered directly on Tap Payments' secure platform. IL Gusto does not receive,
            store, or process your card number, CVV, or expiry date.
          </p>
          <p style={{ ...body, marginTop: '0.75rem' }}>
            For more information on how Tap Payments handles your data, please refer to the
            Tap Payments Privacy Policy available on their website.
          </p>
        </Section>

        <Section title="4. Data Sharing">
          <p style={body}>
            We share your personal data only where necessary and with the following parties:
          </p>
          <ul style={list}>
            <li>
              <strong>Tap Payments:</strong> For processing card payments (when in-app payments
              are enabled).
            </li>
            <li>
              <strong>Delivery personnel:</strong> Your name, phone number, and delivery address
              are shared with our delivery staff solely to fulfil your order.
            </li>
          </ul>
          <p style={{ ...body, marginTop: '0.75rem' }}>
            We do <strong>not</strong> sell, rent, or trade your personal data to third parties
            for marketing purposes.
          </p>
        </Section>

        <Section title="5. Data Retention">
          <p style={body}>
            We retain your account information for as long as your account is active. If you
            delete your account, we retain order history for 3 years for legal and accounting
            purposes, after which it is permanently deleted.
          </p>
          <p style={{ ...body, marginTop: '0.75rem' }}>
            Push notification tokens are deleted when you uninstall the app or revoke
            notification permissions.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <p style={body}>
            Under the Kingdom of Bahrain's PDPL, you have the right to:
          </p>
          <ul style={list}>
            <li><strong>Access</strong> the personal data we hold about you.</li>
            <li><strong>Correct</strong> inaccurate or incomplete personal data.</li>
            <li>
              <strong>Delete</strong> your personal data, subject to our legal retention
              obligations.
            </li>
            <li>
              <strong>Object</strong> to processing of your data in certain circumstances.
            </li>
          </ul>
          <p style={{ ...body, marginTop: '0.75rem' }}>
            To exercise any of these rights, contact us at:{' '}
            gustobahrain@gmail.com. We will respond
            within 15 business days.
          </p>
        </Section>

        <Section title="7. Security">
          <p style={body}>
            We implement appropriate technical and organisational measures to protect your
            personal data:
          </p>
          <ul style={list}>
            <li>All data is transmitted over HTTPS / TLS encrypted connections.</li>
            <li>
              Your data is stored in Supabase, a cloud infrastructure provider that maintains
              SOC 2 Type II compliance.
            </li>
            <li>
              Access to personal data is restricted to authorised IL Gusto staff on a
              need-to-know basis.
            </li>
          </ul>
          <p style={{ ...body, marginTop: '0.75rem' }}>
            No transmission over the internet is 100% secure. While we use commercially reasonable
            measures, we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="8. Cookies and Tracking">
          <p style={body}>
            The IL Gusto mobile application does not use third-party advertising trackers or
            behavioural analytics cookies. The website uses only essential session cookies required
            for the Service to function. We do not engage in cross-site tracking or sell browsing
            data to advertisers.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p style={body}>
            The Service is not directed to children under the age of 13. We do not knowingly
            collect personal data from children under 13. If you believe a child has provided
            us with personal data, please contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p style={body}>
            We may update this Privacy Policy from time to time. When we do, we will update the
            "Last updated" date at the top of this page and, where appropriate, notify you via
            the app. Your continued use of the Service after changes are posted constitutes your
            acceptance of the updated policy.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p style={body}>
            This Privacy Policy is governed by the laws of the Kingdom of Bahrain, including
            the Personal Data Protection Law (PDPL) promulgated by Legislative Decree No. 30
            of 2018.
          </p>
        </Section>

        <Section title="12. Contact — Data Protection Enquiries">
          <p style={body}>
            For privacy-related enquiries, to exercise your data rights, or to raise a concern,
            please contact us:
          </p>
          <address style={{ ...body, fontStyle: 'normal', marginTop: '0.75rem' }}>
            IL Gusto W.L.L. — Data Protection<br />
            Shop 21, Building 385, Road 7113, Block 571<br />
            Al Janabiyah, Kingdom of Bahrain<br />
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
        color: 'var(--color-warm-ink)',
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
  color: 'var(--color-warm-ink)',
  lineHeight: 1.1,
  marginBottom: '0.5rem',
}

const meta: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--color-warm-muted)',
  marginBottom: '2rem',
}

const body: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.7,
  color: 'var(--color-warm-body)',
}

const list: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.7,
  color: 'var(--color-warm-body)',
  paddingLeft: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  marginTop: '0.5rem',
}
