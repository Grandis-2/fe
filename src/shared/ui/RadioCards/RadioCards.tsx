import { useId, type ReactNode } from 'react'

import * as styles from './RadioCards.css'

export type RadioCardItem<T extends string> = {
  value: T
  label: string
  /** 카드 안 설명 — 고르기 전에 차이를 읽을 수 있게 한두 줄로 */
  description?: ReactNode
}

export type RadioCardsProps<T extends string> = {
  /** 묶음의 이름(스크린리더가 읽는다) */
  label: string
  items: readonly RadioCardItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/**
 * 설명이 붙은 하나 고르기. 드롭다운은 고르기 전엔 차이가 안 보여서, 고를 것이 두세 개뿐이고
 * 차이를 알아야 고를 수 있을 때 카드로 펼친다. 안은 진짜 radio라 화살표 키로 옮겨 다닌다.
 */
export function RadioCards<T extends string>({
  label,
  items,
  value,
  onChange,
  className,
}: RadioCardsProps<T>) {
  const name = useId()
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={[styles.root, className].filter(Boolean).join(' ')}
    >
      {items.map((item) => (
        <label key={item.value} className={styles.card}>
          <input
            type="radio"
            name={name}
            className={styles.input}
            checked={item.value === value}
            onChange={() => onChange(item.value)}
          />
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.text}>
            <span className={styles.label}>{item.label}</span>
            {item.description && (
              <span className={styles.description}>{item.description}</span>
            )}
          </span>
        </label>
      ))}
    </div>
  )
}
