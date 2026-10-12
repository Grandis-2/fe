import { Link } from 'react-router'

import { drawPath } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'

import { formatDrawMonthDay, getDrawSchedule } from '../../lib/drawSchedule'

import * as styles from './DrawCard.css'

import type { Draw, DrawPhase } from '../../model/draw'

// 카드는 회차 중 목록에 보이는 칸만 받는다.
export type DrawCardData = Pick<
  Draw,
  | 'drawId'
  | 'title'
  | 'gift'
  | 'entryFee'
  | 'winnerCount'
  | 'opensAt'
  | 'closesAt'
>

export type DrawCardProps = {
  data: DrawCardData
  className?: string
}

const badgeLabel = (phase: DrawPhase, opensAt: string) =>
  phase === 'SCHEDULED'
    ? `${formatDrawMonthDay(opensAt)} 오픈 예정`
    : phase === 'OPEN'
      ? '응모 중'
      : '마감'

// 럭키 드로우 목록 카드. 단계(응모 중·오픈 예정·마감)는 시작·마감 시각으로 정한다.
export function DrawCard({ data, className }: DrawCardProps) {
  const { drawId, title, gift, entryFee, winnerCount, opensAt, closesAt } = data
  const { phase, dday, urgent } = getDrawSchedule(data)
  const closeDay = formatDrawMonthDay(closesAt)

  return (
    <Link
      to={drawPath(drawId)}
      className={[styles.root, styles.phase[phase], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.thumb}>
        {gift.imageUrl && (
          <img src={gift.imageUrl} alt="" className={styles.image} />
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.badges}>
          <span className={styles.badge[phase]}>
            {badgeLabel(phase, opensAt)}
          </span>
          {dday && (
            <span className={styles.dday[urgent ? 'urgent' : 'normal']}>
              {dday}
            </span>
          )}
        </div>
        <span className={styles.title}>{title}</span>
        <span className={styles.meta}>
          {phase === 'SCHEDULED'
            ? `당첨 ${formatNumber(winnerCount)}명`
            : `당첨 ${formatNumber(winnerCount)}명 · 마감 ${closeDay}`}
        </span>
        <span className={styles.fee}>응모비 {formatNumber(entryFee)}원</span>
      </div>
    </Link>
  )
}
