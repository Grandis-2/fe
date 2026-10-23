import type {
  ReservationDetail,
  ReservationDisplayStatus,
} from '@entities/preorder'

import * as styles from './PurchaseSteps.css'

type PurchaseStepsProps = {
  reservation: Pick<ReservationDetail, 'displayStatus'>
}

// current: 이 단계가 지금 진행 중일 때 아래에 붙는 말.
const STEPS = [
  { label: '예약 접수', current: '진행 중' },
  { label: '예약 처리', current: '진행 중' },
  { label: '구매 확정', current: '직접 진행 필요' },
  { label: '결제 완료', current: '진행 중' },
] as const

// 화면 단계별로 지금 진행 중인 단계(STEPS의 위치). 결제가 끝났으면 전부 완료다.
// 기한이 지났거나 취소된 예약은 더 나아갈 단계가 없어 그리지 않는다.
const currentStep: Partial<Record<ReservationDisplayStatus, number>> = {
  RECEIVED: 1,
  PROCESSING: 1,
  PAYABLE: 2,
  PAYMENT_IN_PROGRESS: 2,
  RESERVED: STEPS.length,
}

// 사전예약이 접수 → 처리(외부 등록) → 구매 확정 → 결제 완료 중 어디까지 왔는지 보여 준다.
export function PurchaseSteps({ reservation }: PurchaseStepsProps) {
  const current = currentStep[reservation.displayStatus]
  if (current === undefined) return null

  return (
    <ol className={styles.steps}>
      {STEPS.map((step, index) => {
        const state =
          index < current ? 'done' : index === current ? 'current' : 'todo'
        return (
          <li
            key={step.label}
            className={styles.step}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <div className={styles.bar[state]} />
            <div className={styles.stepTexts}>
              <span className={styles.stepLabel[state]}>{step.label}</span>
              <span className={styles.stepSub}>
                {state === 'done'
                  ? '완료'
                  : state === 'current'
                    ? step.current
                    : '대기'}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
