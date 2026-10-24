import { QueueCard } from '@entities/order'
import { formatNumber } from '@shared/lib/formatNumber'
import { InlineAlert, PollingNotice } from '@shared/ui'

import type { PreorderQueueState } from '../../lib/usePreorderQueue'

export type PreorderQueueCardProps = {
  queue: Pick<
    PreorderQueueState,
    | 'myOrder'
    | 'waitTime'
    | 'totalWaiting'
    | 'admitPerMinute'
    | 'progressPercent'
    | 'leave'
    | 'poll'
    | 'mayHaveLeftQueue'
  >
}

// 대기열 모달의 내용 — 제목·상품명은 PreorderQueue가 Modal에 넘긴다.
// 조회가 실패하면 순번은 마지막 값을 그대로 두고 위에 안내만 띄운다. 오래 끊겼으면 자리를 장담하지 않는다.
export function PreorderQueueCard({ queue }: PreorderQueueCardProps) {
  return (
    <>
      {queue.mayHaveLeftQueue ? (
        <InlineAlert status="warning">
          연결이 오래 끊겨 줄에서 빠졌을 수 있어요. 연결되면 바로 다시
          확인할게요.
        </InlineAlert>
      ) : (
        <PollingNotice query={queue.poll} />
      )}
      <QueueCard
        myOrderNumber={
          queue.myOrder === null ? '-' : formatNumber(queue.myOrder)
        }
        waitTime={queue.waitTime}
        progressPercent={queue.progressPercent}
        totalWaitingCount={
          queue.totalWaiting === null ? '-' : formatNumber(queue.totalWaiting)
        }
        admitPerMinute={queue.admitPerMinute}
        onLeave={queue.leave}
      />
    </>
  )
}
