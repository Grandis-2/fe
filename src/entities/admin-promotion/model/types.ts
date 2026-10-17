import type {
  AdminPromotionStatus,
  AdminPromotionUpsertRequest,
  AdminPromotionView,
} from '@shared/api/types'
import { parseDateOnly } from '@shared/lib/parseDateOnly'
import type { UploadedImage } from '@shared/ui'

/**
 * 사전예약 프로모션. 백엔드에 아직 API가 없어 프론트가 제안한 모양(DTO)을 그대로
 * 쓴다 — 모양이 같아 매퍼 없이 다시 내보낸다.
 */
export type PromotionStatus = AdminPromotionStatus

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

export type AdminPromotion = AdminPromotionView

/** 프로모션에 연결할 수 있는 사전예약 상품 */
export type PromotionLinkableProduct = {
  productId: string
  name: string
  /** '9/20 12:00 오픈' 처럼 이미 다듬어진 문구 */
  openAtLabel: string
  /** 상세를 아직 못 받았거나 그 축이 없으면 비어 있다 */
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

// 사진은 아직 올릴 곳(업로드 API)이 없어 미리보기 주소를 그대로 싣는다 — 목업이
// 메모리에 들고 있는 동안만 보인다.
const toUploaded = (url: string, index: number): UploadedImage => ({
  id: `${index}-${url}`,
  url,
  name: url.split('/').pop() ?? '',
})

/** 수정 화면이 쓸 초기값 */
export const toPromotionFormValue = (
  promotion: AdminPromotion,
): AdminPromotionFormValue => ({
  name: promotion.name,
  startAt: promotion.startAt,
  endAt: promotion.endAt,
  thumbnail: promotion.thumbnailUrl
    ? toUploaded(promotion.thumbnailUrl, 0)
    : null,
  detailImages: promotion.detailImageUrls.map(toUploaded),
  linkedProductIds: promotion.linkedProductIds,
})

export const toPromotionRequest = (
  value: AdminPromotionFormValue,
): AdminPromotionUpsertRequest => ({
  name: value.name.trim(),
  startAt: value.startAt,
  endAt: value.endAt,
  linkedProductIds: value.linkedProductIds,
  thumbnailUrl: value.thumbnail?.url ?? null,
  detailImageUrls: value.detailImages.map((image) => image.url),
})
