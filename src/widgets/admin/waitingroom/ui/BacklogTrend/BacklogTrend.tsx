import { useReservationStatsHistory } from '@entities/admin-reservation'
import { srOnly } from '@shared/config/theme'
import { formatNumber } from '@shared/lib/formatNumber'
import { slopePerSecond } from '@shared/lib/samples'

import * as styles from './BacklogTrend.css'

export type BacklogTrendProps = {
  /** 빼면 전체 */
  productId?: string
  /** 앞에 붙일 말(예: '외부 등록 대기') */
  prefix?: string
}

/** 늘고 있다고 볼 분당 증가 — 대시보드 판정과 같은 기준 */
const RISING_PER_MINUTE = 1

/**
 * 외부 등록 대기 건수와 최근 1분 추이(↑ 늘어남 · → 그대로 · ↓ 줄어듦). 숫자보다 방향이
 * 중요하다 — 오픈 직후엔 많아도 줄고 있으면 괜찮다. 늘고 있을 때만 눈에 띄게 칠한다.
 * 집계는 화면이 받고, 여기는 받은 표본을 읽기만 한다.
 */
export function BacklogTrend({ productId, prefix }: BacklogTrendProps) {
  const history = useReservationStatsHistory(productId).map(
    ({ at, value }) => ({ at, value: value.preorders.PENDING_SYNC }),
  )
  const latest = history.at(-1)?.value
  const slope = slopePerSecond(history, 60_000).at(-1)?.value
  const perMinute = slope === undefined ? null : slope * 60
  const trend =
    perMinute === null
      ? null
      : perMinute >= RISING_PER_MINUTE
        ? 'up'
        : perMinute <= -RISING_PER_MINUTE
          ? 'down'
          : 'flat'

  if (latest === undefined) return <span className={styles.root}>—</span>

  return (
    <span className={trend === 'up' ? styles.rising : styles.root}>
      {prefix && `${prefix} `}
      {formatNumber(latest)}건
      {trend && (
        <>
          {' '}
          <span aria-hidden="true">
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
          <span className={srOnly}>
            {trend === 'up'
              ? '늘고 있음'
              : trend === 'down'
                ? '줄고 있음'
                : '그대로'}
          </span>
        </>
      )}
    </span>
  )
}
