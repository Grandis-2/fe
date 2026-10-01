import { apiClient } from '@/shared/api/client'
import type {
  AdminProductDetail,
  DispatchWindowCreateRequest,
  DispatchWindowListResponse,
  DispatchWindowVersion,
  ProductOpenAtRequest,
} from '@/shared/api/types'

const dispatchPath = (productId: string) =>
  `/api/v1/admin/products/${productId}/dispatch-windows`

/** 배송 차수 구간 버전 목록을 조회한다 */
export const getDispatchWindows = (productId: string) =>
  apiClient.request<DispatchWindowListResponse>(dispatchPath(productId))

/** 새 버전을 초안으로 만든다. 구간이 겹치면 400 DISPATCH_WINDOW_INVALID */
export const createDispatchWindow = (
  productId: string,
  body: DispatchWindowCreateRequest,
) =>
  apiClient.request<DispatchWindowVersion>(dispatchPath(productId), {
    method: 'POST',
    body,
  })

/** 초안을 활성 버전으로 게시한다. 오픈 이후면 409 PRODUCT_ALREADY_OPEN */
export const publishDispatchWindow = (productId: string, version: number) =>
  apiClient.request<DispatchWindowVersion>(
    `${dispatchPath(productId)}/${version}/publish`,
    { method: 'POST' },
  )

/** 오픈 시각을 설정한다. 오픈 이후면 409 PRODUCT_ALREADY_OPEN */
export const putProductOpenAt = (
  productId: string,
  body: ProductOpenAtRequest,
) =>
  apiClient.request<AdminProductDetail>(
    `/api/v1/admin/products/${productId}/open-at`,
    { method: 'PUT', body },
  )
