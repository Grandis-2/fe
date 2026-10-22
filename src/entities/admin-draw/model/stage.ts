import type { AdminDraw, AdminDrawProgress } from './types'

/**
 * 회차가 지금 어디까지 왔는지. 서버의 phase는 마감까지만 알려줘서(추첨 여부는 없다)
 * 진행 조회 값을 더해 나눈다.
 * - WAITING_PAYMENT: 마감했지만 결제 확인 중인 응모가 남아 추첨을 못 한다
 * - DRAWING: 추첨하거나 결과를 반영하는 중
 * - STUCK: 마감 뒤 1시간이 넘도록 결과가 없다 — 명세상 정상이 아니라 개발팀에 알린다
 */
export type DrawStage =
  'SCHEDULED' | 'OPEN' | 'WAITING_PAYMENT' | 'DRAWING' | 'SETTLED' | 'STUCK'

/** 마감 뒤 이만큼 지나도 결과가 없으면 멈춘 것으로 본다(명세) */
export const DRAW_STUCK_AFTER_MS = 60 * 60 * 1000

export const drawStageLabel: Record<DrawStage, string> = {
  SCHEDULED: '응모 시작 전',
  OPEN: '응모 중',
  WAITING_PAYMENT: '결제 확인 대기',
  DRAWING: '추첨 중',
  SETTLED: '결과 반영 완료',
  STUCK: '결과 지연',
}

/** 진행을 아직 못 받았으면 시각만으로 나눈다(마감 뒤는 추첨 중으로 본다) */
export function drawStageOf(
  draw: Pick<AdminDraw, 'opensAt' | 'closesAt'>,
  progress: AdminDrawProgress | undefined,
  now: number,
): DrawStage {
  const closesAt = Date.parse(draw.closesAt)
  if (now < Date.parse(draw.opensAt)) return 'SCHEDULED'
  if (now < closesAt) return 'OPEN'
  if (progress?.settledAt) return 'SETTLED'
  if (now - closesAt > DRAW_STUCK_AFTER_MS) return 'STUCK'
  return progress && progress.authorizingEntries > 0
    ? 'WAITING_PAYMENT'
    : 'DRAWING'
}

/** 결과가 반영되면 더 바뀔 게 없다 — 자동 갱신을 멈춘다 */
export const isDrawSettled = (progress: AdminDrawProgress | undefined) =>
  Boolean(progress?.settledAt)
