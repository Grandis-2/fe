import { Link } from 'react-router'

import {
  drawStageOf,
  useAdminDrawProgress,
  type AdminDraw,
} from '@entities/admin-draw'
import { ADMIN_DRAWS_PATH, adminDrawPath } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import { Skeleton, Tag } from '@shared/ui'

import * as styles from './DrawSummaryCard.css'

/** 응모 중인 회차의 진행은 대시보드 다른 숫자보다 천천히 바뀌어 느리게 받는다 */
const PROGRESS_INTERVAL_MS = 30_000

type DrawRowProps = {
  draw: Pick<AdminDraw, 'drawId' | 'title' | 'opensAt' | 'closesAt' | 'phase'>
  now: number
}

/** 회차 한 줄 — 응모 중이면 결제 전환, 마감 뒤 결과가 안 나왔으면 멈춤 표시 */
function DrawRow({ draw, now }: DrawRowProps) {
  const open = draw.phase === 'OPEN'
  const { data: progress } = useAdminDrawProgress(
    draw.drawId,
    open ? PROGRESS_INTERVAL_MS : false,
  )
  if (!progress) return null

  if (!open) {
    if (drawStageOf(draw, progress, now) !== 'STUCK') return null
    return (
      <li className={styles.stuckRow}>
        <Link to={adminDrawPath(draw.drawId)} className={styles.name}>
          {draw.title}
        </Link>
        <Tag variant="subtle" color="yellow" rounded={false}>
          추첨 멈춤
        </Tag>
      </li>
    )
  }

  // 응모를 시작한 사람(결제 대기·확인 중 포함) 중 응모비를 낸 비율
  const entered =
    progress.paidEntries +
    progress.authorizingEntries +
    progress.awaitingEntries
  const rate = entered ? (progress.paidEntries / entered) * 100 : 0
  const rateLabel = `${rate.toFixed(1)}%`
  return (
    <li className={styles.row}>
      <div className={styles.rowHead}>
        <Link to={adminDrawPath(draw.drawId)} className={styles.name}>
          {draw.title} · 응모 → 결제
        </Link>
        <span className={styles.figure}>
          <b>{formatNumber(progress.paidEntries)}</b> / {formatNumber(entered)}
          명 · <b>{rateLabel}</b>
        </span>
      </div>
      <div
        className={styles.track}
        role="img"
        aria-label={`결제 완료 ${rateLabel}`}
      >
        <div className={styles.bar} style={{ width: `${rate}%` }} />
      </div>
    </li>
  )
}

export type DrawSummaryCardProps = {
  draws: readonly AdminDraw[] | undefined
  isPending: boolean
  /** 멈춤을 판정할 기준 시각 — 다른 카드와 같은 순간으로 본다 */
  now: number
  /** 마감 뒤 이 시간 안의 회차만 멈췄는지 본다 */
  stuckLookbackMs: number
}

/** 럭키드로우 요약 — 응모 중인 회차의 결제 전환과, 마감 뒤 결과가 안 나온 회차 */
export function DrawSummaryCard({
  draws,
  isPending,
  now,
  stuckLookbackMs,
}: DrawSummaryCardProps) {
  const open = (draws ?? []).filter((draw) => draw.phase === 'OPEN')
  const recentlyClosed = (draws ?? []).filter((draw) => {
    const sinceClose = now - Date.parse(draw.closesAt)
    return (
      draw.phase === 'CLOSED' && sinceClose > 0 && sinceClose < stuckLookbackMs
    )
  })

  return (
    <section className={styles.root} aria-labelledby="ops-draws">
      <div className={styles.header}>
        <h2 id="ops-draws" className={styles.title}>
          럭키드로우 · 진행 {open.length}회차
        </h2>
        <Link to={ADMIN_DRAWS_PATH} className={styles.link}>
          럭키드로우 관리
        </Link>
      </div>
      {isPending ? (
        <Skeleton height={72} />
      ) : !draws ? (
        <div className={styles.empty}>회차를 불러오지 못했어요.</div>
      ) : open.length + recentlyClosed.length === 0 ? (
        <div className={styles.empty}>응모 중인 회차가 없어요.</div>
      ) : (
        <ul className={styles.list}>
          {[...open, ...recentlyClosed].map((draw) => (
            <DrawRow key={draw.drawId} draw={draw} now={now} />
          ))}
        </ul>
      )}
    </section>
  )
}
