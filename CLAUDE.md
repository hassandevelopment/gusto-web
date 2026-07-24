# CLAUDE.md — Gusto Pizzeria Web (`gusto-web`)

## Repository scope: two surfaces, one repo

This repo hosts two distinct surfaces with different audiences, design rules, and constraints. Keep them clearly separated in code and in your head.

| Surface | Route(s) | Audience | Form factor | Backend? | Code-split? |
|---|---|---|---|---|---|
| **Customer Menu** | `/`, `/menu` | Diners scanning a QR code | Mobile-first | No (static `menu.json`) | Default chunk |
| **Kitchen Tool** | `/kitchen`, `/kitchen/login` | Restaurant staff | Tablet / desktop | Yes (Supabase auth + Realtime) | Lazy-loaded route |

**Kitchen code must NEVER appear in the customer's initial bundle.** All kitchen routes are imported via `React.lazy`. Verify with bundle analysis on every change that touches the route registry or imports `src/lib/supabase.ts`.

---

## Companion repo

This repo has a sibling: **`DEV-Gusto-App`** (Expo / React Native, customer mobile app). Both repos share the same Supabase project (`hhykbkdxsiclfjbrklyr`).

The mobile app owns:
- The Supabase schema (migrations live there, in `supabase/migrations/`, applied via the Supabase MCP per the project's migration-tracking ADR).
- The canonical order status vocabulary (see `DEV-Gusto-App/CLAUDE.md` §6).
- Customer-facing order placement — the kitchen tool in this repo is the staff-side receiver, not a duplicate placement surface.
- The Realtime channel-reuse guard pattern (see `DEV-Gusto-App/docs/decisions.md`) — applies to any Realtime subscription in either repo.

When schema, status, or Realtime questions arise: check `DEV-Gusto-App/CLAUDE.md` and `DEV-Gusto-App/docs/decisions.md` first. Do not invent or substitute.

---

## Payments — `/payment-complete` bounce page

`/payment-complete` ([src/pages/PaymentCompletePage.tsx](src/pages/PaymentCompletePage.tsx), prerendered via `src/prerender.tsx`) is the Tap Payments redirect bounce page. Tap's hosted payment page cannot redirect to a custom scheme, so it redirects here, and this page forwards the query string **verbatim** into `devgustoapp://payment-complete` so the app's in-app browser session closes and the app resumes.

Two rules bind any edit to this page:

- **Forward verbatim.** Pass `window.location.search` through unchanged. Do not parse, rename, allowlist, or drop params. Tap's param names are not all known in advance.
- **Never imply success.** Tap redirects here on failure too (declined cards, abandoned 3DS, cancellation). The page cannot know the outcome; only the app's server-side verify-payment call does. Copy must stay outcome-neutral.

Full contract (verbatim forwarding, the untrusted-params rule binding the app-side deep-link handler, outcome-neutral copy, and the accepted iOS dialog edge case) lives in `DEV-Gusto-App/docs/decisions.md` **ADR-043**. Read it before changing this page.

---

## Skills — When to read them

For **customer menu** work (any frontend change under `/`, `/menu`, or related components):

1. **UI/UX Pro Max** (structure & conversion) — `~/.claude/skills/ui-ux-pro-max/CLAUDE.md`
   Search: `python3 ~/.claude/skills/ui-ux-pro-max/src/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> --stack react`

2. **Taste Skill** (aesthetic refinement) — `~/.claude/skills/taste-skill.md`

When they conflict: trust UI/UX Pro Max for structure, Taste Skill for visual polish.

**No customer menu frontend code before both skills are read. No exceptions.**

For **kitchen tool** work: these skills are NOT required. The kitchen tool is an internal staff utility, not a brand surface. Follow the principles in "Kitchen Tool — Design principles" below.

---

## Project Summary

### Customer Menu (the original purpose of this repo)

A mobile-first digital menu for **Gusto Pizzeria Ristorante**, an Italian wood-fire pizzeria in Janabiyah, Bahrain. Customers scan a QR code at the table, browse the menu, build a list, and show the screen to the waiter. **No checkout, no payment, no order submission from this surface** — that's the mobile app's job.

The customer menu is intended to eventually replace **Orderlina** (the third-party menu service the restaurant currently pays yearly for).

### Kitchen Tool (added 2026-06)

A staff-facing live order board. Orders placed via the **Gusto mobile app** (`DEV-Gusto-App`) arrive in Supabase; the kitchen page subscribes via Realtime and displays them on a tablet in the kitchen. Staff tap status buttons (placed → preparing → ready → ...) which updates the order and triggers a push notification back to the customer's app.

The kitchen page does **not** replace the in-store POS (Omega / Olive). Staff re-key incoming orders into Omega so it prints to the Epson kitchen printer. The kitchen page is the live receipt board, not a POS.

---

## Customer Menu — Performance Budget (NON-NEGOTIABLE)

These pass/fail criteria apply to the **customer menu** surface only. The kitchen surface is exempt; see "Kitchen Tool — Performance" below.

- **First Contentful Paint:** < 1.0s on 4G
- **Largest Contentful Paint:** < 1.8s on 4G
- **Customer initial JS bundle (gzipped):** < 80 KB
- **Lighthouse Performance score:** ≥ 95 mobile
- **Customer initial page weight:** < 500 KB
- Food images: WebP/AVIF, lazy-loaded below the fold, explicit `width`/`height`
- No third-party analytics on initial load
- No render-blocking web fonts — `font-display: swap`, one self-hosted variable font max

**Kitchen code MUST be code-split out of the customer bundle.** `@supabase/supabase-js` alone is ~73KB gzipped — if it lands in the customer chunk, the budget is blown and the build is broken. Confirm with bundle analysis (`npm run build` + inspect `dist/assets/`) on every change that touches route registration or imports `src/lib/supabase.ts`.

If a customer-menu feature would push past these budgets, the feature loses.

---

## Kitchen Tool — Performance

- Audience: a single staff tablet in the kitchen, on the restaurant's wifi
- Targets (not pass/fail): kitchen route bundle < 200 KB gzipped, interactive within 2s on a mid-tier tablet
- The kitchen surface is not perf-critical the way the customer surface is — staff are captive users on a known device, not strangers on flaky mobile data

---

## Kitchen Tool — Auth, data, and Realtime

- **Auth:** Supabase email/password sign-in (`signInWithPassword`). Session persisted via supabase-js default (localStorage).
- **Staff gate:** `profiles.is_staff = true` enforced (a) client-side after sign-in, (b) server-side via Supabase RLS. Both layers; the RLS is the real security boundary.
- **Data the kitchen reads:** `orders`, `order_items`, `order_item_addons` — RLS allows staff to SELECT all rows.
- **Data the kitchen writes:** `orders.status` — RLS allows staff UPDATE on all rows.
- **Realtime:** Supabase Realtime subscription on `orders` table; status changes propagate to the customer's app via the same channel pattern.
- **Kitchen visibility filter (authoritative):** an online order is hidden from staff until it is paid. The filter `payment_method != 'online' OR payment_status = 'paid'` is enforced in BOTH the `KitchenPage` queries (`fetchOrders`, `fetchHistory`) AND the Realtime handlers (`isKitchenVisible` in `src/pages/KitchenPage.tsx`). RLS (migration 039) is only a backstop; the client query is the authority. A Realtime UPDATE for a row not in local state that passes the filter is treated as an insert (the card appears and the new-order chime fires, exactly as an INSERT); a row that stops passing is removed. Owned by `DEV-Gusto-App`: see migration `supabase/migrations/039_tap_payment_fields.sql` and `docs/decisions.md` ADR-046. A report-only "REFUND OWED" kitchen section (`payment_method='online' AND refund_owed=true`) is live. The former paid-and-cancelled second arm was retired in b98ae45 because it made rows permanently unclearable: a Mark-refunded row cleared `refund_owed` but still matched `payment_status='paid' AND status='cancelled'`, so it returned on every refetch. `refund_owed` is now the single source of truth, set on every cancel write path by migration 048's trigger (see `DEV-Gusto-App` ADR-049/ADR-050).
- **Channel-reuse guard pattern:** every Realtime effect MUST use the `getChannels`-and-reuse pattern (channelRef + reuse-if-exists at the topic), documented in `DEV-Gusto-App/docs/decisions.md`. Do not let CC freelance Realtime subscriptions — Fast Refresh / strict-mode remount will throw "cannot add postgres_changes callbacks after subscribe()" otherwise.

---

## Kitchen Tool — Design principles

The kitchen tool is a utility, not a brand surface. Different rules from the customer menu:

- **Reuse design tokens** from `src/index.css` (`@theme` variables — colors, fonts, shadows, radii). Visual consistency with the rest of the brand.
- **Density over warmth.** Staff scan many orders fast — pack information, minimize whitespace, no decorative motion.
- **No food photography** on the kitchen surface. Order cards are text-heavy.
- **Status changes are loud.** Color and shape both convey state — don't rely on color alone.
- **Touch-first but not mobile-first.** Tablet is the primary form factor. Buttons must be tappable but layouts can be wider than 360px.
- **No decorative animations.** Skeleton states yes; transitions only where they aid comprehension (e.g., a card moving between status columns).

---

## Tech Stack

Current (verify against `package.json`):

- **Framework:** Vite + React **19** + TypeScript
- **Styling:** Tailwind v4 (CSS-based `@theme` tokens in `src/index.css`, no `tailwind.config.js`)
- **Router:** `react-router-dom` v7
- **Icons:** `lucide-react`
- **State:** React Context + `localStorage` (customer cart). No Redux/Zustand needed.
- **Backend client (kitchen only):** `@supabase/supabase-js` v2
- **Deployment:** GitHub Pages via `.github/workflows/deploy.yml`, served at the custom domain `https://gusto.bh/` (live since 2026-07-13). The old `hassandevelopment.github.io/gusto-web/` URL 301-redirects to it. The custom domain is configured in repo Settings, Pages (Actions deploys ignore the `public/CNAME` file; it is kept as documentation and as a safety net for branch-based deploys).

**Do not use:** Next.js, Firebase, any SSR framework, any state management library beyond Context, any UI component library (Tailwind is enough), `gh-pages` npm package (the workflow handles deploys natively).

---

## Project Structure

```
/
├── .github/workflows/
│   └── deploy.yml              # GH Pages deploy on push to main
├── public/
│   ├── CNAME                   # "gusto.bh" (informational; Actions deploys use repo settings)
│   ├── images/                 # Food photos per category (customer)
│   ├── og-image.jpg
│   └── ...
├── src/
│   ├── components/
│   │   ├── ui/                 # Reusable primitives (Button, Card, IconButton, QuantityStepper)
│   │   ├── ProtectedRoute.tsx  # Kitchen auth gate (added Phase 2)
│   │   └── [customer menu components: Header, Hero, CategoryNav,
│   │        MenuSection, MenuItemCard, ItemDetailModal, CartDrawer,
│   │        SearchBar, RestaurantInfo, ErrorBoundary]
│   ├── contexts/
│   │   └── CartContext.tsx     # Customer cart — DO NOT import from kitchen code
│   ├── data/
│   │   └── menu.ts             # Imports menu.json, types it
│   ├── hooks/
│   │   └── useScrollSpy.ts
│   ├── lib/
│   │   └── supabase.ts         # Kitchen-only — never import from customer code
│   ├── pages/
│   │   ├── HomePage.tsx        # Customer home (route: /)
│   │   ├── KitchenLogin.tsx    # Kitchen sign-in (route: /kitchen/login)
│   │   └── KitchenPage.tsx     # Kitchen board (route: /kitchen, protected)
│   ├── types.ts
│   ├── App.tsx                 # Customer menu (route: /menu) — legacy single-file
│   ├── main.tsx                # Router setup; basename="/"
│   └── index.css               # Tailwind v4 entry + @theme tokens
├── menu.json                   # Source of truth for customer menu items
├── CLAUDE.md
├── package.json
├── vite.config.ts              # base: '/'
└── tsconfig*.json
```

---

## Customer Menu — Design System

Pulled from the restaurant's actual interior and current branding.

### Colors (from `src/index.css` `@theme`)

```css
--color-bg:          #FFFFFF
--color-bg-cream:    #F4EFE7   /* Warm cream — customer surface accent */
--color-card:        #FFFFFF
--color-text:        #685A5A   /* Warm brown-grey */
--color-text-muted:  #9A8E8E
--color-ink:         #2D2828   /* Near-black */
--color-accent:      #C75D2C   /* Terracotta — CTAs */
--color-accent-dark: #2D2828
--color-success:     #4A7C59
```

### Typography

- `--font-sans`: Manrope (variable) — body
- `--font-wordmark`: Jost — logo / wordmark
- `--font-italic`: Cormorant Garamond — italic accents
- Sizes (mobile-first): H1 `clamp(2.5rem, 8vw, 3.5rem)` bold; H2 `clamp(1.75rem, 5vw, 2.25rem)` bold; body `1rem`/1.5; small `0.875rem`

### Spacing & radii

- 4px base unit
- `--radius-card: 12px`
- `--radius-pill: 9999px`
- Minimum touch target: 44 × 44 px
- Shadows: `--shadow-card`, `--shadow-card-hover`, `--shadow-pill` (warm-tinted, layered)

---

## Customer Menu — Mobile-First Rules

- Layouts start at 360px viewport. Desktop is a courtesy, not a target.
- No hover-only interactions. Every hover state needs a tap equivalent.
- Sticky elements: header + category nav. Both collapse height on scroll-down.
- Bottom-of-viewport "View Cart" button when cart has items — thumb-reachable.
- Horizontal scroll for category nav: momentum + snap, not free-scroll.
- Test on real iPhone Safari and Android Chrome. iOS Safari has known CSS hazards (`100vh`, sticky behavior, image rendering).

---

## Customer Menu — Features

### Required

1. Hero / welcome with restaurant name and one good interior photo
2. Category navigation — sticky horizontal pills, active state, scroll-spy
3. Menu item grid/list per category
4. Item detail modal/sheet — qty stepper, optional notes, "Add to order"
5. Cart drawer — slide up from bottom; items, qty steppers, total, "Show waiter"
6. Search bar — filters across name & description
7. Persistent cart — `localStorage` key `gusto_cart`, 4-hour inactivity expiry
8. Restaurant info — hours, address, tap-to-call, Maps link, Instagram
9. VAT notice — "All prices include VAT" near the top

### Nice-to-have (still pending decision)

- Arabic / RTL support
- "Send order to WhatsApp" — probably moot now that the mobile app exists
- Dietary filter chips
- Allergen tags

### Explicitly out of scope on the customer menu surface

- User accounts → handled by the mobile app
- Payment / checkout → handled by the mobile app
- Order submission → handled by the mobile app
- Reviews / ratings
- Reservations

### Explicitly out of scope on the kitchen surface

- Replacing the in-store POS (Omega handles receipt printing)
- Customer-facing UI of any kind
- Menu editing (menu data lives in `menu.json`; staff don't edit from the kitchen)

---

## Customer Menu — Cart Behavior (precise)

- Cart state: `{ items: { [itemId]: { qty: number, notes?: string } }, updatedAt: number }`
- Persist to `localStorage` on every change, key = `gusto_cart`
- On load, restore if `updatedAt` is within the last 4 hours; otherwise discard
- Adding an item that already exists increments quantity by 1; doesn't reopen the modal
- Cart count badge shows total quantity (sum of qty), not unique item count
- Total = `sum(items[i].qty * menuPrice(items[i].id))`, formatted `BHD X.XX`
- If a cart contains an item whose `id` no longer exists in `menu.json`, drop it silently on load
- Empty drawer: "Your order is empty — tap any item to add it"

---

## Customer Menu — Accessibility

- All interactive elements keyboard-accessible
- Body text contrast ≥ 4.5:1
- `alt` text on every food image — name + brief description, not "pizza image"
- Modal/drawer focus trap; restore focus to trigger on close
- Quantity steppers: `<button>` with proper `aria-label`s ("Increase quantity of Margherita")
- Cart count badge: `aria-live="polite"`
- Respect `prefers-reduced-motion`

---

## Customer Menu — Image Strategy

- Source: Orderlina screenshots (have food photos baked in), Instagram (@gusto_bahrain) with permission, or a new shoot
- Format: WebP with JPG fallback only if needed
- Sizes: 600px wide for card thumbs, 1200px for detail view
- Compression target: ~50 KB per thumb, ~150 KB per detail
- Loading: `loading="lazy"` below first viewport, `fetchpriority="high"` only on hero
- Aspect ratio: square (1:1) for grid consistency
- Path: `/public/images/[category]/[item-id].webp`

---

## Customer Menu — Data Schema

`menu.json` is the single source of truth. Restaurant updates → edit file → redeploy.

```ts
type Currency = "BHD";

interface MenuItem {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  price: number | null;
  image: string;
  category: string;
  tags?: ("vegetarian" | "vegan" | "gluten-free" | "spicy" | "contains-nuts" | "seafood")[];
  available?: boolean;
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  order: number;
  icon?: string;
}

interface MenuData {
  _extractionIssues?: string[];
  restaurant: {
    name: string;
    address: string;
    phone: string;
    instagram: string;
    googleMapsUrl: string;
    hours: string;
    vatIncluded: true;
  };
  categories: Category[];
  items: MenuItem[];
}
```

Canonical category order (matches the live Orderlina menu):

1. Traditional Wood Oven Fire Pizza (`traditional-wood-oven-fire-pizza`)
2. Starters (`starters`)
3. Salad (`salad`)
4. Chef's Special (`chefs-special`)
5. Drinks (`drinks`)
6. Chef's Signature Pizza (`chefs-signature-pizza`)
7. Calzone (`calzone`)
8. Focaccia (`focaccia`)
9. Pasta & Co (`pasta-and-co`)
10. Side Order (`side-order`)
11. Main Course (`main-course`)
12. Desserts (`desserts`)
13. New Drinks (`new-drinks`)
14. Coffee & Tea (`coffee-and-tea`)

---

## Kitchen Tool — Data dependencies (read from companion repo)

Backend is the shared Supabase project (`hhykbkdxsiclfjbrklyr`). Schema is owned by `DEV-Gusto-App` migrations. Tables relevant to the kitchen surface:

- `profiles` — `is_staff` flag gates kitchen access
- `orders` — read all rows + update `status`
- `order_items` — read
- `order_item_addons` — read
- Address details on `orders` are denormalized at checkout (snapshot fields on the order row)

**Canonical order status vocabulary** (owned by `DEV-Gusto-App/CLAUDE.md` §6):

- Delivery orders: `placed → preparing → ready → out_for_delivery → completed`
- Pickup orders: `placed → preparing → ready → completed` (skips `out_for_delivery`)
- Plus `cancelled` (terminal, any time)

**Do NOT modify the Supabase schema from this repo.** Migrations live in `DEV-Gusto-App/supabase/migrations/` and are applied via the Supabase MCP per the migration-tracking ADR. If the kitchen needs a schema change, it goes in the companion repo's migration history.

---

## Restaurant Info

- **Name:** Gusto Pizzeria Ristorante
- **Address:** The Park, 571 Rd No 7113, Janabiyah, Bahrain
- **Phone:** +973 1769 5556
- **Hours:** Closes 11:30 PM (full weekly schedule TBD — confirm with owner)
- **Price range:** BHD 5–10 per person
- **Instagram:** @gusto_bahrain
- **Talabat:** https://www.talabat.com/bahrain/gusto

---

## Build & Deploy

```bash
npm install
npm run dev          # http://localhost:5173/
npm run typecheck
npm run build        # tsc + vite build + SSR prerender + copy index.html → 404.html
npm run preview      # http://localhost:4173/
```

Deploy: automatic via `.github/workflows/deploy.yml` on push to `main`. GitHub Pages serves at `https://gusto.bh/` (custom domain, live since 2026-07-13); the old `hassandevelopment.github.io/gusto-web/` URL 301-redirects there.

Custom domain notes: `base` in `vite.config.ts` and `basename` in `main.tsx` are both `/` and must stay in sync. The domain itself is set in repo Settings, Pages; `public/CNAME` is informational for Actions-based deploys. Absolute URLs (canonical, `og:url`, `og:image`) in `index.html` point at `https://gusto.bh/`.

---

## Cross-repo workflow rules

- **Source-of-truth docs are binding.** Follow the documented task sequence (e.g., the gusto-app roadmap, `decisions.md`) — do not reorder, skip ahead, or substitute a different plan without flagging the deviation and getting approval.
- **Never invent.** Specs, values, status models, UI layouts — verify against the docs first. If the answer isn't there, stop and ask.
- **Strict diff-review workflow.** No auto-accept-all on CC diffs. Paste every diff as plain text in a fenced block; vscode-webview links don't reach the human reviewer.
- **Trunk-based.** Commit directly to `main`. No feature branches.
- **Conventional commits.** `feat`, `fix`, `chore`, `docs`, `refactor`, etc. Scope where meaningful (`feat(kitchen): ...`).
- **Plan first.** For any non-trivial change: propose the plan (file list, change summary) and wait for approval before writing code.

---

## Open Decisions (as of 2026-06-07)

### Customer menu

- Arabic / RTL support — pending
- WhatsApp order button — likely moot (mobile app covers this)
- Photo source — Instagram crop vs new shoot
- Full weekly hours — confirm with owner
- Menu variants (pizza sizes etc.) — current data has none; if added, schema needs `variants: { name, priceModifier }[]`

### Kitchen tool

- Customer name/phone display on the kitchen card: staff-read `profiles` (simpler RLS expansion) vs. denormalize name+phone onto `orders` at checkout (cleaner privacy boundary). DEFERRED to Phase 3 card design.
- ~~Custom domain timing~~ RESOLVED 2026-07-13: `gusto.bh` is live on GitHub Pages.
- Migration off Lina: the restaurant pays Orderlina yearly. The domain (`gusto.bh`) is now live; once the mobile app + this kitchen tool are live and the customer menu is feature-complete enough to replace Lina, reprint QR codes to point at `gusto.bh` and cancel the Lina subscription. Not yet scheduled.

### Cross-cutting

- Tap Payments merchant-account paperwork — start during `DEV-Gusto-App` Tasks 14–16 so approval lands before Task 17 (online payments).

---

## "Done" definition

### Customer menu

- Lighthouse mobile: Performance ≥95, Accessibility ≥95, Best Practices ≥95, SEO ≥95
- All menu sections populated with real data, `_extractionIssues` empty
- Tested on real iPhone Safari + Android Chrome
- Cart flow works end-to-end including persistence and 4-hour expiry
- Restaurant info, tap-to-call, directions, Instagram links all work
- Deployed to a stable URL with HTTPS

### Kitchen tool (v1)

- Staff can sign in at `/kitchen/login` using a `profiles.is_staff = true` account
- `/kitchen` displays incoming orders in real time (Realtime subscription)
- Staff can advance status through the canonical lifecycle, and the customer app receives a push notification on every status change
- Audible chime on new order arrival (browser autoplay constraints respected)
- Sign-out works; the protected route bounces unauthenticated users to login
- Deployed at the same URL as the customer menu (different route)