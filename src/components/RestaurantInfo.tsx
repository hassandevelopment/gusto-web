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

export default function RestaurantInfo({
  name,
  address,
  phone,
  instagram,
  googleMapsUrl,
  hours,
}: Props) {
  const mapsHref =
    googleMapsUrl ||
    `https://maps.google.com/?q=${encodeURIComponent(name + ', ' + address)}`

  const instagramHref = `https://www.instagram.com/${instagram.replace(/^@/, '')}/`

  return (
    <section aria-label="Restaurant information" className="bg-bg border-t border-[rgba(104,90,90,0.12)] mt-8">
      <div className="max-w-3xl mx-auto px-5 py-10">

        {/* Logo lockup */}
        <div className="mb-8">
          <p
            className="text-ink leading-none"
            style={{
              fontFamily: 'var(--font-wordmark)',
              fontWeight: 400,
              fontSize: 'clamp(1.5rem, 6vw, 2rem)',
              letterSpacing: '0.10em',
            }}
          >
            GUSTO
          </p>
          <p
            className="text-text-muted mt-1"
            style={{
              fontFamily: 'var(--font-italic)',
              fontStyle: 'italic',
              fontSize: '0.9rem',
              letterSpacing: '0.02em',
            }}
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
              <MapPin size={17} className="text-text-muted mt-0.5 flex-shrink-0 group-hover:text-ink transition-colors" />
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
              <Phone size={17} className="text-text-muted flex-shrink-0 group-hover:text-ink transition-colors" />
              <span className="text-sm text-text group-hover:text-ink transition-colors tabular-nums">
                {formatPhone(phone)}
              </span>
            </a>
          </li>

          <li className="flex gap-3 items-center">
            <Clock size={17} className="text-text-muted flex-shrink-0" />
            <span className="text-sm text-text">{hours}</span>
          </li>
        </ul>

        {/* Divider */}
        <div className="border-t border-[rgba(104,90,90,0.12)] mb-6" />

        {/* External links */}
        <div className="flex gap-3 flex-wrap mb-8">
          <a
            href={instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold
                       px-4 py-2 rounded-full border border-[rgba(104,90,90,0.22)]
                       text-text hover:border-ink hover:text-ink
                       transition-colors cursor-pointer"
          >
            <AtSign size={13} />
            @{instagram.replace(/^@/, '')}
          </a>

          <a
            href="https://www.talabat.com/bahrain/gusto"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold
                       px-4 py-2 rounded-full border border-[rgba(104,90,90,0.22)]
                       text-text hover:border-ink hover:text-ink
                       transition-colors cursor-pointer"
          >
            <ExternalLink size={13} />
            Order on Talabat
          </a>
        </div>

        {/* Footer note */}
        <p
          className="text-text-muted"
          style={{ fontSize: '11px', letterSpacing: '0.04em' }}
        >
          All prices include VAT &nbsp;·&nbsp; Menu prices may vary
        </p>
      </div>
    </section>
  )
}
