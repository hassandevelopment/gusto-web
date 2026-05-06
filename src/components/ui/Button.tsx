import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'add'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-1 rounded-full font-semibold ' +
  'transition-[transform,box-shadow,background-color,opacity,color,border-color] duration-200 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'active:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none ' +
  'select-none cursor-pointer whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent-dark text-white shadow-pill ' +
    'hover:-translate-y-px hover:shadow-card-hover ' +
    'focus-visible:outline-accent-dark',
  ghost:
    'border border-accent-dark text-accent-dark bg-transparent ' +
    'hover:bg-accent-dark hover:text-white ' +
    'focus-visible:outline-accent-dark',
  add:
    'border border-ink/20 text-ink bg-transparent ' +
    'hover:border-ink/50 hover:bg-ink hover:text-white ' +
    'focus-visible:outline-ink',
}

const sizes: Record<Size, string> = {
  sm: 'text-[11px] tracking-wide px-2.5 min-h-[26px]',
  md: 'text-sm px-5 min-h-[44px]',
  lg: 'text-base px-7 min-h-[52px]',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
