import type {
  AdmissionRateView,
  ProductRate,
  ProductStatus,
  WaitingroomRuntime,
  WaitingroomSetting,
  WaitingroomStatusView,
} from '@shared/api/types'

// 상한(cap)만 서버가 비워 보낼 수 있어 기본값으로 채운 모양을 쓴다(toWaitingroomStatus).
export type WaitingroomProductStatus = Omit<ProductStatus, 'cap'> & {
  cap: number
}
export type WaitingroomStatus = Omit<WaitingroomStatusView, 'products'> & {
  products: WaitingroomProductStatus[]
}
export type AdmissionRates = AdmissionRateView
export type WaitingroomProductRate = ProductRate
export type { WaitingroomSetting }

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

export const settingSourceLabel: Record<WaitingroomSetting['source'], string> =
  {
    DEFAULT: '기본값',
    OPERATIONAL: '운영값',
  }

/** 브레이크가 걸렸는지 — 1이면 브레이크 없음, 낮을수록 예약 서버 문제로 입장을 줄인 것 */
export const isBraking = (brakeFactor: number | null) =>
  brakeFactor !== null && brakeFactor < 1
