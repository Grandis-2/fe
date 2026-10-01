import { QueueCard } from '@/entities/order'
import { formatNumber } from '@/shared/lib/formatNumber'

import { usePreorderQueue } from '../../model/usePreorderQueue'

export type PreorderQueueCardProps = {
  productName: string
  // 앞 대기 인원이 0이 되면 호출된다.
  onComplete: () => void
}

export function PreorderQueueCard({
  productName,
  onComplete,
}: PreorderQueueCardProps) {
  const { myOrder, totalWaiting, progressPercent } =
    usePreorderQueue(onComplete)

  return (
    <QueueCard
      headline="조금만 기다려주세요,"
      headlineAccent="곧 예약 페이지로 이동합니다."
      productName={productName}
      myOrderNumber={formatNumber(myOrder)}
      progressPercent={progressPercent}
      totalWaitingCount={formatNumber(totalWaiting)}
    />
  )
}
