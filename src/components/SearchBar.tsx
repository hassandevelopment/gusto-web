import { useEffect, useRef } from 'react'
import { ArrowLeft, X } from 'lucide-react'

interface Props {
  query: string
  onChange: (q: string) => void
  onClose: () => void
  headerHidden: boolean
}

export default function SearchBar({ query, onChange, onClose, headerHidden }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Small delay so the slide-in animation plays before focus steals layout
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={
        'sticky z-40 bg-bg/95 backdrop-blur-md border-b border-[rgba(104,90,90,0.12)] ' +
        'transition-[top] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ' +
        (headerHidden ? 'top-0' : 'top-14')
      }
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={onClose}
          aria-label="Close search"
          className="w-10 h-10 flex items-center justify-center rounded-full
                     text-text-muted hover:text-text active:scale-[0.92]
                     transition-transform cursor-pointer flex-shrink-0
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search dishes…"
            aria-label="Search menu"
            className="w-full h-10 bg-card rounded-full px-4 pr-10 text-sm text-text
                       border border-[rgba(104,90,90,0.18)]
                       placeholder:text-text-muted/60
                       focus:outline-2 focus:outline-accent-dark focus:outline-offset-0"
          />
          {query && (
            <button
              onClick={() => onChange('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2
                         text-text-muted hover:text-text active:scale-[0.9]
                         transition-transform cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
