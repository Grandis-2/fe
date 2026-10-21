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
  'productId' | 'saleMode' | 'opensAt' | 'colors' | 'storages'
> & {
  name: string
  /** '10.20 12:00 오픈' 처럼 이미 다듬어진 문구 */
  openAtLabel: string
}

const pad = (value: number) => String(value).padStart(2, '0')

const openAtLabel = ({
  saleMode,
  opensAt,
}: Pick<PromotionLinkableProductView, 'saleMode' | 'opensAt'>) => {
  if (saleMode === 'IN_STOCK')
    return '일반 상품으로 바뀜 — 고객에겐 바로 구매 카드로 보여요'
  if (!opensAt) return '회차 미정'
  const date = new Date(opensAt)
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())} 오픈`
}

export const toPromotionLinkableProduct = ({
  productId,
  title,
  saleMode,
  opensAt,
  colors,
  storages,
}: PromotionLinkableProductView): PromotionLinkableProduct => ({
  productId,
  name: title,
  saleMode,
  opensAt,
  openAtLabel: openAtLabel({ saleMode, opensAt }),
  colors,
  storages,
})

/**
 * 연결 상품의 지금 단계. 관리자 API는 오픈 시각만 줘서 접수 중·마감은 알 수 없다 —
 * 오픈 전·후까지만 나눈다.
 */
export type LinkedProductStage = 'inStock' | 'noRound' | 'beforeOpen' | 'opened'

export const linkedProductStage = (
  product: Pick<PromotionLinkableProduct, 'saleMode' | 'opensAt'>,
  now: number,
): LinkedProductStage => {
  if (product.saleMode === 'IN_STOCK') return 'inStock'
  if (!product.opensAt) return 'noRound'
  return new Date(product.opensAt).getTime() > now ? 'beforeOpen' : 'opened'
}

export const linkedProductStageLabel: Record<LinkedProductStage, string> = {
  beforeOpen: '오픈 전',
  opened: '오픈 후',
  noRound: '회차 미정',
  inStock: '일반 상품',
}

export const linkedProductStageColor: Record<
  LinkedProductStage,
  'blue' | 'gray' | 'yellow'
> = {
  beforeOpen: 'blue',
  opened: 'gray',
  noRound: 'gray',
  inStock: 'yellow',
}

export const linkedProductStageLabels = Object.values(linkedProductStageLabel)

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

// 서버 상한 — 묶는 상품, 상세 사진, 이름 글자 수
export const PROMOTION_PRODUCTS_MAX = 20
export const PROMOTION_DETAIL_IMAGES_MAX = 20
export const PROMOTION_NAME_MAX = 100

// Intl의 ko-KR은 '9. 15.'로 찍혀서 화면 문구와 달라 직접 만든다.
export const formatMonthDay = (value: string) => {
  const date = parseDateOnly(value)
  return date ? `${pad(date.getMonth() + 1)}.${pad(date.getDate())}` : '미정'
}

/** '10.20 – 10.31' */
export const formatPromotionPeriod = ({
  startDate,
  endDate,
}: Pick<AdminPromotion, 'startDate' | 'endDate'>) =>
  `${formatMonthDay(startDate)} – ${formatMonthDay(endDate)}`

const DAY = 86_400_000

/** 오늘 자정부터 그 날까지 며칠인지(지났으면 음수) */
const daysUntil = (value: string, now: number) => {
  const date = parseDateOnly(value)
  if (!date) return null
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return Math.round((date.getTime() - today.getTime()) / DAY)
}

/**
 * 노출 기간 아래 붙는 남은 날 — '9일 남음', '3일 뒤 시작', '종료'. 끝 날도 보이므로
 * 끝 날 당일은 '오늘까지'다. urgent면 곧 내려간다(3일 이하).
 */
export function promotionDue(
  promotion: Pick<AdminPromotion, 'status' | 'startDate' | 'endDate'>,
  now: number,
): { label: string; urgent: boolean } {
  if (promotion.status === 'ENDED') return { label: '종료', urgent: false }
  if (promotion.status === 'SCHEDULED') {
    const days = daysUntil(promotion.startDate, now)
    if (days === null) return { label: '', urgent: false }
    return {
      label: days <= 1 ? '내일 시작' : `${days}일 뒤 시작`,
      urgent: false,
    }
  }
  const days = daysUntil(promotion.endDate, now)
  if (days === null) return { label: '', urgent: false }
  return {
    label: days <= 0 ? '오늘까지' : `${days}일 남음`,
    urgent: days <= 3,
  }
}

/**
 * 고객 페이지에 상품이 제대로 안 보이는 사전예약. 끝난 사전예약은 보지 않는다.
 * 지운 상품은 응답에서 빠지므로 남은 상품이 0개일 수 있다.
 */
export function promotionProductProblem(
  promotion: Pick<AdminPromotion, 'status' | 'products'>,
): string | null {
  if (promotion.status === 'ENDED') return null
  if (promotion.products.length === 0)
    return '남은 연결 상품이 없어요 — 상품이 지워져 빠졌어요'
  if (promotion.products.every((product) => product.saleMode === 'IN_STOCK'))
    return '연결 상품이 모두 일반 상품으로 바뀌었어요'
  return null
}

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
