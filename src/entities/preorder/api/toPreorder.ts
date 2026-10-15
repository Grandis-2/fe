import type {
  ProductDetailView,
  ProductListItem,
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

// 사전예약 목록 = 상품 목록(saleMode=PREORDER). 회차가 아직 없는 상품(opensAt null)은 뺀다.
export const toPreorderCard = (
  item: ProductListItem,
): PreorderCardData | null =>
  item.opensAt && item.closesAt
    ? {
        id: item.productId,
        imageSrc: item.imageUrl ?? '',
        imageAlt: item.title,
        title: item.title,
        opensAt: localDate(item.opensAt),
        closesAt: localDate(item.closesAt),
      }
    : null

// 상품 상세 → 사전예약 상세. 백엔드는 상품 하나가 모델 하나라 models도 한 줄이다.
// 혜택·결제 마감일은 명세에 없어 비워 두고, 출시일은 1차 배송 시작 예정일로 쓴다.
export function toPreorder(
  product: ProductDetailView,
  batches: ShipmentBatch[] = [],
): Preorder | null {
  const { campaign } = product
  if (product.saleMode !== 'PREORDER' || !campaign) return null
  const prices = product.variants
    .filter((variant) => variant.status === 'ACTIVE')
    .map((variant) => variant.price)
  const imageSrc = product.imageUrl ?? ''
  return {
    id: product.productId,
    imageSrc,
    imageAlt: product.title,
    title: product.title,
    opensAt: localDate(campaign.opensAt),
    openTime: localTime(campaign.opensAt),
    closesAt: localDate(campaign.closesAt),
    releaseAt: batches[0]?.estimatedShipStart,
    benefits: [],
    models: [
      {
        id: product.productId,
        name: product.title,
        imageSrc,
        price: prices.length > 0 ? Math.min(...prices) : product.basePrice,
        productId: product.productId,
      },
    ],
  }
}
