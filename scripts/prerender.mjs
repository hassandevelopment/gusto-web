/**
 * Post-build: inject SSR-rendered markup into the built shell so the pre-rendered
 * legal routes are served as real static HTML with HTTP 200 (see src/prerender.tsx).
 *
 * Runs after `vite build` (client) and `vite build --ssr src/prerender.tsx`.
 * Reads the built dist/index.html, injects each route's markup into #root, and
 * writes dist/<route>/index.html. The <head> (fonts, hashed CSS, module script)
 * is reused verbatim, so the pre-rendered page is visually identical to the SPA
 * and the client bundle still boots and hydrates over it.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { render, routes } from '../dist-ssr/prerender.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const templatePath = resolve(root, 'dist/index.html')
const template = readFileSync(templatePath, 'utf-8')

const ROOT_PLACEHOLDER = '<div id="root"></div>'
if (!template.includes(ROOT_PLACEHOLDER)) {
  throw new Error(`prerender: could not find "${ROOT_PLACEHOLDER}" in ${templatePath}`)
}

for (const route of routes) {
  const appHtml = render(route)
  const html = template.replace(ROOT_PLACEHOLDER, `<div id="root">${appHtml}</div>`)
  const outDir = resolve(root, `dist${route}`)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'index.html'), html)
  console.log(`prerendered dist${route}/index.html (${appHtml.length} bytes of markup)`)
}
