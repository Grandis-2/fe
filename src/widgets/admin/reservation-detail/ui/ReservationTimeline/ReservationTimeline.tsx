import {
  actorLabel,
  preorderStatusLabel,
  type ReservationEvent,
} from '@entities/admin-reservation'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { Tag } from '@shared/ui'

import * as styles from './ReservationTimeline.css'

export type ReservationTimelineProps = {
  events: ReservationEvent[]
}

/** 상태 이력. 서버가 매긴 번호 순으로 위에서 아래로 쌓는다 */
export function ReservationTimeline({ events }: ReservationTimelineProps) {
  if (events.length === 0) {
    return <div className={styles.empty}>이력이 없습니다.</div>
  }

  const ordered = events.toSorted((a, b) => a.eventSequence - b.eventSequence)
  return (
    <ol className={styles.list}>
      {ordered.map((event) => (
        <li key={event.eventSequence} className={styles.item}>
          <span className={styles.time}>
            {formatDotDateTime(event.createdAt)}
          </span>
          <div className={styles.body}>
            <span className={styles.change}>
              {event.fromStatus
                ? `${preorderStatusLabel[event.fromStatus]} → ${preorderStatusLabel[event.toStatus]}`
                : preorderStatusLabel[event.toStatus]}
            </span>
            <Tag variant="outline" color="primary" size="small">
              {actorLabel[event.actor]}
            </Tag>
            {event.reason && (
              <span className={styles.reason}>{event.reason}</span>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
