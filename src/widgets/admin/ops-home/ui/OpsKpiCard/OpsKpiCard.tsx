import type { ReactNode } from 'react'

import { Link } from 'react-router'

import { srOnly } from '@shared/config/theme'
import { Skeleton } from '@shared/ui'

import * as styles from './OpsKpiCard.css'

export type OpsKpiCardProps = {
  label: string
  /** 처리할 화면 — 카드 전체가 그리로 가는 링크다 */
  to: string
  /** 오른쪽 위에 적는 가는 곳 이름 */
  linkLabel: string
  /** 못 받았으면 null — '—'로 보여 0건과 구분한다 */
  value: number | null
  unit: string
  description?: ReactNode
  /** danger면 바탕까지 칠해 줄에서 먼저 보이게 한다 */
  tone?: 'default' | 'danger'
  loading?: boolean
}

/** 운영 대시보드 맨 위 숫자 카드 하나 — 영역마다 지금 가장 중요한 숫자 */
export function OpsKpiCard({
  label,
  to,
  linkLabel,
  value,
  unit,
  description,
  tone = 'default',
  loading = false,
}: OpsKpiCardProps) {
  return (
    <Link
      to={to}
      className={styles.root[tone]}
      aria-busy={loading || undefined}
    >
      <span className={styles.head}>
        {label}
        <span className={styles.linkLabel}>{linkLabel}</span>
      </span>
      {loading ? (
        <span>
          <Skeleton width={96} height={34} />
          <span className={srOnly}>불러오는 중</span>
        </span>
      ) : (
        <span className={styles.value}>
          {value === null ? '—' : value.toLocaleString('ko-KR')}
          {value !== null && <span className={styles.unit}>{unit}</span>}
        </span>
      )}
      {description && <span className={styles.description}>{description}</span>}
    </Link>
  )
}
