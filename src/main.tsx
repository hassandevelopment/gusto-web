import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

import HomePage from './pages/HomePage'

// Kitchen routes — lazy so supabase-js never lands in the customer bundle.
// Verify on every build: supabase chunk must NOT appear in the customer
// initial load. Run `npm run build` and inspect dist/assets/ to confirm.
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'))
const KitchenPage = lazy(() => import('./pages/KitchenPage'))
const KitchenLogin = lazy(() => import('./pages/KitchenLogin'))

// Public compliance pages — lazy-loaded to keep the initial bundle small.
const PublicMenuPage = lazy(() => import('./pages/PublicMenuPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const RefundPage = lazy(() => import('./pages/RefundPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const DeleteAccountPage = lazy(() => import('./pages/DeleteAccountPage'))

/**
 * Router setup:
 *   /                → HomePage
 *   /menu            → PublicMenuPage (display-only menu for Tap Payments compliance)
 *   /about           → AboutPage
 *   /terms           → TermsPage
 *   /refund          → RefundPage
 *   /privacy         → PrivacyPage
 *   /delete-account  → DeleteAccountPage
 *   /kitchen         → KitchenPage, gated by ProtectedRoute
 *   /kitchen/login   → KitchenLogin
 *
 * basename="/gusto-web" matches vite.config.ts `base: '/gusto-web/'`.
 * If we move to a custom domain (e.g. gusto.bh) later, change both to "/".
 *
 * Note for GitHub Pages SPA: the build script copies dist/index.html to
 * dist/404.html so GitHub serves the SPA shell at any path.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename="/gusto-web">
        <Suspense fallback={<div style={{ padding: '2rem', fontFamily: 'var(--font-sans)' }}>Loading…</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<PublicMenuPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/refund" element={<RefundPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/delete-account" element={<DeleteAccountPage />} />
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute>
                  <KitchenPage />
                </ProtectedRoute>
              }
            />
            <Route path="/kitchen/login" element={<KitchenLogin />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
