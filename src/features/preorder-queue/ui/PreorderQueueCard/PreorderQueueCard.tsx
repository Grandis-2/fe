import { QueueCard } from '@entities/order'
import { formatNumber } from '@shared/lib/formatNumber'
import { ModalTitle } from '@shared/ui'

import * as styles from './PreorderQueueCard.css'

import type { PreorderQueueState } from '../../lib/usePreorderQueue'

export type PreorderQueueCardProps = {
  productName: string
  queue: Pick<
    PreorderQueueState,
    'myOrder' | 'waitTime' | 'totalWaiting' | 'progressPercent' | 'leave'
  >
}

// 대기열 모달의 내용 — Modal 안에 넣어 쓴다(제목이 dialog의 이름이 된다).
export function PreorderQueueCard({
  productName,
  queue,
}: PreorderQueueCardProps) {
  return (
    <div className={styles.root}>
      <ModalTitle className={styles.title}>
        조금만 기다려주세요,
        <br />곧 예약 페이지로 이동합니다.
      </ModalTitle>
      <div className={styles.productName}>{productName}</div>
      <QueueCard
        className={styles.card}
        myOrderNumber={formatNumber(queue.myOrder)}
        waitTime={queue.waitTime}
        progressPercent={queue.progressPercent}
        totalWaitingCount={formatNumber(queue.totalWaiting)}
        onLeave={queue.leave}
      />
    </div>
  )
}
