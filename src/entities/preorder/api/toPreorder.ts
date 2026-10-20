import type {
  PromotionDetailView,
  PromotionSummary,
  ShipmentBatch,
} from '@shared/api/types'

import type { Preorder } from '../model/preorder'
import type { PreorderCardData } from '../ui/PreorderCard'

const pad = (value: number) => String(value).padStart(2, '0')

// 서버는 ISO 시각(UTC)으로 준다 — 화면 규칙(getPreorderSchedule)은 로컬 날짜로 세므로 로컬로 바꾼다.
const localDate = (iso: string) => {
  const date = new Date(iso)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
const localTime = (iso: string) => {
  const date = new Date(iso)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 오픈·마감 시각은 묶인 상품이 없거나 사전예약 서비스가 답하지 않으면 null이다 — 그때는
// 홍보 기간으로 대신 센다(명세: 단계 표시 없이 그린다).
const periodOf = ({
  startDate,
  endDate,
  opensAt,
  closesAt,
}: PromotionSummary) => ({
  opensAt: opensAt ? localDate(opensAt) : startDate,
  closesAt: closesAt ? localDate(closesAt) : endDate,
})

export const toPreorderCard = (
  promotion: PromotionSummary,
): PreorderCardData => ({
  id: promotion.promotionId,
  imageSrc: promotion.thumbnailUrl,
  imageAlt: promotion.name,
  title: promotion.name,
  ...periodOf(promotion),
})

// 홍보 상세 → 사전예약 상세. 묶인 상품 하나가 모델 하나다. 혜택·결제 마감일은 명세에 없어
// 비워 두고, 출시일은 첫 사전예약 상품의 1차 배송 시작 예정일로 쓴다.
export const toPreorder = (
  promotion: PromotionDetailView,
  batches: ShipmentBatch[] = [],
): Preorder => ({
  id: promotion.promotionId,
  imageSrc: promotion.thumbnailUrl,
  imageAlt: promotion.name,
  title: promotion.name,
  ...periodOf(promotion),
  openTime: promotion.opensAt ? localTime(promotion.opensAt) : '00:00',
  releaseAt: batches[0]?.estimatedShipStart,
  detailImageSrcs: promotion.detailImageUrls,
  benefits: [],
  models: promotion.products.map((product) => ({
    id: product.productId,
    name: product.title,
    imageSrc: product.imageUrl ?? undefined,
    price: product.minPrice,
    productId: product.productId,
    ...(product.opensAt && {
      opensAt: localDate(product.opensAt),
      openTime: localTime(product.opensAt),
    }),
  })),
})
