import PublicLayout from '../components/PublicLayout'

const LAST_UPDATED = 'June 2026'

export default function TermsPage() {
  return (
    <PublicLayout>
      <article style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem 4rem', fontFamily: 'var(--font-archivo)' }}>
        <h1 style={h1}>Terms &amp; Conditions</h1>
        <p style={meta}>Last updated: {LAST_UPDATED}</p>

        <p style={body}>
          These Terms and Conditions ("Terms") govern your use of the IL Gusto mobile application
          and website (collectively, the "Service") operated by IL Gusto W.L.L.
          ("IL Gusto", "we", "us", or "our"). By accessing or using the Service, you agree to be
          bound by these Terms.
        </p>

        <Section title="1. Service Description">
          <p style={body}>
            IL Gusto operates a mobile application that allows customers to browse the menu,
            place food orders, and arrange delivery or pickup from IL Gusto Pizzeria &amp; Restaurant
            located in Shop 21, Building 385, Road 7113, Block 571, Al Janabiyah,
            Kingdom of Bahrain. The Service facilitates the ordering process; food preparation and delivery
            are carried out by IL Gusto W.L.L.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p style={body}>
            The Service is open to all customers. By accessing or using the Service, you agree
            to be bound by these Terms.
          </p>
        </Section>

        <Section title="3. Account Responsibilities">
          <p style={body}>
            To place orders, you will be required to create an account. You are responsible for:
          </p>
          <ul style={list}>
            <li>Providing accurate, complete, and current registration information.</li>
            <li>Maintaining the confidentiality of your account credentials.</li>
            <li>All activity that occurs under your account.</li>
            <li>
              Notifying us immediately at gustobahrain@gmail.com if
              you suspect unauthorised use of your account.
            </li>
          </ul>
        </Section>

        <Section title="4. Ordering">
          <p style={body}>
            By placing an order through the Service, you represent that:
          </p>
          <ul style={list}>
            <li>All prices displayed are in Bahraini Dinar (BHD) and include VAT where applicable.</li>
            <li>
              A minimum order value of BD 3.000 applies to delivery orders.
            </li>
            <li>
              Orders are subject to item availability. If an item becomes unavailable after your order
              is placed, we will contact you to offer a substitute or a refund for that item.
            </li>
            <li>
              IL Gusto reserves the right to refuse or cancel any order at our discretion, including
              in cases of suspected fraud or errors in pricing.
            </li>
          </ul>
        </Section>

        <Section title="5. Payment">
          <p style={body}>
            We currently accept the following payment methods:
          </p>
          <ul style={list}>
            <li>Cash on delivery</li>
            <li>Card on delivery</li>
          </ul>
          <p style={{ ...body, marginTop: '0.75rem' }}>
            In-app card payments powered by Tap Payments will be introduced in a future update.
            When available, online payments will be processed by Tap Payments (Tap Payments Co.),
            a PCI DSS compliant payment provider. IL Gusto does not store or have access to your
            card details.
          </p>
        </Section>

        <Section title="6. Delivery">
          <ul style={list}>
            <li>
              Delivery is available across Bahrain.
            </li>
            <li>
              Estimated delivery time is approximately 30–45 minutes,
              subject to order volume and traffic conditions.
            </li>
            <li>Delivery is currently offered free of charge.</li>
            <li>
              IL Gusto is not liable for delays caused by circumstances beyond our reasonable control,
              including but not limited to severe weather, road closures, or third-party service
              disruptions.
            </li>
            <li>
              You are responsible for providing an accurate delivery address. IL Gusto is not
              responsible for failed deliveries due to incorrect address information.
            </li>
          </ul>
        </Section>

        <Section title="7. Cancellation">
          <p style={body}>
            Orders may be cancelled only before preparation has begun. Once the kitchen has started
            preparing your order, cancellation is no longer possible. To request a cancellation,
            contact us immediately at +973 1769 5556 or
            through the app. Approved cancellations will be refunded in accordance with our
            Refund Policy.
          </p>
        </Section>

        <Section title="8. Loyalty Programme">
          <p style={body}>
            IL Gusto operates a loyalty programme through the mobile application. Points are
            earned on eligible orders and may be redeemed for menu items in accordance with
            the programme terms displayed in the app. IL Gusto reserves the right to:
          </p>
          <ul style={list}>
            <li>Modify point earn rates, redemption values, and eligible items at any time.</li>
            <li>Suspend or terminate individual accounts found to be abusing the programme.</li>
            <li>Discontinue or alter the loyalty programme with reasonable notice.</li>
          </ul>
          <p style={{ ...body, marginTop: '0.75rem' }}>
            Points have no cash value and are non-transferable.
          </p>
        </Section>

        <Section title="9. Intellectual Property">
          <p style={body}>
            All content on the Service — including but not limited to text, graphics, logos,
            images, and software — is the property of IL Gusto W.L.L. or its content suppliers
            and is protected by applicable intellectual property laws. You may not reproduce,
            distribute, or create derivative works without our express written permission.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p style={body}>
            To the fullest extent permitted by applicable law, IL Gusto W.L.L. shall not be
            liable for any indirect, incidental, special, or consequential damages arising from
            your use of or inability to use the Service. Our total liability to you for any
            claim arising from these Terms shall not exceed the value of the order giving rise
            to the claim.
          </p>
          <p style={{ ...body, marginTop: '0.75rem' }}>
            Nothing in these Terms limits or excludes our liability for death or personal injury
            caused by our negligence, fraud, or any other liability that cannot be excluded by law.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p style={body}>
            These Terms are governed by and construed in accordance with the laws of the
            Kingdom of Bahrain. Any disputes arising under these Terms shall be subject to the
            exclusive jurisdiction of the courts of the Kingdom of Bahrain.
          </p>
        </Section>

        <Section title="12. Contact">
          <p style={body}>
            For questions, complaints, or disputes regarding these Terms, please contact us at:
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
  fontSize: '16px',
  lineHeight: 1.75,
  color: 'var(--color-warm-body)',
}

const list: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: 1.75,
  color: 'var(--color-warm-body)',
  paddingLeft: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  marginTop: '0.5rem',
}
