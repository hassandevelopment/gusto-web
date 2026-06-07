import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

import HomePage from './pages/HomePage'
import App from './App.tsx'

// Kitchen routes — lazy so supabase-js never lands in the customer bundle.
// Verify on every build: supabase chunk must NOT appear in the customer
// initial load. Run `npm run build` and inspect dist/assets/ to confirm.
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'))
const KitchenPage = lazy(() => import('./pages/KitchenPage'))
const KitchenLogin = lazy(() => import('./pages/KitchenLogin'))

/**
 * Router setup:
 *   /               → HomePage
 *   /menu           → App (customer menu), wrapped in CartProvider
 *   /kitchen        → KitchenPage, gated by ProtectedRoute
 *   /kitchen/login  → KitchenLogin
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
            <Route
              path="/menu"
              element={
                <CartProvider>
                  <App />
                </CartProvider>
              }
            />
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
