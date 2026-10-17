import type { Draw, DrawPhase, DrawProgress } from '@shared/api/types'

// 서버 응답과 화면이 쓰는 모양이 같아서 매퍼 없이 그대로 재노출한다.
export type AdminDraw = Draw
export type AdminDrawProgress = DrawProgress
export type AdminDrawPhase = DrawPhase

export const drawPhaseLabel: Record<DrawPhase, string> = {
  SCHEDULED: '시작 전',
  OPEN: '응모 중',
  CLOSED: '마감',
}

export const drawPhaseColor: Record<DrawPhase, 'blue' | 'green' | 'gray'> = {
  SCHEDULED: 'blue',
  OPEN: 'green',
  CLOSED: 'gray',
}

// 객체 키 순서가 필터 순서다.
export const drawPhases = Object.keys(drawPhaseLabel) as DrawPhase[]

// 표의 상태 열 너비를 가장 긴 문구에 맞출 때 쓴다(Tag의 widthOptions).
export const drawPhaseLabels = Object.values(drawPhaseLabel)
