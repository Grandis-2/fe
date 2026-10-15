import type { ButtonHTMLAttributes } from 'react'

import { X } from 'lucide-react'
import { Link } from 'react-router'

import * as styles from './Chip.css'

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  /** 라벨 옆에 붙는 개수(필터별 건수) */
  count?: number
  /** 주면 오른쪽에 X 버튼이 붙는다(최근 검색어). 버튼 안에 버튼을 둘 수 없어 겉을 span으로 감싼다. */
  onRemove?: () => void
  removeLabel?: string
  /** 주면 이동 링크로 그린다 — 새 탭으로 열기 등 링크 기본 동작이 남는다. */
  to?: string
}

export function Chip({
  selected = false,
  count,
  onRemove,
  removeLabel = '삭제',
  to,
  className,
  children,
  ...rest
}: ChipProps) {
  const label = (
    <>
      {children}
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className={[styles.root, className].filter(Boolean).join(' ')}
      >
        {label}
      </Link>
    )
  }

  if (onRemove) {
    return (
      <span
        className={[styles.root, styles.removable, className]
          .filter(Boolean)
          .join(' ')}
      >
        <button type="button" className={styles.removableLabel} {...rest}>
          {label}
        </button>
        <button
          type="button"
          className={styles.remove}
          aria-label={removeLabel}
          onClick={onRemove}
        >
          <X size={12} aria-hidden="true" />
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[styles.root, selected && styles.selected, className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {label}
    </button>
  )
}
