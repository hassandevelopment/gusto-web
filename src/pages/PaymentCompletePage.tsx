import { useEffect } from 'react'
import PublicLayout from '../components/PublicLayout'

/**
 * Tap Payments redirect bounce page (route: /payment-complete).
 *
 * Tap's hosted payment page cannot redirect to a custom scheme, so its
 * `redirect.url` is set to https://gusto.bh/payment-complete (see the companion
 * repo's supabase/functions/create-payment/index.ts). This page catches that
 * redirect and forwards the query string, verbatim, into the app's deep link so
 * the app's in-app browser session (expo-web-browser openAuthSessionAsync)
 * closes and the app resumes.
 *
 * OUTCOME-NEUTRAL BY DESIGN. Tap redirects here on failure too (declined cards,
 * abandoned 3DS, cancellations), so this page CANNOT know whether the payment
 * succeeded. Nothing here may state or imply success. Only the app, after its
 * verify-payment call (a server-side re-fetch from Tap), knows the real result.
 *
 * SECURITY CONTRACT for the app-side handler: this is a public URL, so every
 * forwarded param is UNTRUSTED. The charge id is a lookup key only, never proof
 * of payment. The app must pass it to verify-payment and trust only that.
 */

// The app's custom scheme + path the app listens on (app.json scheme: "devgustoapp").
const DEEP_LINK_BASE = 'devgustoapp://payment-complete'

// Canonical store links. iOS App Store id and Android package are from the
// companion repo (eas.json ascAppId, app.json android.package). They go public
// before this flow reaches any real customer.
const APP_STORE_URL = 'https://apps.apple.com/app/id6780534228'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.ilgusto.app'

export default function PaymentCompletePage() {
  useEffect(() => {
    // Client-only: prerender/SSR has no `window`, so all of this lives in the effect.
    document.title = 'Return to the Gusto app'

    const search = window.location.search // verbatim; cannot lose info we haven't seen Tap send
    const deepLink = `${DEEP_LINK_BASE}${search}`
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    // Only auto-fire on mobile. On desktop devgustoapp:// can never resolve, so
    // there is nothing to wait on and we show the message directly (no spinner).
    //
    // In the real flow the app opens this page inside its own openAuthSessionAsync
    // browser, where the app is installed and the session intercepts this scheme
    // (no Safari dialog) then closes and hands the params back. The iOS Safari
    // "address is invalid" dialog is only reachable by opening this URL manually
    // on a device without the app installed, which is outside the payment flow;
    // there is no web API to detect app installation, so we accept that edge case.
    // The store links below are the recovery path for it.
    if (isMobile) {
      window.location.replace(deepLink)
    }
  }, [])

  // The deep link for the manual button. Read at render on the client; during
  // prerender `window` is absent, so fall back to the bare base (the static
  // markup is a crawler/first-paint placeholder that the client bundle replaces).
  const manualDeepLink =
    typeof window === 'undefined' ? DEEP_LINK_BASE : `${DEEP_LINK_BASE}${window.location.search}`

  return (
    <PublicLayout>
      <article style={wrap}>
        <h1 style={h1}>Taking you back to the Gusto app</h1>
        <p style={body}>
          You can return to the Gusto app now. It will show your order and its payment
          status. If the app did not reopen on its own, tap the button below.
        </p>

        <a href={manualDeepLink} style={primaryButton}>
          Open the Gusto app
        </a>

        <p style={{ ...body, marginTop: '2.5rem' }}>
          Do not have the app yet? Get it on the{' '}
          <a href={APP_STORE_URL} style={link} target="_blank" rel="noopener noreferrer">
            App Store
          </a>{' '}
          or{' '}
          <a href={PLAY_STORE_URL} style={link} target="_blank" rel="noopener noreferrer">
            Google Play
          </a>
          .
        </p>
      </article>
    </PublicLayout>
  )
}

const wrap: React.CSSProperties = {
  maxWidth: '520px',
  margin: '0 auto',
  padding: '4rem 1.5rem 5rem',
  fontFamily: 'var(--font-archivo)',
  textAlign: 'center',
}

const h1: React.CSSProperties = {
  fontFamily: 'var(--font-italic)',
  fontStyle: 'italic',
  fontWeight: 500,
  fontSize: 'clamp(1.85rem, 5vw, 2.5rem)',
  color: 'var(--color-warm-ink)',
  lineHeight: 1.15,
  marginBottom: '1rem',
}

const body: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: 1.75,
  color: 'var(--color-warm-body)',
}

const primaryButton: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '2rem',
  padding: '0.85rem 1.75rem',
  borderRadius: '9999px',
  backgroundColor: 'var(--color-warm-accent)',
  color: '#FFFFFF',
  fontSize: '15px',
  fontWeight: 700,
  letterSpacing: '0.02em',
  textDecoration: 'none',
  boxShadow: '0 10px 26px -10px rgba(178,74,36,0.7)',
}

const link: React.CSSProperties = {
  color: 'var(--color-warm-accent)',
  textDecoration: 'underline',
}
