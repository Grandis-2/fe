import {
  drawStageOf,
  drawStageSteps,
  type AdminDraw,
  type AdminDrawProgress,
} from '@entities/admin-draw'
import { untilClose } from '@features/open-preorder-picker'
import { formatNumber } from '@shared/lib/formatNumber'

import * as styles from './DrawProgressSteps.css'

type StepState = 'done' | 'current' | 'warning' | 'todo'

type Step = (typeof drawStageSteps)[number]

// 칸이 좁아 상세 화면의 단계 이름(drawStageLabel)보다 짧게 쓴다.
const stepLabel: Record<Step, string> = {
  OPEN: '응모 중',
  WAITING_PAYMENT: '결제 확인',
  DRAWING: '추첨',
  SETTLED: '결과 반영',
}

/** 마감 뒤 몇 분·시간째인지 */
const elapsedSince = (iso: string, now: number) => {
  const minutes = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000))
  if (minutes < 60) return `${minutes}분째`
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분째`
}

/** 마감까지 — 'D-2'·'곧 마감'은 그대로, 시간이면 '5시간 20분 남음' */
const closesIn = (closesAt: string, now: number) => {
  const left = untilClose(closesAt, now)
  return left.startsWith('D-') || left === '곧 마감' ? left : `${left} 남음`
}

export type DrawProgressStepsProps = {
  draw: Pick<AdminDraw, 'opensAt' | 'closesAt'>
  /** 아직 못 받았으면 시각만으로 단계를 나눈다 */
  progress: AdminDrawProgress | undefined
  now: number
}

/**
 * 회차의 진행 단계 막대 — 응모 중 → 결제 확인 → 추첨 → 결과 반영. 지금 단계는 막대를
 * 절반만 채우고, 칸마다 그 단계의 상태를 한 줄로 적는다. 마감 뒤 1시간이 넘도록 결과가
 * 없으면(STUCK) 추첨 칸을 경고로 그린다.
 */
export function DrawProgressSteps({
  draw,
  progress,
  now,
}: DrawProgressStepsProps) {
  const stage = drawStageOf(draw, progress, now)
  // 결과 지연은 따로 칸이 없다 — 추첨 단계에서 멈춘 것으로 그린다. 시작 전은 어느 칸도 아니다.
  const current =
    stage === 'SCHEDULED'
      ? -1
      : drawStageSteps.indexOf(stage === 'STUCK' ? 'DRAWING' : stage)

  const stateOf = (index: number): StepState => {
    // 결과까지 반영됐으면 마지막 단계도 끝난 것으로 본다.
    if (index < current || (stage === 'SETTLED' && index === current))
      return 'done'
    if (index === current) return stage === 'STUCK' ? 'warning' : 'current'
    return 'todo'
  }

  const subOf = (step: Step, state: StepState) => {
    if (state === 'todo') return '대기'
    switch (step) {
      case 'OPEN':
        return state === 'done' ? '마감' : closesIn(draw.closesAt, now)
      case 'WAITING_PAYMENT':
        return state === 'done'
          ? '완료'
          : `${formatNumber(progress?.authorizingEntries ?? 0)}건 확인 중`
      case 'DRAWING':
        if (state === 'warning')
          return `지연 · ${elapsedSince(draw.closesAt, now)}`
        return state === 'done' ? '완료' : '진행 중'
      case 'SETTLED':
        return `당첨 ${formatNumber(progress?.winners ?? 0)}명`
    }
  }

  return (
    <ol className={styles.root} aria-label="진행 단계">
      {drawStageSteps.map((step, index) => {
        const state = stateOf(index)
        return (
          <li
            key={step}
            className={styles.step}
            aria-current={index === current ? 'step' : undefined}
          >
            <div className={styles.bar[state]} aria-hidden="true" />
            <span className={styles.label[state]}>{stepLabel[step]}</span>
            <span className={styles.sub[state]}>{subOf(step, state)}</span>
          </li>
        )
      })}
    </ol>
  )
}
