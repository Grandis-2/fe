import { apiClient } from '@shared/api/client'
import type { ShipmentBatchListResponse } from '@shared/api/types'

// 사전예약 배송 차수(preorder 모듈의 공개 API). 상품 상세 응답엔 실려 오지 않아 따로 묻는다.
export const getShipmentBatches = (productId: string, signal?: AbortSignal) =>
  apiClient.request<ShipmentBatchListResponse>(
    `/api/v1/products/${encodeURIComponent(productId)}/shipment-batches`,
    { signal },
  )
