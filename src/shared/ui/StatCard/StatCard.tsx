import type { ReactNode } from 'react'

import { Skeleton } from '../Skeleton'

import * as styles from './StatCard.css'

export type StatCardProps = {
  label: ReactNode
  value: ReactNode
  /**
   * 값이 실제 수치가 아닐 때 켠다(집계 조회 실패 등).
   * 흐린 글씨로 보여 0건과 구분된다.
   */
  muted?: boolean
  /** 불러오는 중 — 값 자리에 회색 막대를 깐다(value는 스크린리더용으로만 읽힌다) */
  loading?: boolean
  className?: string
}

export function StatCard({
  label,
  value,
  muted,
  loading = false,
  className,
}: StatCardProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-busy={loading || undefined}
    >
      <div className={styles.label}>{label}</div>
      {loading ? (
        <Skeleton width={72} height={30} />
      ) : (
        <div className={muted ? styles.valueMuted : styles.value}>{value}</div>
      )}
    </div>
  )
}
