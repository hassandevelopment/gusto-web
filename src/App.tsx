import { useEffect, useState } from 'react'
import { fetchMenu, menuImageUrl } from './data/menu-api'
import type { MenuSection } from './data/menu-api'

export default function App() {
  const [sections, setSections] = useState<MenuSection[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setSections(null)
    setError(null)
    fetchMenu()
      .then((data) => { if (!cancelled) setSections(data) })
      .catch((e) => { if (!cancelled) setError(String(e)) })
    return () => { cancelled = true }
  }, [tick])

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-sans, sans-serif)' }}>
        <p style={{ marginBottom: '1rem', color: '#c0392b' }}>Failed to load menu: {error}</p>
        <button
          onClick={() => setTick((t) => t + 1)}
          style={{ padding: '0.5rem 1.25rem', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!sections) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-sans, sans-serif)', color: '#9A8E8E' }}>
        Loading menu…
      </div>
    )
  }

  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem 1rem 3rem', fontFamily: 'var(--font-sans, sans-serif)' }}>
      {sections.map(({ category, items }) => (
        <section key={category.id} style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.75rem', color: '#2D2828' }}>
            {category.name}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {items.map((item) => {
              const imgSrc = menuImageUrl(item.image_url)
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    border: '1px solid #e8e0d8',
                    borderRadius: '10px',
                    backgroundColor: '#fff',
                  }}
                >
                  {imgSrc && (
                    <img
                      src={imgSrc}
                      alt={item.name}
                      loading="lazy"
                      width={80}
                      height={80}
                      style={{
                        objectFit: 'cover',
                        borderRadius: '6px',
                        flexShrink: 0,
                        backgroundColor: '#F4EFE7',
                      }}
                    />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#2D2828' }}>{item.name}</p>
                    {item.description && (
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#9A8E8E', lineHeight: 1.4 }}>
                        {item.description}
                      </p>
                    )}
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#C75D2C' }}>
                      {(item.base_price_fils / 1000).toFixed(3)} BD
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </main>
  )
}
