import type { Draw, DrawPhase, DrawProgress } from '@shared/api/types'
import { formatDistance } from '@shared/lib/formatDistance'

// 서버 응답과 화면이 쓰는 모양이 같아서 매퍼 없이 그대로 재노출한다.
export type AdminDraw = Draw
export type AdminDrawProgress = DrawProgress
export type AdminDrawPhase = DrawPhase

export const drawPhaseLabel: Record<DrawPhase, string> = {
  SCHEDULED: '시작 전',
  OPEN: '응모 중',
  CLOSED: '마감',
}

// 예약 현황과 같은 기준 — 아직(회색), 진행 중(남색 테두리), 끝남(남색 바탕).
export const drawPhaseColor: Record<DrawPhase, 'primary' | 'gray'> = {
  SCHEDULED: 'gray',
  OPEN: 'primary',
  CLOSED: 'primary',
}

export const drawPhaseVariant: Record<DrawPhase, 'subtle' | 'outline'> = {
  SCHEDULED: 'subtle',
  OPEN: 'outline',
  CLOSED: 'subtle',
}

// 객체 키 순서가 필터 순서다.
export const drawPhases = Object.keys(drawPhaseLabel) as DrawPhase[]

/** 응모 중인 회차가 이만큼 안 남았으면 마감을 강조한다 */
const CLOSING_SOON_MS = 24 * 60 * 60 * 1000

/**
 * 지금 기준으로 회차의 다음(또는 지난) 시각 — "3일 뒤 시작", "7시간 뒤 마감", "6일 전 마감".
 * 마감 뒤 결과까지는 목록 응답에 없어 마감 시각만 말한다(추첨 진행은 회차 상세).
 */
export function drawTimingOf(
  draw: Pick<Draw, 'phase' | 'opensAt' | 'closesAt'>,
  now: number,
): { text: string; soon: boolean } {
  const opensIn = Date.parse(draw.opensAt) - now
  const closesIn = Date.parse(draw.closesAt) - now
  // 단계는 목록을 받은 때의 값이라, 화면을 열어 둔 채 경계를 넘으면 시각만 지나 있다 — 그러면 지난 쪽으로 말한다.
  if (draw.phase === 'SCHEDULED') {
    return opensIn > 0
      ? { text: `${formatDistance(opensIn)} 뒤 시작`, soon: false }
      : { text: `${formatDistance(opensIn)} 전 시작`, soon: false }
  }
  if (draw.phase === 'OPEN') {
    return closesIn > 0
      ? {
          text: `${formatDistance(closesIn)} 뒤 마감`,
          soon: closesIn < CLOSING_SOON_MS,
        }
      : { text: `${formatDistance(closesIn)} 전 마감`, soon: false }
  }
  return { text: `${formatDistance(closesIn)} 전 마감`, soon: false }
}
