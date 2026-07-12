/**
 * SSR entry for build-time pre-rendering of static legal pages.
 *
 * Some crawlers (e.g. Google Play Console) do not execute JavaScript, so the
 * SPA fallback (dist/404.html) returns HTTP 404 to them. This entry renders the
 * real page components to static HTML at build time; scripts/prerender.mjs then
 * writes them to dist/<route>/index.html so GitHub Pages serves a true HTTP 200
 * with the content already in the markup. The same client bundle still boots and
 * takes over, so the interactive SPA version is identical to the pre-rendered one.
 *
 * Scope: only the routes listed below. Keep this list in sync intentionally.
 */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import PrivacyPage from './pages/PrivacyPage'
import DeleteAccountPage from './pages/DeleteAccountPage'

const PAGES: Record<string, React.FC> = {
  '/privacy': PrivacyPage,
  '/delete-account': DeleteAccountPage,
}

export const routes = Object.keys(PAGES)

export function render(route: string): string {
  const Page = PAGES[route]
  if (!Page) throw new Error(`prerender: no page registered for route ${route}`)
  return renderToString(
    <StaticRouter location={route} basename="/">
      <Page />
    </StaticRouter>,
  )
}
