import type {
  AdminProductListItem,
  AdminProductResponse,
  PreorderSaleStatus,
} from '@shared/api/types'

import type {
  AdminDisplayStatus,
  AdminProduct,
  AdminProductDetailModel,
} from '../model/types'

/**
 * 전시 상태를 한 값으로 모은다 — 서버는 두 불리언과 접수 단계로 알려 준다. 목록과
 * 상세가 같은 규칙을 써야 해서 둘 다 여기를 거친다.
 *
 * 준비가 안 끝났으면(registrationCompleted false) 공개로 골라 뒀어도 회원에게
 * 보이지 않으므로 그 상태가 먼저다. 사전예약은 공개로 둬도 접수 기간에만 보여서,
 * 기간 밖이면 공개 예정·공개 종료로 나눈다 — '공개 중'이라고 하면 지금 보이는 줄 안다.
 */
const toDisplayStatus = ({
  visible,
  registrationCompleted,
  stage,
}: {
  visible: boolean
  registrationCompleted: boolean
  /** 사전예약 접수 단계. 일반 상품이거나 회차가 아직 없으면 null */
  stage: PreorderSaleStatus | null | undefined
}): AdminDisplayStatus => {
  if (!registrationCompleted) return 'DRAFT'
  if (!visible) return 'HIDDEN'
  if (stage === 'BEFORE_OPEN') return 'SCHEDULED'
  if (stage === 'CLOSED') return 'ENDED'
  return 'PUBLISHED'
}

/**
 * 관리자 목록 한 줄을 화면이 쓰는 모양으로 바꾼다.
 *
 * 판매 상태(status)와 사전예약 접수 단계(preorderStatus)는 서버가 나눠 주는 대로
 * 둘 다 들고 있는다 — 다른 축이라 하나로 합치면 '판매 중지인데 접수 중'처럼 서로
 * 어긋난 경우를 화면에서 못 보여준다.
 */
export const toAdminProduct = (item: AdminProductListItem): AdminProduct => ({
  productId: item.productId,
  name: item.title,
  saleMode: item.saleMode,
  optionCount: item.optionCount,
  opensAt: item.opensAt,
  closesAt: item.closesAt,
  status: item.status,
  preorderStatus: item.preorderStatus,
  displayStatus: toDisplayStatus({ ...item, stage: item.preorderStatus }),
  minPrice: item.minPrice,
  minListPrice: item.minListPrice,
  discountRate: item.discountRate,
  soldOut: item.soldOut,
  brand: item.brand,
  modelName: item.modelName,
  thumbnailUrl: item.imageUrl,
})

// 빈 조각은 버린다 — '삼성,,갤럭시'나 끝 콤마에서 빈 태그가 생기지 않게.
const splitTags = (tags: string | null) =>
  (tags ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

/** 관리자 상세를 화면이 쓰는 모양으로 편다 */
export const toAdminProductDetail = ({
  product,
  tags,
  registration,
}: AdminProductResponse): AdminProductDetailModel => ({
  productId: product.productId,
  name: product.title,
  brand: product.brand,
  modelName: product.modelName,
  saleMode: product.saleMode,
  status: product.status,
  campaign: product.campaign,
  basePrice: product.basePrice,
  discountRate: product.discountRate,
  optionAxes: product.optionAxes,
  variants: product.variants,
  description: product.description,
  warranty: product.warranty,
  images: product.images,
  categoryId: product.categoryId,
  tags: splitTags(tags),
  registrationCompleted: registration.completed,
  displayStatus: toDisplayStatus({
    visible: product.visible,
    registrationCompleted: registration.completed,
    stage: product.campaign?.status,
  }),
})
