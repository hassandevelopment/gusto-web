import { useEffect, useState } from 'react'
import { UtensilsCrossed } from 'lucide-react'
import { fetchMenu, menuImageUrl } from './data/menu-api'
import type { MenuItem, MenuSection } from './data/menu-api'
import { useScrollDirection } from './hooks/useScrollSpy'
import Header from './components/Header'
import CategoryNav from './components/CategoryNav'

// ── Per-item card with image/placeholder/onError logic ────────────────────────
function MenuItemCard({ item }: { item: MenuItem }) {
  const [imgError, setImgError] = useState(false)
  const imgSrc = menuImageUrl(item.image_url)
  const showImg = !!imgSrc && !imgError
  const outOfStock = item.in_stock === false

  return (
    <article
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px',
        backgroundColor: 'var(--color-card)',
        borderRadius: '14px',
        border: '1px solid rgba(104,90,90,0.14)',
        boxShadow: 'var(--shadow-card)',
        opacity: outOfStock ? 0.5 : 1,
      }}
    >
      {/* Image box — always present, 90×90 */}
      <div
        style={{
          flexShrink: 0,
          width: 90,
          height: 90,
          borderRadius: '14px',
          overflow: 'hidden',
          backgroundColor: '#ECE8E0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {showImg ? (
          <img
            src={imgSrc}
            alt={item.name}
            loading="lazy"
            width={90}
            height={90}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <UtensilsCrossed size={28} color="var(--color-accent)" strokeWidth={1.5} />
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: '15px',
              color: 'var(--color-ink)',
              lineHeight: 1.3,
              flex: 1,
              minWidth: 0,
            }}
          >
            {item.name}
          </p>
          {outOfStock && (
            <span
              style={{
                flexShrink: 0,
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                border: '1px solid rgba(104,90,90,0.22)',
                borderRadius: '4px',
                padding: '1px 5px',
                whiteSpace: 'nowrap',
                marginTop: '2px',
              }}
            >
              Out of stock
            </span>
          )}
        </div>
        {item.description && (
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.description}
          </p>
        )}
        <p
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: '14px',
            color: 'var(--color-accent)',
            marginTop: 'auto',
          }}
        >
          {(item.base_price_fils / 1000).toFixed(3)} BD
        </p>
      </div>
    </article>
  )
}

// ── Skeleton loading state ─────────────────────────────────────────────────────
function SkeletonMenu() {
  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {[0, 1, 2].map((s) => (
        <section key={s} style={{ marginBottom: '2rem' }}>
          <div className="skeleton" style={{ height: '22px', width: '150px', marginBottom: '14px' }} />
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: '114px', borderRadius: '14px', marginBottom: '10px' }}
            />
          ))}
        </section>
      ))}
    </main>
  )
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [sections, setSections] = useState<MenuSection[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const headerHidden = useScrollDirection(80)

  useEffect(() => {
    let cancelled = false
    setSections(null)
    setError(null)
    fetchMenu()
      .then((data) => { if (!cancelled) setSections(data) })
      .catch((e) => { if (!cancelled) setError(String(e)) })
    return () => { cancelled = true }
  }, [tick])

  // Adapt MenuSection[] → CategoryNav's NavCategory[] / NavItem[]
  const navCategories = sections?.map((s) => s.category) ?? []
  const navItems =
    sections?.flatMap((s) =>
      s.items.map((item) => ({
        category: item.category!.id,
        image: menuImageUrl(item.image_url) ?? '',
      }))
    ) ?? []

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--color-bg-cream)' }}>
      <Header cartCount={0} hidden={headerHidden} />

      {sections && (
        <CategoryNav categories={navCategories} items={navItems} headerHidden={headerHidden} />
      )}

      {error ? (
        <div
          style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            fontFamily: 'var(--font-sans, sans-serif)',
          }}
        >
          <p style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}>
            Failed to load menu: {error}
          </p>
          <button
            onClick={() => setTick((t) => t + 1)}
            style={{
              padding: '0.5rem 1.5rem',
              cursor: 'pointer',
              borderRadius: '9999px',
              border: '1px solid rgba(104,90,90,0.3)',
              backgroundColor: 'var(--color-card)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--color-ink)',
            }}
          >
            Retry
          </button>
        </div>
      ) : !sections ? (
        <SkeletonMenu />
      ) : (
        <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
          {sections.map(({ category, items }) => (
            <section
              key={category.id}
              id={category.id}
              style={{ marginBottom: '2.5rem', scrollMarginTop: '140px' }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-italic)',
                  fontStyle: 'italic',
                  fontSize: '24px',
                  fontWeight: 500,
                  color: 'var(--color-ink)',
                  margin: '0 0 12px',
                }}
              >
                {category.name}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </main>
      )}
    </div>
  )
}
