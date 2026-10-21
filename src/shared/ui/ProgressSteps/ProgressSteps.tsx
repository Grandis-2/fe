import { srOnly } from '@shared/config/theme'

import * as styles from './ProgressSteps.css'

/** 끝남 / 지금 진행 중 / 곧 기한 / 막힘 / 아직 */
export type ProgressTone = 'done' | 'now' | 'warn' | 'stuck' | 'todo'

export type ProgressStep = {
  key: string
  label: string
  /** 칸 아래 한 줄 — 시각·남은 시간·시도 횟수 */
  detail: string
  tone: ProgressTone
}

export type ProgressStepsProps = {
  steps: ProgressStep[]
}

const toneText: Record<ProgressStep['tone'], string> = {
  done: '완료',
  now: '진행 중',
  warn: '기한 임박',
  stuck: '막힘',
  todo: '대기',
}

/**
 * 일이 어디까지 왔는지(예약·럭키드로우 회차) — 어디서 멈췄는지가 한눈에 보이게 칸을
 * 나란히 둔다. 끝난 칸은 남색 바탕, 지금 칸은 테두리, 막힌 칸은 빨간 테두리.
 */
export function ProgressSteps({ steps }: ProgressStepsProps) {
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
