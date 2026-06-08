import { ShoppingBag, Search } from 'lucide-react'
import IconButton from './ui/IconButton'

interface Props {
  cartCount: number
  onCartOpen?: () => void
  onSearchOpen?: () => void
  hidden: boolean
}

export default function Header({ cartCount, onCartOpen, onSearchOpen, hidden }: Props) {
  return (
    <header
      className={
        'sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-[rgba(104,90,90,0.12)] ' +
        'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ' +
        (hidden ? '-translate-y-full' : 'translate-y-0')
      }
    >
      <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex flex-col leading-none select-none">
          <span
            className="text-ink"
            style={{
              fontFamily: 'var(--font-wordmark)',
              fontWeight: 400,
              fontSize: '17px',
              letterSpacing: '0.08em',
            }}
          >
            GUSTO
          </span>
          <span
            className="text-text mt-[3px]"
            style={{
              fontFamily: 'var(--font-italic)',
              fontStyle: 'italic',
              fontSize: '11px',
              letterSpacing: '0.02em',
            }}
          >
            pizzeria ristorante
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {onSearchOpen && (
            <IconButton
              icon={<Search size={18} strokeWidth={1.75} />}
              label="Search menu"
              variant="ghost"
              onClick={onSearchOpen}
            />
          )}

          {cartCount > 0 && (
            <div className="relative">
              <IconButton
                icon={<ShoppingBag size={18} strokeWidth={1.75} />}
                label="View order"
                variant="filled"
                onClick={onCartOpen}
              />
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full
                           bg-ink text-white text-[10px] font-bold
                           flex items-center justify-center pointer-events-none"
                aria-live="polite"
                aria-atomic="true"
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
