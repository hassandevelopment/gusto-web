# CLAUDE.md — Gusto Pizzeria Ristorante Menu

## Skills — Read in This Order, Every Session

**Step 1 — UI/UX Pro Max** (structure & conversion):
`~/.claude/skills/ui-ux-pro-max/CLAUDE.md`
Search tool: `python3 ~/.claude/skills/ui-ux-pro-max/src/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> --stack react`

**Step 2 — Taste Skill** (aesthetic refinement):
`~/.claude/skills/taste-skill.md`

### How They Work Together
- UI/UX Pro Max answers: *Does this layout guide the customer toward browsing and ordering?*
- Taste Skill answers: *Does this feel like a premium Italian restaurant?*
- When they conflict, trust UI/UX Pro Max for structure, Taste Skill for visual polish.
- This is a QR-code menu — the primary job is fast browsing and easy "show waiter" flow.

**No frontend code before both skills are read. No exceptions.**

---

## Project Summary

A mobile-first digital menu for **Gusto Pizzeria Ristorante**, an Italian wood-fire pizzeria in Janabiyah, Bahrain. Customers scan a QR code at the table, browse the menu, build a list of what they want, and show the screen to the waiter. **No checkout, no payment, no backend.**

This is replacing a heavy, laggy third-party menu (orderlina.menu) — performance is the primary reason for the rebuild, not features.

## Performance Budget (NON-NEGOTIABLE)

These are pass/fail criteria, not goals.

- **First Contentful Paint:** < 1.0s on 4G
- **Largest Contentful Paint:** < 1.8s on 4G
- **Total JavaScript (gzipped):** < 80 KB
- **Lighthouse Performance score:** ≥ 95 mobile
- **Total page weight (initial load):** < 500 KB
- All food images: **WebP or AVIF**, lazy-loaded below the fold, with explicit `width`/`height` to prevent CLS
- No third-party analytics scripts on initial load
- No web fonts that block render — use `font-display: swap` and prefer system font stack or one self-hosted variable font max

If a feature would push us past these budgets, the feature loses.

## Tech Stack

- **Framework:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS
- **State:** React Context + localStorage for cart (no Redux/Zustand needed)
- **Routing:** React Router (only 2–3 routes — could even be a single page with sections)
- **Icons:** Lucide React
- **Image optimization:** `vite-plugin-image-optimizer` or pre-optimized assets
- **Deployment:** Cloudflare Pages (preferred) or Vercel

**Do not use:** Next.js, Firebase, any SSR framework, any state management library beyond Context, any UI component library (Tailwind is enough).

## Project Structure

