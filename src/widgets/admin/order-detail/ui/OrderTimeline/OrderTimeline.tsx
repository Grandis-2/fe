import {
  adminOrderStatusLabel,
  orderActorLabel,
  orderEventReasonLabel,
  type AdminOrderEvent,
} from '@entities/admin-order'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { Tag } from '@shared/ui'

import * as styles from './OrderTimeline.css'

export type OrderTimelineProps = {
  events: AdminOrderEvent[]
}

/** 주문 상태 이력. 서버가 매긴 번호 순으로 위에서 아래로 쌓는다 */
export function OrderTimeline({ events }: OrderTimelineProps) {
  if (events.length === 0) {
    return <div className={styles.empty}>이력이 없습니다.</div>
  }

  const ordered = events.toSorted((a, b) => a.eventSequence - b.eventSequence)
  return (
    <ol className={styles.list}>
      {ordered.map((event) => {
        const reason = orderEventReasonLabel(event)
        return (
          <li key={event.eventSequence} className={styles.item}>
            <span className={styles.time}>
              {formatDotDateTime(event.createdAt)}
            </span>
            <div className={styles.body}>
              <span className={styles.change}>
                {event.fromStatus
                  ? `${adminOrderStatusLabel[event.fromStatus]} → ${adminOrderStatusLabel[event.toStatus]}`
                  : adminOrderStatusLabel[event.toStatus]}
              </span>
              <Tag variant="outline" color="primary" size="small">
                {orderActorLabel[event.actor]}
              </Tag>
              {reason && <span className={styles.reason}>{reason}</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
