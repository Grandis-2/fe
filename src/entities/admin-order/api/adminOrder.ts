import { apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  AdminOrderDetail,
  AdminOrderListParams,
  AdminOrderPage,
  AdvanceShippingRequest,
  ShippingStepResponse,
} from '@shared/api/types'

const BASE = '/api/v1/admin/orders'

/** 모든 회원의 주문(최신순). 상태·출처는 둘 다 주면 둘 다 맞는 것만 */
export const getAdminOrders = (
  params: AdminOrderListParams,
  signal?: AbortSignal,
) =>
  apiClient.request<AdminOrderPage>(`${BASE}${toQueryString(params)}`, {
    signal,
  })

export const getAdminOrder = (orderId: string, signal?: AbortSignal) =>
  apiClient.request<AdminOrderDetail>(
    `${BASE}/${encodeURIComponent(orderId)}`,
    { signal },
  )

/**
 * 배송 단계를 한 칸 옮긴다. 이미 그 단계면 아무것도 바꾸지 않고 applied false라 두 번
 * 눌러도 안전하다. 갈 수 없으면 409 ORDER_STEP_NOT_ALLOWED(details.status에 지금 상태)
 */
export const advanceShipping = (
  orderId: string,
  body: AdvanceShippingRequest,
) =>
  apiClient.request<ShippingStepResponse>(
    `${BASE}/${encodeURIComponent(orderId)}/shipping-steps`,
    { method: 'POST', body },
  )
