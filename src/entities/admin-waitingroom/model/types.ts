import type {
  AdmissionRateView,
  ProductRate,
  ProductStatus,
  WaitingroomRuntime,
  WaitingroomPhase,
  WaitingroomSetting,
  WaitingroomStatusView,
} from '@shared/api/types'

// 서버 응답과 화면이 쓰는 모양이 같아서 매퍼 없이 그대로 재노출한다.
export type WaitingroomStatus = WaitingroomStatusView
export type WaitingroomProductStatus = ProductStatus
export type AdmissionRates = AdmissionRateView
export type WaitingroomProductRate = ProductRate
export type { WaitingroomSetting }

/** 운영값 범위(서버 검증과 같다). 전역·상품 상한의 최댓값은 응답의 maxGlobalCredit */
export const MAX_WAIT_SECONDS_RANGE = { min: 1, max: 86_400 } as const
export const LEAVE_GRACE_SECONDS_RANGE = { min: 250, max: 1_800 } as const

/** 서버 기본값 — 되돌리기 버튼 옆에 무엇으로 돌아가는지 보여준다 */
export const WAITINGROOM_DEFAULTS = {
  globalCredit: 150,
  productCap: 150,
  leaveGraceSeconds: 250,
} as const

export const waitingroomRuntimeLabel: Record<WaitingroomRuntime, string> = {
  IDLE: '줄 없음',
  QUEUEING: '대기 중',
  DRAINING: '곧 비워짐',
  HIDDEN: '비공개',
  CLOSED: '마감',
}

export const waitingroomRuntimeColor: Record<
  WaitingroomRuntime,
  'gray' | 'yellow' | 'blue' | 'red'
> = {
  IDLE: 'gray',
  QUEUEING: 'yellow',
  DRAINING: 'blue',
  HIDDEN: 'red',
  CLOSED: 'gray',
}

export const waitingroomRuntimeLabels = Object.values(waitingroomRuntimeLabel)

export const waitingroomPhaseLabel: Record<WaitingroomPhase, string> = {
  BEFORE_OPEN: '오픈 전',
  OPEN: '접수 중',
  CLOSED: '마감',
}

export const settingSourceLabel: Record<WaitingroomSetting['source'], string> =
  {
    DEFAULT: '기본값',
    OPERATIONAL: '운영값',
  }

/** 브레이크가 걸렸는지 — 1이면 브레이크 없음, 낮을수록 예약 서버 문제로 입장을 줄인 것 */
export const isBraking = (brakeFactor: number | null) =>
  brakeFactor !== null && brakeFactor < 1
