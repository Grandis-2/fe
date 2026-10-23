import { useCountdown } from '@shared/lib/useCountdown'

import * as styles from './PurchaseDeadline.css'

type PurchaseDeadlineProps = {
  // 렌더마다 새 Date를 넘기면 useCountdown의 타이머가 계속 새로 걸린다 — 고정된 값을 넘긴다.
  dueAt: Date
}

const pad = (value: number) => String(value).padStart(2, '0')

// 예약만 접수되고 결제는 아직인 주문 — 구매 확정 마감까지 남은 시간을 보여 준다.
export function PurchaseDeadline({ dueAt }: PurchaseDeadlineProps) {
  const { days, hours, minutes, seconds, isOver } = useCountdown(dueAt)
  const dueText = dueAt.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className={styles.deadline}>
      <div className={styles.deadlineTexts}>
        <span className={styles.deadlineTitle}>
          {isOver ? '구매 확정 기한이 지났어요' : '구매 확정 마감까지'}
        </span>
        <span className={styles.deadlineDate}>{dueText}까지</span>
      </div>
      {/* 마감이 정확히 24시간이면 훅이 days=1, hours=0으로 쪼개므로 시간 단위로 합친다. */}
      {!isOver && (
        <span className={styles.countdown}>
          {pad(days * 24 + hours)}:{minutes}:{seconds}
        </span>
      )}
    </div>
  )
}
