import type {
  AdmissionRateView,
  CapacityGuide,
  ProductRate,
  ProductStatus,
  SettingChange,
  SettingChangeKind,
  WaitingroomRuntime,
  WaitingroomSetting,
  WaitingroomStatusView,
} from '@shared/api/types'

// 상한(cap)은 운영값이 없으면 null이다 — 기본 숫자를 응답에서 알 수 없어서 채우지 않는다.
export type WaitingroomProductStatus = ProductStatus
export type WaitingroomStatus = Omit<WaitingroomStatusView, 'products'> & {
  products: WaitingroomProductStatus[]
}
export type AdmissionRates = AdmissionRateView
export type AdmissionCapacity = CapacityGuide
export type WaitingroomSettingChange = SettingChange

/** 변경 이력의 운영값 이름 — 상품 상한은 화면이 상품 이름을 앞에 붙인다 */
export const settingChangeKindLabel: Record<SettingChangeKind, string> = {
  GLOBAL_CREDIT: '전역 입장 속도',
  PRODUCT_CREDIT: '입장 상한',
  LEAVE_GRACE: '자리 지켜 주기',
  MAX_WAIT: '최대 대기 시간',
}

/** 변경 이력 값의 단위 — 속도는 명/초, 시간은 초 */
export const settingChangeUnit: Record<SettingChangeKind, string> = {
  GLOBAL_CREDIT: '명/초',
  PRODUCT_CREDIT: '명/초',
  LEAVE_GRACE: '초',
  MAX_WAIT: '초',
}
export type WaitingroomProductRate = ProductRate
export type { WaitingroomSetting }

/**
 * 서버 기본값 중 명세와 맞는 것만 둔다. 입장 속도·상품 상한의 기본값은 여기 두지 않는다 —
 * 명세 문서(150)와 서버 실제 값(2026-10-21에 15로 낮춤)이 어긋나서, 화면은 운영값 응답의
 * source가 DEFAULT일 때 그 value를 기본값으로 보여 주고, 바꾼 상태라 모르면 "서버 기본값"이라고만 쓴다.
 */
export const WAITINGROOM_DEFAULTS = {
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
