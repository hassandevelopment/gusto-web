interface Props {
  restaurantName: string
  address: string
  hours: string
}

export default function Hero({ address, hours }: Props) {
  return (
    <section className="bg-bg pt-9 pb-7 px-6 text-center">
      {/* Wordmark */}
      <h1
        className="leading-none text-ink"
        style={{
          fontFamily: 'var(--font-wordmark)',
          fontWeight: 400,
          letterSpacing: '0.10em',
          fontSize: 'clamp(2.75rem, 11vw, 3.75rem)',
        }}
      >
        GUSTO
      </h1>

      {/* Italic tagline */}
      <p
        className="text-ink mt-2"
        style={{
          fontFamily: 'var(--font-italic)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(1rem, 4.2vw, 1.2rem)',
          letterSpacing: '0.02em',
        }}
      >
        pizzeria ristorante
      </p>

      {/* Ornamental flourish */}
      <div className="flex justify-center mt-4 mb-5 text-ink/70">
        <svg
          width="100"
          height="15"
          viewBox="0 0 80 12"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.7"
          strokeLinecap="round"
        >
          <path d="M2 6 L26 6" />
          <path d="M54 6 L78 6" />
          <path d="M30 6 C 32 4, 34 4, 36 6 C 38 8, 40 8, 40 6" />
          <path d="M50 6 C 48 4, 46 4, 44 6 C 42 8, 40 8, 40 6" />
          <circle cx="40" cy="6" r="0.9" fill="currentColor" />
        </svg>
      </div>

      {/* Address + hours */}
      <p
        className="text-text"
        style={{
          fontFamily: 'var(--font-italic)',
          fontStyle: 'italic',
          fontSize: '0.95rem',
          lineHeight: 1.65,
        }}
      >
        {address}
        <br />
        <span className="text-text-muted">{hours}</span>
      </p>

      {/* Meta rows — two lines */}
      <div
        className="flex flex-col items-center gap-1 mt-4 text-text-muted"
        style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        <span>Forno a Legna</span>
        <span>VAT incl.</span>
      </div>
    </section>
  )
}
