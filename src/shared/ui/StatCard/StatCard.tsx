import type { ReactNode } from 'react'

import * as styles from './StatCard.css'

export type StatCardProps = {
  label: ReactNode
  value: ReactNode
  /**
   * 값이 실제 수치가 아닐 때 켠다(집계 조회 실패 등).
   * 흐린 글씨로 보여 0건과 구분된다.
   */
  muted?: boolean
  className?: string
}

export function StatCard({ label, value, muted, className }: StatCardProps) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.label}>{label}</div>
      <div className={muted ? styles.valueMuted : styles.value}>{value}</div>
    </div>
  )
}
