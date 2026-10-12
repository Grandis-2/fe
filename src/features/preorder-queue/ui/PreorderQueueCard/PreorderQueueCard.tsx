import { QueueCard } from '@entities/order'
import { formatNumber } from '@shared/lib/formatNumber'

import type { PreorderQueueState } from '../../lib/usePreorderQueue'

export type PreorderQueueCardProps = {
  queue: Pick<
    PreorderQueueState,
    'myOrder' | 'waitTime' | 'totalWaiting' | 'progressPercent' | 'leave'
  >
}

// 대기열 모달의 내용 — 제목·상품명은 PreorderQueue가 Modal에 넘긴다.
export function PreorderQueueCard({ queue }: PreorderQueueCardProps) {
  return (
    <QueueCard
      myOrderNumber={queue.myOrder === null ? '-' : formatNumber(queue.myOrder)}
      waitTime={queue.waitTime}
      progressPercent={queue.progressPercent}
      totalWaitingCount={
        queue.totalWaiting === null ? '-' : formatNumber(queue.totalWaiting)
      }
      onLeave={queue.leave}
    />
  )
}