```
/
├── public/
│   ├── images/
│   │   ├── pizzas/        # Food photos, WebP, ~600px wide
│   │   ├── starters/
│   │   ├── pastas/
│   │   ├── etc/
│   │   └── logo.svg       # Gusto logo
│   └── og-image.jpg       # Social share image
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Logo + cart icon + lang switcher
│   │   ├── Hero.tsx             # Welcome / restaurant name banner
│   │   ├── CategoryNav.tsx      # Sticky horizontal scroll of category pills
│   │   ├── MenuSection.tsx      # Renders one category
│   │   ├── MenuItemCard.tsx     # Image + name + description + price + add btn
│   │   ├── ItemDetailModal.tsx  # Quantity + notes + add to cart
│   │   ├── CartDrawer.tsx       # Slide-up drawer with items + total
│   │   ├── SearchBar.tsx
│   │   └── RestaurantInfo.tsx   # Hours, location, contact
│   ├── contexts/
│   │   └── CartContext.tsx      # Cart state + localStorage persistence
│   ├── data/
│   │   └── menu.ts              # Imports menu.json, types it
│   ├── hooks/
│   │   └── useScrollSpy.ts      # For sticky category nav highlighting
│   ├── i18n/                    # If Arabic support is added
│   │   ├── en.json
│   │   └── ar.json
│   ├── types.ts
│   ├── App.tsx
│   └── main.tsx
├── menu.json                    # ⚠️ THE MENU DATA — see schema below
├── CLAUDE.md
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## Design System

Pulled from the restaurant's actual interior + current branding.

### Colors

```css
--bg:           #D1D1D1   /* Soft warm grey (matches their current site bg) */
--bg-card:      #FFFFFF
--text:         #685A5A   /* Warm brown-grey, their current text color */
--text-muted:   #9A8E8E
--accent:       #C75D2C   /* Burnt orange — matches the banquette seating */
--accent-dark:  #2D2828   /* Near-black for primary buttons / nav pill active */
--success:      #4A7C59
--border:       rgba(104, 90, 90, 0.12)
```

### Typography

- **Headings:** A geometric sans-serif. **Manrope** (variable, ~30KB) or system stack `system-ui, -apple-system, "Segoe UI"`. Match the current site's bold sans look.
- **Body:** Same family, regular weight.
- **Sizes (mobile-first):**
  - H1: `clamp(2.5rem, 8vw, 3.5rem)` bold
  - H2: `clamp(1.75rem, 5vw, 2.25rem)` bold
  - Body: `1rem` / 1.5 line-height
  - Small: `0.875rem`

### Spacing & Radii

- 4px base unit
- Card border-radius: `12px`
- Button border-radius: `9999px` (pill) for primary actions
- Generous touch targets: minimum **44×44px** for any tappable element

## Mobile-First Rules

- All layouts start at 360px viewport. Desktop is a courtesy, not a target.
- **No hover-only interactions.** Every hover state must have a tap equivalent.
- Sticky elements: header (logo + cart icon) and category nav. Both must collapse height on scroll-down to give content room.
- Bottom-of-viewport "View Cart" button when cart has items — thumb-reachable.
- Horizontal scroll for category nav must have momentum + snap, not free-scroll.
- Test on actual iPhone Safari and Android Chrome. CSS bugs on iOS Safari are a known hazard (`100vh`, sticky behavior, image rendering).

## Features

### Required

1. **Hero / welcome screen** with restaurant name and one good interior photo
2. **Category navigation** — sticky horizontal scrollable pills, active state, scroll-spy linked to sections
3. **Menu item grid/list** per category — image, name, short description, price, "+ Add" button
4. **Item detail modal/sheet** — opens on tap; shows large image, full description, quantity stepper, optional notes, "Add to order" CTA
5. **Cart drawer** — slide up from bottom; lists items with quantity steppers, shows running total, "Show waiter" button (just dismisses or scales up)
6. **Search bar** — filters across all categories by item name & description
7. **Persistent cart** — `localStorage` key `gusto_cart`, restored on page load, with timestamp; auto-clear after 4 hours of inactivity
8. **Restaurant info section** at bottom: hours, address, phone (tap-to-call), Google Maps link, Instagram link
9. **VAT notice** — "All prices include VAT" displayed near the top of the menu

### Nice-to-have (decide before starting)

- Arabic / RTL support (toggle in header). **Decision needed.**
- "Send order to WhatsApp" button that opens WhatsApp with pre-filled order text to the restaurant's number. **Decision needed.**
- Dietary filter chips (Vegetarian, Contains seafood, etc.)
- Item-level allergen tags

### Explicitly out of scope

- User accounts
- Payment / checkout
- Real-time order submission to a kitchen system
- Reviews / ratings
- Reservations

## Data Schema

`menu.json` is the single source of truth. Restaurant updates → edit this file → redeploy.

```ts
type Currency = "BHD";

interface MenuItem {
  id: string;                    // kebab-case slug of the name, stable across edits, e.g. "margherita"
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  price: number | null;          // in BHD, e.g. 5.5. null if extraction was incomplete.
  image: string;                 // path under /public/images/[category]/[id].webp
  category: string;              // matches Category.id
  tags?: ("vegetarian" | "vegan" | "gluten-free" | "spicy" | "contains-nuts" | "seafood")[];
  available?: boolean;           // default true; allows toggling without delete
}

