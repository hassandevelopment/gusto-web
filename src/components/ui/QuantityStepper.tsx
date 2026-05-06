import { Minus, Plus } from 'lucide-react'
import IconButton from './IconButton'

interface Props {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  itemName?: string
}

export default function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  itemName = 'item',
}: Props) {
  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label={`Quantity for ${itemName}`}>
      <IconButton
        icon={<Minus size={16} strokeWidth={2} />}
        label={`Decrease quantity of ${itemName}`}
        variant="default"
        size="sm"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      />

      <span
        className="min-w-[32px] text-center text-sm font-semibold text-text tabular-nums select-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>

      <IconButton
        icon={<Plus size={16} strokeWidth={2} />}
        label={`Increase quantity of ${itemName}`}
        variant="default"
        size="sm"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      />
    </div>
  )
}
