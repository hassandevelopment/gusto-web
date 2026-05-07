import { MapPin, Phone, Clock, AtSign, ExternalLink } from 'lucide-react'

interface Props {
  name: string
  address: string
  phone: string
  instagram: string
  googleMapsUrl: string
  hours: string
}

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('973') && digits.length === 11) {
    return `+973 ${digits.slice(3, 7)} ${digits.slice(7)}`
  }
  return raw
}

export default function RestaurantInfo({ name, address, phone, instagram, googleMapsUrl, hours }: Props) {
  const mapsHref = googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(name + ', ' + address)}`
  const instagramHref = `https://www.instagram.com/${instagram.replace(/^@/, '')}/`

  return (
    <section aria-label="Restaurant information" className="mt-10">
      {/* Top divider */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="border-t border-[rgba(104,90,90,0.14)]" />
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-10 pb-16">

        {/* Wordmark centred */}
        <div className="mb-8 text-center">
          <p
            className="text-ink leading-none"
            style={{ fontFamily: 'var(--font-wordmark)', fontWeight: 400, fontSize: '1.5rem', letterSpacing: '0.12em' }}
          >
            GUSTO
          </p>
          {/* Ornamental flourish */}
          <div className="flex justify-center mt-3 mb-1 text-ink/30">
            <svg width="72" height="12" viewBox="0 0 80 12" aria-hidden="true"
                 fill="none" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round">
              <path d="M2 6 L26 6" /><path d="M54 6 L78 6" />
              <path d="M30 6 C 32 4, 34 4, 36 6 C 38 8, 40 8, 40 6" />
              <path d="M50 6 C 48 4, 46 4, 44 6 C 42 8, 40 8, 40 6" />
              <circle cx="40" cy="6" r="0.9" fill="currentColor" />
            </svg>
          </div>
          <p
            className="text-text-muted"
            style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontSize: '0.88rem', letterSpacing: '0.02em' }}
          >
            pizzeria ristorante
          </p>
        </div>

        {/* Info rows */}
        <ul className="space-y-4 mb-8">
          <li>
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 items-start group"
              aria-label="Open location in Google Maps"
            >
              <MapPin size={16} className="text-text-muted mt-0.5 flex-shrink-0 group-hover:text-ink transition-colors" />
              <span className="text-sm text-text group-hover:text-ink transition-colors leading-snug">
                {address}
              </span>
            </a>
          </li>
          <li>
            <a
              href={`tel:${phone}`}
              className="flex gap-3 items-center group"
              aria-label="Call restaurant"
            >
              <Phone size={16} className="text-text-muted flex-shrink-0 group-hover:text-ink transition-colors" />
              <span className="text-sm text-text group-hover:text-ink transition-colors tabular-nums">
                {formatPhone(phone)}
              </span>
            </a>
          </li>
          <li className="flex gap-3 items-center">
            <Clock size={16} className="text-text-muted flex-shrink-0" />
            <span className="text-sm text-text">{hours}</span>
          </li>
        </ul>

        {/* External links */}
        <div className="flex gap-2 flex-wrap mb-10">
          <a
            href={instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold
                       px-4 py-2.5 rounded-full border border-[rgba(104,90,90,0.22)]
                       text-text hover:border-ink hover:text-ink transition-colors cursor-pointer"
          >
            <AtSign size={13} />
            @{instagram.replace(/^@/, '')}
          </a>
          <a
            href="https://www.talabat.com/bahrain/gusto"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold
                       px-4 py-2.5 rounded-full border border-[rgba(104,90,90,0.22)]
                       text-text hover:border-ink hover:text-ink transition-colors cursor-pointer"
          >
            <ExternalLink size={13} />
            Order on Talabat
          </a>
        </div>

        {/* Footer note */}
        <p className="text-text-muted text-center" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
          All prices include VAT &nbsp;·&nbsp; Menu prices may vary
        </p>
      </div>
    </section>
  )
}
