import { useMemo } from 'react'

import { Timer } from 'lucide-react'

import { productPath } from '@shared/config/routes'
import { useCountdown } from '@shared/lib/useCountdown'
import { Button } from '@shared/ui'

import {
  admissionUsableUntil,
  joinPreorderQueue,
  usePreorderQueueStore,
} from '../../model/preorderQueueStore'

import * as styles from './AdmissionTimer.css'

export type AdmissionTimerProps = {
  productId: string
  productName: string
}

// 30초 아래로 남으면 경고색으로 바꿔 서두르게 한다.
const URGENT_SECONDS = 30

// 차례가 와서 받은 입장권의 남은 시간(90~120초). 옵션을 고르다 시간이 지나면 목록으로 보내지 않고
// 이 자리에서 다시 줄을 세운다. 이 상품의 입장권이 없으면 그리지 않는다.
export function AdmissionTimer({
  productId,
  productName,
}: AdmissionTimerProps) {
  const admission = usePreorderQueueStore((state) => state.admission)
  if (admission?.productId !== productId) return null
  return (
    <Countdown
      key={admission.admissionTicket}
      usableUntil={admissionUsableUntil(admission)}
      productId={productId}
      productName={productName}
    />
  )
}

function Countdown({
  usableUntil,
  productId,
  productName,
}: AdmissionTimerProps & { usableUntil: number }) {
  const clearAdmission = usePreorderQueueStore((state) => state.clearAdmission)
  // useCountdown이 매 렌더 새 Date로 타이머를 다시 걸지 않게 값이 바뀔 때만 만든다.
  const target = useMemo(() => new Date(usableUntil), [usableUntil])
  const { minutes, seconds, isOver } = useCountdown(target)

  if (isOver)
    return (
      <div className={[styles.root, styles.tone.warning].join(' ')}>
        <Timer size={16} aria-hidden="true" />
        <span className={styles.text}>
          예약 가능 시간이 지났어요. 다시 줄을 서면 차례가 왔을 때 이 화면으로
          돌아와요.
        </span>
        <Button
          size="small"
          onClick={() => {
            clearAdmission()
            joinPreorderQueue({
              productId,
              productName,
              to: productPath(productId),
            })
          }}
        >
          다시 줄 서기
        </Button>
      </div>
    )

  const urgent = minutes === '00' && Number(seconds) < URGENT_SECONDS
  // 1초마다 바뀌는 숫자라 읽어 주는 영역(aria-live)으로 두지 않는다 — role="timer"는 기본으로 읽지 않는다.
  return (
    <div
      role="timer"
      className={[styles.root, styles.tone[urgent ? 'warning' : 'normal']].join(
        ' ',
      )}
    >
      <Timer size={16} aria-hidden="true" />
      <span className={styles.text}>
        <span className={styles.time}>
          {minutes}:{seconds}
        </span>{' '}
        안에 사전예약을 눌러 주세요. 시간이 지나면 다시 줄을 서야 해요.
      </span>
    </div>
  )
}
