import { parseDateOnly } from '@shared/lib/parseDateOnly'
import type { UploadedImage } from '@shared/ui'

/**
 * 사전예약 프로모션은 아직 API 명세가 없다. 화면부터 만들고 있어서
 * 여기 타입이 임시 계약 역할을 한다 — 명세가 나오면 shared/api/types에 DTO를
 * 만들고 이 파일은 그걸 재노출하는 형태로 바꾼다.
 */
export type PromotionStatus = 'SCHEDULED' | 'ONGOING' | 'ENDED'

export const promotionStatusLabel: Record<PromotionStatus, string> = {
  SCHEDULED: '진행 예정',
  ONGOING: '진행 중',
  ENDED: '종료',
}

export const promotionStatusColor: Record<
  PromotionStatus,
  'blue' | 'green' | 'gray'
> = {
  SCHEDULED: 'blue',
  ONGOING: 'green',
  ENDED: 'gray',
}

// Tag 너비를 가장 긴 문구에 맞출 때 쓴다.
export const promotionStatusLabels = Object.values(promotionStatusLabel)

/** 목록 한 줄 */
export type AdminPromotion = {
  promotionId: string
  name: string
  status: PromotionStatus
  /** 'YYYY-MM-DD' */
  startAt: string
  endAt: string
  linkedProductIds: string[]
  /** 고객에게 보여줄 프로모션 페이지 주소 — 링크 복사에 쓴다 */
  publicUrl: string
}

/** 프로모션에 연결할 수 있는 사전예약 상품 */
export type PromotionLinkableProduct = {
  productId: string
  name: string
  /** '9/20 12:00 오픈' 처럼 이미 다듬어진 문구 */
  openAtLabel: string
  colors: string[]
  storages: string[]
}

/** 생성·수정 폼이 다루는 값 */
export type AdminPromotionFormValue = {
  name: string
  startAt: string
  endAt: string
  thumbnail: UploadedImage | null
  detailImages: UploadedImage[]
  linkedProductIds: string[]
}

export const createEmptyPromotionFormValue = (): AdminPromotionFormValue => ({
  name: '',
  startAt: '',
  endAt: '',
  thumbnail: null,
  detailImages: [],
  linkedProductIds: [],
})

// Intl의 ko-KR은 '9. 15.'로 찍혀서 화면 문구와 달라 직접 만든다.
const monthDay = (value: string) => {
  const date = parseDateOnly(value)
  return date ? `${date.getMonth() + 1}/${date.getDate()}` : '미정'
}

/** 목록의 '9/15 ~ 9/21' */
export const formatPromotionPeriod = (promotion: AdminPromotion) => {
  if (!promotion.startAt || !promotion.endAt) return '미정'
  return `${monthDay(promotion.startAt)} ~ ${monthDay(promotion.endAt)}`
}
