import type {
  PromotionDetailView,
  PromotionSummary,
  ShipmentBatch,
} from '@shared/api/types'

import type { Preorder } from '../model/preorder'
import type { PreorderCardData } from '../ui/PreorderCard'

// 서버는 ISO 시각(UTC, 끝에 Z)으로 준다 — 브라우저 시간대와 상관없이 한국 시간으로 보여준다.
// 한국은 서머타임이 없어 9시간을 더하면 된다. toISOString()은 'YYYY-MM-DDTHH:mm:ss.sssZ'다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const toKst = (iso: string) =>
  new Date(Date.parse(iso) + KST_OFFSET_MS).toISOString()
const kstDate = (iso: string) => toKst(iso).slice(0, 10)
const kstTime = (iso: string) => toKst(iso).slice(11, 16)

// 오픈·마감 시각은 묶인 상품이 없거나 사전예약 서비스가 답하지 않으면 null이다 — 그때는
// 홍보 기간으로 대신 센다(명세: 단계 표시 없이 그린다).
const periodOf = ({
  startDate,
  endDate,
  opensAt,
  closesAt,
}: PromotionSummary) => ({
  opensAt: opensAt ? kstDate(opensAt) : startDate,
  openTime: opensAt ? kstTime(opensAt) : '00:00',
  closesAt: closesAt ? kstDate(closesAt) : endDate,
  closeTime: closesAt ? kstTime(closesAt) : '23:59',
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
      opensAt: kstDate(product.opensAt),
      openTime: kstTime(product.opensAt),
    }),
    ...(product.closesAt && { closeTime: kstTime(product.closesAt) }),
  })),
})
