import { useState } from 'react'

type StarRatingProps = {
  value: number | null | undefined
  count: number | undefined
  disabled?: boolean
  onRate?: (value: number) => void
}

export function StarRating({ value, count, disabled, onRate }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value ?? 0
  const total = typeof count === 'number' ? count : 0
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {stars.map(star => {
          const filled = display >= star - 0.25

          return (
            <button
              key={star}
              type="button"
              disabled={disabled || !onRate}
              onMouseEnter={() => !disabled && onRate && setHover(star)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onRate?.(star)}
              className="relative mx-[1px] text-lg leading-none disabled:cursor-default"
            >
              <span
                className={
                  'transition-colors ' +
                  (filled
                    ? 'text-[#F8BE00]'
                    : 'text-zinc-300 dark:text-zinc-700')
                }
              >
                ★
              </span>
            </button>
          )
        })}
      </div>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {value ? value.toFixed(1) : '–'} · {total || 0} ratings
      </span>
    </div>
  )
}


