import type {
  AdminPromotionStatus,
  AdminPromotionUpsertRequest,
  AdminPromotionView,
  PromotionLinkableProductView,
} from '@shared/api/types'
import { parseDateOnly } from '@shared/lib/parseDateOnly'
import type { UploadedImage } from '@shared/ui'

/** 사전예약 프로모션(홍보). 화면이 쓰는 모양이 응답과 같아 매퍼 없이 다시 내보낸다 */
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
export type PromotionLinkableProduct = Pick<
  PromotionLinkableProductView,
  'productId' | 'colors' | 'storages'
> & {
  name: string
  /** '9/20 12:00 오픈' 처럼 이미 다듬어진 문구 */
  openAtLabel: string
}

const pad = (value: number) => String(value).padStart(2, '0')

const openAtLabel = (opensAt: string | null) => {
  if (!opensAt) return '회차 미정'
  const date = new Date(opensAt)
  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())} 오픈`
}

export const toPromotionLinkableProduct = ({
  productId,
  title,
  opensAt,
  colors,
  storages,
}: PromotionLinkableProductView): PromotionLinkableProduct => ({
  productId,
  name: title,
  openAtLabel: openAtLabel(opensAt),
  colors,
  storages,
})

/** 생성·수정 폼이 다루는 값 */
export type AdminPromotionFormValue = {
  name: string
  startDate: string
  endDate: string
  thumbnail: UploadedImage | null
  detailImages: UploadedImage[]
  linkedProductIds: string[]
}

export const createEmptyPromotionFormValue = (): AdminPromotionFormValue => ({
  name: '',
  startDate: '',
  endDate: '',
  thumbnail: null,
  detailImages: [],
  linkedProductIds: [],
})

// 서버가 묶는 상품 수 상한
export const PROMOTION_PRODUCTS_MAX = 20

// Intl의 ko-KR은 '9. 15.'로 찍혀서 화면 문구와 달라 직접 만든다.
const monthDay = (value: string) => {
  const date = parseDateOnly(value)
  return date ? `${date.getMonth() + 1}/${date.getDate()}` : '미정'
}

/** 목록의 '9/15 ~ 9/21' */
export const formatPromotionPeriod = ({ startDate, endDate }: AdminPromotion) =>
  `${monthDay(startDate)} ~ ${monthDay(endDate)}`

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
  startDate: promotion.startDate,
  endDate: promotion.endDate,
  thumbnail: toUploaded(promotion.thumbnailUrl, 0),
  detailImages: promotion.detailImageUrls.map(toUploaded),
  // 지운 상품은 응답에서 빠져 있어 그대로 다시 보내도 된다.
  linkedProductIds: promotion.products.map((product) => product.productId),
})

// 올라가는 중·실패한 사진은 url이 미리보기 주소(blob:)라 보내면 400이다.
const imageProblem = (images: UploadedImage[]) =>
  images.some((image) => image.status === 'uploading')
    ? '사진을 올리는 중입니다. 다 올라간 뒤에 다시 눌러 주세요.'
    : images.some((image) => image.status === 'error')
      ? '올리지 못한 사진이 있습니다. 다시 올리거나 빼 주세요.'
      : null

/** 보내기 전에 막을 문제. 없으면 null — 서버도 같은 칸으로 400을 준다 */
export function promotionFormProblem(
  value: AdminPromotionFormValue,
): string | null {
  if (!value.name.trim()) return '사전예약명을 입력해 주세요.'
  if (!value.startDate || !value.endDate) return '진행 기간을 선택해 주세요.'
  if (!value.thumbnail) return '썸네일 이미지를 올려 주세요.'
  const images = imageProblem([value.thumbnail, ...value.detailImages])
  if (images) return images
  if (value.linkedProductIds.length === 0) return '연결할 상품을 골라 주세요.'
  if (value.linkedProductIds.length > PROMOTION_PRODUCTS_MAX)
    return `상품은 ${PROMOTION_PRODUCTS_MAX}개까지 연결할 수 있습니다.`
  return null
}

// promotionFormProblem을 통과한 값만 온다.
export const toPromotionRequest = (
  value: AdminPromotionFormValue,
): AdminPromotionUpsertRequest => ({
  name: value.name.trim(),
  startDate: value.startDate,
  endDate: value.endDate,
  thumbnailUrl: value.thumbnail?.url ?? '',
  detailImageUrls: value.detailImages.map((image) => image.url),
  productIds: value.linkedProductIds,
})
