import { ApiRequestError, apiClient } from '@shared/api/client'
import type {
  PageResponse,
  ProductDetailView,
  ProductListItem,
  ShipmentBatchListResponse,
} from '@shared/api/types'

import { toPreorder, toPreorderCard } from './toPreorder'

import type { PreorderCardData } from '../ui/PreorderCard'

// 사전예약 프로모션 전용 API는 없다 — catalog의 사전예약 상품(saleMode=PREORDER)이 곧 사전예약이다.
// ponytail: 첫 쪽(최대 100건)만 받는다 — 사전예약 상품이 그보다 늘면 page를 이어 받는다.
export const getPreorders = async (
  signal?: AbortSignal,
): Promise<PreorderCardData[]> => {
  const page = await apiClient.request<PageResponse<ProductListItem>>(
    '/api/v1/products?saleMode=PREORDER&size=100',
    { signal },
  )
  return page.items.flatMap((item) => toPreorderCard(item) ?? [])
}

// 상품 상세 + 배송 차수(출시일). 사전예약 상품이 아니거나 회차가 없으면 null.
export const getPreorder = async (productId: string, signal?: AbortSignal) => {
  const id = encodeURIComponent(productId)
  const [product, batches] = await Promise.all([
    apiClient.request<ProductDetailView>(`/api/v1/products/${id}`, { signal }),
    apiClient
      .request<ShipmentBatchListResponse>(
        `/api/v1/preorders/products/${id}/shipment-batches`,
        { signal },
      )
      .then(({ items }) => items)
      // 차수가 아직 없으면 404 — 출시일만 비우고 상세는 그린다.
      .catch((caught: unknown) => {
        if (caught instanceof ApiRequestError && caught.status === 404)
          return []
        throw caught
      }),
  ])
  return toPreorder(product, batches)
}
