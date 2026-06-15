import { useEffect, useRef, useState } from 'react'
import { UtensilsCrossed } from 'lucide-react'
import PublicLayout from '../components/PublicLayout'
import { useScrollSpy } from '../hooks/useScrollSpy'
import { fetchMenu, menuImageUrl } from '../data/menu-api'
import type { MenuItem, MenuSection } from '../data/menu-api'

// Sticky header (56px) + this nav (~52px); anchor scroll lands below both.
const NAV_OFFSET = 116

// Square thumbnail with placeholder/onError fallback (mirrors the menu card pattern).
function ItemThumb({ item }: { item: MenuItem }) {
  const [imgError, setImgError] = useState(false)
  const imgSrc = menuImageUrl(item.image_url)
  const showImg = !!imgSrc && !imgError

  return (
    <div style={{
      flexShrink: 0,
      width: 80,
      height: 80,
      borderRadius: '10px',
      overflow: 'hidden',
      backgroundColor: '#ECE8E0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {showImg ? (
        <img
          src={imgSrc}
          alt={item.name}
          loading="lazy"
          width={80}
          height={80}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <UtensilsCrossed size={24} strokeWidth={1.5} color="var(--color-text-muted)" />
      )}
    </div>
  )
}

function formatPrice(fils: number): string {
  return 'BD ' + (fils / 1000).toLocaleString('en-BH', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

export default function PublicMenuPage() {
  const [sections, setSections] = useState<MenuSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const ids = sections.map((s) => s.category.id)
  const activeId = useScrollSpy(ids, NAV_OFFSET)
  const navRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  useEffect(() => {
    fetchMenu()
      .then(setSections)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  // Keep the active pill in view as the user scrolls.
  useEffect(() => {
    const pill = pillRefs.current.get(activeId)
    if (pill && navRef.current) {
      pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeId])

  function scrollToSection(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <PublicLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-italic)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: 'var(--color-ink)',
            lineHeight: 1.1,
            marginBottom: '0.5rem',
          }}>
            Our Menu
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            All prices include VAT · Prices in Bahraini Dinar (BHD)
          </p>
        </div>

        {/* ── Sticky category pill nav ──────────────────────────────── */}
        {!loading && !error && sections.length > 0 && (
          <div
            ref={navRef}
            role="navigation"
            aria-label="Menu categories"
            style={{
              position: 'sticky',
              top: 55,
              zIndex: 45,
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              // Full-bleed: break out of the container's 1.5rem side padding so the
              // bar spans edge-to-edge and fully masks items scrolling underneath.
              marginLeft: '-1.5rem',
              marginRight: '-1.5rem',
              padding: '0.75rem 1.5rem',
              marginBottom: '1.5rem',
              backgroundColor: 'var(--color-bg)',
              borderBottom: '1px solid rgba(104,90,90,0.12)',
              scrollbarWidth: 'none',
            }}
          >
            {sections.map((section) => {
              const active = activeId === section.category.id
              return (
                <button
                  key={section.category.id}
                  ref={(el) => {
                    if (el) pillRefs.current.set(section.category.id, el)
                    else pillRefs.current.delete(section.category.id)
                  }}
                  onClick={() => scrollToSection(section.category.id)}
                  style={{
                    flexShrink: 0,
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    padding: '0.45rem 0.9rem',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid',
                    borderColor: active ? 'var(--color-accent)' : 'rgba(104,90,90,0.2)',
                    color: active ? '#fff' : 'var(--color-text)',
                    backgroundColor: active ? 'var(--color-accent)' : 'var(--color-card)',
                    transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
                  }}
                >
                  {section.category.name}
                </button>
              )
            })}
          </div>
        )}

        {loading && (
          <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '15px' }}>
            Loading menu…
          </div>
        )}

        {error && (
          <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '15px' }}>
            Unable to load menu. Please try again later.
          </div>
        )}

        {!loading && !error && sections.map((section) => (
          <section
            key={section.category.id}
            id={section.category.id}
            style={{ marginBottom: '3rem', scrollMarginTop: `${NAV_OFFSET}px` }}
          >
            <h2 style={{
              fontFamily: 'var(--font-italic)',
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: '1.5rem',
              color: 'var(--color-accent)',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(199,93,44,0.2)',
            }}>
              {section.category.name}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {section.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--color-card)',
                    borderRadius: 'var(--radius-card)',
                    border: '1px solid rgba(104,90,90,0.1)',
                    boxShadow: 'var(--shadow-card)',
                    opacity: item.in_stock === false ? 0.5 : 1,
                  }}
                >
                  <ItemThumb item={item} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-ink)', lineHeight: 1.3 }}>
                        {item.name}
                      </p>
                      {item.in_stock === false && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--color-text-muted)',
                          border: '1px solid currentColor',
                          borderRadius: '4px',
                          padding: '1px 5px',
                        }}>
                          Unavailable
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p style={{ marginTop: '0.25rem', fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.5 }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  <p style={{
                    fontWeight: 600,
                    fontSize: '15px',
                    color: 'var(--color-ink)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {formatPrice(item.base_price_fils)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PublicLayout>
  )
}
