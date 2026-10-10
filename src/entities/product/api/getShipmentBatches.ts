import { apiClient } from '@shared/api/client'
import type { ShipmentBatchListResponse } from '@shared/api/types'

// 사전예약 배송 차수(preorder 서비스의 공개 API, 로그인 없이). 상품 상세 응답엔 실려 오지 않아 따로 묻는다.
// 차수가 없으면(사전예약 상품이 아니거나 준비 전) 404라 사전예약 상품일 때만 부른다.
export const getShipmentBatches = (productId: string, signal?: AbortSignal) =>
  apiClient.request<ShipmentBatchListResponse>(
    `/api/v1/preorders/products/${encodeURIComponent(productId)}/shipment-batches`,
    { signal },
  )
