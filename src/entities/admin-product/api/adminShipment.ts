import { apiClient } from '@shared/api/client'
import type {
  ShipmentBatchesRequest,
  ShipmentBatchListResponse,
} from '@shared/api/types'

// 배송 차수는 catalog가 아니라 preorder 서비스가 들고 있다.
const shipmentPath = (productId: string) =>
  `/api/v1/admin/preorders/products/${productId}/shipment-batches`

/** 배송 차수를 batchNumber 순으로 준다. 아직 정하지 않았으면 빈 배열, 회차가 없으면 404 */
export const getAdminShipmentBatches = (
  productId: string,
  signal?: AbortSignal,
) =>
  apiClient
    .request<ShipmentBatchListResponse>(shipmentPath(productId), { signal })
    .then((response) => response.items)

/**
 * 배송 차수 전체를 보낸 목록으로 바꾼다. 구간이 어긋나면 400 SHIPMENT_BATCH_INVALID,
 * 회차가 없으면 404, 오픈 뒤면 409 PRODUCT_ALREADY_OPEN
 */
export const putAdminShipmentBatches = (
  productId: string,
  body: ShipmentBatchesRequest,
) =>
  apiClient
    .request<ShipmentBatchListResponse>(shipmentPath(productId), {
      method: 'PUT',
      body,
    })
    .then((response) => response.items)
