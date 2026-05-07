export default function GustoPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center gap-1.5 bg-[#f8f6f3] ${className}`}
      aria-hidden="true"
    >
      <p
        className="tracking-[0.18em] text-[11px] text-ink/50 uppercase"
        style={{ fontFamily: 'var(--font-wordmark)', fontWeight: 400 }}
      >
        GUSTO
      </p>
      <svg
        width="56" height="8" viewBox="0 0 80 12"
        fill="none" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round"
        className="text-ink/25"
      >
        <path d="M2 6 L26 6" /><path d="M54 6 L78 6" />
        <path d="M30 6 C 32 4, 34 4, 36 6 C 38 8, 40 8, 40 6" />
        <path d="M50 6 C 48 4, 46 4, 44 6 C 42 8, 40 8, 40 6" />
        <circle cx="40" cy="6" r="0.9" fill="currentColor" />
      </svg>
      <p
        className="text-ink/35 text-[10px]"
        style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic' }}
      >
        pizzeria ristorante
      </p>
    </div>
  )
}
