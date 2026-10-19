import { CircleCheck, LoaderCircle, TriangleAlert } from 'lucide-react'

import { syncErrorCause } from '@entities/admin-reservation'
import { formatNumber } from '@shared/lib/formatNumber'

import { GRACE_SECONDS } from '../../lib/recoveryStatus'

import * as styles from './SentRunList.css'

import type { SentRun } from '../../model/sentRun'

export type SentRunListProps = {
  /** 최근에 보낸 것부터 */
  runs: readonly SentRun[]
  /** 지금 원인(오류 코드)별 재처리 필요 건수 — 가장 최근 기록의 결과에 쓴다 */
  failuresByCode: Readonly<Record<string, number>>
  /** 판정 기준 시각(받은 집계 시각) */
  now: number
}

const timeOf = (ms: number) =>
  new Date(ms).toLocaleTimeString('ko-KR', { hour12: false })

/**
 * 보낸 기록 — PR 확인처럼 처리 중이면 돌고, 끝나면 결과 표시로 바뀐다. 서버가 묶음별
 * 성공·실패를 주지 않아(백엔드 요청서 R6) 처리 중인지는 예상 시간으로, 결과는 그 원인의
 * 남은 실패 수로 보인다 — 그래서 결과는 가장 최근 기록에만 붙인다(앞 기록은 뒤 기록과 섞인다).
 */
export function SentRunList({ runs, failuresByCode, now }: SentRunListProps) {
  if (runs.length === 0) return null

  return (
    <ol className={styles.root} aria-label="보낸 기록">
      {runs.map((run, index) => {
        const doneAt = run.at + run.estimatedSeconds * 1000
        const inFlight = now <= doneAt + GRACE_SECONDS * 1000
        const secondsLeft = Math.max(0, Math.ceil((doneAt - now) / 1000))
        const latest = index === 0
        const remaining = Object.keys(run.byErrorCode).reduce(
          (total, code) => total + (failuresByCode[code] ?? 0),
          0,
        )
        const state = inFlight
          ? 'pending'
          : !latest
            ? 'done'
            : remaining === 0
              ? 'success'
              : 'left'
        const Icon =
          state === 'pending'
            ? LoaderCircle
            : state === 'left'
              ? TriangleAlert
              : CircleCheck
        const causes = Object.entries(run.byErrorCode)
          .map(
            ([code, count]) =>
              `${syncErrorCause(code).label} ${formatNumber(count)}`,
          )
          .join(' · ')

        return (
          <li key={run.at} className={styles.row}>
            <Icon className={styles.icon[state]} size={20} aria-hidden="true" />
            <div className={styles.text}>
              <div className={styles.title}>
                {timeOf(run.at)} · {formatNumber(run.targetCount)}건 다시 보냄
                <span className={styles.causes}>{causes}</span>
              </div>
              <div className={styles.status[state]}>
                {state === 'pending'
                  ? `처리 중 · ${secondsLeft > 0 ? `약 ${formatNumber(secondsLeft)}초 남음` : '마무리하는 중'}`
                  : state === 'done'
                    ? '처리 끝'
                    : // 보낸 것이 또 실패한 수가 아니다 — 같은 원인의 새 실패도 섞인다(R6 전까지).
                      `처리 끝 · 같은 원인 실패 지금 ${formatNumber(remaining)}건 (새로 생긴 실패 포함)`}
                {latest &&
                  run.skippedCount > 0 &&
                  ` · 조건 밖이라 건너뛴 ${formatNumber(run.skippedCount)}건`}
                {latest &&
                  run.capped &&
                  ' · 원인마다 1,000건까지라 남은 실패는 다시 보내세요'}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
