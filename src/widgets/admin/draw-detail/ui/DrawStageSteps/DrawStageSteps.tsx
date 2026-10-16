import {
  drawStageDescription,
  drawStageLabel,
  drawStageSteps,
  type DrawStage,
} from '@entities/admin-draw'

import * as styles from './DrawStageSteps.css'

export type DrawStageStepsProps = {
  stage: DrawStage
}

type StepState = 'done' | 'current' | 'upcoming' | 'warning'

// 결과 지연은 따로 칸이 없다 — 추첨 단계에서 멈춘 것으로 그린다.
const positionOf = (stage: DrawStage) =>
  stage === 'SCHEDULED'
    ? -1
    : stage === 'STUCK'
      ? drawStageSteps.indexOf('DRAWING')
      : drawStageSteps.indexOf(stage)

/** 응모 중 → 결제 확인 대기 → 추첨 중 → 결과 반영. 지금 단계엔 설명을 붙인다 */
export function DrawStageSteps({ stage }: DrawStageStepsProps) {
  const current = positionOf(stage)
  // 결과까지 반영됐으면 마지막 단계도 끝난 것으로 본다.
  const stateOf = (index: number): StepState => {
    if (index < current || (stage === 'SETTLED' && index === current))
      return 'done'
    if (index === current) return stage === 'STUCK' ? 'warning' : 'current'
    return 'upcoming'
  }

  return (
    <div className={styles.root}>
      <ol className={styles.list}>
        {drawStageSteps.map((step, index) => {
          const state = stateOf(index)
          return (
            <li
              key={step}
              className={styles.step[state]}
              aria-current={index === current ? 'step' : undefined}
            >
              <span className={styles.dot[state]} aria-hidden="true" />
              {stage === 'STUCK' && index === current
                ? drawStageLabel.STUCK
                : drawStageLabel[step]}
            </li>
          )
        })}
      </ol>
      <div className={stage === 'STUCK' ? styles.warning : styles.description}>
        {drawStageDescription[stage]}
      </div>
    </div>
  )
}
