import { ApiRequestError, apiClient } from '@shared/api/client'
import type {
  PromotionDetailView,
  PromotionListResponse,
  ShipmentBatchListResponse,
} from '@shared/api/types'

import { toPreorder, toPreorderCard } from './toPreorder'

import type { PreorderCardData } from '../ui/PreorderCard'

// [catalog] GET /api/v1/promotions — 오늘 보이는 사전예약 홍보(페이지 없음)
export const getPreorders = async (
  signal?: AbortSignal,
): Promise<PreorderCardData[]> => {
  const { items } = await apiClient.request<PromotionListResponse>(
    '/api/v1/promotions',
    { signal },
  )
  return items.map(toPreorderCard)
}

// [preorder] GET /api/v1/preorders/products/{productId}/shipment-batches — 배송 차수(로그인 불필요)
// 차수가 아직 없으면 404 — 출시일만 비우고 상세는 그린다.
const getShipmentBatches = (productId: string, signal?: AbortSignal) =>
  apiClient
    .request<ShipmentBatchListResponse>(
      `/api/v1/preorders/products/${encodeURIComponent(productId)}/shipment-batches`,
      { signal },
    )
    .then(({ items }) => items)
    .catch((caught: unknown) => {
      if (caught instanceof ApiRequestError && caught.status === 404) return []
      throw caught
    })

// [catalog] GET /api/v1/promotions/{promotionId} — 기간 밖이거나 없으면 404
// + 출시일은 첫 사전예약 상품의 배송 차수로 쓴다.
export const getPreorder = async (
  promotionId: string,
  signal?: AbortSignal,
) => {
  const promotion = await apiClient.request<PromotionDetailView>(
    `/api/v1/promotions/${encodeURIComponent(promotionId)}`,
    { signal },
  )
  const first = promotion.products.find(
    (product) => product.saleMode === 'PREORDER',
  )
  const batches = first ? await getShipmentBatches(first.productId, signal) : []
  return toPreorder(promotion, batches)
}
