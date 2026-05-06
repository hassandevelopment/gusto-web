import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverable?: boolean
  className?: string
}

export default function Card({ children, hoverable = false, className = '', ...rest }: Props) {
  const hoverClass = hoverable
    ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover active:scale-[0.99]'
    : ''

  return (
    <div
      className={
        `bg-card rounded-[12px] border border-[rgba(104,90,90,0.12)] shadow-card ` +
        `transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ` +
        `${hoverClass} ${className}`
      }
      {...rest}
    >
      {children}
    </div>
  )
}
