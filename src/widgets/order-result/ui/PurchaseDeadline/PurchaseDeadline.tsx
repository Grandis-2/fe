import { useCountdown } from '@shared/lib/useCountdown'

import * as styles from './PurchaseDeadline.css'

type PurchaseDeadlineProps = {
  // 렌더마다 새 Date를 넘기면 useCountdown의 타이머가 계속 새로 걸린다 — 고정된 값을 넘긴다.
  dueAt: Date
}

const pad = (value: number) => String(value).padStart(2, '0')

// 예약 접수 → 구매 확정 → 결제 완료 중 지금은 두 번째 단계 중간이다.
const STEPS = [
  { label: '예약 접수', sub: '완료', state: 'done' },
  { label: '구매 확정', sub: '직접 진행 필요', state: 'current' },
  { label: '결제 완료', sub: '대기', state: 'todo' },
] as const

// 예약만 접수되고 결제는 아직인 주문 — 구매 확정 마감까지 남은 시간과 진행 단계를 보여 준다.
export function PurchaseDeadline({ dueAt }: PurchaseDeadlineProps) {
  const { days, hours, minutes, seconds } = useCountdown(dueAt)
  const dueText = dueAt.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <>
      <div className={styles.deadline}>
        <div className={styles.deadlineTexts}>
          <span className={styles.deadlineTitle}>구매 확정 마감까지</span>
          <span className={styles.deadlineDate}>{dueText}까지</span>
        </div>
        {/* 마감이 정확히 24시간이면 훅이 days=1, hours=0으로 쪼개므로 시간 단위로 합친다. */}
        <span className={styles.countdown}>
          {pad(days * 24 + hours)}:{minutes}:{seconds}
        </span>
      </div>

      <ol className={styles.steps}>
        {STEPS.map((step) => (
          <li key={step.label} className={styles.step}>
            <div className={styles.bar[step.state]} />
            <div className={styles.stepTexts}>
              <span className={styles.stepLabel[step.state]}>{step.label}</span>
              <span className={styles.stepSub}>{step.sub}</span>
            </div>
          </li>
        ))}
      </ol>
    </>
  )
}
