import type { TagProps } from '@shared/ui'

import { getDrawPhase } from './drawSchedule'

import type { DrawEntry, MyDrawEntryState } from '../model/draw'

// none 응모하지 않음 · unpaid 응모비 결제 전 · authorizing 결제 확인 중 · missed 결제 없이 마감(추첨 대상 아님)
// waiting 응모 완료(결과 발표 전) · won 당첨 · lost 낙첨.
export type DrawEntryState =
  'none' | 'unpaid' | 'authorizing' | 'missed' | 'waiting' | 'won' | 'lost'

// 내 응모(없으면 null)를 화면 단계로 — 명세의 status × result 표를 한 곳에서 푼다.
export function getDrawEntryState(
  entry: Pick<DrawEntry, 'status' | 'result' | 'draw'> | null | undefined,
  now = new Date(),
): DrawEntryState {
  if (!entry) return 'none'
  if (entry.status === 'AUTHORIZING') return 'authorizing'
  if (entry.status === 'AWAITING_PAYMENT')
    return getDrawPhase(entry.draw, now) === 'CLOSED' ? 'missed' : 'unpaid'
  if (entry.result === 'WON') return 'won'
  return entry.result === 'LOST' ? 'lost' : 'waiting'
}

// 내 응모 목록 카드의 상태 태그 하나(문구·색) — 서버가 준 state 그대로 고른다.
export const drawEntryTag: Record<
  MyDrawEntryState,
  { label: string; color: TagProps['color'] }
> = {
  AWAITING_PAYMENT: { label: '결제 대기', color: 'yellow' },
  PAYMENT_CONFIRMING: { label: '결제 확인 중', color: 'yellow' },
  CLOSED_UNPAID: { label: '응모 미완료', color: 'gray' },
  AWAITING_RESULT: { label: '발표 대기', color: 'gray' },
  WON: { label: '당첨', color: 'primary' },
  LOST: { label: '미당첨', color: 'gray' },
}
