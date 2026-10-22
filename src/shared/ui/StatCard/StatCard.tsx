import type { ReactNode } from 'react'

import { srOnly } from '@shared/config/theme'

import { Skeleton } from '../Skeleton'

import * as styles from './StatCard.css'

export type StatCardProps = {
  label: ReactNode
  value: ReactNode
  /** 값 아래 한 줄 설명(정가·할인율, 남은 시간 등) */
  caption?: ReactNode
  /**
   * 값이 실제 수치가 아닐 때 켠다(집계 조회 실패 등).
   * 흐린 글씨로 보여 0건과 구분된다.
   */
  muted?: boolean
  /** 불러오는 중 — value 대신 회색 막대를 깐다('—'·'조회 실패'와 섞이지 않게) */
  loading?: boolean
  className?: string
}

export function StatCard({
  label,
  value,
  caption,
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
        // 카드마다 live 영역을 두면 여러 장이 한꺼번에 읽힌다 — 값 자리의 글자로만 둔다.
        <div>
          <Skeleton width={72} height={30} />
          <span className={srOnly}>불러오는 중</span>
        </div>
      ) : (
        <div className={muted ? styles.valueMuted : styles.value}>{value}</div>
      )}
      {caption && <div className={styles.caption}>{caption}</div>}
    </div>
  )
}
