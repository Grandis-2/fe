import {
  ChevronRight,
  Gauge,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router'

import { ADMIN_WAITINGROOM_PATH } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import { TrendChart } from '@shared/ui'

import { backlogTrend, type BacklogTrend } from '../../lib/backlogTrend'

import * as styles from './BacklogCard.css'

const trendIcon: Record<BacklogTrend['status'], typeof TrendingUp> = {
  rising: TrendingUp,
  falling: TrendingDown,
  steady: Minus,
  measuring: Gauge,
}

const valueOf = (count: number | null, unit = '') =>
  count === null ? '—' : `${formatNumber(count)}${unit}`

export type BacklogCardProps = {
  /** 지금 외부 등록 대기(PENDING_SYNC). 못 받았으면 null */
  backlog: number | null
  /** 분당 변화(늘면 +). 표본이 모자라면 null */
  perMinute: number | null
  /** 대기 건수 기록 — 화면을 연 뒤부터 */
  history: { times: readonly number[]; values: readonly number[] }
  /** 서버가 부하로 대기열 입장을 줄이는 중 */
  braking: boolean
  /** 예약 흐름 — 대기열 인원, 결제 대기(REGISTERED), 결제 완료(RESERVED) */
  flow: {
    waiting: number | null
    payable: number | null
    reserved: number | null
  }
}

/**
 * 외부 등록 대기 카드 — "얼마나 밀렸나, 언제 풀리나". 판정 문장을 먼저 크게 두고, 아래에
 * 대기 건수 추이와 예약이 지나가는 흐름(대기열 → 외부 등록 대기 → 결제 대기 → 결제 완료)을
 * 둔다. 늘고 있으면 대기열 입장 속도 조절로 바로 보낸다.
 */
export function BacklogCard({
  backlog,
  perMinute,
  history,
  braking,
  flow,
}: BacklogCardProps) {
  // 지금 건수를 못 받았으면 추이만으로 '대기 없음'이라 말하지 않는다.
  const trend = backlogTrend({
    backlog: backlog ?? 0,
    perMinute: backlog === null ? null : perMinute,
  })
  const TrendIcon = trendIcon[trend.status]
  const rising = trend.status === 'rising'

  const steps = [
    { key: 'waiting', label: '대기열', value: valueOf(flow.waiting, '명') },
    { key: 'backlog', label: '외부 등록 대기', value: valueOf(backlog) },
    { key: 'payable', label: '결제 대기', value: valueOf(flow.payable) },
    { key: 'reserved', label: '결제 완료', value: valueOf(flow.reserved) },
  ]

  return (
    <section className={styles.root} aria-labelledby="ops-backlog">
      <div className={styles.header}>
        <h2 id="ops-backlog" className={styles.title}>
          외부 등록 대기
        </h2>
        <span className={styles.caption}>5초마다 측정</span>
      </div>

      <div className={styles.verdict[trend.status]}>
        <div className={styles.verdictMain}>
          <span className={styles.big}>
            {valueOf(backlog)}
            <span className={styles.bigUnit}>건 대기</span>
          </span>
          <span className={styles.trend}>
            <TrendIcon
              className={styles.trendIcon[trend.status]}
              aria-hidden="true"
            />
            {trend.headline}
          </span>
        </div>
        <div className={styles.verdictSide}>
          <span className={styles.hint}>{trend.hint}</span>
          {braking && (
            <span className={styles.braking}>
              서버 부하로 입장을 줄이는 중이에요
            </span>
          )}
        </div>
        {rising && (
          <Link to={ADMIN_WAITINGROOM_PATH} className={styles.action}>
            입장 속도 조절
          </Link>
        )}
      </div>

      <TrendChart
        times={history.times}
        values={history.values}
        unit="건"
        label="외부 등록 대기 건수"
        tone={rising ? 'warning' : 'primary'}
      />

      <ol className={styles.flow} aria-label="예약 흐름">
        {steps.map((step, index) => (
          <li key={step.key} className={styles.flowItem}>
            {index > 0 && (
              <ChevronRight className={styles.flowArrow} aria-hidden="true" />
            )}
            <span
              className={
                step.key === 'backlog'
                  ? styles.flowCurrent[trend.status]
                  : styles.flowStep
              }
            >
              <span className={styles.flowLabel}>{step.label}</span>
              <span className={styles.flowValue}>{step.value}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
