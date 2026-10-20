import { Link } from 'react-router'

import { useAdminDrawProgress, type AdminDraw } from '@entities/admin-draw'
import { ADMIN_DRAWS_PATH, adminDrawPath } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import { Skeleton } from '@shared/ui'

import { DrawProgressSteps } from '../DrawProgressSteps'

import * as styles from './DrawSummaryCard.css'

/**
 * 진행은 대시보드 다른 숫자보다 천천히 바뀌어 느리게 받는다. 결과가 반영되면 훅이 알아서
 * 멈춘다.
 */
const PROGRESS_INTERVAL_MS = 30_000

type DrawRowProps = {
  draw: Pick<
    AdminDraw,
    'drawId' | 'title' | 'opensAt' | 'closesAt' | 'winnerCount'
  >
  now: number
}

/** 회차 한 줄 — 이름·당첨·응모 인원과 진행 단계 막대 */
function DrawRow({ draw, now }: DrawRowProps) {
  const { data: progress } = useAdminDrawProgress(
    draw.drawId,
    PROGRESS_INTERVAL_MS,
  )
  // 응모를 시작한 사람 — 결제 확인 중·결제 대기 포함
  const entered = progress
    ? progress.paidEntries +
      progress.authorizingEntries +
      progress.awaitingEntries
    : null

  return (
    <li className={styles.row}>
      <div className={styles.rowHead}>
        <Link to={adminDrawPath(draw.drawId)} className={styles.name}>
          {draw.title}
        </Link>
        <span className={styles.figure}>
          당첨 <b>{formatNumber(draw.winnerCount)}</b>명 · 응모{' '}
          <b>{entered === null ? '—' : formatNumber(entered)}</b>명
        </span>
      </div>
      <DrawProgressSteps draw={draw} progress={progress} now={now} />
    </li>
  )
}

export type DrawSummaryCardProps = {
  draws: readonly AdminDraw[] | undefined
  isPending: boolean
  /** 단계를 판정할 기준 시각 — 다른 카드와 같은 순간으로 본다 */
  now: number
  /** 마감 뒤 이 시간 안의 회차까지 보인다(추첨·결과 반영을 지켜보는 동안) */
  recentMs: number
}

/**
 * 럭키드로우 요약 — 응모 중인 회차와 최근 마감한 회차가 어느 단계에 있는지. 회차가 많아
 * 카드 높이를 넘으면 목록만 안에서 스크롤한다.
 */
export function DrawSummaryCard({
  draws,
  isPending,
  now,
  recentMs,
}: DrawSummaryCardProps) {
  const open = (draws ?? []).filter((draw) => draw.phase === 'OPEN')
  // 마감한 회차는 최근 것부터 — 방금 마감해 추첨을 지켜볼 회차가 위로 온다.
  const recentlyClosed = (draws ?? [])
    .filter((draw) => {
      const sinceClose = now - Date.parse(draw.closesAt)
      return draw.phase === 'CLOSED' && sinceClose > 0 && sinceClose < recentMs
    })
    .toSorted((a, b) => Date.parse(b.closesAt) - Date.parse(a.closesAt))
  // 응모 중은 마감 임박 순
  const visible = [
    ...open.toSorted((a, b) => Date.parse(a.closesAt) - Date.parse(b.closesAt)),
    ...recentlyClosed,
  ]

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
      ) : visible.length === 0 ? (
        <div className={styles.empty}>진행 중인 회차가 없어요.</div>
      ) : (
        <ul className={styles.list}>
          {visible.map((draw) => (
            <DrawRow key={draw.drawId} draw={draw} now={now} />
          ))}
        </ul>
      )}
    </section>
  )
}
