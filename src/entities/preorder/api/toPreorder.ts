import type {
  PromotionDetailView,
  PromotionSummary,
  ShipmentBatch,
} from '@shared/api/types'

import { toKstParts } from '../lib/preorderSchedule'

import type { Preorder } from '../model/preorder'
import type { PreorderCardData } from '../ui/PreorderCard'

// 서버는 ISO 시각(UTC, 끝에 Z)으로 준다 — 브라우저 시간대와 상관없이 한국 시간으로 바꾼다.
// 오픈은 분까지, 마감은 초까지 남긴다(23:59:59 마감이 23:59:00에 닫혀 보이지 않게).
const kstDate = (iso: string) => toKstParts(iso).date
const kstTime = (iso: string) => toKstParts(iso).time.slice(0, 5)
const kstCloseTime = (iso: string) => toKstParts(iso).time

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
  closeTime: closesAt ? kstCloseTime(closesAt) : '23:59:59',
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
    ...(product.closesAt && {
      closesAt: kstDate(product.closesAt),
      closeTime: kstCloseTime(product.closesAt),
    }),
  })),
})
