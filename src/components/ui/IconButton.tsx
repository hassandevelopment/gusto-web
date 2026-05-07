import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  variant?: 'default' | 'ghost' | 'filled'
  size?: 'xs' | 'sm' | 'md'
}

const base =
  'inline-flex items-center justify-center rounded-full ' +
  'transition-[transform,background-color] duration-200 ' +
  'active:scale-[0.92] disabled:opacity-40 disabled:pointer-events-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer select-none'

const variants = {
  default: 'bg-card border border-[rgba(104,90,90,0.12)] text-text hover:bg-bg focus-visible:outline-accent-dark',
  ghost:   'bg-transparent text-text-muted hover:text-text hover:bg-card focus-visible:outline-accent-dark',
  filled:  'bg-accent-dark text-white hover:opacity-90 focus-visible:outline-accent-dark',
}

const sizes = {
  sm: 'w-9 h-9 min-w-[36px] min-h-[36px]',
  md: 'w-11 h-11 min-w-[44px] min-h-[44px]',
  xs: 'w-7 h-7 min-w-[28px] min-h-[28px]',
}

export default function IconButton({
  icon,
  label,
  variant = 'default',
  size = 'md',
  className = '',
  ...rest
}: Props) {
  return (
    <button
      aria-label={label}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  )
}