interface Category {
  id: string;                    // "pizza", "starters", etc. (kebab-case)
  name: string;
  nameAr?: string;
  order: number;                 // display order (1-indexed)
  icon?: string;                 // optional category thumbnail
}

interface MenuData {
  _extractionIssues?: string[];  // ids of items with incomplete data — see extraction step
  restaurant: {
    name: string;
    address: string;
    phone: string;               // E.164, e.g. "+97317695556"
    instagram: string;           // handle
    googleMapsUrl: string;
    hours: string;
    vatIncluded: true;
  };
  categories: Category[];
  items: MenuItem[];
}
```

---

## ⚠️ MENU DATA EXTRACTION — DO THIS FIRST, BEFORE ANY CODE

The full menu lives as **PNG screenshots from the previous Orderlina menu**, captured per category. They are stored in `./brand_assets/gusto/`. **Confirm this folder exists before doing anything else.**

Each PNG follows the same Orderlina layout: a category title at the top, then a vertical list of items where each item has a square food photo on the left and the name + description + price stacked on the right. Some category sections span multiple scrolled screenshots, so the same item may appear partially in two files.

Your first job is to extract this into a clean `menu.json`. **Do not scaffold the app, do not write any React components, do not install any dependencies, until the menu data is extracted AND verified by the user.**

### Step 1 — Inventory the source files

Before extracting anything, list every file you find in the menu screenshots folder. For each file, output:

- Filename
- Which category it appears to show (read the header at the top of the screenshot)
- How many distinct items are visible on that screenshot
- Any items where the price or description is cut off / partially visible at the top or bottom edge

Output this as a markdown table in chat. **Stop here and wait for the user to confirm the inventory looks right.** Do not proceed to extraction without confirmation.

### Step 2 — Extract menu data into `menu.json`

Once the inventory is confirmed, read every screenshot and extract every menu item into `menu.json` matching the `MenuData` schema above. Rules:

- **`id`** = kebab-case slug of the English name, e.g. `quattro-formaggi`, `tonno-e-cipolla`. Must be unique across the whole menu.
- **`category`** = kebab-case slug of the section header, e.g. `traditional-wood-oven-fire-pizza`, `chefs-special`, `pasta-and-co`.
- **`price`** = number in BHD as a decimal, e.g. `5.5`, `6.82`. If the price is cut off or unclear, set to `null` and add the item's `id` to the top-level `_extractionIssues` array.
- **`description`** = the description as written on the menu, with sensible casing (sentence case is fine — match the style in the source). Don't paraphrase. If a description is cut off, mark `null` and flag in `_extractionIssues`.
- **`image`** = `/images/[category]/[id].webp` — the actual image file will be placed there later.
- **`tags`** = inferred from the description. Examples: pizza with "shrimps" or "tuna" → `seafood`. "Vegetariana" or any pizza without meat/seafood → `vegetarian`. A pasta with cream/butter and no meat → `vegetarian`. Don't guess gluten-free, vegan, or allergen tags — leave those off unless the menu explicitly says so.
- **Deduplicate.** The same item may appear in two scrolled screenshots — only include it once. Use the more complete version of the description.
- **Preserve the canonical category order** (see below).
- **Do not invent missing data.** Any field you can't read with confidence becomes `null` and the item id goes in `_extractionIssues`.

### Canonical category order

This matches the live Orderlina menu order exactly (confirmed from screenshots).

```
1.  Traditional Wood Oven Fire Pizza   (id: traditional-wood-oven-fire-pizza)
2.  Starters                           (id: starters)
3.  Salad                              (id: salad)
4.  Chef's Special                     (id: chefs-special)
5.  Drinks                             (id: drinks)
6.  Chef's Signature Pizza             (id: chefs-signature-pizza)
7.  Calzone                            (id: calzone)
8.  Focaccia                           (id: focaccia)
9.  Pasta & Co                         (id: pasta-and-co)
10. Side Order                         (id: side-order)
11. Main Course                        (id: main-course)
12. Desserts                           (id: desserts)
13. New Drinks                         (id: new-drinks)
14. Coffee & Tea                       (id: coffee-and-tea)
```

### Known-good baseline (use this as a sanity check)

The following pizza items have been verified manually. After your extraction, **compare your output to this baseline.** If any of these prices/names don't match what you extracted, something went wrong — re-read those screenshots before proceeding.

| Name | Price (BHD) | Description |
|---|---|---|
| Margherita | 5.50 | Tomato sauce, basil, parmesan & mozzarella |
| Funghi | 5.72 | Tomato sauce, mushroom, parmesan & mozzarella |
| Melanzane | 6.05 | Tomato sauce, eggplants, cherry tomato, basil, parmesan & mozzarella |
| Vegetariana | 6.49 | Tomato sauce, bell peppers, zucchini, eggplant, mushroom, parmesan & mozzarella |
| Quattro Formaggi | 6.60 | Fontina, ricotta, gorgonzola, parmesan & mozzarella |
| Pizza Pollo | 6.82 | Tomato sauce, grilled chicken, cherry tomato, onion & mozzarella |
| Gamberi | 7.15 | Tomato sauce, shrimps, rocket leaves, cherry tomatoes, parmesan & mozzarella |
| Capricciosa | 6.71 | Tomato sauce, mushroom, salami, artichoke, black olives, eggs, parmesan & mozzarella |
| Tonno e Cipolla | 6.38 | Tomato sauce, tuna, onion, parmesan & mozzarella |

### Step 3 — Verification table

After producing `menu.json`, output a markdown table in chat showing **every single item** you extracted, with these columns:

`Source File | Category | ID | Name | Description | Price (BHD) | Tags | Issues`

The "Issues" column should flag anything you're not confident about — partial reads, ambiguous prices, items you suspect might be duplicates, descriptions that ran off the screen edge, etc.

Also report at the end of the table:

- Total items extracted
- Items per category
- Items in `_extractionIssues`
- Any baseline pizza items that didn't match

**Stop here and wait for the user to verify the table. Do not start scaffolding the app until they confirm.**

---

## Step 4 onwards — Build the app, in stages

Only after `menu.json` is verified:

1. **Scaffold** the Vite + React + TS + Tailwind project per the structure defined above. No features yet — just folders, config, a working dev server, and an `App.tsx` that imports `menu.json` and renders a flat list of category names + item counts as a smoke test. Show the file tree and confirm `npm run dev` works.
2. **Design system pass**: Tailwind config with the color tokens, font setup, and a small set of low-level primitives (`Button`, `Card`, `IconButton`, `QuantityStepper`). Demo them on a single throwaway page so we can review the look before building real screens.
3. **Read-only menu views**: `Header`, `Hero`, `CategoryNav` (with scroll-spy), `MenuSection`, `MenuItemCard`. No cart yet. Site should be browseable end-to-end with real menu data.
4. **Cart**: `CartContext` with localStorage persistence, `ItemDetailModal`, `CartDrawer`, sticky "View cart" button when items exist.
5. **Search**: `SearchBar` component with client-side filtering across name + description.
6. **Restaurant info & polish**: `RestaurantInfo` section, empty states, error boundaries, 404 fallback, OG image, favicon.
7. **Performance pass**: image optimization, bundle analysis, Lighthouse run on a real mobile device, fix anything below the budget.

After each stage, **stop and let the user review.** Don't chain stages without confirmation — small reviews are how we catch problems before they compound.

---

## Restaurant Info (from Google listing — verify with owner)

- **Name:** Gusto Pizzeria Ristorante
- **Address:** The Park, 571 Rd No 7113, Janabiyah, Bahrain
- **Phone:** +973 1769 5556
- **Hours:** Closes 11:30 PM (full weekly schedule TBD — confirm with owner)
- **Price range:** BHD 5–10 per person
- **Instagram:** @gusto_bahrain
- **Talabat:** https://www.talabat.com/bahrain/gusto

## Cart Behavior (precise)

- Cart state is `{ items: { [itemId]: { qty: number, notes?: string } }, updatedAt: number }`
- Persist to `localStorage` on every change, key = `gusto_cart`
- On load, restore if `updatedAt` is within last 4 hours; otherwise discard and start empty
- Adding an item that already exists increments quantity by 1; doesn't open the modal again
- Cart count badge shows total quantity (sum of qty), not unique item count
- Total price = `sum(items[i].qty * menuPrice(items[i].id))`, formatted as `BHD X.XX`
- If a cart contains an item whose `id` no longer exists in `menu.json` (e.g., menu was edited), drop it silently on load
- Empty cart drawer state: friendly message, e.g. "Your order is empty — tap any item to add it"

## Accessibility

- All interactive elements keyboard-accessible (even though primary UX is touch)
- Color contrast ≥ 4.5:1 for body text against backgrounds
- `alt` text on every food image — name + brief description, not just "pizza image"
- Modal/drawer focus trap when open, focus restored to trigger on close
- Quantity steppers use `<button>` elements with proper `aria-label`s ("Increase quantity of Margherita")
- Cart count badge uses `aria-live="polite"` so screen readers announce changes
- Respect `prefers-reduced-motion` for the cart drawer slide animation

## Image Strategy

- Source: existing Orderlina screenshots have the food photos baked in. Either crop them out of the source PNGs, or pull from the restaurant's Instagram (@gusto_bahrain) with permission. A new photo shoot would be ideal but is not blocking.
- **Format:** WebP, with JPG fallback only if absolutely needed
- **Sizes:** 600px wide for card thumbnails, 1200px for detail modal view
- **Compression target:** ~50KB per thumbnail, ~150KB per detail image
- **Loading:** `loading="lazy"` for everything below first viewport, `fetchpriority="high"` only on the hero image
- **Aspect ratio:** square (1:1) for grid consistency
- **Filename convention:** `[item-id].webp`, e.g. `margherita.webp`, in `/public/images/[category]/`

## Build & Deploy

```bash
# Dev
npm install
npm run dev          # http://localhost:5173

