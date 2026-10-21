import { srOnly } from '@shared/config/theme'

import * as styles from './ReservationProgress.css'

import type { ProgressStep } from '../../lib/progress'

export type ReservationProgressProps = {
  steps: ProgressStep[]
}

const toneText: Record<ProgressStep['tone'], string> = {
  done: '완료',
  now: '진행 중',
  warn: '기한 임박',
  stuck: '막힘',
  todo: '대기',
}

/** 예약이 어디까지 왔는지 — 어디서 멈췄는지가 한눈에 보이게 칸을 나란히 둔다 */
export function ReservationProgress({ steps }: ReservationProgressProps) {
  return (
    <ol className={styles.list}>
      {steps.map((step) => (
        <li key={step.key} className={styles.step[step.tone]}>
          <span className={styles.label[step.tone]}>
            {step.label}
            {/* 색만으로 구분하지 않게 상태를 읽어 준다. */}
            <span className={srOnly}>{` (${toneText[step.tone]})`}</span>
          </span>
          <span className={styles.detail}>{step.detail}</span>
        </li>
      ))}
    </ol>
  )
}
