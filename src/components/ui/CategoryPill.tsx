import { useState } from 'react'
import GustoPlaceholder from '../ui/GustoPlaceholder'

interface Props {
  label: string
  image?: string
  active?: boolean
  onClick?: () => void
}

export default function CategoryPill({ label, image, active = false, onClick }: Props) {
  const [imgErr, setImgErr] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex items-center gap-2 pl-1.5 pr-4 rounded-2xl border ' +
        'min-h-[52px] whitespace-nowrap select-none cursor-pointer ' +
        'transition-[background-color,color,border-color,box-shadow] duration-200 ' +
        'active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ' +
        (active
          ? 'bg-ink text-white border-ink shadow-sm'
          : 'bg-card text-text-muted border-[rgba(104,90,90,0.18)] hover:border-ink/40 hover:text-ink')
      }
    >
      {/* Category thumbnail */}
      <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 my-1.5">
        {image && !imgErr ? (
          <img
            src={image}
            alt=""
            className={`w-full h-full object-cover transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-85'}`}
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <GustoPlaceholder />
        )}
      </div>

      {/* Label */}
      <span
        className="font-semibold"
        style={{ fontSize: '10px', letterSpacing: '0.09em', textTransform: 'uppercase' }}
      >
        {label}
      </span>
    </button>
  )
}