# Type check
npm run typecheck

# Production build
npm run build        # outputs to /dist
npm run preview      # local preview of the prod build

# Deploy to Cloudflare Pages
# Connect repo to Cloudflare Pages, build cmd: `npm run build`, output dir: `dist`
```

## Open Decisions (resolve before deeper work)

These need owner answers. Don't guess.

1. **Arabic support: yes / no?** If yes, add `i18n` setup, RTL Tailwind config, and `nameAr`/`descriptionAr` become required for every item.
2. **WhatsApp order button: yes / no?** If yes, what's the WhatsApp number, and what message format?
3. **Domain:** custom domain or `gusto.pages.dev`?
4. **Photos:** crop from existing screenshots, pull from Instagram, or new shoot?
5. **Hours:** confirm full weekly schedule.
6. **Variants:** are there item variants (pizza sizes, pasta sauce options, etc.)? Current data doesn't show any. If yes, schema needs `variants: { name, priceModifier }[]`.

## "Done" definition

- Lighthouse mobile: Performance ≥95, Accessibility ≥95, Best Practices ≥95, SEO ≥95
- All menu sections populated with real data, `_extractionIssues` empty
- Tested on real iPhone (Safari) and real Android (Chrome)
- Cart flow works end-to-end including persistence and 4-hour expiry
- Restaurant info, tap-to-call, directions, Instagram links all work
- Deployed to a stable URL with HTTPS