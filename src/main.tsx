import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

import HomePage from './pages/HomePage'
import App from './App.tsx'

/**
 * Router setup:
 *   /        → HomePage (no cart context — homepage doesn't add items)
 *   /menu    → existing App component (the menu site), wrapped in CartProvider
 *
 * basename="/gusto-web" matches vite.config.ts `base: '/gusto-web/'`.
 * If we move to a custom domain (e.g. gusto.bh) later, change both to "/".
 *
 * Note for GitHub Pages SPA: when a user lands directly on /gusto-web/menu
 * (or refreshes there), GitHub returns 404 because there's no menu/index.html.
 * Fix: the `build` script copies dist/index.html to dist/404.html so GitHub
 * serves the SPA shell at any path.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename="/gusto-web">
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
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
