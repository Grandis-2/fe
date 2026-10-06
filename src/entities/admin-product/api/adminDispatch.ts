import { apiClient } from '@shared/api/client'
import type {
  DispatchWindow,
  DispatchWindowPutRequest,
} from '@shared/api/types'

const dispatchPath = (productId: string) =>
  `/api/v1/admin/products/${productId}/dispatch-window`

/** 배송 차수 구성을 조회한다. 아직 정하지 않았으면 차수가 비어 있다 */
export const getDispatchWindow = (productId: string, signal?: AbortSignal) =>
  apiClient.request<DispatchWindow>(dispatchPath(productId), { signal })

/**
 * 배송 차수 구성을 통째로 교체한다.
 * 구간이 어긋나면 400 DISPATCH_WINDOW_INVALID, 오픈 이후면 409 PRODUCT_ALREADY_OPEN
 */
export const putDispatchWindow = (
  productId: string,
  body: DispatchWindowPutRequest,
) =>
  apiClient.request<DispatchWindow>(dispatchPath(productId), {
    method: 'PUT',
    body,
  })
