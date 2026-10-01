import type { ReactNode } from 'react'

import * as styles from './SegmentedTabs.css'

export type SegmentedTabItem<T extends string> = {
  value: T
  label: ReactNode
}

export type SegmentedTabsProps<T extends string> = {
  items: readonly SegmentedTabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={styles.tab[item.value === value ? 'active' : 'inactive']}
          aria-pressed={item.value === value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
