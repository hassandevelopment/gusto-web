interface Props {
  label: string
  active?: boolean
  onClick?: () => void
}

export default function CategoryPill({ label, active = false, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex items-center px-3 rounded-full text-xs whitespace-nowrap ' +
        'transition-[background-color,color,border-color] duration-200 min-h-[28px] ' +
        'active:scale-[0.96] select-none cursor-pointer focus-visible:outline-2 ' +
        'focus-visible:outline-offset-2 focus-visible:outline-ink border ' +
        (active
          ? 'bg-ink text-white font-semibold border-ink'
          : 'text-text-muted font-medium border-[rgba(104,90,90,0.22)] hover:border-ink/50 hover:text-ink')
      }
    >
      {label}
    </button>
  )
}
