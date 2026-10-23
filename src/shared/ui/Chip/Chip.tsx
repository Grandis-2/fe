import type { ButtonHTMLAttributes } from 'react'

import { X } from 'lucide-react'
import { Link } from 'react-router'

import * as styles from './Chip.css'

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  /**
   * 고른 칩의 모양. tint는 옅은 남색 바탕(사용자 페이지 필터), solid는 남색으로 꽉 채운다
   * (관리자 폼에서 여러 개 중 고른 걸 또렷하게 보일 때 — 상품 검색 태그, 배너 배지).
   */
  variant?: 'tint' | 'solid'
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
  variant = 'tint',
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
      className={[
        styles.root,
        variant === 'solid' && styles.solid,
        selected && styles.selected[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {label}
    </button>
  )
}
