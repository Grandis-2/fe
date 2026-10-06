import { Modal } from '@shared/ui'

import { usePreorderQueue } from '../../lib/usePreorderQueue'
import { PreorderQueueCard } from '../PreorderQueueCard'
import { QueuePill } from '../QueuePill'

export type PreorderQueueProps = {
  productName: string
  // 모달을 보고 있을 때 내 차례가 오면 호출된다.
  onComplete: () => void
}

// 대기열 한 번(줄 서기 → 대기 → 이동/나가기/만료). 마운트되는 순간 줄을 서고 모달이 열린다 —
// 새로 줄을 세우려면 여는 쪽이 key를 바꿔 다시 마운트한다.
// 모달을 닫으면(나가기 X) 순번이 5분 유지되고 그동안 QueuePill이 떠 있다.
export function PreorderQueue({ productName, onComplete }: PreorderQueueProps) {
  const queue = usePreorderQueue(onComplete)

  return (
    <>
      <Modal open={queue.isOpen} onClose={queue.close}>
        <PreorderQueueCard productName={productName} queue={queue} />
      </Modal>
      {!queue.isOpen && !queue.hasLeft && (
        <QueuePill productName={productName} queue={queue} />
      )}
    </>
  )
}
