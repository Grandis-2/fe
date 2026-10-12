import { Modal } from '@shared/ui'

import { usePreorderQueue } from '../../lib/usePreorderQueue'
import { PreorderQueueCard } from '../PreorderQueueCard'
import { QueuePill } from '../QueuePill'

import type { PreorderAdmission } from '../../model/preorderQueueStore'

export type PreorderQueueProps = {
  productId: string
  productName: string
  // 내 차례가 오면(모달이 닫혀 있어도) 입장권과 함께 호출된다.
  onComplete: (admission: PreorderAdmission) => void
  // 줄을 설 수 없으면(마감·오픈 전 등) 서버 문구와 함께 호출된다.
  onFail: (message: string) => void
}

// 대기열 한 번(줄 서기 → 대기 → 이동/나가기). 마운트되는 순간 줄을 서고 모달이 열린다 —
// 새로 줄을 세우려면 여는 쪽이 key를 바꿔 다시 마운트한다.
// 모달을 닫아도(나가기 X) 순번 조회는 계속되고 그동안 QueuePill이 떠 있다.
export function PreorderQueue({
  productId,
  productName,
  onComplete,
  onFail,
}: PreorderQueueProps) {
  const queue = usePreorderQueue({ productId, onComplete, onFail })

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
