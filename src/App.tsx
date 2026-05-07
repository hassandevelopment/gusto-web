import { useEffect, useRef, useState } from 'react'
import { ShoppingBag, SearchX } from 'lucide-react'
import { menuData } from './data/menu'
import type { MenuItem } from './types'
import { useCart } from './contexts/CartContext'
import { useScrollDirection } from './hooks/useScrollSpy'
import Header from './components/Header'
import Hero from './components/Hero'
import CategoryNav from './components/CategoryNav'
import SearchBar from './components/SearchBar'
import MenuSection from './components/MenuSection'
import MenuItemCard from './components/MenuItemCard'
import RestaurantInfo from './components/RestaurantInfo'
import ItemDetailModal from './components/ItemDetailModal'
import CartDrawer from './components/CartDrawer'

export default function App() {
  const { restaurant, categories, items } = menuData
  const headerHidden = useScrollDirection(80)
  const { totalQty, totalPrice, add } = useCart()

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Auto-close drawer when cart is cleared
  const prevQty = useRef(totalQty)
  useEffect(() => {
    if (totalQty === 0) setDrawerOpen(false)
    prevQty.current = totalQty
  }, [totalQty])

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order)

  const trimmed = searchQuery.trim().toLowerCase()
  const searchResults = searchOpen && trimmed
    ? items.filter(
        (item) =>
          item.available !== false &&
          (item.name.toLowerCase().includes(trimmed) ||
            item.description?.toLowerCase().includes(trimmed)),
      )
    : null

  function handleSearchClose() {
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="min-h-[100dvh] bg-bg">
      <Header
        cartCount={totalQty}
        onCartOpen={totalQty > 0 ? () => setDrawerOpen(true) : undefined}
        onSearchOpen={() => setSearchOpen(true)}
        hidden={headerHidden}
      />

      <Hero
        restaurantName={restaurant.name}
        address={restaurant.address}
        hours={restaurant.hours}
      />

      {searchOpen ? (
        <SearchBar
          query={searchQuery}
          onChange={setSearchQuery}
          onClose={handleSearchClose}
          headerHidden={headerHidden}
        />
      ) : (
        <CategoryNav categories={sortedCategories} items={items} headerHidden={headerHidden} />
      )}

      <main className="max-w-3xl mx-auto px-4 pb-32" id="menu-main" style={{ paddingTop: '4rem' }}>
        {/* ── Search results ── */}
        {searchOpen ? (
          <>
            {!trimmed ? (
              <p className="text-sm text-text-muted text-center py-10">
                Start typing to search the menu…
              </p>
            ) : searchResults && searchResults.length === 0 ? (
              <div className="flex flex-col items-center py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center mb-4 shadow-card">
                  <SearchX size={24} className="text-text-muted" />
                </div>
                <p className="font-semibold text-text mb-1">No results for "{searchQuery}"</p>
                <p className="text-sm text-text-muted">Try a different dish name or ingredient</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-3 tabular-nums">
                  {searchResults!.length} {searchResults!.length === 1 ? 'result' : 'results'}
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {searchResults!.map((item, i) => (
                    <div
                      key={item.id}
                      className="stagger-in"
                      style={{ '--i': Math.min(i, 6) } as React.CSSProperties}
                    >
                      <MenuItemCard
                        item={item}
                        onAdd={(it) => add(it.id)}
                        onTap={setSelectedItem}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Normal menu ── */
          sortedCategories.map((cat, catIdx) => {
            const catItems = items.filter(
              (item) => item.category === cat.id && item.available !== false,
            )
            if (catItems.length === 0) return null
            return (
              <MenuSection
                key={cat.id}
                category={cat}
                items={catItems}
                onAdd={(item) => add(item.id)}
                onTap={setSelectedItem}
                firstSection={catIdx === 0}
              />
            )
          })
        )}
      </main>

      {!searchOpen && (
        <RestaurantInfo
          name={restaurant.name}
          address={restaurant.address}
          phone={restaurant.phone}
          instagram={restaurant.instagram}
          googleMapsUrl={restaurant.googleMapsUrl}
          hours={restaurant.hours}
        />
      )}

      {/* Sticky "View Order" bar */}
      {totalQty > 0 && (
        <div
          className="fixed bottom-0 inset-x-0 z-40 px-4 pt-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        >
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-full flex items-center gap-3 px-5 rounded-full
                         bg-accent-dark text-white font-semibold shadow-pill
                         transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                         hover:-translate-y-px hover:shadow-card-hover active:scale-[0.98]
                         cursor-pointer select-none"
              style={{ minHeight: '52px' }}
              aria-label={`View order, ${totalQty} ${totalQty === 1 ? 'item' : 'items'}`}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 flex-shrink-0">
                <ShoppingBag size={16} strokeWidth={2} />
              </span>
              <span className="flex-1 text-left text-sm">
                View order · {totalQty} {totalQty === 1 ? 'item' : 'items'}
              </span>
              <span className="font-bold tabular-nums text-sm flex-shrink-0">
                BHD {totalPrice.toFixed(2)}
              </span>
            </button>
          </div>
        </div>
      )}

      <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
